/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ORGANIZADOR' | 'VENDEDOR' | 'COMPRADOR';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';
export type RaffleStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
export type TicketStatus = 'AVAILABLE' | 'RESERVED' | 'PAID' | 'CANCELLED' | 'SOLD';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  failedLoginAttempts: number;
  isSuperAdmin?: boolean;
  lastAccessAt?: string;
  createdAt?: string;
  organizerId?: string;
}

export interface Raffle {
  id: string;
  name: string;
  description: string;
  prize: string;
  totalNumbers: number;
  ticketPrice: number;
  startDate: string; // ISO String
  endDate: string; // ISO String
  status: RaffleStatus;
  drawDate?: string;
  drawTime?: string;
  liveStreamUrl?: string;
  salesCutoffDate?: string;
  salesCutoffTime?: string;
  salesEnabled?: boolean;
  autoTombola?: boolean;
  prizes?: PrizeConfig[];
}

export interface Seller {
  id: string;
  userId: string;
  name: string;
  assignedRangeStart: number;
  assignedRangeEnd: number;
  status: UserStatus;
  phone: string;
  username?: string;
  linkingCode?: string;
}

export interface Sale {
  id: string;
  raffleId: string;
  ticketNumber: number;
  buyerName: string;
  phone: string;
  email: string;
  city: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: TicketStatus;
  sellerId?: string; // Optional, can be direct or assigned
  sellerName?: string; // Automatically and immutably recorded seller name
  reservedAt?: string; // ISO timestamp when reservation was created
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  channel: NotificationChannel;
  sent: boolean;
  recipient: string;
}

export interface AppConfig {
  id: string;
  allowOfflineSync: boolean;
  maxFailedAttempts: number;
  commissionPercentage?: number;
  currency?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  ticketsSold: number;
  ticketsReserved: number;
  ticketsAvailable: number;
  salesBySeller: { sellerName: string; count: number; revenue: number }[];
  salesByCity: { city: string; count: number }[];
  salesByDate: { date: string; count: number; revenue: number }[];
  recentActivity: { id: string; time: string; type: string; description: string }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  targetType: 'ALL' | 'SPECIFIC';
  targetSellerId?: string;
  placement: string; // E.g., 'LOGIN', 'DASHBOARD', 'BOTH', 'COMPRADOR_HERO', 'VENDEDOR_PANEL', 'MODAL_ALERTA'
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  ctaText?: string;
  ctaUrl?: string;
  deviceTarget?: 'ALL' | 'DESKTOP' | 'MOBILE';
}

export interface AnnouncementRead {
  id: string;
  announcementId: string;
  sellerId: string;
  readAt: string;
}

export const GLOBAL_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano (COP)' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano (MXN)' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino (ARS)' },
  { code: 'PEN', symbol: 'S/.', name: 'Sol peruano (PEN)' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno (CLP)' },
  { code: 'UYU', symbol: '$', name: 'Peso uruguayo (UYU)' },
  { code: 'VES', symbol: 'Bs.', name: 'Bolívar venezolano (VES)' },
  { code: 'BOB', symbol: 'Bs', name: 'Boliviano (BOB)' },
  { code: 'PYG', symbol: '₲', name: 'Guaraní paraguayo (PYG)' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño (BRL)' },
  { code: 'CRC', symbol: '₡', name: 'Colón costarricense (CRC)' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal guatemalteco (GTQ)' },
  { code: 'HNL', symbol: 'L', name: 'Lempira hondureño (HNL)' },
  { code: 'NIO', symbol: 'C$', name: 'Córdoba nicaragüense (NIO)' },
  { code: 'PAB', symbol: 'B/.', name: 'Balboa panameño (PAB)' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso dominicano (DOP)' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina (GBP)' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo (CHF)' },
  { code: 'CAD', symbol: '$', name: 'Dólar canadiense (CAD)' },
  { code: 'AUD', symbol: '$', name: 'Dólar australiano (AUD)' },
  { code: 'NZD', symbol: '$', name: 'Dólar neozelandés (NZD)' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés (JPY)' },
  { code: 'CNY', symbol: '¥', name: 'Yuan chino (CNY)' },
  { code: 'INR', symbol: '₹', name: 'Rupia india (INR)' },
  { code: 'KRW', symbol: '₩', name: 'Won surcoreano (KRW)' },
  { code: 'TRY', symbol: '₺', name: 'Lira turca (TRY)' },
  { code: 'RUB', symbol: '₽', name: 'Rublo ruso (RUB)' },
  { code: 'ZAR', symbol: 'R', name: 'Rand sudafricano (ZAR)' },
  { code: 'AED', symbol: 'د.إ', name: 'Dirham de los EAU (AED)' },
  { code: 'SAR', symbol: 'ر.س', name: 'Riyal saudí (SAR)' },
  { code: 'EGP', symbol: 'E£', name: 'Libra egipcia (EGP)' },
  { code: 'ILS', symbol: '₪', name: 'Nuevo séquel israelí (ILS)' },
  { code: 'SEK', symbol: 'kr', name: 'Corona sueca (SEK)' },
  { code: 'NOK', symbol: 'kr', name: 'Corona noruega (NOK)' },
  { code: 'DKK', symbol: 'kr', name: 'Corona danesa (DKK)' },
  { code: 'PLN', symbol: 'zł', name: 'Zloty polaco (PLN)' },
  { code: 'HUF', symbol: 'Ft', name: 'Florín húngaro (HUF)' },
  { code: 'CZK', symbol: 'Kč', name: 'Corona checa (CZK)' },
  { code: 'THB', symbol: '฿', name: 'Baht tailandés (THB)' },
  { code: 'SGD', symbol: '$', name: 'Dólar de Singapur (SGD)' },
  { code: 'HKD', symbol: '$', name: 'Dólar de Hong Kong (HKD)' },
  { code: 'MYR', symbol: 'RM', name: 'Ringgit malayo (MYR)' },
  { code: 'IDR', symbol: 'Rp', name: 'Rupia indonesia (IDR)' },
  { code: 'PHP', symbol: '₱', name: 'Peso filipino (PHP)' },
  { code: 'VND', symbol: '₫', name: 'Dong vietnamita (VND)' },
];

export function getCurrencySymbol(code?: string): string {
  if (!code) return '$';
  const found = GLOBAL_CURRENCIES.find(c => c.code === code);
  return found ? found.symbol : '$';
}

export function formatPrice(amount: number, code?: string): string {
  const currentCode = code || 'USD';
  const symbol = getCurrencySymbol(currentCode);
  return `${symbol}${amount.toFixed(2)} ${currentCode}`;
}

export interface PrizeConfig {
  id: string;
  raffleId: string;
  name: string;
  description?: string;
  enabled: boolean;
  order: number; // 1, 2, or 3
  budget?: number;
}

export interface DrawHistory {
  id: string;
  raffleId: string;
  drawDate: string; // YYYY-MM-DD
  drawTime: string; // HH:MM
  winningNumber: number;
  winnerName?: string;
  winnerPhone?: string;
  winnerCity?: string;
  winnerEmail?: string;
  prizeName: string;
  sellerName?: string;
  createdAt: string; // ISO timestamp
}

export interface AppVisit {
  id: string;
  timestamp: string; // ISO
  hour: number;      // 0-23
  city: string;
  country: string;
  device: 'MOBILE' | 'DESKTOP' | 'TABLET';
  browser: string;
  referrer: string;  // e.g. "Direct", "WhatsApp", "Facebook", "Instagram", "Google"
  raffleId?: string;
}

export interface GlobalTelemetryStats {
  totalVisits: number;
  conversionRate: number; // calculated as (totalBuyers / totalVisits) * 100
  visitsByHour: { hour: number; count: number }[];
  visitsByReferrer: { referrer: string; count: number }[];
  visitsByLocation: { city: string; country: string; count: number }[];
  visitsByDevice: { device: string; count: number }[];
  visitsByBrowser: { browser: string; count: number }[];
  salesByCity: { city: string; count: number; revenue: number }[];
  popularNumbers: { number: number; count: number }[];
  popularEndings: { ending: string; count: number }[];
  totalGamesStats: {
    totalDraws: number;
    mostDrawnNumbers: { number: number; count: number }[];
    recentDrawsCount: number;
    drawsByPrize: { prizeName: string; count: number }[];
  };
}


