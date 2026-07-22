/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, Announcement, formatPrice } from './types';

export function escapeXml(unsafe: string = ''): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const generateTicketSVG = (
  ticketNum: number, 
  sale: Sale, 
  raffleName: string, 
  rafflePrize: string, 
  currency?: string, 
  ticketPrice?: number,
  sponsor?: Announcement | string,
  sponsorContentParam?: string
) => {
  const refCode = `REF-${sale.id.substring(0, 8).toUpperCase()}`;
  const priceText = formatPrice(ticketPrice || 10, currency);
  const isPaid = sale.status === 'PAID' || sale.status === 'SOLD';
  
  // Status-specific styles
  const statusColor = isPaid ? '#10b981' : '#f59e0b';
  const statusDot = isPaid ? '#34d399' : '#fbbf24';
  const statusText = isPaid ? 'COMPROBANTE OFICIAL CONFIRMADO' : 'RESERVA TEMPORAL - PENDIENTE DE PAGO';
  const badgeText = isPaid ? 'PAGADO Y CONFIRMADO' : 'RESERVA TEMPORAL';
  const badgeTextColor = isPaid ? '#a7f3d0' : '#fef3c7';

  // Sponsor / Advertising details on ticket
  const sponsorObj = typeof sponsor === 'object' && sponsor !== null ? (sponsor as Announcement) : null;
  const sponsorTitleStr = typeof sponsor === 'string' ? sponsor : '';
  
  const finalSponsorTitle = sponsorObj?.title || sponsorTitleStr || 'PromoBlitz - Plataforma Oficial de Campañas';
  const finalSponsorContent = sponsorObj?.content || sponsorContentParam || 'Transparencia, auditoría digital y seguridad garantizada en cada boleto emitido.';

  // Escaped dynamic variables for XML safety
  const xRaffleName = escapeXml(raffleName);
  const xRafflePrize = escapeXml(rafflePrize);
  const xBuyerName = escapeXml(sale.buyerName);
  const xPhone = escapeXml(sale.phone);
  const xCity = escapeXml(sale.city || 'N/A');
  const xSellerName = escapeXml(sale.sellerName || 'Organizador Oficial');
  const xRefCode = escapeXml(refCode);
  const xPriceText = escapeXml(priceText);
  const xStatusText = escapeXml(statusText);
  const xBadgeText = escapeXml(badgeText);
  const xSponsorTitle = escapeXml(finalSponsorTitle);
  const xSponsorContent = escapeXml(finalSponsorContent.length > 75 ? finalSponsorContent.substring(0, 75) + '...' : finalSponsorContent);
  const xDate = escapeXml(sale.date);
  const xTime = escapeXml(sale.time);

  return `<svg width="700" height="360" viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
    </style>
    
    <!-- Background Luxury Dark Gradient -->
    <linearGradient id="ticketBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#120733;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#230a47;stop-opacity:1" />
      <stop offset="80%" style="stop-color:#3b0f5e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#110626;stop-opacity:1" />
    </linearGradient>

    <!-- Metallic Gradient Border -->
    <linearGradient id="metalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:#a855f7;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#38bdf8;stop-opacity:0.8" />
    </linearGradient>

    <!-- Holographic Seal Gradient -->
    <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#38bdf8" />
      <stop offset="50%" style="stop-color:#a855f7" />
      <stop offset="100%" style="stop-color:#f43f5e" />
    </linearGradient>

    <!-- Non-Intrusive Guilloche Wave Security Pattern -->
    <pattern id="guillochePattern" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 0,30 Q 15,0 30,30 T 60,30" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.06" />
      <path d="M 0,30 Q 15,60 30,30 T 60,30" fill="none" stroke="#ec4899" stroke-width="0.8" stroke-opacity="0.06" />
      <path d="M 30,0 Q 60,15 30,30 T 30,60" fill="none" stroke="#a855f7" stroke-width="0.8" stroke-opacity="0.05" />
      <circle cx="30" cy="30" r="12" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.04" />
    </pattern>

    <!-- Fine Micro-Dot Matrix Watermark -->
    <pattern id="dotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="1" fill="#ffffff" fill-opacity="0.05" />
    </pattern>

    <!-- Clip Path for Rounded Ticket Corner Frame -->
    <clipPath id="ticketClip">
      <rect x="0" y="0" width="700" height="360" rx="28" />
    </clipPath>
  </defs>

  <g clip-path="url(#ticketClip)">
    <!-- LAYER 1: Background & Luxury Gradient -->
    <rect width="700" height="360" fill="url(#ticketBg)" />

    <!-- Ambient Glow Spots -->
    <circle cx="100" cy="80" r="180" fill="#a855f7" fill-opacity="0.12" />
    <circle cx="600" cy="300" r="160" fill="#ec4899" fill-opacity="0.1" />

    <!-- LAYER 2: Non-Intrusive Guilloche & Dot Matrix Watermarks -->
    <rect width="700" height="360" fill="url(#guillochePattern)" />
    <rect width="700" height="360" fill="url(#dotGrid)" />

    <!-- Outer Security Hairline Border -->
    <rect x="2" y="2" width="696" height="356" rx="26" fill="none" stroke="url(#metalBorder)" stroke-width="1.5" />

    <!-- Notch Cutouts (Left & Right) -->
    <circle cx="0" cy="180" r="22" fill="#050212" stroke="url(#metalBorder)" stroke-width="1" />
    <circle cx="700" cy="180" r="22" fill="#050212" stroke="url(#metalBorder)" stroke-width="1" />

    <!-- Stub Perforation Dashed Line -->
    <line x1="510" y1="0" x2="510" y2="360" stroke="#ffffff" stroke-dasharray="8 6" stroke-opacity="0.25" stroke-width="2" />

    <!-- LAYER 3: Foreground Content, Official Logo & Typography -->
    
    <!-- Top Left: Official App Emblem & Brand Header -->
    <g transform="translate(35, 25)">
      <rect width="32" height="32" rx="8" fill="#1e0c4f" stroke="#ec4899" stroke-width="1.5" />
      <path d="M 18 6 L 10 18 L 16 18 L 13 26 L 22 14 L 16 14 Z" fill="#facc15" stroke="#ffffff" stroke-width="0.8" />
      
      <text x="42" y="16" font-size="14" font-weight="900" fill="#ffffff" letter-spacing="0.5">PROMO<tspan fill="#ec4899">BLITZ</tspan></text>
      <text x="42" y="27" font-size="7.5" font-weight="800" fill="#c084fc" letter-spacing="1.2">PLATAFORMA OFICIAL DE COMPROBANTES</text>
    </g>

    <!-- Top Right (Main Body): Reference & Hologram Security Seal -->
    <rect x="330" y="25" width="165" height="22" rx="6" fill="#1e1045" fill-opacity="0.8" stroke="#a855f7" stroke-opacity="0.5" stroke-width="1" />
    <circle cx="342" cy="36" r="3.5" fill="#38bdf8" />
    <text x="352" y="40" font-size="8.5" font-weight="800" fill="#e0e7ff" letter-spacing="1">${xRefCode}</text>

    <!-- Main Campaign Name & Prize -->
    <text x="35" y="92" font-size="19" font-weight="900" fill="#ffffff">${xRaffleName}</text>
    <text x="35" y="114" font-size="12" font-weight="600" fill="#f472b6">Premio Principal: <tspan fill="#ffffff" font-weight="800">${xRafflePrize}</tspan></text>

    <!-- Buyer Details Grid -->
    <rect x="35" y="132" width="460" height="76" rx="12" fill="#0d0628" fill-opacity="0.6" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />
    
    <text x="50" y="152" font-size="7.5" font-weight="800" fill="#a855f7" letter-spacing="1">TITULAR DEL BOLETO</text>
    <text x="50" y="170" font-size="13" font-weight="800" fill="#ffffff">${xBuyerName}</text>

    <text x="220" y="152" font-size="7.5" font-weight="800" fill="#a855f7" letter-spacing="1">TELÉFONO DE CONTACTO</text>
    <text x="220" y="170" font-size="11" font-weight="700" fill="#e0e7ff" font-family="monospace">${xPhone}</text>

    <text x="360" y="152" font-size="7.5" font-weight="800" fill="#a855f7" letter-spacing="1">CIUDAD</text>
    <text x="360" y="170" font-size="12" font-weight="800" fill="#ffffff">${xCity}</text>

    <text x="50" y="196" font-size="8" font-weight="600" fill="#94a3b8">Asesor / Colaborador Autorizado: <tspan fill="#e2e8f0" font-weight="700">${xSellerName}</tspan></text>

    <!-- Official Validation Status Banner -->
    <rect x="35" y="220" width="460" height="32" rx="8" fill="${statusColor}" fill-opacity="0.18" stroke="${statusColor}" stroke-opacity="0.4" stroke-width="1" />
    <circle cx="52" cy="236" r="4" fill="${statusDot}" />
    <text x="65" y="240" font-size="9" font-weight="800" fill="${badgeTextColor}" letter-spacing="0.5">${xStatusText}</text>
    
    <!-- Publicidad / Sponsor Banner on Ticket -->
    <rect x="35" y="262" width="460" height="68" rx="10" fill="#0c0724" fill-opacity="0.85" stroke="#ec4899" stroke-opacity="0.3" stroke-width="1" />
    <rect x="45" y="272" width="115" height="18" rx="5" fill="#ec4899" fill-opacity="0.2" />
    <text x="102" y="284" font-size="7.5" font-weight="900" fill="#f472b6" text-anchor="middle" letter-spacing="1">COMUNICADO / PUBLICIDAD</text>
    <text x="170" y="284" font-size="10" font-weight="800" fill="#ffffff">${xSponsorTitle}</text>
    <text x="45" y="308" font-size="9" font-weight="500" fill="#cbd5e1">${xSponsorContent}</text>
    <text x="45" y="322" font-size="7.5" font-weight="700" fill="#a855f7">Verifica comunicados y avisos oficiales en la app PromoBlitz</text>

    <!-- RIGHT STUB SECTION -->
    <circle cx="605" cy="180" r="70" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1" />
    <text x="605" y="55" font-size="8" font-weight="900" fill="#a855f7" text-anchor="middle" letter-spacing="1.5">NÚMERO OFICIAL</text>

    <rect x="535" y="70" width="140" height="70" rx="16" fill="#09041a" fill-opacity="0.9" stroke="url(#metalBorder)" stroke-width="1.5" />
    <text x="605" y="118" font-family="monospace" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">#${ticketNum}</text>

    <rect x="555" y="155" width="100" height="26" rx="8" fill="#ffffff" />
    <text x="605" y="172" font-size="11" font-weight="900" fill="#6d28d9" text-anchor="middle">${xPriceText}</text>

    <rect x="540" y="195" width="130" height="24" rx="8" fill="${statusColor}" fill-opacity="0.25" stroke="${statusColor}" stroke-opacity="0.5" stroke-width="1" />
    <text x="605" y="211" font-size="8.5" font-weight="900" fill="${badgeTextColor}" text-anchor="middle" letter-spacing="0.8">${xBadgeText}</text>

    <text x="605" y="285" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">REGISTRO: ${xDate}</text>
    <text x="605" y="300" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">HORA: ${xTime}</text>
    
    <rect x="545" y="320" width="120" height="14" rx="4" fill="url(#holoGrad)" fill-opacity="0.2" />
    <text x="605" y="330" font-size="6.5" font-weight="800" fill="#e2e8f0" text-anchor="middle" letter-spacing="1">AUTENTICO Y VERIFICADO</text>
  </g>
</svg>`;
};

export function downloadTicketFile(sale: Sale, raffleName: string, rafflePrize: string, currency?: string, ticketPrice?: number) {
  const svgString = generateTicketSVG(sale.ticketNumber, sale, raffleName, rafflePrize, currency, ticketPrice);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `boleto_oficial_${raffleName.toLowerCase().replace(/\s+/g, '_')}_num_${sale.ticketNumber}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export sales list as CSV
export function exportToCSV(sales: Sale[], title: string = 'Sistema_Rifa_Profesional_Ventas') {
  const headers = ['ID', 'Número Ticket', 'Comprador', 'Teléfono', 'Correo', 'Ciudad', 'Estado', 'Fecha', 'Hora', 'Notas'];
  const rows = sales.map(s => [
    s.id,
    s.ticketNumber,
    `"${s.buyerName.replace(/"/g, '""')}"`,
    `"${s.phone}"`,
    `"${s.email}"`,
    `"${s.city}"`,
    s.status,
    s.date,
    s.time,
    `"${(s.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${title}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate printable report simulation (PDF/Print View)
export function exportToPDF(sales: Sale[], raffleName: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite las ventanas emergentes para descargar el reporte PDF.');
    return;
  }

  const salesRows = sales.map(s => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 8px; font-weight: bold;">#${s.ticketNumber}</td>
      <td style="padding: 8px;">${s.buyerName}</td>
      <td style="padding: 8px;">${s.phone}</td>
      <td style="padding: 8px;">${s.city}</td>
      <td style="padding: 8px;"><span style="
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
        background-color: ${s.status === 'PAID' ? '#d1fae5' : s.status === 'RESERVED' ? '#fef3c7' : '#f3f4f6'};
        color: ${s.status === 'PAID' ? '#065f46' : s.status === 'RESERVED' ? '#92400e' : '#374151'};
      ">${s.status}</span></td>
      <td style="padding: 8px;">${s.date} ${s.time}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Ventas - Sistema de Rifa Profesional</title>
        <style>
          body { font-family: sans-serif; color: #333; margin: 40px; }
          h1 { color: #1e3a8a; margin-bottom: 5px; }
          .header-meta { color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f3f4f6; text-align: left; padding: 12px 8px; border-bottom: 2px solid #ddd; }
          .footer { margin-top: 50px; font-size: 0.8em; text-align: center; color: #888; }
        </style>
      </head>
      <body>
        <h1>Sistema de Rifa Profesional — Reporte Oficial de Ventas</h1>
        <div class="header-meta">
          <strong>Rifa:</strong> ${raffleName}<br/>
          <strong>Fecha de Generación:</strong> ${new Date().toLocaleString()}<br/>
          <strong>Registros:</strong> ${sales.length} transacciones
        </div>
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Comprador</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Fecha de Operación</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows}
          </tbody>
        </table>
        <div class="footer">
          Documento autogenerado por la plataforma corporativa Sistema de Rifa Profesional. Todos los derechos reservados.
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Detects the user's country calling code using an IP lookup API with robust timezone/locale fallbacks.
 */
export async function detectCountryCallingCode(): Promise<string> {
  // 1. Try IP Geolocation API (reliable, fast, real-time)
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      if (data && data.country_calling_code) {
        let code = data.country_calling_code;
        if (code) {
          if (!code.startsWith('+')) {
            code = '+' + code;
          }
          return code;
        }
      }
    }
  } catch (e) {
    console.warn('IP Geolocation failed, using locale/timezone estimation fallback.', e);
  }

  // 2. Fallback: Estimating from Browser Timezone & language
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes('bogota') || lowerTz.includes('colombia')) return '+57';
    if (lowerTz.includes('mexico')) return '+52';
    if (lowerTz.includes('santiago') || lowerTz.includes('chile')) return '+56';
    if (lowerTz.includes('buenos_aires') || lowerTz.includes('argentina')) return '+54';
    if (lowerTz.includes('lima') || lowerTz.includes('peru')) return '+51';
    if (lowerTz.includes('quito') || lowerTz.includes('ecuador')) return '+593';
    if (lowerTz.includes('caracas') || lowerTz.includes('venezuela')) return '+58';
    if (lowerTz.includes('la_paz') || lowerTz.includes('bolivia')) return '+591';
    if (lowerTz.includes('asuncion') || lowerTz.includes('paraguay')) return '+595';
    if (lowerTz.includes('montevideo') || lowerTz.includes('uruguay')) return '+598';
    if (lowerTz.includes('guatemala')) return '+502';
    if (lowerTz.includes('tegucigalpa') || lowerTz.includes('honduras')) return '+504';
    if (lowerTz.includes('el_salvador')) return '+503';
    if (lowerTz.includes('managua') || lowerTz.includes('nicaragua')) return '+505';
    if (lowerTz.includes('san_jose') || lowerTz.includes('costa_rica')) return '+506';
    if (lowerTz.includes('panama')) return '+507';
    if (lowerTz.includes('santo_domingo') || lowerTz.includes('dominican')) return '+1';
    if (lowerTz.includes('puerto_rico')) return '+1';
    if (lowerTz.includes('madrid') || lowerTz.includes('spain')) return '+34';

    const locale = navigator.language || '';
    if (locale.endsWith('-CO')) return '+57';
    if (locale.endsWith('-MX')) return '+52';
    if (locale.endsWith('-AR')) return '+54';
    if (locale.endsWith('-CL')) return '+56';
    if (locale.endsWith('-PE')) return '+51';
    if (locale.endsWith('-EC')) return '+593';
    if (locale.endsWith('-VE')) return '+58';
    if (locale.endsWith('-BO')) return '+591';
    if (locale.endsWith('-UY')) return '+598';
    if (locale.endsWith('-PY')) return '+595';
    if (locale.endsWith('-GT')) return '+502';
    if (locale.endsWith('-HN')) return '+504';
    if (locale.endsWith('-SV')) return '+503';
    if (locale.endsWith('-NI')) return '+505';
    if (locale.endsWith('-CR')) return '+506';
    if (locale.endsWith('-PA')) return '+507';
    if (locale.endsWith('-DO')) return '+1';
    if (locale.endsWith('-ES')) return '+34';
  } catch (e) {
    console.warn('Timezone/locale fallback lookup failed:', e);
  }

  return '';
}



