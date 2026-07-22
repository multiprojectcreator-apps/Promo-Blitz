/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import http from 'http';
import fs from 'fs/promises';
import { WebSocketServer, WebSocket } from 'ws';
import { dbInstance } from './server/db';
import { paymentService } from './server/services/PaymentService';
import { notificationService } from './server/services/NotificationService';

const app = express();
const PORT = 3000;

const server = http.createServer(app);

// Store active WebSocket connections
const wsClients = new Set<any>();

// Initialize WebSocket Server and its handlers only if not running on Vercel
if (!process.env.VERCEL) {
  try {
    const wss = new WebSocketServer({ noServer: true });

    // Handle manual upgrade to avoid conflict with Vite's HMR WebSockets
    server.on('upgrade', (request, socket, head) => {
      try {
        const url = request.url || '';
        // Only handle upgrades on the /ws path
        if (url.startsWith('/ws')) {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
          });
        }
      } catch (err) {
        console.warn('[Sistema de Rifa Profesional WS Upgrade Error]', err);
      }
    });

    wss.on('connection', (ws) => {
      wsClients.add(ws);

      // Send initial configuration and state upon connection
      ws.send(JSON.stringify({
        type: 'init',
        sales: dbInstance.sales,
        raffles: dbInstance.raffles,
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
        config: dbInstance.config,
        drawHistory: dbInstance.drawHistory,
      }));

      ws.on('close', () => {
        wsClients.delete(ws);
      });

      ws.on('error', (err) => {
        console.warn('[Sistema de Rifa Profesional WS Error]', err);
        wsClients.delete(ws);
      });
    });
  } catch (err) {
    console.error('[Sistema de Rifa Profesional WS Setup Error]', err);
  }
}

// Broadcast helper
function broadcast(payload: any) {
  if (process.env.VERCEL) {
    // WebSockets are not supported on Vercel Serverless, so broadcast is a no-op
    return;
  }
  try {
    const data = JSON.stringify(payload);
    for (const client of wsClients) {
      if (client.readyState === 1 /* WebSocket.OPEN */) {
        client.send(data);
      }
    }
  } catch (err) {
    console.warn('[Sistema de Rifa Profesional WS Broadcast Error]', err);
  }
}

// Register database broadcast callback and initialize Supabase Realtime
dbInstance.registerBroadcastCallback(broadcast);
dbInstance.readyPromise.then(() => {
  if (!process.env.VERCEL) {
    dbInstance.initRealtimeSubscription();
  } else {
    console.log('⚡ Skipping Supabase Realtime subscription on Vercel serverless environment.');
  }
}).catch((err) => {
  console.error('[Supabase Realtime Setup Error]', err);
});

// Use JSON and URL-encoded body parser with higher limit to support sponsor logo uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- PRODUCTION SECURITY ENHANCEMENTS & REVERSE ENGINEERING MITIGATION ---

// 1. Hide technology fingerprinting
app.disable('x-powered-by');

// 2. Custom Secure Headers (OWASP Aligned)
app.use((req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// 3. Lightweight IP-Based Rate Limiter (Brute-force protection)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: any) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    let record = rateLimits.get(key);
    
    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimits.set(key, record);
      return next();
    }
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    record.count++;
    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({ 
        error: 'Demasiadas solicitudes. Bloqueo temporal por seguridad contra ataques de fuerza bruta.', 
        retryAfterSeconds 
      });
      return;
    }
    next();
  };
}

// Apply rate limits to security-sensitive endpoints (10 requests per minute)
const authLimiter = rateLimiter(10, 60 * 1000);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// Global database ready state middleware
app.use(async (req: Request, res: Response, next) => {
  // Rapid bypass for critical diagnostic endpoints to prevent timeouts if Supabase/external DB is slow/down
  const pathToCheck = req.path || '';
  if (pathToCheck.includes('supabase-status') || pathToCheck.includes('health')) {
    return next();
  }
  try {
    // Wait for database initialization but cap it at 4 seconds max to prevent Vercel/serverless timeouts
    await Promise.race([
      dbInstance.readyPromise,
      new Promise((resolve) => setTimeout(resolve, 4000))
    ]);
  } catch (err) {
    console.error('[Database Ready Middleware] Error waiting for database initialization:', err);
  }
  next();
});

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Supabase connection status check
  app.get('/api/supabase-status', (req: Request, res: Response) => {
    res.json({ connected: dbInstance.isSupabaseEnabled() });
  });

  // --- AUTOMATIC PAYMENT GATEWAY WEBHOOKS ---

  // MercadoPago Webhook
  app.post('/api/webhooks/mercadopago', async (req: Request, res: Response) => {
    try {
      const result = await paymentService.handleMercadoPagoWebhook(req.body);
      if (result.saleId) {
        broadcast({
          type: 'sales_updated',
          sales: dbInstance.sales,
          auditLogs: dbInstance.auditLogs,
        });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe Webhook
  app.post('/api/webhooks/stripe', async (req: Request, res: Response) => {
    try {
      const result = await paymentService.handleStripeWebhook(req.body);
      if (result.saleId) {
        broadcast({
          type: 'sales_updated',
          sales: dbInstance.sales,
          auditLogs: dbInstance.auditLogs,
        });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Wompi Webhook
  app.post('/api/webhooks/wompi', async (req: Request, res: Response) => {
    try {
      const result = await paymentService.handleWompiWebhook(req.body);
      if (result.saleId) {
        broadcast({
          type: 'sales_updated',
          sales: dbInstance.sales,
          auditLogs: dbInstance.auditLogs,
        });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual / On-Demand Transactional Notification Trigger
  app.post('/api/notifications/send-ticket', async (req: Request, res: Response) => {
    try {
      const { saleId } = req.body;
      const sale = dbInstance.sales.find(s => s.id === saleId);
      if (!sale) {
        res.status(404).json({ error: 'Venta no encontrada.' });
        return;
      }
      const raffle = dbInstance.raffles.find(r => r.id === sale.raffleId) || { id: sale.raffleId, name: 'Gran Rifa' } as any;

      const whatsappRes = await notificationService.sendWhatsAppTicket(sale, raffle);
      const emailRes = await notificationService.sendEmailReceipt(sale, raffle);

      res.json({
        success: true,
        whatsapp: whatsappRes,
        email: emailRes,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Usuario y contraseña obligatorios.' });
        return;
      }
      const result = await dbInstance.login(username, password);
      if (!result) {
        res.status(401).json({ error: 'Credenciales inválidas.' });
        return;
      }
      res.json(result);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  // Auth: Register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, name, email, phone, password, role, linkingCode } = req.body;
      if (!username || !name || !email || !phone || !password) {
        res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        return;
      }
      const result = await dbInstance.registerUser(username, name, email, phone, password, role || 'VENDEDOR', linkingCode);
      res.status(201).json(result);

      // Broadcast real-time update of sellers/users list
      broadcast({
        type: 'sellers_updated',
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Auth: Verify Email Link
  app.get('/api/auth/verify', (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token) {
        res.status(400).send(`
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Error de Verificación - Sistema de Rifa Profesional</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-slate-50 font-sans h-screen flex items-center justify-center p-4">
              <div class="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-xl">
                <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-slate-800 mb-2">Token faltante</h1>
                <p class="text-slate-600 text-sm mb-6">El token de verificación de correo electrónico es obligatorio o no es válido.</p>
                <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition-colors text-sm">
                  Volver al Inicio
                </a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      const verifiedUser = dbInstance.verifyUserByToken(token as string);
      if (!verifiedUser) {
        res.status(400).send(`
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Error de Verificación - Sistema de Rifa Profesional</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-slate-50 font-sans h-screen flex items-center justify-center p-4">
              <div class="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-xl">
                <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-slate-800 mb-2">Enlace inválido o expirado</h1>
                <p class="text-slate-600 text-sm mb-6">Este enlace de confirmación ha expirado o no existe en el sistema.</p>
                <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition-colors text-sm">
                  Volver al Inicio
                </a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      res.send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Cuenta Confirmada - Sistema de Rifa Profesional</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50 font-sans h-screen flex items-center justify-center p-4">
            <div class="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-xl">
              <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-slate-800 mb-2">¡Correo Confirmado!</h1>
              <p class="text-slate-600 text-sm mb-2">Hola, <strong class="text-slate-800">${verifiedUser.name}</strong>. Tu cuenta ha sido activada con éxito.</p>
              <p class="text-slate-500 text-xs mb-6">Ya puedes ingresar al panel utilizando tu usuario y contraseña.</p>
              <a href="/?verified=true" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-full transition-colors text-sm">
                Iniciar Sesión
              </a>
            </div>
          </body>
        </html>
      `);

      // Broadcast changes
      broadcast({
        type: 'sellers_updated',
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(500).send(`Error: ${err.message}`);
    }
  });

  // Auth: Change Password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    try {
      const { userId, oldPassword, newPassword } = req.body;
      const success = dbInstance.changePassword(userId, oldPassword, newPassword);
      if (success) {
        res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
      } else {
        res.status(404).json({ error: 'Usuario no encontrado.' });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin Reset Password
  app.post('/api/auth/admin-reset-password', (req: Request, res: Response) => {
    try {
      const { adminUserId, targetUserId, newPassword } = req.body;
      const success = dbInstance.resetPasswordByAdmin(adminUserId, targetUserId, newPassword);
      if (success) {
        res.json({ success: true, message: 'Contraseña reestablecida correctamente.' });
      } else {
        res.status(404).json({ error: 'No se pudo reestablecer la contraseña.' });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get active configurations
  app.get('/api/config', (req: Request, res: Response) => {
    res.json(dbInstance.config);
  });

  // Update configurations
  app.put('/api/config', async (req: Request, res: Response) => {
    try {
      const { adminUserId, updates } = req.body;
      const updated = await dbInstance.updateConfig(adminUserId, updates);
      res.json(updated);

      // Broadcast real-time update
      broadcast({
        type: 'config_updated',
        config: updated,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get all raffles
  app.get('/api/raffles', (req: Request, res: Response) => {
    res.json(dbInstance.raffles);
  });

  // Update Raffle
  app.put('/api/raffles/:id', async (req: Request, res: Response) => {
    try {
      const raffleId = req.params.id;
      const { adminUserId, updates } = req.body;
      const updated = await dbInstance.updateRaffle(adminUserId, raffleId, updates);
      res.json(updated);
      
      // Broadcast real-time update
      broadcast({
        type: 'raffle_updated',
        raffle: updated,
        raffles: dbInstance.raffles,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get sellers list
  app.get('/api/sellers', (req: Request, res: Response) => {
    res.json(dbInstance.sellers);
  });

  // Create Seller
  app.post('/api/sellers', async (req: Request, res: Response) => {
    try {
      const { adminUserId, sellerData } = req.body;
      const newSeller = await dbInstance.createSeller(adminUserId, sellerData);
      res.status(201).json(newSeller);

      // Broadcast real-time update
      broadcast({
        type: 'sellers_updated',
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Auto-generate sellers in ranges
  app.post('/api/sellers/auto-generate', async (req: Request, res: Response) => {
    try {
      const { adminUserId, rangeSize } = req.body;
      const updatedSellers = await dbInstance.autoGenerateSellers(adminUserId, rangeSize);
      res.json({ success: true, sellers: updatedSellers });

      // Broadcast real-time update
      broadcast({
        type: 'sellers_updated',
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update Seller
  app.put('/api/sellers/:id', async (req: Request, res: Response) => {
    try {
      const sellerId = req.params.id;
      const { adminUserId, updates } = req.body;
      const updated = await dbInstance.updateSeller(adminUserId, sellerId, updates);
      res.json(updated);

      // Broadcast real-time update
      broadcast({
        type: 'sellers_updated',
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete Seller
  app.delete('/api/sellers/:id', async (req: Request, res: Response) => {
    try {
      const sellerId = req.params.id;
      const { adminUserId } = req.body;
      const success = await dbInstance.deleteSeller(adminUserId, sellerId);
      if (success) {
        res.json({ success: true });

        // Broadcast real-time update
        broadcast({
          type: 'sellers_updated',
          sellers: dbInstance.sellers,
          auditLogs: dbInstance.auditLogs,
        });
      } else {
        res.status(404).json({ error: 'Vendedor no encontrado.' });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get sales list (filtered by raffle or seller range)
  app.get('/api/sales', (req: Request, res: Response) => {
    const { raffleId, sellerId } = req.query;
    dbInstance.cleanupExpiredReservations();
    let list = dbInstance.sales;
    if (raffleId) {
      list = list.filter(s => s.raffleId === raffleId);
    }
    if (sellerId) {
      list = list.filter(s => s.sellerId === sellerId);
    }
    res.json(list);
  });

  // Create or Reserve Sales
  app.post('/api/sales', async (req: Request, res: Response) => {
    try {
      const { operatorUserId, saleData } = req.body;
      const sale = await dbInstance.registerSale(operatorUserId, saleData);
      res.status(201).json(sale);

      // Broadcast real-time update
      broadcast({
        type: 'sales_updated',
        sales: dbInstance.sales,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update Sale Status
  app.put('/api/sales/:id/status', async (req: Request, res: Response) => {
    try {
      const saleId = req.params.id;
      const { operatorUserId, status } = req.body;
      const updated = await dbInstance.updateSaleStatus(operatorUserId, saleId, status);
      res.json(updated);

      // Trigger automatic transactional notifications if marked as PAID
      if (status === 'PAID') {
        const raffle = dbInstance.raffles.find(r => r.id === updated.raffleId) || { id: updated.raffleId, name: 'Gran Rifa' } as any;
        notificationService.sendWhatsAppTicket(updated, raffle).catch(console.error);
        notificationService.sendEmailReceipt(updated, raffle).catch(console.error);
      }

      // Broadcast real-time update
      broadcast({
        type: 'sales_updated',
        sales: dbInstance.sales,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Sync Offline Sales
  app.post('/api/sales/sync', async (req: Request, res: Response) => {
    try {
      const { sellerUserId, offlineSales } = req.body;
      const result = await dbInstance.syncOfflineSales(sellerUserId, offlineSales);
      res.json(result);

      // Broadcast real-time update
      broadcast({
        type: 'sales_updated',
        sales: dbInstance.sales,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Raffle Stats
  app.get('/api/stats/:raffleId', (req: Request, res: Response) => {
    try {
      const raffleId = req.params.raffleId;
      dbInstance.cleanupExpiredReservations();
      const stats = dbInstance.getStats(raffleId);
      res.json(stats);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Post Telemetry Visit
  app.post('/api/telemetry/visit', (req: Request, res: Response) => {
    try {
      const { hour, city, country, device, browser, referrer, raffleId } = req.body;
      const visit = dbInstance.registerVisit({
        hour: typeof hour === 'number' ? hour : new Date().getHours(),
        city: city || 'Bogotá',
        country: country || 'Colombia',
        device: device || 'DESKTOP',
        browser: browser || 'Chrome',
        referrer: referrer || 'Directo',
        raffleId: raffleId || 'r1',
      });
      res.json(visit);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Global Telemetry Stats
  app.get('/api/telemetry/stats/:raffleId', (req: Request, res: Response) => {
    try {
      const raffleId = req.params.raffleId;
      const stats = dbInstance.getGlobalTelemetryStats(raffleId);
      res.json(stats);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Audit Logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json(dbInstance.auditLogs);
  });

  // Get system users list
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      if (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) {
        await dbInstance.syncUsersFromSupabase();
      }
    } catch (e) {
      console.warn('[Sync Users Error]', e);
    }
    res.json(dbInstance.users);
  });

  // Update user status by Super Admin (with cascade block/unblock actions)
  app.put('/api/superadmin/users/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { superAdminId, status } = req.body;
      const updatedUser = await dbInstance.toggleUserStatusBySuperAdmin(superAdminId, id, status);
      res.json(updatedUser);

      // Broadcast changes to update all clients
      broadcast({
        type: 'users_updated',
        users: dbInstance.users,
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- ANNOUNCEMENT ENDPOINTS ---

  // Get all announcements
  app.get('/api/announcements', (req: Request, res: Response) => {
    res.json(dbInstance.announcements);
  });

  // Get all read records
  app.get('/api/announcements/reads', (req: Request, res: Response) => {
    res.json(dbInstance.announcementReads);
  });

  // Create announcement
  app.post('/api/announcements', async (req: Request, res: Response) => {
    try {
      const { adminUserId, announcementData } = req.body;
      const newAnn = await dbInstance.createAnnouncement(adminUserId, announcementData);
      res.status(201).json(newAnn);

      // Broadcast update
      broadcast({
        type: 'announcements_updated',
        announcements: dbInstance.announcements,
        announcementReads: dbInstance.announcementReads,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update announcement
  app.put('/api/announcements/:id', async (req: Request, res: Response) => {
    try {
      const { adminUserId, announcementData } = req.body;
      const id = req.params.id;
      const updatedAnn = await dbInstance.updateAnnouncement(adminUserId, id, announcementData);
      res.json(updatedAnn);

      // Broadcast update
      broadcast({
        type: 'announcements_updated',
        announcements: dbInstance.announcements,
        announcementReads: dbInstance.announcementReads,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete announcement
  app.delete('/api/announcements/:id', async (req: Request, res: Response) => {
    try {
      const { adminUserId } = req.body;
      const id = req.params.id;
      await dbInstance.deleteAnnouncement(adminUserId, id);
      res.json({ success: true });

      // Broadcast update
      broadcast({
        type: 'announcements_updated',
        announcements: dbInstance.announcements,
        announcementReads: dbInstance.announcementReads,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Mark announcement as read
  app.post('/api/announcements/:id/read', async (req: Request, res: Response) => {
    try {
      const { sellerUserId } = req.body;
      const id = req.params.id;
      const readRecord = await dbInstance.markAnnouncementAsRead(sellerUserId, id);
      res.json(readRecord);

      // Broadcast update
      broadcast({
        type: 'announcements_updated',
        announcements: dbInstance.announcements,
        announcementReads: dbInstance.announcementReads,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- SPONSOR ENDPOINTS ---

  // Get all sponsors
  app.get('/api/sponsors', (req: Request, res: Response) => {
    res.json(dbInstance.sponsors || []);
  });

  // Create sponsor
  app.post('/api/sponsors', async (req: Request, res: Response) => {
    try {
      const { adminUserId, sponsorData } = req.body;
      const newSponsor = await dbInstance.createSponsor(adminUserId, sponsorData);
      res.status(201).json(newSponsor);

      // Broadcast update
      broadcast({
        type: 'sponsors_updated',
        sponsors: dbInstance.sponsors,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update sponsor
  app.put('/api/sponsors/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { adminUserId, sponsorData } = req.body;
      const updatedSponsor = await dbInstance.updateSponsor(adminUserId, id, sponsorData);
      res.json(updatedSponsor);

      // Broadcast update
      broadcast({
        type: 'sponsors_updated',
        sponsors: dbInstance.sponsors,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete sponsor
  app.delete('/api/sponsors/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { adminUserId } = req.body;
      await dbInstance.deleteSponsor(adminUserId, id);
      res.json({ success: true });

      // Broadcast update
      broadcast({
        type: 'sponsors_updated',
        sponsors: dbInstance.sponsors,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- DRAWING AND PRIZES ENDPOINTS ---

  // Get all draw history
  app.get('/api/draw-history', (req: Request, res: Response) => {
    res.json(dbInstance.drawHistory);
  });

  // Create a winner draw
  app.post('/api/draws', async (req: Request, res: Response) => {
    try {
      const { adminUserId, raffleId, prizeId, winningNumber } = req.body;
      const newDraw = await dbInstance.drawWinner(adminUserId, raffleId, prizeId, Number(winningNumber));
      res.status(201).json(newDraw);

      // Broadcast update to all clients
      broadcast({
        type: 'draw_created',
        drawHistory: dbInstance.drawHistory,
        auditLogs: dbInstance.auditLogs,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Factory Reset endpoint
  app.post('/api/superadmin/factory-reset', async (req: Request, res: Response) => {
    try {
      const { superAdminId } = req.body;
      if (!superAdminId) {
        return res.status(400).json({ error: 'ID de Super Administrador es requerido.' });
      }
      await dbInstance.factoryReset(superAdminId);
      broadcast({
        type: 'init',
        sales: dbInstance.sales,
        raffles: dbInstance.raffles,
        sellers: dbInstance.sellers,
        auditLogs: dbInstance.auditLogs,
        config: dbInstance.config,
        drawHistory: dbInstance.drawHistory,
      });
      res.json({ success: true, message: 'La aplicación ha sido reiniciada a su configuración de fábrica original con éxito.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al ejecutar el reset de fábrica.' });
    }
  });

  // Game Cycle Report endpoint
  app.get('/api/game-cycle/report/:raffleId', (req: Request, res: Response) => {
    try {
      const { raffleId } = req.params;
      const raffle = dbInstance.raffles.find(r => r.id === raffleId) || dbInstance.raffles[0];
      if (!raffle) {
        return res.status(404).json({ error: 'Sorteo no encontrado.' });
      }

      const salesForRaffle = dbInstance.sales.filter(s => s.raffleId === raffle.id);
      const paidSales = salesForRaffle.filter(s => s.status === 'PAID');
      const reservedSales = salesForRaffle.filter(s => s.status === 'RESERVED');
      const cancelledSales = salesForRaffle.filter(s => s.status === 'CANCELLED');

      const totalRevenue = paidSales.length * raffle.ticketPrice;
      const reservedRevenue = reservedSales.length * raffle.ticketPrice;
      const totalAvailable = Math.max(0, raffle.totalNumbers - paidSales.length - reservedSales.length);

      const commissionRate = dbInstance.config?.commissionPercentage ?? 10.0;
      let totalCommissions = 0;

      // Sellers sales and commissions calculation
      const sellerStats = dbInstance.sellers.map(s => {
        const sellerSales = paidSales.filter(sale => sale.sellerId === s.id);
        const sellerGross = sellerSales.length * raffle.ticketPrice;
        const sellerCommission = (sellerGross * commissionRate) / 100;
        totalCommissions += sellerCommission;

        return {
          sellerId: s.id,
          sellerName: s.name,
          phone: s.phone,
          range: `${s.assignedRangeStart} - ${s.assignedRangeEnd}`,
          ticketsSold: sellerSales.length,
          grossSales: sellerGross,
          commissionEarned: sellerCommission
        };
      });

      const winners = dbInstance.drawHistory.filter(d => d.raffleId === raffle.id);
      const appVisits = dbInstance.appVisits.filter(v => !v.raffleId || v.raffleId === raffle.id).length;
      const conversionRate = appVisits > 0 ? (paidSales.length / appVisits) * 100 : 0;

      res.json({
        raffle,
        summary: {
          totalNumbers: raffle.totalNumbers,
          ticketPrice: raffle.ticketPrice,
          paidTicketsCount: paidSales.length,
          paidTicketsPercentage: (paidSales.length / raffle.totalNumbers) * 100,
          reservedTicketsCount: reservedSales.length,
          reservedTicketsPercentage: (reservedSales.length / raffle.totalNumbers) * 100,
          availableTicketsCount: totalAvailable,
          availableTicketsPercentage: (totalAvailable / raffle.totalNumbers) * 100,
          cancelledTicketsCount: cancelledSales.length,
          grossRevenue: totalRevenue,
          reservedRevenue: reservedRevenue,
          totalCommissionsPaid: totalCommissions,
          netRevenue: totalRevenue - totalCommissions,
          currency: dbInstance.config?.currency || 'USD'
        },
        sellerStats,
        winners,
        telemetry: {
          totalAppVisits: appVisits,
          conversionRate: conversionRate.toFixed(2)
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al generar el reporte completo del ciclo de juego.' });
    }
  });

  // --- AUTOMATIC CUTOFF & GAME CYCLE LIFE CYCLE TICKER ---
  if (!process.env.VERCEL) {
    setInterval(() => {
      try {
        const now = new Date();
        let changed = false;
        dbInstance.raffles.forEach(async (raffle) => {
          if (raffle.status === 'ACTIVE' && raffle.salesCutoffDate && raffle.salesCutoffTime) {
            const cutoffDateTime = new Date(`${raffle.salesCutoffDate}T${raffle.salesCutoffTime}`);
            if (now >= cutoffDateTime) {
              raffle.status = 'FINISHED';
              raffle.salesEnabled = false;
              changed = true;
              
              // Sync status to Supabase
              await dbInstance.syncToSupabase('raffles', {
                id: raffle.id,
                status: 'FINISHED',
                sales_enabled: false
              });

              // Auto release pending reservations
              const reservedSales = dbInstance.sales.filter(s => s.raffleId === raffle.id && s.status === 'RESERVED');
              for (const s of reservedSales) {
                s.status = 'CANCELLED';
                await dbInstance.syncToSupabase('sales', {
                  id: s.id,
                  status: 'CANCELLED'
                });
              }

              dbInstance['logAudit']('SYSTEM', 'SYSTEM_BOT', 'AUTO_FINISH_RAFFLE', `Sorteo "${raffle.name}" finalizó período de venta automáticamente (Corte programado cumplido).`);
            }
          }

          // Check for automatic tombola draw trigger
          if ((raffle.status === 'ACTIVE' || raffle.status === 'FINISHED') && raffle.drawDate && raffle.drawTime && raffle.autoTombola !== false) {
            const drawDateTime = new Date(`${raffle.drawDate}T${raffle.drawTime}`);
            if (now >= drawDateTime) {
              const hasDraw = dbInstance.drawHistory.some(d => d.raffleId === raffle.id);
              if (!hasDraw) {
                const paidSales = dbInstance.sales.filter(s => s.raffleId === raffle.id && s.status === 'PAID');
                let winningNum = 1;
                if (paidSales.length > 0) {
                  const winnerSale = paidSales[Math.floor(Math.random() * paidSales.length)];
                  winningNum = winnerSale.ticketNumber;
                } else {
                  winningNum = Math.floor(Math.random() * raffle.totalNumbers) + 1;
                }

                try {
                  const superAdmin = dbInstance.users.find(u => u.isSuperAdmin || u.role === 'ORGANIZADOR') || { id: 'system' };
                  await dbInstance.drawWinner(superAdmin.id, raffle.id, '', winningNum);
                  raffle.status = 'FINISHED';
                  raffle.salesEnabled = false;
                  changed = true;

                  dbInstance['logAudit']('SYSTEM', 'AUTO_TOMBOLA_BOT', 'AUTO_TOMBOLA_EXECUTE', `Sorteo por tómbola virtual automática ejecutado para "${raffle.name}". Número ganador: #${winningNum}.`);
                } catch (e: any) {
                  console.error('Error executing automatic tombola draw:', e);
                }
              }
            }
          }
        });

        if (changed) {
          broadcast({
            type: 'raffle_updated',
            raffle: dbInstance.raffles.find(r => r.status === 'ACTIVE') || dbInstance.raffles[0],
            raffles: dbInstance.raffles,
            sales: dbInstance.sales,
            drawHistory: dbInstance.drawHistory,
            auditLogs: dbInstance.auditLogs,
          });
        }
      } catch (err) {
        console.error('Error checking sales cutoffs & auto tombola in background:', err);
      }
    }, 30000); // Check every 30 seconds
  }

  // --- ALGORITMOS DE POSICIONAMIENTO WEB (SEO) ---

  // 1. Dynamic XML Sitemap
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    try {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.secure ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Main index page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/</loc>\n`;
      sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>1.0</priority>\n`;
      sitemap += `  </url>\n`;

      // Active raffles URLs
      dbInstance.raffles.forEach(r => {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/?sorteo=${r.id}</loc>\n`;
        sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        sitemap += `    <changefreq>hourly</changefreq>\n`;
        sitemap += `    <priority>0.9</priority>\n`;
        sitemap += `  </url>\n`;
      });

      sitemap += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // 2. Dynamic Robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    let robots = `User-agent: *\n`;
    robots += `Allow: /\n`;
    robots += `Disallow: /api/\n`;
    robots += `Disallow: /ws\n`;
    robots += `\nSitemap: ${baseUrl}/sitemap.xml\n`;

    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // 3. Dynamic SEO page middleware (Meta, Open Graph, and JSON-LD Structured Schema)
  const serveSEOIndexedPage = async (req: Request, res: Response) => {
    try {
      const activeRaffle = dbInstance.raffles.find(r => r.status === 'ACTIVE') || dbInstance.raffles[0];
      const raffleName = activeRaffle ? activeRaffle.name : 'Sistema de Rifa Profesional';
      const rafflePrize = activeRaffle ? activeRaffle.prize : 'Premios increíbles';
      const raffleDesc = activeRaffle ? activeRaffle.description : 'Participa en nuestros sorteos oficiales y gana grandes premios de forma segura y transparente.';
      const ticketPrice = activeRaffle ? activeRaffle.ticketPrice : 10;
      const currency = dbInstance.config?.currency || 'USD';

      // Dynamic Meta & Open Graph Tags
      const metaTags = `
    <title>${raffleName} | Sorteo Oficial</title>
    <meta name="description" content="${raffleDesc}" />
    <meta name="keywords" content="rifas, sorteos, boletos, loteria, ganar premios, ${raffleName.toLowerCase()}" />
    <!-- Open Graph (Facebook, WhatsApp) -->
    <meta property="og:title" content="${raffleName} - ¡Gana ${rafflePrize}!" />
    <meta property="og:description" content="${raffleDesc} Precio de boleto: ${ticketPrice} ${currency}." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://${req.get('host')}${req.originalUrl}" />
    <meta property="og:image" content="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1200&h=630&q=80" />
    <meta property="og:locale" content="es_ES" />
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${raffleName} - ¡Gana ${rafflePrize}!" />
    <meta name="twitter:description" content="${raffleDesc}" />
    <meta name="twitter:image" content="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1200&h=630&q=80" />
      `;

      // Structured Data (JSON-LD Schema.org Event/Product)
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": raffleName,
        "description": raffleDesc,
        "startDate": activeRaffle ? activeRaffle.startDate : new Date().toISOString(),
        "endDate": activeRaffle ? activeRaffle.endDate : new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "location": {
          "@type": "VirtualLocation",
          "url": `https://${req.get('host')}`
        },
        "offers": {
          "@type": "Offer",
          "price": ticketPrice,
          "priceCurrency": currency,
          "availability": "https://schema.org/InStock",
          "url": `https://${req.get('host')}`
        }
      };

      const jsonLdScript = `\n<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n`;

      const indexHtmlPath = process.env.NODE_ENV === 'production' 
        ? path.join(process.cwd(), 'dist', 'index.html') 
        : path.join(process.cwd(), 'index.html');

      let html = await fs.readFile(indexHtmlPath, 'utf8');

      // Remove standard basic title to avoid duplicates
      html = html.replace(/<title>.*?<\/title>/gi, '');

      // Inject metaTags and jsonLdScript into the <head>
      html = html.replace('<head>', `<head>${metaTags}${jsonLdScript}`);
      
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      console.error('[SEO Ingestion Error]', err);
      // Fallback
      if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    }
  };

  // Route index page requests to our SEO generator
  app.get('/', serveSEOIndexedPage);

  // --- VITE INTERFACE HANDLER ---

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    import('vite').then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then((vite) => {
        app.use(vite.middlewares);
      }).catch((err) => {
        console.error('[Vite Server Setup Error]', err);
      });
    }).catch((err) => {
      console.error('[Vite Dynamic Import Error]', err);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      serveSEOIndexedPage(req, res);
    });
  }

  // Start HTTP & WS server on the same Port
  if (!process.env.VERCEL) {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Sistema de Rifa Profesional Backend with WebSockets] Server running on http://0.0.0.0:${PORT}`);
    });
  }

  // Global error handler middleware
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('[Global Error Handler] Caught exception:', err);
    res.status(500).json({
      error: 'Error interno del servidor en la API',
      message: err.message || 'Error desconocido',
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  });

export default app;
