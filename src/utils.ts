/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, formatPrice } from './types';

export const generateTicketSVG = (ticketNum: number, sale: Sale, raffleName: string, rafflePrize: string, currency?: string, ticketPrice?: number) => {
  const refCode = `REF-${sale.id.substring(0, 8).toUpperCase()}`;
  const priceText = formatPrice(ticketPrice || 10, currency);
  return `
<svg width="600" height="260" viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d946ef;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
    <clipPath id="ticketClip">
      <rect x="0" y="0" width="600" height="260" rx="24" />
    </clipPath>
  </defs>
  
  <g clip-path="url(#ticketClip)">
    <rect width="600" height="260" fill="url(#grad)" />
    
    <circle cx="50" cy="50" r="120" fill="white" fill-opacity="0.03" />
    <circle cx="550" cy="210" r="100" fill="white" fill-opacity="0.04" />
    
    <circle cx="0" cy="130" r="18" fill="#0b0625" />
    <circle cx="600" cy="130" r="18" fill="#0b0625" />
    
    <line x1="430" y1="0" x2="430" y2="260" stroke="#ffffff" stroke-dasharray="8 6" stroke-opacity="0.3" stroke-width="2" />
    
    <rect x="35" y="25" width="120" height="20" rx="6" fill="white" fill-opacity="0.2" />
    <text x="95" y="38" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">BOLETO OFICIAL</text>
    
    <text x="170" y="38" font-family="monospace" font-size="11" font-weight="700" fill="#f5f3ff" fill-opacity="0.8">${refCode}</text>
    
    <text x="35" y="85" font-family="'Inter', -apple-system, sans-serif" font-size="18" font-weight="900" fill="#ffffff">${raffleName}</text>
    <text x="35" y="108" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="500" fill="#f5f3ff" fill-opacity="0.9">Premio: ${rafflePrize}</text>
    
    <text x="35" y="160" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="700" fill="#e9d5ff" letter-spacing="1">TITULAR</text>
    <text x="35" y="180" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#ffffff">${sale.buyerName}</text>
    
    <text x="210" y="160" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="700" fill="#e9d5ff" letter-spacing="1">CIUDAD</text>
    <text x="210" y="180" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#ffffff">${sale.city || 'N/A'}</text>
    
    <text x="330" y="160" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="700" fill="#e9d5ff" letter-spacing="1">TELÉFONO</text>
    <text x="330" y="180" font-family="monospace" font-size="11" font-weight="700" fill="#ffffff">${sale.phone}</text>
    
    <rect x="35" y="210" width="360" height="24" rx="8" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-opacity="0.4" stroke-width="1" />
    <circle cx="50" cy="222" r="4" fill="#34d399" />
    <text x="62" y="226" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="800" fill="#34d399" letter-spacing="0.5">SOPORTE DE RESERVA CONFIRMADO Y VALIDADO</text>
    
    <text x="515" y="55" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="800" fill="#e9d5ff" text-anchor="middle" letter-spacing="1">NÚMERO</text>
    
    <rect x="460" y="70" width="110" height="60" rx="12" fill="#0f172a" fill-opacity="0.4" />
    <text x="515" y="112" font-family="monospace" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle">#${ticketNum}</text>
    
    <rect x="465" y="150" width="100" height="24" rx="8" fill="#ffffff" />
    <text x="515" y="166" font-family="'Inter', -apple-system, sans-serif" font-size="10" font-weight="900" fill="#7c3aed" text-anchor="middle">${priceText}</text>
    
    <text x="515" y="215" font-family="monospace" font-size="8" fill="#f5f3ff" fill-opacity="0.7" text-anchor="middle">REG: ${sale.date}</text>
    <text x="515" y="228" font-family="monospace" font-size="8" fill="#f5f3ff" fill-opacity="0.7" text-anchor="middle">${sale.time}</text>
  </g>
</svg>
`;
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



