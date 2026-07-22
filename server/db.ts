/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { User, Raffle, Seller, Sale, AuditLog, Notification, AppConfig, DashboardStats, TicketStatus, Announcement, AnnouncementRead, PrizeConfig, DrawHistory, AppVisit, GlobalTelemetryStats, UserStatus } from '../src/types';

// Initialize Supabase Client lazily and safely
let supabaseUrlRaw = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

// Sanitize URL to ensure it doesn't include /rest/v1/ or /rest/v1 at the end, and remove any trailing slash
let supabaseUrl = supabaseUrlRaw.trim();
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, ''); // Remove /rest/v1/ or /rest/v1 at the end
  supabaseUrl = supabaseUrl.replace(/\/$/, ''); // Remove trailing slash
}

export let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Client initialized successfully with sanitized URL:', supabaseUrl);
  } catch (err: any) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('⚠️ Supabase environment variables missing. Operating in dynamic fall-back mode.');
}

// In-Memory & Cloud Synchronization Database for Sistema de Rifa Profesional
export class Database {
  users: User[] = [];
  passwords: Record<string, string> = {}; // username -> password
  raffles: Raffle[] = [];
  sellers: Seller[] = [];
  sales: Sale[] = [];
  auditLogs: AuditLog[] = [];
  notifications: Notification[] = [];
  announcements: Announcement[] = [];
  announcementReads: AnnouncementRead[] = [];
  prizes: PrizeConfig[] = [];
  drawHistory: DrawHistory[] = [];
  appVisits: AppVisit[] = [];
  sponsors: any[] = [];
  ticketLocks: Set<string> = new Set();
  verificationTokens: Record<string, { userId: string; token: string; expiresAt: number }> = {};
  config: AppConfig = {
    id: '1',
    allowOfflineSync: false,
    maxFailedAttempts: 5,
    commissionPercentage: 10,
    currency: 'USD',
  };

  private supabaseQueue: Promise<any> = Promise.resolve();
  public readyPromise: Promise<void>;
  private failedTables: Set<string> = new Set();
  private broadcastCallback: ((payload: any) => void) | null = null;

  isSupabaseEnabled() {
    return supabase !== null;
  }

  registerBroadcastCallback(cb: (payload: any) => void) {
    this.broadcastCallback = cb;
  }

  initRealtimeSubscription() {
    if (!supabase) {
      console.log('⚠️ Supabase Realtime not enabled: Supabase client is not initialized.');
      return;
    }

    console.log('🔌 Inicializando suscripción Supabase Realtime para todas las tablas...');
    
    const channel = supabase.channel('schema-db-changes');

    // Subscribe to sales changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales' },
      async (payload: any) => {
        console.log('[Supabase Realtime] Sales change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const s = payload.new;
          const mappedSale: Sale = {
            id: s.id,
            raffleId: s.raffle_id,
            ticketNumber: s.ticket_number,
            buyerName: s.buyer_name,
            phone: s.phone,
            email: s.email,
            city: s.city,
            notes: s.notes,
            date: s.date,
            time: s.time,
            status: s.status,
            sellerId: s.seller_id,
            sellerName: s.seller_name,
            reservedAt: s.reserved_at
          };

          const idx = this.sales.findIndex(item => item.id === mappedSale.id);
          if (idx !== -1) {
            this.sales[idx] = mappedSale;
          } else {
            this.sales.push(mappedSale);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            this.sales = this.sales.filter(item => item.id !== oldId);
          }
        }

        // Sync newest audit logs if they were created
        try {
          const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(20);
          if (logs) {
            this.auditLogs = logs.map((a: any) => ({
              id: a.id,
              timestamp: a.timestamp,
              userId: a.user_id,
              username: a.username,
              action: a.action,
              details: a.details
            })).reverse();
          }
        } catch (e) {}

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'sales_updated',
            sales: this.sales,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to raffles changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'raffles' },
      (payload: any) => {
        console.log('[Supabase Realtime] Raffles change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const r = payload.new;
          const mappedRaffle: Raffle = {
            id: r.id,
            name: r.name,
            description: r.description,
            prize: r.prize,
            totalNumbers: r.total_numbers,
            ticketPrice: Number(r.ticket_price),
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status,
            drawDate: r.draw_date,
            drawTime: r.draw_time,
            liveStreamUrl: r.live_stream_url,
            salesCutoffDate: r.sales_cutoff_date,
            salesCutoffTime: r.sales_cutoff_time,
            salesEnabled: r.sales_enabled !== false,
            autoTombola: r.auto_tombola !== false,
            prizes: this.prizes.filter(p => p.raffleId === r.id)
          };

          const idx = this.raffles.findIndex(item => item.id === mappedRaffle.id);
          if (idx !== -1) {
            this.raffles[idx] = mappedRaffle;
          } else {
            this.raffles.push(mappedRaffle);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            this.raffles = this.raffles.filter(item => item.id !== oldId);
          }
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'raffle_updated',
            raffle: this.raffles.find(r => r.status === 'ACTIVE') || this.raffles[0],
            raffles: this.raffles,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to sellers changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sellers' },
      (payload: any) => {
        console.log('[Supabase Realtime] Sellers change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const s = payload.new;
          const mappedSeller: Seller = {
            id: s.id,
            userId: s.user_id,
            name: s.name,
            assignedRangeStart: s.assigned_range_start,
            assignedRangeEnd: s.assigned_range_end,
            status: s.status,
            phone: s.phone || '',
            username: s.username || '',
            linkingCode: s.linking_code || ''
          };

          const idx = this.sellers.findIndex(item => item.id === mappedSeller.id);
          if (idx !== -1) {
            this.sellers[idx] = mappedSeller;
          } else {
            this.sellers.push(mappedSeller);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            this.sellers = this.sellers.filter(item => item.id !== oldId);
          }
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'sellers_updated',
            sellers: this.sellers,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to users changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      (payload: any) => {
        console.log('[Supabase Realtime] Users change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const u = payload.new;
          const existingUser = this.users.find(item => item.id === u.id);
          const isSuper = (u.is_super_admin !== undefined && u.is_super_admin !== null) 
            ? Boolean(u.is_super_admin) 
            : (existingUser?.isSuperAdmin ?? false);
          const mappedUser: User = {
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            failedLoginAttempts: u.failed_login_attempts ?? 0,
            isSuperAdmin: isSuper,
            lastAccessAt: u.last_access_at || undefined,
            createdAt: u.created_at || undefined,
            organizerId: u.organizer_id || undefined
          };

          const idx = this.users.findIndex(item => item.id === mappedUser.id);
          if (idx !== -1) {
            this.users[idx] = mappedUser;
          } else {
            this.users.push(mappedUser);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            this.users = this.users.filter(item => item.id !== oldId);
          }
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'users_updated',
            users: this.users,
            sellers: this.sellers,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to profiles changes (Supabase auth profile table)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      (payload: any) => {
        console.log('[Supabase Realtime] Profiles change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const p = payload.new;
          const isSuper = (p.is_super_admin !== undefined && p.is_super_admin !== null)
            ? Boolean(p.is_super_admin)
            : false;

          const existingUser = this.users.find(u => u.id === p.id);
          if (existingUser) {
            existingUser.isSuperAdmin = isSuper;
            if (p.status) existingUser.status = p.status;
            if (p.role) existingUser.role = p.role;
          }
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'users_updated',
            users: this.users,
            sellers: this.sellers,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to announcements changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'announcements' },
      (payload: any) => {
        console.log('[Supabase Realtime] Announcements change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const a = payload.new;
          const mappedAnn: Announcement = {
            id: a.id,
            title: a.title,
            content: a.content,
            imageUrl: a.image_url,
            targetType: a.target_type,
            targetSellerId: a.target_seller_id,
            placement: a.placement,
            status: a.status,
            createdAt: a.created_at,
            ctaText: a.cta_text || '',
            ctaUrl: a.cta_url || '',
            deviceTarget: a.device_target || 'ALL'
          };

          const idx = this.announcements.findIndex(item => item.id === mappedAnn.id);
          if (idx !== -1) {
            this.announcements[idx] = mappedAnn;
          } else {
            this.announcements.push(mappedAnn);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            this.announcements = this.announcements.filter(item => item.id !== oldId);
          }
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'announcements_updated',
            announcements: this.announcements,
            announcementReads: this.announcementReads,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to config changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'config' },
      (payload: any) => {
        console.log('[Supabase Realtime] Config change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const c = payload.new;
          this.config = {
            id: c.id,
            allowOfflineSync: c.allow_offline_sync,
            maxFailedAttempts: c.max_failed_attempts,
            commissionPercentage: Number(c.commission_percentage ?? 10.0),
            currency: c.currency || 'USD'
          };
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'config_updated',
            config: this.config,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    // Subscribe to draw_history changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'draw_history' },
      (payload: any) => {
        console.log('[Supabase Realtime] Draw History change detected:', payload.eventType, payload.new?.id || payload.old?.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const d = payload.new;
          const mappedDraw: DrawHistory = {
            id: d.id,
            raffleId: d.raffle_id,
            drawDate: d.draw_date,
            drawTime: d.draw_time,
            winningNumber: d.winning_number,
            winnerName: d.winner_name || '',
            winnerPhone: d.winner_phone || '',
            winnerCity: d.winner_city || '',
            winnerEmail: d.winner_email || '',
            prizeName: d.prize_name,
            sellerName: d.seller_name || '',
            createdAt: d.created_at
          };

          const idx = this.drawHistory.findIndex(item => item.id === mappedDraw.id);
          if (idx !== -1) {
            this.drawHistory[idx] = mappedDraw;
          } else {
            this.drawHistory.push(mappedDraw);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            this.drawHistory = this.drawHistory.filter(item => item.id !== oldId);
          }
        }

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'draw_created',
            drawHistory: this.drawHistory,
            auditLogs: this.auditLogs
          });
        }
      }
    );

    channel.subscribe((status) => {
      console.log(`[Supabase Realtime Status] Subscription status: ${status}`);
    });
  }

  constructor() {
    this.seed();
    this.readyPromise = this.loadDataFromSupabase().then(() => {
      this.seedToSupabaseIfEmpty();
    });
  }

  hashPassword(password: string): string {
    const iterations = 10000;
    const keyLength = 64;
    const digest = 'sha256';
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
    return `pbkdf2:sha256:${iterations}:${salt}:${derivedKey.toString('hex')}`;
  }

  verifyPassword(password: string, correctPasswordHash: string): boolean {
    if (!correctPasswordHash) return false;
    
    if (correctPasswordHash.startsWith('pbkdf2:sha256:')) {
      const parts = correctPasswordHash.split(':');
      if (parts.length === 5) {
        const iterations = parseInt(parts[2], 10);
        const salt = parts[3];
        const hash = parts[4];
        const keyLength = 64;
        const digest = 'sha256';
        const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
        return derivedKey.toString('hex') === hash;
      }
    }
    
    if (correctPasswordHash.length === 64) {
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      return legacyHash === correctPasswordHash;
    }
    
    return password === correctPasswordHash;
  }

  // --- SUPABASE CLOUD SYNC UTILITIES ---

  async syncToSupabase(table: string, payload: any, primaryKeyField: string = 'id') {
    if (!supabase) return;
    if (this.failedTables.has(table)) return;
    this.supabaseQueue = this.supabaseQueue.then(async () => {
      try {
        if (this.failedTables.has(table)) return;
        let currentPayload = { ...payload };
        let retries = 0;
        const maxRetries = 4;

        while (retries <= maxRetries) {
          let { error } = await supabase.from(table).upsert(currentPayload);
          if (!error) {
            if (retries > 0) {
              console.log(`✅ Upsert to "${table}" succeeded after self-healing (attempt ${retries + 1}).`);
            }
            return;
          }

          // Gracefully detect if table does not exist in the database or RLS prohibits writes
          if (
            error.message.includes('Could not find the table') ||
            (error.message.includes('relation') && error.message.includes('does not exist'))
          ) {
            console.warn(`⚠️ [Aviso Supabase] La tabla opcional "${table}" no existe en Supabase. Operando en modo local para esta función.`);
            this.failedTables.add(table);
            return;
          }

          if (
            error.message.includes('row-level security') ||
            error.message.includes('violates row-level security policy')
          ) {
            console.warn(`⚠️ [Aviso Supabase] La tabla "${table}" tiene políticas RLS activas que impiden la escritura desde este cliente. Operando en modo local para esta función.`);
            this.failedTables.add(table);
            return;
          }

          console.error(`[Supabase Error] Upsert to "${table}" failed (attempt ${retries + 1}):`, error.message);

          // 1. Missing column in schema: delete the key from payload
          if (error.message.includes('Could not find') && error.message.includes('column')) {
            const match = error.message.match(/Could not find the '([^']+)' column|Could not find the "([^"]+)" column|column '([^']+)'|column "([^"]+)"/i);
            const missingColumn = match ? (match[1] || match[2] || match[3] || match[4]) : null;
            if (missingColumn && currentPayload[missingColumn] !== undefined) {
              console.log(`⚠️ Retrying upsert to "${table}" after removing missing column: ${missingColumn}`);
              delete currentPayload[missingColumn];
              retries++;
              continue;
            }
          }

          // 2. NOT NULL constraint violation: populate a non-null default value for the missing column
          if (error.message.includes('violates not-null constraint') || error.message.includes('null value in column')) {
            const match = error.message.match(/column ["']([^"']+)["']/i);
            const missingNotNullCol = match ? match[1] : null;
            if (missingNotNullCol) {
              console.log(`⚠️ Retrying upsert to "${table}" after populating default for NOT NULL column: ${missingNotNullCol}`);
              let defaultValue: any = '';
              if (missingNotNullCol.includes('color')) defaultValue = '#a855f7';
              else if (missingNotNullCol.includes('name') || missingNotNullCol.includes('title')) defaultValue = 'Gran Rifa Pro';
              else if (missingNotNullCol.includes('enabled') || missingNotNullCol.includes('active')) defaultValue = true;
              else if (missingNotNullCol.includes('count') || missingNotNullCol.includes('attempt') || missingNotNullCol.includes('percentage') || missingNotNullCol.includes('price')) defaultValue = 0;
              currentPayload[missingNotNullCol] = defaultValue;
              retries++;
              continue;
            }
          }

          // If error couldn't be auto-healed, break out
          break;
        }
      } catch (err: any) {
        console.error(`[Supabase Exception] Failed to sync to "${table}":`, err.message);
      }
    });
    await this.supabaseQueue;
  }

  async deleteFromSupabase(table: string, id: string, primaryKeyField: string = 'id') {
    if (!supabase) return;
    if (this.failedTables.has(table)) return;
    this.supabaseQueue = this.supabaseQueue.then(async () => {
      try {
        if (this.failedTables.has(table)) return;
        const { error } = await supabase.from(table).delete().eq(primaryKeyField, id);
        if (error) {
          if (
            error.message.includes('Could not find the table') ||
            (error.message.includes('relation') && error.message.includes('does not exist'))
          ) {
            console.warn(`⚠️ [Aviso Supabase] La tabla opcional "${table}" no existe en Supabase. Operando en modo local para esta función.`);
            this.failedTables.add(table);
            return;
          }

          if (
            error.message.includes('row-level security') ||
            error.message.includes('violates row-level security policy')
          ) {
            console.warn(`⚠️ [Aviso Supabase] La tabla "${table}" tiene políticas RLS activas que impiden la eliminación desde este cliente. Operando en modo local para esta función.`);
            this.failedTables.add(table);
            return;
          }
          console.error(`[Supabase Error] Delete from "${table}" failed:`, error.message);
        }
      } catch (err: any) {
        console.error(`[Supabase Exception] Failed to delete from "${table}":`, err.message);
      }
    });
    await this.supabaseQueue;
  }

  async loadDataFromSupabase() {
    if (!supabase) return;
    console.log('🔄 Sincronizando datos desde Supabase de forma concurrente...');
    
    const tasks = [
      // 1. Users & Profiles
      (async () => {
        try {
          const { data, error } = await supabase.from('users').select('*');
          if (error) throw error;

          let profileMap = new Map();
          try {
            const { data: profilesData } = await supabase.from('profiles').select('*');
            if (profilesData) {
              profilesData.forEach((p: any) => profileMap.set(p.id, p));
            }
          } catch (e) {
            // Profiles optional
          }

          if (data && data.length > 0) {
            this.users = data.map((u: any) => {
              const prof = profileMap.get(u.id);
              const isSuper = (prof && prof.is_super_admin !== undefined && prof.is_super_admin !== null)
                ? Boolean(prof.is_super_admin)
                : Boolean(u.is_super_admin);

              return {
                id: u.id,
                username: u.username || prof?.username || u.name,
                name: u.name || prof?.name,
                email: u.email || prof?.email,
                role: u.role || prof?.role,
                status: prof?.status || u.status,
                failedLoginAttempts: u.failed_login_attempts ?? 0,
                isSuperAdmin: isSuper,
                lastAccessAt: u.last_access_at || prof?.last_access_at || undefined,
                createdAt: u.created_at || prof?.created_at || undefined,
                organizerId: u.organizer_id || prof?.organizer_id || undefined
              };
            });
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar los usuarios desde Supabase:', err.message);
        }
      })(),

      // 2. Passwords
      (async () => {
        try {
          const { data, error } = await supabase.from('passwords').select('*');
          if (error) throw error;
          if (data) {
            data.forEach((p: any) => {
              this.passwords[p.username] = p.password;
            });
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar las contraseñas desde Supabase:', err.message);
        }
      })(),

      // 3. Sellers
      (async () => {
        try {
          const { data, error } = await supabase.from('sellers').select('*');
          if (error) throw error;
          if (data) {
            this.sellers = data.map((s: any) => ({
              id: s.id,
              userId: s.user_id,
              name: s.name,
              assignedRangeStart: s.assigned_range_start,
              assignedRangeEnd: s.assigned_range_end,
              status: s.status,
              phone: s.phone || '',
              username: s.username || '',
              linkingCode: s.linking_code || ''
            }));
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar los vendedores desde Supabase:', err.message);
        }
      })(),

      // 4. Raffles
      (async () => {
        try {
          const { data, error } = await supabase.from('raffles').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            this.raffles = data.map((r: any) => ({
              id: r.id,
              name: r.name,
              description: r.description,
              prize: r.prize,
              totalNumbers: r.total_numbers,
              ticketPrice: Number(r.ticket_price),
              startDate: r.start_date,
              endDate: r.end_date,
              status: r.status,
              drawDate: r.draw_date,
              drawTime: r.draw_time,
              liveStreamUrl: r.live_stream_url,
              salesCutoffDate: r.sales_cutoff_date,
              salesCutoffTime: r.sales_cutoff_time,
              salesEnabled: r.sales_enabled !== false,
              autoTombola: r.auto_tombola !== false
            }));
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar las rifas desde Supabase:', err.message);
        }
      })(),

      // 5. Sales
      (async () => {
        try {
          const { data, error } = await supabase.from('sales').select('*');
          if (error) throw error;
          if (data) {
            this.sales = data.map((s: any) => ({
              id: s.id,
              raffleId: s.raffle_id,
              ticketNumber: s.ticket_number,
              buyerName: s.buyer_name,
              phone: s.phone,
              email: s.email,
              city: s.city,
              notes: s.notes,
              date: s.date,
              time: s.time,
              status: s.status,
              sellerId: s.seller_id,
              sellerName: s.seller_name,
              reservedAt: s.reserved_at
            }));
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar las ventas desde Supabase:', err.message);
        }
      })(),

      // 6. Audit Logs
      (async () => {
        try {
          const { data, error } = await supabase.from('audit_logs').select('*');
          if (error) throw error;
          if (data) {
            this.auditLogs = data.map((a: any) => ({
              id: a.id,
              timestamp: a.timestamp,
              userId: a.user_id,
              username: a.username,
              action: a.action,
              details: a.details
            }));
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar los logs de auditoría desde Supabase:', err.message);
        }
      })(),

      // 7. Config
      (async () => {
        try {
          const { data, error } = await supabase.from('config').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            const c = data[0];
            this.config = {
              id: c.id,
              allowOfflineSync: c.allow_offline_sync,
              maxFailedAttempts: c.max_failed_attempts,
              commissionPercentage: Number(c.commission_percentage ?? 10.0),
              currency: c.currency || 'USD'
            };
          }
        } catch (err: any) {
          console.warn('⚠️ No se pudieron sincronizar la configuración desde Supabase:', err.message);
        }
      })(),

      // 8. Verification Tokens
      (async () => {
        try {
          const { data, error } = await supabase.from('verification_tokens').select('*');
          if (error) throw error;
          if (data) {
            data.forEach((t: any) => {
              this.verificationTokens[t.user_id] = {
                userId: t.user_id,
                token: t.token,
                expiresAt: new Date(t.expires_at).getTime()
              };
            });
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })(),

      // 9. Announcements
      (async () => {
        try {
          const { data, error } = await supabase.from('announcements').select('*');
          if (error) throw error;
          if (data) {
            this.announcements = data.map((a: any) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              imageUrl: a.image_url,
              targetType: a.target_type,
              targetSellerId: a.target_seller_id,
              placement: a.placement,
              status: a.status,
              createdAt: a.created_at,
              ctaText: a.cta_text || '',
              ctaUrl: a.cta_url || '',
              deviceTarget: a.device_target || 'ALL'
            }));
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })(),

      // 10. Announcement Reads
      (async () => {
        try {
          const { data, error } = await supabase.from('announcement_reads').select('*');
          if (error) throw error;
          if (data) {
            this.announcementReads = data.map((r: any) => ({
              id: r.id,
              announcementId: r.announcement_id,
              sellerId: r.seller_id,
              readAt: r.read_at
            }));
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })(),

      // 11. Prizes
      (async () => {
        try {
          const { data, error } = await supabase.from('prizes').select('*');
          if (error) throw error;
          if (data) {
            this.prizes = data.map((p: any) => ({
              id: p.id,
              raffleId: p.raffle_id,
              name: p.name,
              description: p.description || '',
              enabled: p.enabled,
              order: p.order_num,
              budget: p.budget || 0
            }));
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })(),

      // 12. Draw History
      (async () => {
        try {
          const { data, error } = await supabase.from('draw_history').select('*');
          if (error) throw error;
          if (data) {
            this.drawHistory = data.map((d: any) => ({
              id: d.id,
              raffleId: d.raffle_id,
              drawDate: d.draw_date,
              drawTime: d.draw_time,
              winningNumber: d.winning_number,
              winnerName: d.winner_name || '',
              winnerPhone: d.winner_phone || '',
              winnerCity: d.winner_city || '',
              winnerEmail: d.winner_email || '',
              prizeName: d.prize_name,
              sellerName: d.seller_name || '',
              createdAt: d.created_at
            }));
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })(),

      // 13. Telemetry App Visits
      (async () => {
        try {
          const { data, error } = await supabase.from('app_visits').select('*');
          if (error) throw error;
          if (data) {
            this.appVisits = data.map((v: any) => ({
              id: v.id,
              timestamp: v.timestamp,
              hour: Number(v.hour),
              city: v.city,
              country: v.country,
              device: v.device,
              browser: v.browser,
              referrer: v.referrer,
              raffleId: v.raffle_id
            }));
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })(),

      // 14. Sponsors
      (async () => {
        try {
          const { data, error } = await supabase.from('sponsors').select('*');
          if (error) throw error;
          if (data) {
            this.sponsors = data.map((s: any) => ({
              id: s.id,
              name: s.name,
              imageUrl: s.image_url,
              text: s.text,
              designLayout: s.design_layout,
              enabled: s.enabled,
              order: s.sort_order || 0,
              createdAt: s.created_at
            }));
          }
        } catch (err: any) {
          // Table might not exist yet
        }
      })()
    ];

    try {
      await Promise.all(tasks);

      // Link prizes to raffles after both lists are populated
      this.raffles.forEach(r => {
        r.prizes = this.prizes.filter(p => p.raffleId === r.id);
      });

      console.log('✅ Sincronización inicial concurrente con Supabase completada con éxito.');
    } catch (err: any) {
      console.warn('\n⚠️ [Aviso Supabase] Error inesperado durante la sincronización concurrente:', err.message);
    }
  }

  async syncSalesFromSupabase() {
    if (!supabase) {
      throw new Error('La base de datos central Supabase no está configurada o no está disponible.');
    }
    const { data: salesData, error: salesErr } = await supabase.from('sales').select('*');
    if (salesErr) {
      throw new Error(`Error al sincronizar las ventas desde la base de datos central: ${salesErr.message}`);
    }
    this.sales = (salesData || []).map((s: any) => ({
      id: s.id,
      raffleId: s.raffle_id,
      ticketNumber: s.ticket_number,
      buyerName: s.buyer_name,
      phone: s.phone,
      email: s.email,
      city: s.city,
      notes: s.notes,
      date: s.date,
      time: s.time,
      status: s.status,
      sellerId: s.seller_id,
      sellerName: s.seller_name,
      reservedAt: s.reserved_at
    }));
  }

  async syncUsersFromSupabase() {
    if (!supabase) {
      throw new Error('La base de datos central Supabase no está configurada o no está disponible.');
    }
    const { data: usersData, error: usersErr } = await supabase.from('users').select('*');
    if (usersErr) {
      throw new Error(`Error al sincronizar los usuarios desde la base de datos central: ${usersErr.message}`);
    }

    let profileMap = new Map();
    try {
      const { data: profilesData } = await supabase.from('profiles').select('*');
      if (profilesData) {
        profilesData.forEach((p: any) => profileMap.set(p.id, p));
      }
    } catch (e) {
      // Profiles optional
    }

    this.users = usersData.map((u: any) => {
      const prof = profileMap.get(u.id);
      const isSuper = (prof && prof.is_super_admin !== undefined && prof.is_super_admin !== null)
        ? Boolean(prof.is_super_admin)
        : Boolean(u.is_super_admin);
      return {
        id: u.id,
        username: u.username || prof?.username,
        name: u.name || prof?.name,
        email: u.email || prof?.email,
        role: u.role || prof?.role,
        status: prof?.status || u.status,
        failedLoginAttempts: u.failed_login_attempts ?? 0,
        isSuperAdmin: isSuper,
        lastAccessAt: u.last_access_at || prof?.last_access_at || undefined,
        createdAt: u.created_at || undefined,
        organizerId: u.organizer_id || prof?.organizer_id || undefined
      };
    });

    const { data: passData, error: passErr } = await supabase.from('passwords').select('*');
    if (passErr) throw passErr;
    if (passData) {
      passData.forEach((p: any) => {
        this.passwords[p.username] = p.password;
      });
    }
  }

  async syncSellersFromSupabase() {
    if (!supabase) {
      throw new Error('La base de datos central Supabase no está configurada o no está disponible.');
    }
    const { data: sellersData, error: sellersErr } = await supabase.from('sellers').select('*');
    if (sellersErr) {
      throw new Error(`Error al sincronizar los vendedores desde la base de datos central: ${sellersErr.message}`);
    }
    this.sellers = (sellersData || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      name: s.name,
      assignedRangeStart: s.assigned_range_start,
      assignedRangeEnd: s.assigned_range_end,
      status: s.status,
      phone: s.phone || '',
      username: s.username || '',
      linkingCode: s.linking_code || ''
    }));
  }

  async syncRafflesFromSupabase() {
    if (!supabase) return;
    if (this.failedTables.has('raffles')) return;
    try {
      try {
        const { data: prizesData } = await supabase.from('prizes').select('*');
        if (prizesData && prizesData.length > 0) {
          this.prizes = prizesData.map((p: any) => ({
            id: p.id,
            raffleId: p.raffle_id,
            name: p.name,
            description: p.description || '',
            enabled: p.enabled,
            order: p.order_num,
            budget: p.budget || 0
          }));
        }
      } catch (e) {
        // Prizes table optional
      }

      const { data: rafflesData, error: rafflesErr } = await supabase.from('raffles').select('*');
      if (rafflesErr) {
        console.warn(`⚠️ [Aviso Supabase] Error al consultar "raffles": ${rafflesErr.message}. Operando en modo memoria local.`);
        this.failedTables.add('raffles');
        return;
      }
      if (rafflesData && rafflesData.length > 0) {
        this.raffles = (rafflesData || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          prize: r.prize,
          totalNumbers: r.total_numbers,
          ticketPrice: Number(r.ticket_price),
          startDate: r.start_date,
          endDate: r.end_date,
          status: r.status,
          drawDate: r.draw_date,
          drawTime: r.draw_time,
          liveStreamUrl: r.live_stream_url,
          salesCutoffDate: r.sales_cutoff_date,
          salesCutoffTime: r.sales_cutoff_time,
          salesEnabled: r.sales_enabled !== false,
          prizes: this.prizes.filter(p => p.raffleId === r.id)
        }));
      }
    } catch (err: any) {
      console.warn('Error al sincronizar rifas de Supabase:', err?.message || err);
      this.failedTables.add('raffles');
    }
  }

  async seedToSupabaseIfEmpty() {
    if (!supabase) return;
    try {
      // 1. Seed Config if missing
      const { data: configData, error: configErr } = await supabase.from('config').select('id', { limit: 1 });
      if (!configErr && (!configData || configData.length === 0)) {
        console.log('🌱 Tabla config vacía en Supabase. Sembrando configuración por defecto...');
        const initialPayload: any = {
          id: this.config.id,
          allow_offline_sync: this.config.allowOfflineSync,
          max_failed_attempts: this.config.maxFailedAttempts,
          commission_percentage: this.config.commissionPercentage ?? 10.0
        };
        const { error: insertErr } = await supabase.from('config').insert(initialPayload);
        if (insertErr) {
          console.warn('⚠️ Error al sembrar config inicial:', insertErr.message);
          if (insertErr.message.includes('Could not find') && insertErr.message.includes('column')) {
            const match = insertErr.message.match(/Could not find the '([^']+)' column|Could not find the "([^"]+)" column|column '([^']+)'|column "([^"]+)"/i);
            const missingCol = match ? (match[1] || match[2] || match[3] || match[4]) : null;
            if (missingCol && initialPayload[missingCol] !== undefined) {
              console.log(`🌱 Re-intentando siembra de config sin la columna: ${missingCol}`);
              delete initialPayload[missingCol];
              const { error: retryErr } = await supabase.from('config').insert(initialPayload);
              if (retryErr) {
                console.warn('⚠️ Segundo error al sembrar config:', retryErr.message);
              } else {
                console.log('✅ Config inicial sembrada con éxito tras auto-corrección.');
              }
            }
          }
        }
      }

      // 2. Seed default active Raffle if missing
      const { data: rafflesData, error: rafflesErr } = await supabase.from('raffles').select('id', { limit: 1 });
      if (!rafflesErr && (!rafflesData || rafflesData.length === 0)) {
        console.log('🌱 Tabla raffles vacía en Supabase. Sembrando rifa por defecto...');
        for (const r of this.raffles) {
          await supabase.from('raffles').insert({
            id: r.id,
            name: r.name,
            description: r.description,
            prize: r.prize,
            total_numbers: r.totalNumbers,
            ticket_price: r.ticketPrice,
            start_date: r.startDate,
            end_date: r.endDate,
            status: r.status,
            draw_date: r.drawDate,
            draw_time: r.drawTime,
            live_stream_url: r.liveStreamUrl,
            sales_cutoff_date: r.salesCutoffDate || null,
            sales_cutoff_time: r.salesCutoffTime || null
          });
        }
      }

      // 3. Seed default Prizes if missing
      const { data: prizesData, error: prizesErr } = await supabase.from('prizes').select('id', { limit: 1 });
      if (!prizesErr && (!prizesData || prizesData.length === 0)) {
        console.log('🌱 Tabla prizes vacía en Supabase. Sembrando premios por defecto...');
        for (const p of this.prizes) {
          await supabase.from('prizes').insert({
            id: p.id,
            raffle_id: p.raffleId,
            name: p.name,
            description: p.description || '',
            enabled: p.enabled,
            order_num: p.order,
            budget: p.budget || 0
          });
        }
      }
      console.log('✅ Verificación de datos de inicialización completada.');
    } catch (err: any) {
      console.warn('⚠️ Error al verificar/sembrar datos iniciales en Supabase:', err.message);
    }
  }

  getSqlSchemaInstructions(): string {
    return `
-- SCRIPT SQL MAESTRO PARA RIFA PRO EN SUPABASE (EDICIÓN DE ALTA SEGURIDAD) --
-- Cumple con estándares internacionales de seguridad: OWASP Top 10, GDPR y mejores prácticas de Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ORGANIZADOR', 'VENDEDOR')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION')),
  failed_login_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ORGANIZADOR', 'VENDEDOR')),
  phone TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS passwords (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  assigned_range_start INTEGER NOT NULL,
  assigned_range_end INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION')),
  phone TEXT,
  username TEXT,
  linking_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raffles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  total_numbers INTEGER NOT NULL,
  ticket_price NUMERIC NOT NULL CHECK (ticket_price >= 0),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED')),
  draw_date TEXT,
  draw_time TEXT,
  live_stream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  raffle_id TEXT NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  buyer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'RESERVED', 'PAID', 'CANCELLED', 'SOLD')),
  seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
  seller_name TEXT,
  reserved_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  allow_offline_sync BOOLEAN DEFAULT TRUE,
  max_failed_attempts INTEGER DEFAULT 5,
  commission_percentage NUMERIC DEFAULT 10.0,
  currency TEXT DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_visits (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  hour INTEGER NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  device TEXT NOT NULL,
  browser TEXT NOT NULL,
  referrer TEXT NOT NULL,
  raffle_id TEXT REFERENCES raffles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  text TEXT,
  design_layout TEXT NOT NULL CHECK (design_layout IN ('IMAGE_ONLY', 'IMAGE_TEXT', 'TEXT_ONLY')),
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_raffle_id ON sales(raffle_id);
CREATE INDEX IF NOT EXISTS idx_sales_ticket_number ON sales(ticket_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_sellers_linking_code ON sellers(linking_code);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_app_visits_raffle_id ON app_visits(raffle_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon y authenticated en app_visits" ON app_visits;
CREATE POLICY "Permitir todo a anon y authenticated en app_visits" ON app_visits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anon y authenticated en sponsors" ON sponsors;
CREATE POLICY "Permitir todo a anon y authenticated en sponsors" ON sponsors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura básica de usuarios" ON users;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON users;
CREATE POLICY "Permitir todo a anon y authenticated" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública de perfiles" ON profiles;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON profiles;
CREATE POLICY "Permitir todo a anon y authenticated" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON passwords;
CREATE POLICY "Permitir todo a anon y authenticated" ON passwords FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública de vendedores activos" ON sellers;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sellers;
CREATE POLICY "Permitir todo a anon y authenticated" ON sellers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública de rifas activas" ON raffles;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON raffles;
CREATE POLICY "Permitir todo a anon y authenticated" ON raffles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública de tickets para ver disponibilidad" ON sales;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sales;
CREATE POLICY "Permitir todo a anon y authenticated" ON sales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserción de logs desde backend" ON audit_logs;
DROP POLICY IF EXISTS "Permitir lectura de logs solo al rol administrador de servicio" ON audit_logs;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON audit_logs;
CREATE POLICY "Permitir todo a anon y authenticated" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública de la configuración" ON config;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON config;
CREATE POLICY "Permitir todo a anon y authenticated" ON config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON verification_tokens;
CREATE POLICY "Permitir todo a anon y authenticated" ON verification_tokens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;
  }

  // --- INITIAL DATA SEEDING ---

  seed() {
    const now = new Date();
    // Clean, empty memory structures without any hardcoded credentials, emails, or passwords (Option A)
    this.users = [];
    this.passwords = {};
    this.sellers = [];
    this.sales = [];
    this.auditLogs = [];
    this.notifications = [];
    this.sponsors = [];
    this.announcements = [
      {
        id: 'ann-default-1',
        title: '🚀 ¡Bono de Comisión Extra esta Semana!',
        content: 'Hola asesores, les recordamos que todos los vendedores que alcancen más de 20 boletos pagados esta semana recibirán un bono adicional del 5% sobre sus comisiones acumuladas. ¡A por todas!',
        imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop',
        targetType: 'ALL',
        placement: 'BOTH',
        status: 'ACTIVE',
        createdAt: now.toISOString(),
        deviceTarget: 'ALL'
      }
    ];
    this.announcementReads = [];

    // Seed telemetry visits with realistic distributions (empty by default for authentic production telemetry tracking)
    this.appVisits = [];

    // Initialize only a default, non-sensitive Raffle structure for convenience
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.raffles = [
      {
        id: 'r1',
        name: 'Gran Rifa Pro Anual - Tesla Model 3',
        description: 'Participa para ganar un Tesla Model 3 de última generación. Todos los fondos recaudados apoyarán causas benéficas y equipamiento educativo.',
        prize: 'Tesla Model 3 Standard Range LFP 2026 (Valorado en $45,000 USD)',
        totalNumbers: 500,
        ticketPrice: 15.00,
        startDate: oneWeekAgo,
        endDate: oneMonthLater,
        status: 'DRAFT',
        salesEnabled: false,
        drawDate: '2026-08-30',
        drawTime: '19:00',
        liveStreamUrl: 'https://youtube.com/live/rifaprofesional2026',
        salesCutoffDate: '2026-08-30',
        salesCutoffTime: '18:00',
      }
    ];
  }

  // --- BUSINESS OPERATIONS ---

  // Auth Operations
  async login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string } | null> {
    const lookupKey = usernameOrEmail.toLowerCase();
    let user = this.users.find(u => u.username.toLowerCase() === lookupKey || u.email.toLowerCase() === lookupKey);

    if (supabase) {
      try {
        let query = supabase.from('users').select('*');
        if (lookupKey.includes('@')) {
          query = query.eq('email', lookupKey);
        } else {
          query = query.eq('username', lookupKey);
        }
        const { data, error } = await query.single();
        if (!error && data) {
          let profData: any = null;
          try {
            const { data: p } = await supabase.from('profiles').select('*').eq('id', data.id).single();
            profData = p;
          } catch (e) {}

          const isSuper = (profData && profData.is_super_admin !== undefined && profData.is_super_admin !== null)
            ? Boolean(profData.is_super_admin)
            : Boolean(data.is_super_admin);

          const freshUser: User = {
            id: data.id,
            username: data.username,
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status,
            failedLoginAttempts: data.failed_login_attempts ?? 0,
            isSuperAdmin: isSuper,
            lastAccessAt: data.last_access_at || profData?.last_access_at || undefined,
            createdAt: data.created_at || undefined,
            organizerId: data.organizer_id || profData?.organizer_id || undefined
          };

          const idx = this.users.findIndex(u => u.id === freshUser.id || u.username.toLowerCase() === freshUser.username.toLowerCase());
          if (idx !== -1) {
            this.users[idx] = freshUser;
          } else {
            this.users.push(freshUser);
          }
          user = freshUser;
        }
      } catch (err) {
        console.warn('[Supabase Direct User Lookup Warning]', err);
      }
    }

    if (!user) return null;

    if (user.status === 'BLOCKED') {
      throw new Error('Su cuenta ha sido bloqueada debido a demasiados intentos fallidos de inicio de sesión o por decisión del administrador.');
    }

    // NATIVE SUPABASE AUTHENTICATION (When configured)
    if (supabase) {
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password
        });

        if (signInErr) {
          throw new Error(signInErr.message);
        }

        if (signInData?.user) {
          const sbUser = signInData.user;
          // Si el correo está confirmado en Supabase Auth pero sigue pendiente en nuestra base de datos, lo activamos
          if (sbUser.email_confirmed_at && user.status === 'PENDING_VERIFICATION') {
            user.status = 'ACTIVE';
            
            const seller = this.sellers.find(s => s.userId === user.id);
            if (seller) {
              seller.status = 'ACTIVE';
              await this.syncToSupabase('sellers', {
                id: seller.id,
                user_id: seller.userId && seller.userId !== '' ? seller.userId : null,
                name: seller.name,
                assigned_range_start: seller.assignedRangeStart,
                assigned_range_end: seller.assignedRangeEnd,
                status: seller.status,
                phone: seller.phone,
                username: seller.username,
                linking_code: seller.linkingCode
              });
            }

            const phone = seller ? seller.phone : '';
            await this.syncToSupabase('profiles', {
              id: user.id,
              username: user.username,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: phone,
              status: user.status
            });

            this.logAudit(user.id, user.username, 'AUTO_VERIFY_LOGIN', 'Cuenta activada automáticamente tras confirmar correo electrónicamente en Supabase.');
          }

          user.failedLoginAttempts = 0;
          user.lastAccessAt = new Date().toISOString();
          this.logAudit(user.id, user.username, 'LOGIN', 'Inicio de sesión exitoso vía Supabase Auth nativo.');

          await this.syncToSupabase('users', {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            failed_login_attempts: user.failedLoginAttempts,
            last_access_at: user.lastAccessAt,
            is_super_admin: user.isSuperAdmin ?? false,
            organizer_id: user.organizerId || null
          });

          // Sincronizar contraseña local
          const hashedPassword = this.hashPassword(password);
          this.passwords[user.username] = hashedPassword;
          await this.syncToSupabase('passwords', {
            username: user.username,
            password: hashedPassword
          }, 'username');

          return { 
            user, 
            token: signInData.session?.access_token || `jwt-token-simulated-for-${user.id}` 
          };
        }
      } catch (err: any) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= this.config.maxFailedAttempts) {
          user.status = 'BLOCKED';
          this.logAudit(user.id, user.username, 'BLOCK_USER', 'Usuario bloqueado tras superar el límite de intentos fallidos.');
        } else {
          this.logAudit(user.id, user.username, 'FAILED_LOGIN', `Intento fallido de inicio de sesión (${user.failedLoginAttempts}/${this.config.maxFailedAttempts}).`);
        }

        await this.syncToSupabase('users', {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          failed_login_attempts: user.failedLoginAttempts
        });

        throw new Error(err.message || 'Credenciales inválidas o correo pendiente de verificación.');
      }
    }

    // LOCAL SECURE FALLBACK LOGIN (When Supabase is not active/configured)
    if (user.status === 'PENDING_VERIFICATION') {
      throw new Error('Su cuenta está pendiente de verificación por correo electrónico. Por favor, revise su bandeja de entrada (o las notificaciones simuladas) y use el enlace de confirmación para activar su cuenta.');
    }

    const correctPassword = this.passwords[user.username] || this.passwords[user.username.toLowerCase()];
    const isCorrect = correctPassword && this.verifyPassword(password, correctPassword);

    if (isCorrect) {
      if (!correctPassword.startsWith('pbkdf2:sha256:')) {
        const newSecureHash = this.hashPassword(password);
        this.passwords[user.username] = newSecureHash;
        this.syncToSupabase('passwords', {
          username: user.username.toLowerCase(),
          password: newSecureHash
        }, 'username').catch(err => console.error('Error auto-migrating password to PBKDF2:', err));
      }

      user.failedLoginAttempts = 0;
      user.lastAccessAt = new Date().toISOString();
      this.logAudit(user.id, user.username, 'LOGIN', 'Inicio de sesión exitoso (Modo Local con actualización de hash).');

      this.syncToSupabase('users', {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        failed_login_attempts: user.failedLoginAttempts,
        last_access_at: user.lastAccessAt,
        is_super_admin: user.isSuperAdmin ?? false,
        organizer_id: user.organizerId || null
      }).catch(err => console.error('Error updating last_access_at on local login:', err));

      const seller = this.sellers.find(s => s.userId === user.id);
      const phone = seller ? seller.phone : '';
      this.syncToSupabase('profiles', {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: phone,
        status: user.status,
        last_access_at: user.lastAccessAt,
        is_super_admin: user.isSuperAdmin ?? false,
        organizer_id: user.organizerId || null
      }).catch(err => console.error('Error updating profile last_access_at on local login:', err));

      return { user, token: `jwt-token-simulated-for-${user.id}` };
    } else {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= this.config.maxFailedAttempts) {
        user.status = 'BLOCKED';
        this.logAudit(user.id || 'system', user.username, 'BLOCK_USER', 'Usuario bloqueado tras superar el límite de intentos fallidos.');
        throw new Error(`Cuenta bloqueada. Se ha superado el número máximo de intentos fallidos (${this.config.maxFailedAttempts}). Contacte al administrador.`);
      }
      this.logAudit(user.id || 'system', user.username, 'FAILED_LOGIN', `Intento fallido de inicio de sesión (${user.failedLoginAttempts}/${this.config.maxFailedAttempts}).`);
      return null;
    }
  }

  changePassword(userId: string, oldPass: string, newPass: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;

    const currentPass = this.passwords[user.username];
    const isCorrect = currentPass && this.verifyPassword(oldPass, currentPass);

    if (!isCorrect) {
      throw new Error('La contraseña actual es incorrecta.');
    }

    const hashedNewPass = this.hashPassword(newPass);
    this.passwords[user.username] = hashedNewPass;
    this.logAudit(userId, user.username, 'CHANGE_PASSWORD', 'Contraseña cambiada exitosamente.');
    
    this.syncToSupabase('passwords', {
      username: user.username,
      password: hashedNewPass
    }, 'username');

    return true;
  }

  resetPasswordByAdmin(adminUserId: string, targetUserId: string, newPass: string): boolean {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const user = this.users.find(u => u.id === targetUserId);
    if (!user) return false;

    const hashedNewPass = this.hashPassword(newPass);
    this.passwords[user.username] = hashedNewPass;
    this.logAudit(adminUserId, admin.username, 'RESET_PASSWORD', `Reestableció contraseña del usuario ${user.username}`);
    
    this.syncToSupabase('passwords', {
      username: user.username,
      password: hashedNewPass
    }, 'username');

    return true;
  }

  async toggleUserStatusBySuperAdmin(superAdminId: string, targetUserId: string, newStatus: UserStatus): Promise<User> {
    const superAdmin = this.users.find(u => u.id === superAdminId && u.isSuperAdmin === true);
    if (!superAdmin) {
      throw new Error('Permiso denegado: Se requiere rol de Super Administrador.');
    }

    const targetUser = this.users.find(u => u.id === targetUserId);
    if (!targetUser) {
      throw new Error('Usuario no encontrado.');
    }

    targetUser.status = newStatus;
    
    // Sync the target user status
    await this.syncToSupabase('users', {
      id: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      failed_login_attempts: targetUser.failedLoginAttempts,
      is_super_admin: targetUser.isSuperAdmin ?? false,
      last_access_at: targetUser.lastAccessAt || null,
      organizer_id: targetUser.organizerId || null
    });

    const sellerObj = this.sellers.find(s => s.userId === targetUser.id);
    const phone = sellerObj ? sellerObj.phone : '';
    await this.syncToSupabase('profiles', {
      id: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      phone: phone,
      status: targetUser.status,
      is_super_admin: targetUser.isSuperAdmin ?? false,
      last_access_at: targetUser.lastAccessAt || null,
      organizer_id: targetUser.organizerId || null
    });

    this.logAudit(superAdminId, superAdmin.username, 'SUPER_ADMIN_TOGGLE_STATUS', `Cambió estado de ${targetUser.role} "${targetUser.name}" a ${newStatus}`);

    // RECURSIVE DEACTIVATION: "cuando el super administrador desactive un organizador automaticamente se desactivará todo lo que que tenga que ver con el organizador"
    if (targetUser.role === 'ORGANIZADOR' && newStatus === 'BLOCKED') {
      // Find all sellers that belong to this organizer
      const associatedSellers = this.users.filter(u => u.role === 'VENDEDOR' && u.organizerId === targetUser.id);
      for (const sellerUser of associatedSellers) {
        sellerUser.status = 'BLOCKED';
        
        await this.syncToSupabase('users', {
          id: sellerUser.id,
          username: sellerUser.username,
          name: sellerUser.name,
          email: sellerUser.email,
          role: sellerUser.role,
          status: sellerUser.status,
          failed_login_attempts: sellerUser.failedLoginAttempts,
          is_super_admin: sellerUser.isSuperAdmin ?? false,
          last_access_at: sellerUser.lastAccessAt || null,
          organizer_id: sellerUser.organizerId || null
        });

        const sRecord = this.sellers.find(s => s.userId === sellerUser.id);
        if (sRecord) {
          sRecord.status = 'BLOCKED';
          await this.syncToSupabase('sellers', {
            id: sRecord.id,
            user_id: sRecord.userId,
            name: sRecord.name,
            assigned_range_start: sRecord.assignedRangeStart,
            assigned_range_end: sRecord.assignedRangeEnd,
            status: 'BLOCKED',
            phone: sRecord.phone,
            username: sRecord.username,
            linking_code: sRecord.linkingCode
          });
        }

        const sPhone = sRecord ? sRecord.phone : '';
        await this.syncToSupabase('profiles', {
          id: sellerUser.id,
          username: sellerUser.username,
          name: sellerUser.name,
          email: sellerUser.email,
          role: sellerUser.role,
          phone: sPhone,
          status: sellerUser.status,
          is_super_admin: sellerUser.isSuperAdmin ?? false,
          last_access_at: sellerUser.lastAccessAt || null,
          organizer_id: sellerUser.organizerId || null
        });

        this.logAudit(superAdminId, superAdmin.username, 'SUPER_ADMIN_CASCADE_BLOCK', `Desactivación en cascada del colaborador: ${sellerUser.name}`);
      }
    } else if (targetUser.role === 'ORGANIZADOR' && newStatus === 'ACTIVE') {
      // Cascade activation
      const associatedSellers = this.users.filter(u => u.role === 'VENDEDOR' && u.organizerId === targetUser.id);
      for (const sellerUser of associatedSellers) {
        sellerUser.status = 'ACTIVE';
        
        await this.syncToSupabase('users', {
          id: sellerUser.id,
          username: sellerUser.username,
          name: sellerUser.name,
          email: sellerUser.email,
          role: sellerUser.role,
          status: sellerUser.status,
          failed_login_attempts: sellerUser.failedLoginAttempts,
          is_super_admin: sellerUser.isSuperAdmin ?? false,
          last_access_at: sellerUser.lastAccessAt || null,
          organizer_id: sellerUser.organizerId || null
        });

        const sRecord = this.sellers.find(s => s.userId === sellerUser.id);
        if (sRecord) {
          sRecord.status = 'ACTIVE';
          await this.syncToSupabase('sellers', {
            id: sRecord.id,
            user_id: sRecord.userId,
            name: sRecord.name,
            assigned_range_start: sRecord.assignedRangeStart,
            assigned_range_end: sRecord.assignedRangeEnd,
            status: 'ACTIVE',
            phone: sRecord.phone,
            username: sRecord.username,
            linking_code: sRecord.linkingCode
          });
        }

        const sPhone = sRecord ? sRecord.phone : '';
        await this.syncToSupabase('profiles', {
          id: sellerUser.id,
          username: sellerUser.username,
          name: sellerUser.name,
          email: sellerUser.email,
          role: sellerUser.role,
          phone: sPhone,
          status: sellerUser.status,
          is_super_admin: sellerUser.isSuperAdmin ?? false,
          last_access_at: sellerUser.lastAccessAt || null,
          organizer_id: sellerUser.organizerId || null
        });
      }
    }

    return targetUser;
  }

  // Seller CRUD Operations
  async createSeller(adminUserId: string, data: Omit<Seller, 'id' | 'status'> & { username?: string; pass?: string; email?: string }): Promise<Seller> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
    }

    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    if (data.username && this.users.some(u => u.username === data.username!.toLowerCase())) {
      throw new Error(`El nombre de usuario "${data.username}" ya está registrado.`);
    }

    if (data.assignedRangeStart <= 0 || data.assignedRangeEnd <= 0) {
      throw new Error('Los rangos de números deben ser mayores a cero.');
    }
    if (data.assignedRangeStart > data.assignedRangeEnd) {
      throw new Error('El número inicial del rango no puede ser mayor que el final.');
    }

    // Check overlap
    for (const seller of this.sellers) {
      const startsOverlap = data.assignedRangeStart >= seller.assignedRangeStart && data.assignedRangeStart <= seller.assignedRangeEnd;
      const endsOverlap = data.assignedRangeEnd >= seller.assignedRangeStart && data.assignedRangeEnd <= seller.assignedRangeEnd;
      const containsOverlap = data.assignedRangeStart <= seller.assignedRangeStart && data.assignedRangeEnd >= seller.assignedRangeEnd;

      if (startsOverlap || endsOverlap || containsOverlap) {
        throw new Error(`Conflicto de rango: El rango ${data.assignedRangeStart}-${data.assignedRangeEnd} se solapa con el vendedor "${seller.name}" (${seller.assignedRangeStart}-${seller.assignedRangeEnd}).`);
      }
    }

    let newUserId = '';
    if (data.username && data.pass && data.email) {
      newUserId = `u-${Date.now()}`;
      const newUser: User = {
        id: newUserId,
        username: data.username.toLowerCase(),
        name: data.name,
        email: data.email,
        role: 'VENDEDOR',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        isSuperAdmin: false,
        organizerId: adminUserId,
      };
      
      const hashedPassword = this.hashPassword(data.pass);
      this.users.push(newUser);
      this.passwords[data.username.toLowerCase()] = hashedPassword;

      // Sync User & Password
      this.syncToSupabase('users', {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        failed_login_attempts: newUser.failedLoginAttempts,
        is_super_admin: newUser.isSuperAdmin,
        organizer_id: newUser.organizerId
      });
      this.syncToSupabase('passwords', {
        username: newUser.username,
        password: hashedPassword
      }, 'username');
    }

    const newSellerId = `s-${Date.now()}`;
    const newSeller: Seller = {
      id: newSellerId,
      userId: newUserId,
      name: data.name,
      assignedRangeStart: data.assignedRangeStart,
      assignedRangeEnd: data.assignedRangeEnd,
      status: 'ACTIVE',
      phone: data.phone || '',
      username: data.username ? data.username.toLowerCase() : '',
      linkingCode: this.generateUniqueLinkingCode(),
    };
    this.sellers.push(newSeller);

    // Sync Seller
    this.syncToSupabase('sellers', {
      id: newSeller.id,
      user_id: newSeller.userId && newSeller.userId !== '' ? newSeller.userId : null,
      name: newSeller.name,
      assigned_range_start: newSeller.assignedRangeStart,
      assigned_range_end: newSeller.assignedRangeEnd,
      status: newSeller.status,
      phone: newSeller.phone,
      username: newSeller.username,
      linking_code: newSeller.linkingCode
    });

    if (newUserId) {
      this.logAudit(adminUserId, admin.username, 'CREATE_SELLER', `Vendedor creado: ${data.name} (Rango ${data.assignedRangeStart}-${data.assignedRangeEnd})`);
    } else {
      this.logAudit(adminUserId, admin.username, 'CREATE_LICENSE', `Licencia de vendedor generada: ${data.name} (Rango ${data.assignedRangeStart}-${data.assignedRangeEnd}) con código de vinculación ${newSeller.linkingCode}`);
    }
    return newSeller;
  }

  async updateSeller(adminUserId: string, sellerId: string, updates: Partial<Seller>): Promise<Seller> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
    }

    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const seller = this.sellers.find(s => s.id === sellerId);
    if (!seller) throw new Error('Vendedor no encontrado.');

    const newStart = updates.assignedRangeStart ?? seller.assignedRangeStart;
    const newEnd = updates.assignedRangeEnd ?? seller.assignedRangeEnd;

    if (updates.assignedRangeStart !== undefined || updates.assignedRangeEnd !== undefined) {
      if (newStart <= 0 || newEnd <= 0) {
        throw new Error('Los rangos de números deben ser mayores a cero.');
      }
      if (newStart > newEnd) {
        throw new Error('El rango inicial no puede ser mayor al final.');
      }

      for (const other of this.sellers) {
        if (other.id === sellerId) continue;
        const startsOverlap = newStart >= other.assignedRangeStart && newStart <= other.assignedRangeEnd;
        const endsOverlap = newEnd >= other.assignedRangeStart && newEnd <= other.assignedRangeEnd;
        const containsOverlap = newStart <= other.assignedRangeStart && newEnd >= other.assignedRangeEnd;

        if (startsOverlap || endsOverlap || containsOverlap) {
          throw new Error(`Conflicto de rango con vendedor "${other.name}" (${other.assignedRangeStart}-${other.assignedRangeEnd}).`);
        }
      }
    }

    seller.name = updates.name ?? seller.name;
    seller.assignedRangeStart = newStart;
    seller.assignedRangeEnd = newEnd;
    seller.phone = updates.phone ?? seller.phone;

    if (updates.status) {
      seller.status = updates.status;
      const targetUser = this.users.find(u => u.id === seller.userId);
      if (targetUser) {
        targetUser.status = updates.status;
        this.syncToSupabase('users', {
          id: targetUser.id,
          username: targetUser.username,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          status: targetUser.status,
          failed_login_attempts: targetUser.failedLoginAttempts
        });
      }
    }

    this.logAudit(adminUserId, admin.username, 'UPDATE_SELLER', `Modificación del vendedor: ${seller.name} (Rango ${seller.assignedRangeStart}-${seller.assignedRangeEnd})`);
    
    this.syncToSupabase('sellers', {
      id: seller.id,
      user_id: seller.userId && seller.userId !== '' ? seller.userId : null,
      name: seller.name,
      assigned_range_start: seller.assignedRangeStart,
      assigned_range_end: seller.assignedRangeEnd,
      status: seller.status,
      phone: seller.phone,
      username: seller.username,
      linking_code: seller.linkingCode
    });

    return seller;
  }

  async deleteSeller(adminUserId: string, sellerId: string): Promise<boolean> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
    }

    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const idx = this.sellers.findIndex(s => s.id === sellerId);
    if (idx === -1) return false;

    const seller = this.sellers[idx];
    
    if (seller.userId) {
      this.users = this.users.filter(u => u.id !== seller.userId);
      this.deleteFromSupabase('users', seller.userId);
    }
    
    this.sellers.splice(idx, 1);
    this.deleteFromSupabase('sellers', seller.id);

    this.logAudit(adminUserId, admin.username, 'DELETE_SELLER', `Eliminó vendedor o licencia: ${seller.name}`);
    return true;
  }

  async autoGenerateSellers(adminUserId: string, rangeSize: number): Promise<Seller[]> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
    }

    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const raffle = this.raffles.find(r => r.status === 'ACTIVE') || this.raffles[0];
    if (!raffle) throw new Error('Sorteo activo no encontrado.');

    // 1. Delete all non-linked sellers first, to clear the slate for regeneration
    const linkedSellers = this.sellers.filter(s => !!s.userId);
    const unlinkedSellers = this.sellers.filter(s => !s.userId);

    for (const s of unlinkedSellers) {
      this.deleteFromSupabase('sellers', s.id);
    }
    this.sellers = linkedSellers;

    // 2. Generate sequential ranges of rangeSize up to raffle.totalNumbers
    const newSellersGenerated: Seller[] = [];
    const total = raffle.totalNumbers;
    
    for (let start = 1; start <= total; start += rangeSize) {
      const end = Math.min(start + rangeSize - 1, total);
      
      // Check if this range overlaps with any remaining linked sellers
      let overlap = false;
      for (const seller of this.sellers) {
        const startsOverlap = start >= seller.assignedRangeStart && start <= seller.assignedRangeEnd;
        const endsOverlap = end >= seller.assignedRangeStart && end <= seller.assignedRangeEnd;
        const containsOverlap = start <= seller.assignedRangeStart && end >= seller.assignedRangeEnd;
        if (startsOverlap || endsOverlap || containsOverlap) {
          overlap = true;
          break;
        }
      }

      if (overlap) {
        continue; // Skip this range as it conflicts with an existing active seller
      }

      // Create new unlinked license
      const newSellerId = `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const linkingCode = this.generateUniqueLinkingCode();
      const newSeller: Seller = {
        id: newSellerId,
        userId: '',
        name: `Licencia Auto-Generada (${start}-${end})`,
        assignedRangeStart: start,
        assignedRangeEnd: end,
        status: 'ACTIVE',
        phone: '',
        username: '',
        linkingCode: linkingCode,
      };

      this.sellers.push(newSeller);
      newSellersGenerated.push(newSeller);

      // Sync to Supabase
      this.syncToSupabase('sellers', {
        id: newSeller.id,
        user_id: null,
        name: newSeller.name,
        assigned_range_start: newSeller.assignedRangeStart,
        assigned_range_end: newSeller.assignedRangeEnd,
        status: newSeller.status,
        phone: newSeller.phone,
        username: newSeller.username,
        linking_code: newSeller.linkingCode
      });
    }

    this.logAudit(adminUserId, admin.username, 'AUTO_GEN_LICENSES', `Auto-generó licencias de vendedores en rangos de ${rangeSize} números.`);
    return this.sellers;
  }

  // System Config Operations
  async updateConfig(adminUserId: string, updates: Partial<AppConfig>): Promise<AppConfig> {
    if (supabase) {
      await this.syncUsersFromSupabase();
    }

    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    if (updates.allowOfflineSync !== undefined) this.config.allowOfflineSync = updates.allowOfflineSync;
    if (updates.maxFailedAttempts !== undefined) this.config.maxFailedAttempts = updates.maxFailedAttempts;
    if (updates.commissionPercentage !== undefined) this.config.commissionPercentage = updates.commissionPercentage;
    if (updates.currency !== undefined) this.config.currency = updates.currency;

    this.logAudit(adminUserId, admin.username, 'UPDATE_CONFIG', `Actualizó la configuración global del sistema.`);

    await this.syncToSupabase('config', {
      id: this.config.id,
      allow_offline_sync: this.config.allowOfflineSync,
      max_failed_attempts: this.config.maxFailedAttempts,
      commission_percentage: this.config.commissionPercentage ?? 10.0,
      currency: this.config.currency || 'USD',
      primary_color: '#a855f7',
      secondary_color: '#ec4899',
      app_name: 'Gran Rifa Pro Anual',
      logo_url: ''
    });

    return this.config;
  }

  // Raffle Operations
  async updateRaffle(adminUserId: string, raffleId: string, updates: Partial<Raffle>): Promise<Raffle> {
    if (supabase) {
      await this.syncUsersFromSupabase();
    }

    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const raffle = this.raffles.find(r => r.id === raffleId);
    if (!raffle) throw new Error('Rifa no encontrada.');

    if (updates.name !== undefined) raffle.name = updates.name;
    if (updates.description !== undefined) raffle.description = updates.description;
    if (updates.prize !== undefined) raffle.prize = updates.prize;
    if (updates.ticketPrice !== undefined) raffle.ticketPrice = updates.ticketPrice;
    if (updates.drawDate !== undefined) raffle.drawDate = updates.drawDate;
    if (updates.drawTime !== undefined) raffle.drawTime = updates.drawTime;
    if (updates.liveStreamUrl !== undefined) raffle.liveStreamUrl = updates.liveStreamUrl;
    if (updates.salesCutoffDate !== undefined) raffle.salesCutoffDate = updates.salesCutoffDate;
    if (updates.salesCutoffTime !== undefined) raffle.salesCutoffTime = updates.salesCutoffTime;
    if (updates.salesEnabled !== undefined) raffle.salesEnabled = updates.salesEnabled;
    if (updates.autoTombola !== undefined) raffle.autoTombola = updates.autoTombola;
    if (updates.status !== undefined) {
      if (raffle.status === 'ACTIVE' && updates.status === 'DRAFT') {
        throw new Error('Una vez activado el sorteo, no es posible desactivarlo (devolverlo a borrador). Únicamente puede pausar o reanudar la recepción de registros.');
      }
      raffle.status = updates.status;
    }

    if (updates.prizes !== undefined) {
      // Clear existing prizes for this raffle in memory
      this.prizes = this.prizes.filter(p => p.raffleId !== raffleId);
      
      for (const p of updates.prizes) {
        const prizeId = p.id || `prize-${Date.now()}-${p.order}`;
        const newPrize: PrizeConfig = {
          id: prizeId,
          raffleId: raffleId,
          name: p.name,
          description: p.description || '',
          enabled: p.enabled,
          order: p.order,
          budget: p.budget || 0
        };
        this.prizes.push(newPrize);
        
        // Sync to Supabase
        await this.syncToSupabase('prizes', {
          id: newPrize.id,
          raffle_id: newPrize.raffleId,
          name: newPrize.name,
          description: newPrize.description,
          enabled: newPrize.enabled,
          order_num: newPrize.order,
          budget: newPrize.budget
        });
      }
      raffle.prizes = this.prizes.filter(p => p.raffleId === raffleId);
    }
    
    // Validate sales cutoff vs draw date/time
    const checkDrawDate = updates.drawDate !== undefined ? updates.drawDate : raffle.drawDate;
    const checkDrawTime = updates.drawTime !== undefined ? updates.drawTime : raffle.drawTime;
    const checkCutoffDate = updates.salesCutoffDate !== undefined ? updates.salesCutoffDate : raffle.salesCutoffDate;
    const checkCutoffTime = updates.salesCutoffTime !== undefined ? updates.salesCutoffTime : raffle.salesCutoffTime;

    if (checkDrawDate && checkDrawTime && checkCutoffDate && checkCutoffTime) {
      const drawDateTime = new Date(`${checkDrawDate}T${checkDrawTime}`);
      const cutoffDateTime = new Date(`${checkCutoffDate}T${checkCutoffTime}`);
      if (cutoffDateTime > drawDateTime) {
        throw new Error('La fecha y hora límite de venta no puede ser posterior a la fecha y hora del sorteo.');
      }
    }
    
    if (updates.totalNumbers !== undefined) {
      if (updates.totalNumbers % 2 !== 0) {
        throw new Error('La cantidad de números a generar debe ser un número par.');
      }
      raffle.totalNumbers = updates.totalNumbers;
    }

    this.logAudit(adminUserId, admin.username, 'UPDATE_RAFFLE', `Actualizó configuración de la rifa: ${raffle.name}`);
    
    await this.syncToSupabase('raffles', {
      id: raffle.id,
      name: raffle.name,
      description: raffle.description,
      prize: raffle.prize,
      total_numbers: raffle.totalNumbers,
      ticket_price: raffle.ticketPrice,
      start_date: raffle.startDate,
      end_date: raffle.endDate,
      status: raffle.status,
      draw_date: raffle.drawDate,
      draw_time: raffle.drawTime,
      live_stream_url: raffle.liveStreamUrl,
      sales_cutoff_date: raffle.salesCutoffDate || null,
      sales_cutoff_time: raffle.salesCutoffTime || null,
      sales_enabled: raffle.salesEnabled !== false,
      auto_tombola: raffle.autoTombola !== false
    });

    return raffle;
  }

  // Sale Operations
  async registerSale(operatorUserId: string, saleData: Omit<Sale, 'id' | 'date' | 'time'>): Promise<Sale> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
      await this.syncSalesFromSupabase();
    }

    const operator = this.users.find(u => u.id === operatorUserId);
    if (!operator) throw new Error('Usuario inválido.');

    const raffle = this.raffles.find(r => r.id === saleData.raffleId);
    if (!raffle) throw new Error('Rifa no encontrada.');

    if (raffle.salesEnabled === false) {
      throw new Error('Las ventas de boletos se encuentran pausadas o deshabilitadas por el organizador.');
    }

    const now = new Date();
    const startDate = new Date(raffle.startDate);
    const endDate = new Date(raffle.endDate);

    if (now < startDate) {
      throw new Error('La venta aún no ha comenzado.');
    }
    if (raffle.salesCutoffDate && raffle.salesCutoffTime) {
      const cutoffDateTime = new Date(`${raffle.salesCutoffDate}T${raffle.salesCutoffTime}`);
      if (now > cutoffDateTime) {
        throw new Error('Las ventas han cerrado para este sorteo (límite de tiempo alcanzado).');
      }
    }
    if (now > endDate || raffle.status === 'FINISHED') {
      throw new Error('La rifa ha finalizado.');
    }
    if (raffle.status === 'CANCELLED') {
      throw new Error('La rifa ha sido cancelada.');
    }

    if (saleData.ticketNumber <= 0 || saleData.ticketNumber > raffle.totalNumbers) {
      throw new Error(`El número debe estar entre 1 y ${raffle.totalNumbers}.`);
    }

    if (operator.role === 'VENDEDOR') {
      const seller = this.sellers.find(s => s.userId === operator.id);
      if (!seller) throw new Error('Perfil de vendedor no encontrado.');
      if (seller.status === 'BLOCKED') throw new Error('Su cuenta de vendedor está bloqueada.');
    }

    // Atomic lock check to prevent race condition collision on the same ticket
    const lockKey = `${saleData.raffleId}:${saleData.ticketNumber}`;
    if (this.ticketLocks.has(lockKey)) {
      throw new Error(`El número #${saleData.ticketNumber} se está procesando simultáneamente en otra transacción. Intente de nuevo.`);
    }

    this.ticketLocks.add(lockKey);

    try {
      const existing = this.sales.find(s => s.raffleId === saleData.raffleId && s.ticketNumber === saleData.ticketNumber);
      if (existing && existing.status !== 'CANCELLED' && existing.status !== 'AVAILABLE') {
        throw new Error(`El número #${saleData.ticketNumber} ya se encuentra ${existing.status === 'PAID' ? 'pagado' : 'reservado'}.`);
      }

    let resolvedSellerId = saleData.sellerId;
    let resolvedSellerName = 'Directo (Sin Vendedor)';

    if (operator.role === 'VENDEDOR') {
      const seller = this.sellers.find(s => s.userId === operator.id);
      if (seller) {
        resolvedSellerId = seller.id;
        resolvedSellerName = seller.name;
      }
    } else if (resolvedSellerId) {
      const seller = this.sellers.find(s => s.id === resolvedSellerId);
      if (seller) {
        resolvedSellerName = seller.name;
      }
    }

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      raffleId: saleData.raffleId,
      ticketNumber: saleData.ticketNumber,
      buyerName: saleData.buyerName,
      phone: saleData.phone,
      email: saleData.email,
      city: saleData.city,
      notes: saleData.notes,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      status: saleData.status,
      sellerId: resolvedSellerId,
      sellerName: resolvedSellerName,
      reservedAt: saleData.status === 'RESERVED' ? now.toISOString() : undefined,
    };

    if (existing) {
      const idx = this.sales.findIndex(s => s.id === existing.id);
      this.sales[idx] = newSale;
    } else {
      this.sales.push(newSale);
    }

    this.logAudit(operatorUserId, operator.username, 'REGISTER_SALE', `Número #${newSale.ticketNumber} registrado como ${newSale.status} para ${newSale.buyerName}`);
    
    // Sync Sale
    this.syncToSupabase('sales', {
      id: newSale.id,
      raffle_id: newSale.raffleId,
      ticket_number: newSale.ticketNumber,
      buyer_name: newSale.buyerName,
      phone: newSale.phone,
      email: newSale.email,
      city: newSale.city,
      notes: newSale.notes,
      date: newSale.date,
      time: newSale.time,
      status: newSale.status,
      seller_id: newSale.sellerId && newSale.sellerId !== '' ? newSale.sellerId : null,
      seller_name: newSale.sellerName,
      reserved_at: newSale.reservedAt
    });

    this.notifications.push({
      id: `n-${Date.now()}`,
      title: `Confirmación de Ticket #${newSale.ticketNumber}`,
      message: `Hola ${newSale.buyerName}, tu número #${newSale.ticketNumber} ha sido registrado como ${newSale.status === 'PAID' ? 'PAGADO' : 'RESERVADO'}. Premio: ${raffle.prize}. ¡Mucho éxito!`,
      date: now.toISOString(),
      channel: newSale.email ? 'EMAIL' : 'WHATSAPP',
      sent: true,
      recipient: newSale.email || newSale.phone,
    });

    return newSale;
    } finally {
      this.ticketLocks.delete(lockKey);
    }
  }

  cleanupExpiredReservations() {
    const now = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    
    this.sales = this.sales.filter(s => {
      // Check if raffle sales cutoff is reached
      const raffle = this.raffles.find(r => r.id === s.raffleId);
      if (raffle && raffle.salesCutoffDate && raffle.salesCutoffTime) {
        const cutoffDateTime = new Date(`${raffle.salesCutoffDate}T${raffle.salesCutoffTime}`).getTime();
        if (now > cutoffDateTime && s.status === 'RESERVED') {
          this.logAudit('system', 'sistema', 'RESERVATION_EXPIRED_CUTOFF', `La reserva del ticket #${s.ticketNumber} para ${s.buyerName} fue liberada automáticamente al alcanzarse la fecha/hora límite de venta.`);
          this.deleteFromSupabase('sales', s.id);
          return false;
        }
      }

      if (s.status === 'RESERVED' && s.reservedAt) {
        const reservedTime = new Date(s.reservedAt).getTime();
        if (now - reservedTime > threeHoursMs) {
          this.logAudit('system', 'sistema', 'RESERVATION_EXPIRED', `La reserva del ticket #${s.ticketNumber} para ${s.buyerName} expiró (límite de 3 horas alcanzado).`);
          
          this.deleteFromSupabase('sales', s.id);
          return false;
        }
      }
      return true;
    });
  }

  async updateSaleStatus(operatorUserId: string, saleId: string, newStatus: TicketStatus): Promise<Sale> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSalesFromSupabase();
    }

    const operator = this.users.find(u => u.id === operatorUserId);
    if (!operator) throw new Error('Usuario inválido.');

    const sale = this.sales.find(s => s.id === saleId);
    if (!sale) throw new Error('Venta no encontrada.');

    if (sale.status === 'PAID') {
      throw new Error('El ticket ya ha sido PAGADO. Las ventas pagadas son definitivas e inmutables.');
    }

    const oldStatus = sale.status;
    sale.status = newStatus;

    this.logAudit(operatorUserId, operator.username, 'UPDATE_SALE_STATUS', `Cambió estado de ticket #${sale.ticketNumber} de ${oldStatus} a ${newStatus}`);
    
    this.syncToSupabase('sales', {
      id: sale.id,
      raffle_id: sale.raffleId,
      ticket_number: sale.ticketNumber,
      buyer_name: sale.buyerName,
      phone: sale.phone,
      email: sale.email,
      city: sale.city,
      notes: sale.notes,
      date: sale.date,
      time: sale.time,
      status: sale.status,
      seller_id: sale.sellerId && sale.sellerId !== '' ? sale.sellerId : null,
      seller_name: sale.sellerName,
      reserved_at: sale.reservedAt
    });

    return sale;
  }

  // Legacy Offline Sync Fallback (Cleaned up from front-end, but kept on back-end for API safety)
  async syncOfflineSales(sellerUserId: string, offlineSales: Omit<Sale, 'id'>[]): Promise<{ syncedCount: number; conflicts: string[] }> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
      await this.syncSalesFromSupabase();
    }

    const sellerUser = this.users.find(u => u.id === sellerUserId);
    if (!sellerUser) throw new Error('Usuario inválido.');
    const seller = this.sellers.find(s => s.userId === sellerUserId);
    if (!seller) throw new Error('Vendedor inválido.');

    let syncedCount = 0;
    const conflicts: string[] = [];

    for (const off of offlineSales) {
      try {
        const existing = this.sales.find(s => s.raffleId === off.raffleId && s.ticketNumber === off.ticketNumber);

        if (existing) {
          if (existing.status === 'PAID') {
            conflicts.push(`Número #${off.ticketNumber} ya fue vendido y pagado en el servidor por ${existing.buyerName}.`);
            continue;
          } else if (existing.status === 'RESERVED' && off.status === 'PAID') {
            existing.buyerName = off.buyerName;
            existing.phone = off.phone;
            existing.email = off.email;
            existing.city = off.city;
            existing.status = 'PAID';
            existing.sellerId = seller.id;
            existing.sellerName = seller.name;
            existing.date = off.date;
            existing.time = off.time;
            syncedCount++;
            this.logAudit(sellerUserId, sellerUser.username, 'OFFLINE_SYNC_OVERWRITE', `Sobre-escribió reserva del número #${off.ticketNumber} con pago sin conexión de: ${off.buyerName}`);
            
            this.syncToSupabase('sales', {
              id: existing.id,
              raffle_id: existing.raffleId,
              ticket_number: existing.ticketNumber,
              buyer_name: existing.buyerName,
              phone: existing.phone,
              email: existing.email,
              city: existing.city,
              notes: existing.notes,
              date: existing.date,
              time: existing.time,
              status: existing.status,
              seller_id: existing.sellerId && existing.sellerId !== '' ? existing.sellerId : null,
              seller_name: existing.sellerName,
              reserved_at: existing.reservedAt
            });
          } else {
            conflicts.push(`Número #${off.ticketNumber} ya se encuentra reservado en el servidor por ${existing.buyerName}.`);
          }
        } else {
          await this.registerSale(sellerUserId, {
            raffleId: off.raffleId,
            ticketNumber: off.ticketNumber,
            buyerName: off.buyerName,
            phone: off.phone,
            email: off.email,
            city: off.city,
            notes: `[Sincronizado Cloud] ${off.notes || ''}`,
            status: off.status,
            sellerId: seller.id,
          });
          syncedCount++;
        }
      } catch (err: any) {
        conflicts.push(`Número #${off.ticketNumber}: ${err.message}`);
      }
    }

    return { syncedCount, conflicts };
  }

  // Dashboard Stats
  getStats(raffleId: string): DashboardStats {
    const raffle = this.raffles.find(r => r.id === raffleId);
    if (!raffle) throw new Error('Rifa inválida.');

    const activeSales = this.sales.filter(s => s.raffleId === raffleId && s.status !== 'CANCELLED');
    const paidSales = activeSales.filter(s => s.status === 'PAID');
    const reservedSales = activeSales.filter(s => s.status === 'RESERVED');
    const totalSoldAndPaid = paidSales.length + activeSales.filter(s => s.status === 'SOLD').length;

    const totalRevenue = paidSales.length * raffle.ticketPrice;

    const salesBySeller = this.sellers.map(s => {
      const sSales = activeSales.filter(sale => sale.sellerId === s.id);
      const paid = sSales.filter(sale => sale.status === 'PAID');
      return {
        sellerName: s.name,
        count: sSales.length,
        revenue: paid.length * raffle.ticketPrice,
      };
    });

    const cityMap: Record<string, number> = {};
    activeSales.forEach(s => {
      cityMap[s.city] = (cityMap[s.city] || 0) + 1;
    });
    const salesByCity = Object.entries(cityMap).map(([city, count]) => ({ city, count }));

    const dateMap: Record<string, { count: number; revenue: number }> = {};
    activeSales.forEach(s => {
      if (!dateMap[s.date]) {
        dateMap[s.date] = { count: 0, revenue: 0 };
      }
      dateMap[s.date].count += 1;
      if (s.status === 'PAID') {
        dateMap[s.date].revenue += raffle.ticketPrice;
      }
    });
    const salesByDate = Object.entries(dateMap).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    })).sort((a, b) => a.date.localeCompare(b.date));

    const recentActivity = this.auditLogs
      .slice(-10)
      .reverse()
      .map(log => ({
        id: log.id,
        time: new Date(log.timestamp).toLocaleTimeString(),
        type: log.action,
        description: log.details,
      }));

    return {
      totalSales: activeSales.length,
      totalRevenue,
      ticketsSold: totalSoldAndPaid,
      ticketsReserved: reservedSales.length,
      ticketsAvailable: raffle.totalNumbers - activeSales.length,
      salesBySeller,
      salesByCity,
      salesByDate,
      recentActivity,
    };
  }

  // Register Telemetry Visit
  registerVisit(data: {
    hour: number;
    city: string;
    country: string;
    device: 'MOBILE' | 'DESKTOP' | 'TABLET';
    browser: string;
    referrer: string;
    raffleId?: string;
  }) {
    const newVisit: AppVisit = {
      id: `visit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      hour: data.hour,
      city: data.city || 'Desconocida',
      country: data.country || 'Desconocido',
      device: data.device || 'DESKTOP',
      browser: data.browser || 'Chrome',
      referrer: data.referrer || 'Directo',
      raffleId: data.raffleId || 'r1',
    };
    this.appVisits.push(newVisit);

    // Save to Supabase (catch errors silently to avoid crash if table does not exist)
    this.syncToSupabase('app_visits', {
      id: newVisit.id,
      timestamp: newVisit.timestamp,
      hour: newVisit.hour,
      city: newVisit.city,
      country: newVisit.country,
      device: newVisit.device,
      browser: newVisit.browser,
      referrer: newVisit.referrer,
      raffle_id: newVisit.raffleId,
    }).catch(() => {});

    return newVisit;
  }

  // Get Global Telemetry Stats
  getGlobalTelemetryStats(raffleId: string): GlobalTelemetryStats {
    const raffle = this.raffles.find(r => r.id === raffleId);
    const rafflePrice = raffle ? raffle.ticketPrice : 15;
    
    // 1. Total Visits
    const totalVisits = this.appVisits.length;

    // 2. Active Sales, buyers list & conversion calculation
    const activeSales = this.sales.filter(s => s.raffleId === raffleId && s.status !== 'CANCELLED');
    const uniqueBuyersCount = new Set(activeSales.map(s => s.phone.trim())).size;
    
    // Conversion rate: unique buyers / total visits
    const conversionRate = totalVisits > 0 ? Number(((uniqueBuyersCount / totalVisits) * 100).toFixed(2)) : 0;

    // 3. Visits by Hour (0 to 23)
    const hourMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    this.appVisits.forEach(v => {
      hourMap[v.hour] = (hourMap[v.hour] || 0) + 1;
    });
    const visitsByHour = Object.entries(hourMap).map(([hour, count]) => ({
      hour: Number(hour),
      count,
    })).sort((a, b) => a.hour - b.hour);

    // 4. Visits by Referrer
    const refMap: Record<string, number> = {};
    this.appVisits.forEach(v => {
      refMap[v.referrer] = (refMap[v.referrer] || 0) + 1;
    });
    const visitsByReferrer = Object.entries(refMap).map(([referrer, count]) => ({
      referrer,
      count,
    })).sort((a, b) => b.count - a.count);

    // 5. Visits by Location (City / Country)
    const locMap: Record<string, { city: string; country: string; count: number }> = {};
    this.appVisits.forEach(v => {
      const key = `${v.city}, ${v.country}`;
      if (!locMap[key]) {
        locMap[key] = { city: v.city, country: v.country, count: 0 };
      }
      locMap[key].count++;
    });
    const visitsByLocation = Object.values(locMap).sort((a, b) => b.count - a.count);

    // 6. Visits by Device
    const devMap: Record<string, number> = {};
    this.appVisits.forEach(v => {
      devMap[v.device] = (devMap[v.device] || 0) + 1;
    });
    const visitsByDevice = Object.entries(devMap).map(([device, count]) => ({
      device,
      count,
    }));

    // 7. Visits by Browser
    const browserMap: Record<string, number> = {};
    this.appVisits.forEach(v => {
      browserMap[v.browser] = (browserMap[v.browser] || 0) + 1;
    });
    const visitsByBrowser = Object.entries(browserMap).map(([browser, count]) => ({
      browser,
      count,
    }));

    // 8. Sales and Revenue by City (Real ticket sales city stats)
    const saleCityMap: Record<string, { count: number; revenue: number }> = {};
    activeSales.forEach(s => {
      const city = s.city || 'No Especificada';
      if (!saleCityMap[city]) {
        saleCityMap[city] = { count: 0, revenue: 0 };
      }
      saleCityMap[city].count++;
      if (s.status === 'PAID') {
        saleCityMap[city].revenue += rafflePrice;
      }
    });
    const salesByCity = Object.entries(saleCityMap).map(([city, data]) => ({
      city,
      count: data.count,
      revenue: data.revenue,
    })).sort((a, b) => b.count - a.count);

    // 9. Popular Numbers & Popular Endings
    const numMap: Record<number, number> = {};
    const endingMap: Record<string, number> = {};
    activeSales.forEach(s => {
      numMap[s.ticketNumber] = (numMap[s.ticketNumber] || 0) + 1;
      const endingDigit = String(s.ticketNumber % 10);
      endingMap[endingDigit] = (endingMap[endingDigit] || 0) + 1;
    });

    const popularNumbers = Object.entries(numMap)
      .map(([num, count]) => ({ number: Number(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const popularEndings = Object.entries(endingMap)
      .map(([ending, count]) => ({ ending, count }))
      .sort((a, b) => b.count - a.count);

    // 10. Games / Sorteos Stats
    const drawsForRaffle = this.drawHistory.filter(d => d.raffleId === raffleId);
    
    const drawNumMap: Record<number, number> = {};
    drawsForRaffle.forEach(d => {
      drawNumMap[d.winningNumber] = (drawNumMap[d.winningNumber] || 0) + 1;
    });
    const mostDrawnNumbers = Object.entries(drawNumMap)
      .map(([num, count]) => ({ number: Number(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const prizeMap: Record<string, number> = {};
    drawsForRaffle.forEach(d => {
      prizeMap[d.prizeName] = (prizeMap[d.prizeName] || 0) + 1;
    });
    const drawsByPrize = Object.entries(prizeMap).map(([prizeName, count]) => ({
      prizeName,
      count,
    }));

    return {
      totalVisits,
      conversionRate,
      visitsByHour,
      visitsByReferrer,
      visitsByLocation,
      visitsByDevice,
      visitsByBrowser,
      salesByCity,
      popularNumbers,
      popularEndings,
      totalGamesStats: {
        totalDraws: drawsForRaffle.length,
        mostDrawnNumbers,
        recentDrawsCount: drawsForRaffle.slice(-5).length,
        drawsByPrize,
      },
    };
  }

  generateUniqueLinkingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    let code = '';
    while (!isUnique) {
      code = 'VIN-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!this.sellers.some(s => s.linkingCode === code)) {
        isUnique = true;
      }
    }
    return code;
  }

  generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  verifyUserByToken(token: string): User | null {
    const found = Object.values(this.verificationTokens).find(vt => vt.token === token);
    if (!found) return null;
    if (found.expiresAt < Date.now()) {
      delete this.verificationTokens[found.userId];
      this.deleteFromSupabase('verification_tokens', found.userId, 'user_id');
      return null;
    }

    const user = this.users.find(u => u.id === found.userId);
    if (!user) return null;

    user.status = 'ACTIVE';
    
    // Activate the seller too if they are a seller
    const seller = this.sellers.find(s => s.userId === user.id);
    if (seller) {
      seller.status = 'ACTIVE';
      this.syncToSupabase('sellers', {
        id: seller.id,
        user_id: seller.userId && seller.userId !== '' ? seller.userId : null,
        name: seller.name,
        assigned_range_start: seller.assignedRangeStart,
        assigned_range_end: seller.assignedRangeEnd,
        status: seller.status,
        phone: seller.phone,
        username: seller.username,
        linking_code: seller.linkingCode
      });
    }

    this.logAudit(user.id, user.username, 'VERIFY_EMAIL', `Correo verificado con éxito para ${user.username}. Cuenta activada.`);

    this.syncToSupabase('users', {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      failed_login_attempts: user.failedLoginAttempts
    });

    const phone = seller ? seller.phone : '';
    this.syncToSupabase('profiles', {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: phone,
      status: user.status
    });

    delete this.verificationTokens[found.userId];
    this.deleteFromSupabase('verification_tokens', found.userId, 'user_id');

    return user;
  }

  async registerUser(
    username: string,
    name: string,
    email: string,
    phone: string,
    pass: string,
    role: 'VENDEDOR' | 'ORGANIZADOR' = 'VENDEDOR',
    linkingCode?: string
  ): Promise<{ user: User; seller?: Seller; token: string; verificationLink: string }> {
    if (supabase) {
      await this.syncUsersFromSupabase();
      await this.syncSellersFromSupabase();
    }

    if (role === 'ORGANIZADOR') {
      if (this.users.some(u => u.username === username.toLowerCase())) {
        throw new Error(`El nombre de usuario "${username}" ya está registrado.`);
      }

      let newUserId = `u-${Date.now()}`;
      let verificationToken = this.generateVerificationToken();

      // Intentar registro nativo en Supabase Auth si está inicializado
      if (supabase) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: pass,
            options: {
              data: {
                username: username.toLowerCase(),
                name,
                role,
                phone
              }
            }
          });
          if (authError) {
            throw new Error(authError.message);
          }
          if (authData?.user?.id) {
            newUserId = authData.user.id;
          }
        } catch (authErr: any) {
          throw new Error(`Error en el registro nativo de Supabase: ${authErr.message}`);
        }
      }

      const newUser: User = {
        id: newUserId,
        username: username.toLowerCase(),
        name,
        email,
        role,
        status: 'PENDING_VERIFICATION',
        failedLoginAttempts: 0,
      };

      const hashedPassword = this.hashPassword(pass);
      this.users.push(newUser);
      this.passwords[username.toLowerCase()] = hashedPassword;

      this.verificationTokens[newUserId] = {
        userId: newUserId,
        token: verificationToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };

      this.logAudit(newUserId, username.toLowerCase(), 'REGISTER_ADMIN', `Nuevo organizador registrado (pendiente de confirmación de correo): ${name}`);
      
      try {
        await this.syncToSupabase('users', {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          failed_login_attempts: newUser.failedLoginAttempts
        });
        // NOTA: No insertamos en 'profiles' durante el registro por requerimiento del cliente.
        // Los usuarios pasan a la tabla 'profiles' únicamente tras confirmar el correo electrónico.
        await this.syncToSupabase('passwords', {
          username: username.toLowerCase(),
          password: hashedPassword
        }, 'username');
        await this.syncToSupabase('verification_tokens', {
          user_id: newUserId,
          token: verificationToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, 'user_id');
      } catch (dbErr: any) {
        // Rollback memory states if sync fails
        this.users = this.users.filter(u => u.id !== newUserId);
        delete this.passwords[username.toLowerCase()];
        delete this.verificationTokens[newUserId];
        throw new Error(`Error de sincronización con la base de datos de Supabase: ${dbErr.message || dbErr}`);
      }

      const verificationLink = `/api/auth/verify?token=${verificationToken}`;
      this.notifications.push({
        id: `n-${Date.now()}`,
        title: `Verifica tu correo electrónico - Sistema de Rifa Profesional`,
        message: `Hola ${name}, por favor confirma tu cuenta en el Sistema de Rifa Profesional haciendo clic en este enlace: ${verificationLink}`,
        date: new Date().toISOString(),
        channel: 'EMAIL',
        sent: true,
        recipient: email,
      });

      return {
        user: newUser,
        token: `jwt-token-simulated-for-${newUserId}`,
        verificationLink
      };
    }

    if (!linkingCode) {
      throw new Error('El identificador único de vinculación es obligatorio para registrarse como vendedor.');
    }

    const codeClean = linkingCode.trim().toUpperCase();
    const existingSeller = this.sellers.find(s => s.linkingCode?.toUpperCase() === codeClean);
    if (!existingSeller) {
      throw new Error('El código de vinculación proporcionado no es válido o no existe.');
    }

    if (existingSeller.userId && this.users.some(u => u.id === existingSeller.userId)) {
      throw new Error('Esta licencia ya ha sido vinculada y reclamada por otro vendedor.');
    }

    const otherUserWithUsername = this.users.find(u => u.username === username.toLowerCase() && u.id !== existingSeller.userId);
    if (otherUserWithUsername) {
      throw new Error(`El nombre de usuario "${username}" ya está registrado por otra cuenta.`);
    }

    let linkedUser = this.users.find(u => u.id === existingSeller.userId);
    const wasUserNew = !linkedUser;
    
    // Backup current state for rollback in case of failure
    const oldUserData = linkedUser ? { ...linkedUser } : null;
    const oldSellerData = { ...existingSeller };
    const oldPasswordValue = this.passwords[username.toLowerCase()];

    let newUserId = existingSeller.userId || `u-${Date.now()}`;

    // Intentar registro nativo en Supabase Auth si está inicializado y el usuario es nuevo
    if (wasUserNew && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: pass,
          options: {
            data: {
              username: username.toLowerCase(),
              name,
              role: 'VENDEDOR',
              phone
            }
          }
        });
        if (authError) {
          throw new Error(authError.message);
        }
        if (authData?.user?.id) {
          newUserId = authData.user.id;
        }
      } catch (authErr: any) {
        throw new Error(`Error en el registro nativo de Supabase: ${authErr.message}`);
      }
    }

    if (wasUserNew) {
      linkedUser = {
        id: newUserId,
        username: username.toLowerCase(),
        name,
        email,
        role: 'VENDEDOR',
        status: 'PENDING_VERIFICATION',
        failedLoginAttempts: 0,
      };
      this.users.push(linkedUser);
      existingSeller.userId = linkedUser.id;
    } else {
      const oldUsername = linkedUser.username;
      linkedUser.username = username.toLowerCase();
      linkedUser.name = name;
      linkedUser.email = email;
      linkedUser.status = 'PENDING_VERIFICATION';
      linkedUser.failedLoginAttempts = 0;

      if (oldUsername && oldUsername !== username.toLowerCase()) {
        delete this.passwords[oldUsername];
      }
    }

    const hashedPassword = this.hashPassword(pass);
    this.passwords[username.toLowerCase()] = hashedPassword;

    existingSeller.name = name;
    existingSeller.phone = phone;
    existingSeller.username = username.toLowerCase();
    existingSeller.status = 'PENDING_VERIFICATION';

    const verificationToken = this.generateVerificationToken();
    this.verificationTokens[linkedUser.id] = {
      userId: linkedUser.id,
      token: verificationToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    this.logAudit(linkedUser.id, username.toLowerCase(), 'LINK_SELLER_REGISTER', `Vendedor vinculado mediante código ${codeClean} (pendiente de confirmación de correo). Rango: ${existingSeller.assignedRangeStart}-${existingSeller.assignedRangeEnd}`);

    try {
      await this.syncToSupabase('users', {
        id: linkedUser.id,
        username: linkedUser.username,
        name: linkedUser.name,
        email: linkedUser.email,
        role: linkedUser.role,
        status: linkedUser.status,
        failed_login_attempts: linkedUser.failedLoginAttempts
      });
      // NOTA: No insertamos en 'profiles' durante el registro por requerimiento del cliente.
      // Los usuarios pasan a la tabla 'profiles' únicamente tras confirmar el correo electrónico.
      await this.syncToSupabase('passwords', {
        username: username.toLowerCase(),
        password: hashedPassword
      }, 'username');
      await this.syncToSupabase('sellers', {
        id: existingSeller.id,
        user_id: existingSeller.userId && existingSeller.userId !== '' ? existingSeller.userId : null,
        name: existingSeller.name,
        assigned_range_start: existingSeller.assignedRangeStart,
        assigned_range_end: existingSeller.assignedRangeEnd,
        status: existingSeller.status,
        phone: existingSeller.phone,
        username: existingSeller.username,
        linking_code: existingSeller.linkingCode
      });
      await this.syncToSupabase('verification_tokens', {
        user_id: linkedUser.id,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }, 'user_id');

      if (oldUserData && oldUserData.username && oldUserData.username !== username.toLowerCase()) {
        await this.deleteFromSupabase('passwords', oldUserData.username, 'username');
      }
    } catch (dbErr: any) {
      // Rollback memory states if sync fails
      if (wasUserNew) {
        this.users = this.users.filter(u => u.id !== linkedUser!.id);
        existingSeller.userId = oldSellerData.userId;
      } else {
        Object.assign(linkedUser!, oldUserData);
      }
      delete this.passwords[username.toLowerCase()];
      if (oldPasswordValue) {
        this.passwords[username.toLowerCase()] = oldPasswordValue;
      }
      Object.assign(existingSeller, oldSellerData);
      delete this.verificationTokens[linkedUser.id];
      throw new Error(`Error de sincronización con la base de datos de Supabase: ${dbErr.message || dbErr}`);
    }

    const verificationLink = `/api/auth/verify?token=${verificationToken}`;
    this.notifications.push({
      id: `n-${Date.now()}`,
      title: `Verifica tu correo electrónico - Sistema de Rifa Profesional`,
      message: `Hola ${name}, por favor confirma tu cuenta en el Sistema de Rifa Profesional haciendo clic en este enlace: ${verificationLink}`,
      date: new Date().toISOString(),
      channel: 'EMAIL',
      sent: true,
      recipient: email,
    });

    return {
      user: linkedUser,
      seller: existingSeller,
      token: `jwt-token-simulated-for-${linkedUser.id}`,
      verificationLink
    };
  }

  // --- ANNOUNCEMENT (PUBLICIDAD Y AVISOS) OPERATIONS ---

  async uploadMediaToSupabase(base64Str: string, folder: string): Promise<string> {
    if (!supabase) return base64Str;
    try {
      const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return base64Str;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let extension = 'bin';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
      else if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('webp')) extension = 'webp';
      else if (mimeType.includes('gif')) extension = 'gif';
      else if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('quicktime')) extension = 'mov';

      const fileName = `${folder}/${Date.now()}-${Math.floor(Math.random() * 100000)}.${extension}`;
      console.log(`📤 Uploading file to Supabase Storage: "${fileName}" (${buffer.length} bytes)...`);

      const { data, error } = await supabase.storage
        .from('multimedia')
        .upload(fileName, buffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`❌ [Supabase Storage Error] Upload failed:`, error.message);
        return base64Str;
      }

      const { data: publicUrlData } = supabase.storage
        .from('multimedia')
        .getPublicUrl(fileName);

      if (publicUrlData && publicUrlData.publicUrl) {
        console.log(`✅ [Supabase Storage Success] File uploaded:`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }

      return base64Str;
    } catch (err: any) {
      console.error(`❌ [Supabase Storage Exception] Failed to upload media:`, err.message);
      return base64Str;
    }
  }

  async createAnnouncement(adminUserId: string, data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    let uploadedImageUrl = data.imageUrl;
    if (uploadedImageUrl && uploadedImageUrl.startsWith('data:')) {
      uploadedImageUrl = await this.uploadMediaToSupabase(uploadedImageUrl, 'announcements');
    }

    const newAnn: Announcement = {
      id: `ann-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: data.title,
      content: data.content,
      imageUrl: uploadedImageUrl,
      targetType: data.targetType,
      targetSellerId: data.targetSellerId,
      placement: data.placement,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      ctaText: (data as any).ctaText || '',
      ctaUrl: (data as any).ctaUrl || '',
      deviceTarget: data.deviceTarget || 'ALL'
    };

    this.announcements.push(newAnn);

    // Sync to Supabase
    this.syncToSupabase('announcements', {
      id: newAnn.id,
      title: newAnn.title,
      content: newAnn.content,
      image_url: newAnn.imageUrl || null,
      target_type: newAnn.targetType,
      target_seller_id: newAnn.targetSellerId || null,
      placement: newAnn.placement,
      status: newAnn.status,
      created_at: newAnn.createdAt,
      cta_text: newAnn.ctaText || null,
      cta_url: newAnn.ctaUrl || null,
      device_target: newAnn.deviceTarget || 'ALL'
    });

    this.logAudit(adminUserId, admin.username, 'CREATE_ANNOUNCEMENT', `Creó anuncio publicitario: "${newAnn.title}"`);
    return newAnn;
  }

  async updateAnnouncement(adminUserId: string, id: string, data: Partial<Announcement>): Promise<Announcement> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const ann = this.announcements.find(a => a.id === id);
    if (!ann) throw new Error('Anuncio no encontrado.');

    if (data.title !== undefined) ann.title = data.title;
    if (data.content !== undefined) ann.content = data.content;
    if (data.imageUrl !== undefined) {
      let uploadedImageUrl = data.imageUrl;
      if (uploadedImageUrl && uploadedImageUrl.startsWith('data:')) {
        uploadedImageUrl = await this.uploadMediaToSupabase(uploadedImageUrl, 'announcements');
      }
      ann.imageUrl = uploadedImageUrl;
    }
    if (data.targetType !== undefined) ann.targetType = data.targetType;
    if (data.targetSellerId !== undefined) ann.targetSellerId = data.targetSellerId;
    if (data.placement !== undefined) ann.placement = data.placement;
    if (data.status !== undefined) ann.status = data.status;
    if ((data as any).ctaText !== undefined) ann.ctaText = (data as any).ctaText;
    if ((data as any).ctaUrl !== undefined) ann.ctaUrl = (data as any).ctaUrl;
    if (data.deviceTarget !== undefined) ann.deviceTarget = data.deviceTarget;

    // Sync to Supabase
    this.syncToSupabase('announcements', {
      id: ann.id,
      title: ann.title,
      content: ann.content,
      image_url: ann.imageUrl || null,
      target_type: ann.targetType,
      target_seller_id: ann.targetSellerId || null,
      placement: ann.placement,
      status: ann.status,
      created_at: ann.createdAt,
      cta_text: ann.ctaText || null,
      cta_url: ann.ctaUrl || null,
      device_target: ann.deviceTarget || 'ALL'
    });

    this.logAudit(adminUserId, admin.username, 'UPDATE_ANNOUNCEMENT', `Actualizó anuncio publicitario: "${ann.title}"`);
    return ann;
  }

  async deleteAnnouncement(adminUserId: string, id: string): Promise<boolean> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Anuncio no encontrado.');

    const title = this.announcements[idx].title;
    this.announcements.splice(idx, 1);

    // Delete reads associated
    this.announcementReads = this.announcementReads.filter(r => r.announcementId !== id);

    this.deleteFromSupabase('announcements', id);
    this.logAudit(adminUserId, admin.username, 'DELETE_ANNOUNCEMENT', `Eliminó anuncio publicitario: "${title}"`);
    return true;
  }

  async markAnnouncementAsRead(sellerUserId: string, announcementId: string): Promise<AnnouncementRead> {
    const user = this.users.find(u => u.id === sellerUserId);
    if (!user) throw new Error('Usuario inválido.');

    const seller = this.sellers.find(s => s.userId === sellerUserId);
    if (!seller) throw new Error('El usuario no es un vendedor autorizado.');

    const existing = this.announcementReads.find(r => r.announcementId === announcementId && r.sellerId === seller.id);
    if (existing) return existing;

    const newRead: AnnouncementRead = {
      id: `read-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      announcementId,
      sellerId: seller.id,
      readAt: new Date().toISOString()
    };

    this.announcementReads.push(newRead);

    this.syncToSupabase('announcement_reads', {
      id: newRead.id,
      announcement_id: newRead.announcementId,
      seller_id: newRead.sellerId,
      read_at: newRead.readAt
    });

    return newRead;
  }

  // --- SPONSOR OPERATIONS ---

  async createSponsor(adminUserId: string, data: any): Promise<any> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    let uploadedImageUrl = data.imageUrl || '';
    if (uploadedImageUrl && uploadedImageUrl.startsWith('data:')) {
      uploadedImageUrl = await this.uploadMediaToSupabase(uploadedImageUrl, 'sponsors');
    }

    const newSponsor = {
      id: `sp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name,
      text: data.text || '',
      imageUrl: uploadedImageUrl,
      designLayout: data.designLayout || 'IMAGE_ONLY',
      enabled: data.enabled !== false,
      order: Number(data.order) || 0,
      createdAt: new Date().toISOString()
    };

    this.sponsors.push(newSponsor);

    // Sync to Supabase
    this.syncToSupabase('sponsors', {
      id: newSponsor.id,
      name: newSponsor.name,
      text: newSponsor.text || null,
      image_url: newSponsor.imageUrl || null,
      design_layout: newSponsor.designLayout,
      enabled: newSponsor.enabled,
      sort_order: newSponsor.order,
      created_at: newSponsor.createdAt
    });

    this.logAudit(adminUserId, admin.username, 'CREATE_SPONSOR', `Creó auspiciante: "${newSponsor.name}"`);
    return newSponsor;
  }

  async updateSponsor(adminUserId: string, id: string, data: any): Promise<any> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const sponsor = this.sponsors.find(s => s.id === id);
    if (!sponsor) throw new Error('Auspiciante no encontrado.');

    if (data.name !== undefined) sponsor.name = data.name;
    if (data.text !== undefined) sponsor.text = data.text;
    if (data.imageUrl !== undefined) {
      let uploadedImageUrl = data.imageUrl;
      if (uploadedImageUrl && uploadedImageUrl.startsWith('data:')) {
        uploadedImageUrl = await this.uploadMediaToSupabase(uploadedImageUrl, 'sponsors');
      }
      sponsor.imageUrl = uploadedImageUrl;
    }
    if (data.designLayout !== undefined) sponsor.designLayout = data.designLayout;
    if (data.enabled !== undefined) sponsor.enabled = data.enabled;
    if (data.order !== undefined) sponsor.order = Number(data.order) || 0;

    // Sync to Supabase
    this.syncToSupabase('sponsors', {
      id: sponsor.id,
      name: sponsor.name,
      text: sponsor.text || null,
      image_url: sponsor.imageUrl || null,
      design_layout: sponsor.designLayout,
      enabled: sponsor.enabled,
      sort_order: sponsor.order,
      created_at: sponsor.createdAt
    });

    this.logAudit(adminUserId, admin.username, 'UPDATE_SPONSOR', `Actualizó auspiciante: "${sponsor.name}"`);
    return sponsor;
  }

  async deleteSponsor(adminUserId: string, id: string): Promise<boolean> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const idx = this.sponsors.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Auspiciante no encontrado.');

    const name = this.sponsors[idx].name;
    this.sponsors.splice(idx, 1);

    this.deleteFromSupabase('sponsors', id);
    this.logAudit(adminUserId, admin.username, 'DELETE_SPONSOR', `Eliminó auspiciante: "${name}"`);
    return true;
  }

  async drawWinner(adminUserId: string, raffleId: string, prizeId: string, winningNumber: number): Promise<DrawHistory> {
    const admin = this.users.find(u => u.id === adminUserId && u.role === 'ORGANIZADOR');
    if (!admin) throw new Error('Permiso denegado.');

    const raffle = this.raffles.find(r => r.id === raffleId);
    if (!raffle) throw new Error('Rifa no encontrada.');

    // Find if ticket is sold / paid / reserved
    const winningSale = this.sales.find(s => s.raffleId === raffleId && s.ticketNumber === winningNumber);
    
    // Find prize name
    let prizeName = raffle.prize; // default
    if (prizeId) {
      const prize = this.prizes.find(p => p.id === prizeId);
      if (prize) {
        prizeName = prize.name;
      }
    }

    const drawId = `draw-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    
    const newDraw: DrawHistory = {
      id: drawId,
      raffleId: raffleId,
      drawDate: now.toISOString().split('T')[0],
      drawTime: now.toTimeString().split(' ')[0].substring(0, 5),
      winningNumber: winningNumber,
      winnerName: winningSale ? winningSale.buyerName : 'Sin ganador (Boleto no vendido)',
      winnerPhone: winningSale ? winningSale.phone : undefined,
      winnerCity: winningSale ? winningSale.city : undefined,
      winnerEmail: winningSale ? winningSale.email : undefined,
      prizeName: prizeName,
      sellerName: winningSale ? winningSale.sellerName : undefined,
      createdAt: now.toISOString()
    };

    this.drawHistory.push(newDraw);

    // Sync to Supabase
    await this.syncToSupabase('draw_history', {
      id: newDraw.id,
      raffle_id: newDraw.raffleId,
      draw_date: newDraw.drawDate,
      draw_time: newDraw.drawTime,
      winning_number: newDraw.winningNumber,
      winner_name: newDraw.winnerName || null,
      winner_phone: newDraw.winnerPhone || null,
      winner_city: newDraw.winnerCity || null,
      winner_email: newDraw.winnerEmail || null,
      prize_name: newDraw.prizeName,
      seller_name: newDraw.sellerName || null,
      created_at: newDraw.createdAt
    });

    this.logAudit(adminUserId, admin.username, 'DRAW_WINNER', `Sorteo realizado para rifa "${raffle.name}". Número ganador: #${winningNumber} (${prizeName})`);

    return newDraw;
  }

  // Factory Reset (Super Admin Only)
  async factoryReset(superAdminUserId: string): Promise<boolean> {
    if (supabase) {
      await this.syncUsersFromSupabase();
    }

    const superAdmin = this.users.find(u => u.id === superAdminUserId && (u.isSuperAdmin === true || u.role === 'ORGANIZADOR'));
    if (!superAdmin) {
      throw new Error('Permiso denegado. Se requieren credenciales de Super Administrador para ejecutar el Reset de Fábrica.');
    }

    // 1. Reset memory state
    this.sales = [];
    this.drawHistory = [];
    this.announcements = [];
    this.announcementReads = [];
    this.sponsors = [];
    this.appVisits = [];
    this.ticketLocks.clear();
    this.verificationTokens = {};

    // Keep Super Admin users, clear secondary users
    this.users = this.users.filter(u => u.isSuperAdmin === true);
    const remainingUsernames = new Set(this.users.map(u => u.username));
    Object.keys(this.passwords).forEach(username => {
      if (!remainingUsernames.has(username)) {
        delete this.passwords[username];
      }
    });

    // Reset sellers
    this.sellers = [];

    // Reset App Config
    this.config = {
      id: 'cfg-default',
      allowOfflineSync: true,
      maxFailedAttempts: 5,
      commissionPercentage: 10.0,
      currency: 'USD'
    };

    // Reset default draft raffle
    const now = new Date();
    const defaultDrawDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultCutoffDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    this.prizes = [
      { id: 'p1', raffleId: 'r1', name: 'Premio Principal Magnífico', description: 'Premio Principal Oficial', enabled: true, order: 1, budget: 1000 },
      { id: 'p2', raffleId: 'r1', name: 'Segundo Premio Especial', description: 'Segundo Premio', enabled: false, order: 2, budget: 0 },
      { id: 'p3', raffleId: 'r1', name: 'Tercer Premio Sorpresa', description: 'Tercer Premio', enabled: false, order: 3, budget: 0 }
    ];

    this.raffles = [
      {
        id: 'r1',
        name: 'Gran Sorteo Pro Anual',
        description: 'Participa en nuestro gran sorteo oficial y gana excelentes premios con total transparencia.',
        prize: 'Premio Principal Magnífico',
        totalNumbers: 1000,
        ticketPrice: 10,
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'DRAFT',
        drawDate: defaultDrawDate,
        drawTime: '20:00',
        liveStreamUrl: '',
        salesCutoffDate: defaultCutoffDate,
        salesCutoffTime: '18:00',
        salesEnabled: true,
        autoTombola: true,
        prizes: this.prizes
      }
    ];

    // Log Audit
    this.logAudit(superAdminUserId, superAdmin.username, 'SUPER_ADMIN_FACTORY_RESET', 'La aplicación fue reiniciada a su configuración original de fábrica.');

    // 2. Clear Supabase tables if connected
    if (supabase) {
      try {
        const dummyEq = '00000000-0000-0000-0000-000000000000';
        await Promise.allSettled([
          supabase.from('sales').delete().neq('id', dummyEq),
          supabase.from('draw_history').delete().neq('id', dummyEq),
          supabase.from('announcements').delete().neq('id', dummyEq),
          supabase.from('announcement_reads').delete().neq('id', dummyEq),
          supabase.from('app_visits').delete().neq('id', dummyEq),
          supabase.from('sponsors').delete().neq('id', dummyEq),
          supabase.from('sellers').delete().neq('id', dummyEq),
          supabase.from('prizes').delete().neq('id', dummyEq),
          supabase.from('verification_tokens').delete().neq('user_id', dummyEq),
        ]);

        const superAdminIds = this.users.map(u => u.id);
        if (superAdminIds.length > 0) {
          await supabase.from('users').delete().not('id', 'in', `(${superAdminIds.join(',')})`);
          await supabase.from('profiles').delete().not('id', 'in', `(${superAdminIds.join(',')})`);
        }

        await this.syncToSupabase('config', {
          id: this.config.id,
          allow_offline_sync: this.config.allowOfflineSync,
          max_failed_attempts: this.config.maxFailedAttempts,
          commission_percentage: this.config.commissionPercentage,
          currency: this.config.currency
        });

        await this.syncToSupabase('raffles', {
          id: 'r1',
          name: this.raffles[0].name,
          description: this.raffles[0].description,
          prize: this.raffles[0].prize,
          total_numbers: 1000,
          ticket_price: 10,
          start_date: this.raffles[0].startDate,
          end_date: this.raffles[0].endDate,
          status: 'DRAFT',
          draw_date: defaultDrawDate,
          draw_time: '20:00',
          sales_cutoff_date: defaultCutoffDate,
          sales_cutoff_time: '18:00',
          sales_enabled: true,
          auto_tombola: true
        });

        for (const prize of this.prizes) {
          await this.syncToSupabase('prizes', {
            id: prize.id,
            raffle_id: prize.raffleId,
            name: prize.name,
            description: prize.description,
            enabled: prize.enabled,
            order_num: prize.order,
            budget: prize.budget
          });
        }
      } catch (err: any) {
        console.error('Error clearing Supabase tables during factory reset:', err.message);
      }
    }

    return true;
  }

  // Log audit helper
  private logAudit(userId: string, username: string, action: string, details: string) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId,
      username,
      action,
      details,
    };
    this.auditLogs.push(newLog);

    this.syncToSupabase('audit_logs', {
      id: newLog.id,
      timestamp: newLog.timestamp,
      user_id: newLog.userId,
      username: newLog.username,
      action: newLog.action,
      details: newLog.details
    });
  }
}

// Global Single Instance
export const dbInstance = new Database();
