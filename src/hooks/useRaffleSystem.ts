import React, { useState, useEffect } from 'react';
import { 
  User, Raffle, Seller, Sale, AuditLog, AppConfig, DashboardStats, 
  TicketStatus, Announcement, AnnouncementRead, DrawHistory 
} from '../types';
import { detectCountryCallingCode } from '../utils';


// In-memory telemetry caching to avoid local client storage footprint entirely
let memoryTelemetryCity = '';
let memoryTelemetryCountry = '';
let memoryTelemetryVisitRegistered = false;

export function useRaffleSystem() {
  // State variables with localStorage persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('raffle_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user || null;
      }
    } catch (e) {
      console.error('Error loading session from localStorage:', e);
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('raffle_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.token || null;
      }
    } catch (e) {
      console.error('Error loading token from localStorage:', e);
    }
    return null;
  });

  // Sync session with localStorage whenever currentUser or token changes
  useEffect(() => {
    if (currentUser && token) {
      localStorage.setItem('raffle_user_session', JSON.stringify({ user: currentUser, token }));
    } else if (!currentUser) {
      localStorage.removeItem('raffle_user_session');
    }
  }, [currentUser, token]);
  
  // App states
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);

  // Authentication Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Selected seller state for buyer mode
  const [selectedSellerForBuyerMode, setSelectedSellerForBuyerMode] = useState<string>(''); // default to empty (show all numbers)

  // CRUD seller state
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  const [newSellerUser, setNewSellerUser] = useState({
    username: '',
    pass: '',
    name: '',
    email: '',
    assignedRangeStart: 1,
    assignedRangeEnd: 100,
    phone: '',
  });
  const [sellerCrudError, setSellerCrudError] = useState('');

  // Seller registering sale state
  const [isRegisteringSale, setIsRegisteringSale] = useState(false);
  const [targetNumberForSale, setTargetNumberForSale] = useState<number | null>(null);
  const [newSaleForm, setNewSaleForm] = useState({
    buyerName: '',
    phone: '',
    email: '',
    city: 'Madrid',
    notes: '',
    status: 'PAID' as TicketStatus,
  });
  const [saleError, setSaleError] = useState('');
  const [sellerActiveTab, setSellerActiveTab] = useState<'grid' | 'buyers' | 'reservations' | 'report'>('grid');
  const [organizerSection, setOrganizerSection] = useState<'vendedores' | 'ventas' | 'configuracion' | 'estadisticas' | 'publicidad' | 'comisiones' | 'sorteos'>('estadisticas');

  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementReads, setAnnouncementReads] = useState<AnnouncementRead[]>([]);
  const [forceShowAnnouncements, setForceShowAnnouncements] = useState(false);

  // Buyer ticket selection state
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [buyerForm, setBuyerForm] = useState({
    buyerName: '',
    phone: '',
    email: '',
    city: memoryTelemetryCity || 'Madrid',
    notes: '',
  });
  const [buyerError, setBuyerError] = useState('');
  const [buyerSuccessMsg, setBuyerSuccessMsg] = useState('');
  const [buyerModalInfo, setBuyerModalInfo] = useState<{
    tickets: number[];
    buyerName: string;
    phone: string;
    email: string;
    city: string;
    notes: string;
    sellerName: string;
    sellerPhone: string;
  } | null>(null);

  // New states for interactive modals on ticket click
  const [isBuyerRegisterModalOpen, setIsBuyerRegisterModalOpen] = useState(false);
  const [buyerMessageModal, setBuyerMessageModal] = useState<{ title: string; message: string; type: 'reserved' | 'paid'; ticketNumber: number } | null>(null);
  const [selectedReservationForSellerModal, setSelectedReservationForSellerModal] = useState<Sale | null>(null);
  const [selectedSoldTicketForSellerModal, setSelectedSoldTicketForSellerModal] = useState<Sale | null>(null);
  const [paymentSuccessMessageModal, setPaymentSuccessMessageModal] = useState<Sale | null>(null);

  // Real-time synchronization connection state
  const [wsConnected, setWsConnected] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);

  // Auto detected country calling code
  const [detectedPhonePrefix, setDetectedPhonePrefix] = useState('');

  useEffect(() => {
    detectCountryCallingCode().then(code => {
      if (code) {
        setDetectedPhonePrefix(code);
        // Pre-fill empty phone fields
        setNewSellerUser(prev => !prev.phone ? { ...prev, phone: code } : prev);
        setNewSaleForm(prev => !prev.phone ? { ...prev, phone: code } : prev);
        setBuyerForm(prev => !prev.phone ? { ...prev, phone: code } : prev);
        setRegisterForm(prev => !prev.phone ? { ...prev, phone: code } : prev);
      }
    });
  }, []);

  // Admin Config settings
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [adminConfigForm, setAdminConfigForm] = useState({
    allowOfflineSync: false,
    maxFailedAttempts: 5,
    commissionPercentage: 10,
    currency: 'USD',
  });
  const [raffleConfigForm, setRaffleConfigForm] = useState({
    drawDate: '2026-08-30',
    drawTime: '19:00',
    liveStreamUrl: 'https://youtube.com/live/rifaprofesional2026',
    prize: '',
    ticketPrice: 0,
    totalNumbers: 500,
    salesCutoffDate: '2026-08-30',
    salesCutoffTime: '18:00',
    prizes: [] as any[],
    salesEnabled: true,
  });
  const [isUpdatingRaffle, setIsUpdatingRaffle] = useState(false);
  const [raffleUpdateMsg, setRaffleUpdateMsg] = useState('');
  const [totalNumbersType, setTotalNumbersType] = useState<'preset' | 'custom'>('preset');

  // Password Recovery Simulator state
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState('');

  // Register state variables
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'VENDEDOR' as 'VENDEDOR' | 'ORGANIZADOR',
    linkingCode: '',
  });
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState('');
  const [registerVerificationLink, setRegisterVerificationLink] = useState('');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sellerFilter, setSellerFilter] = useState<string>('ALL');

  const [isAutoGeneratingSellers, setIsAutoGeneratingSellers] = useState(false);
  const [autoGenSellersMsg, setAutoGenSellersMsg] = useState('');
  const [autoGenRangeSize, setAutoGenRangeSize] = useState<number>(100);

  // Real-time WebSocket connection manager
  useEffect(() => {
    // Detect Vercel deployments or serverless environment to completely bypass WebSockets
    if (window.location.hostname.includes('vercel.app')) {
      console.log('[Sistema de Rifa Profesional WebSockets] Bypassing WebSockets on Vercel deployment. Using polling fallback instead.');
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    function connect() {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.warn('[Sistema de Rifa Profesional WebSockets] Max connection attempts reached. WebSockets disabled. Relying entirely on HTTP polling fallback.');
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
      
      console.log('[Sistema de Rifa Profesional WebSockets] Connecting to:', wsUrl);
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
        socket = ws;
      } catch (wsErr) {
        console.warn('[Sistema de Rifa Profesional WebSockets] Failed to create WebSocket:', wsErr);
        setWsConnected(false);
        reconnectAttempts++;
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 5000);
        return;
      }

      ws.onopen = () => {
        console.log('[Sistema de Rifa Profesional WebSockets] Connected successfully to server');
        setWsConnected(true);
        reconnectAttempts = 0; // Reset count upon success
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[Sistema de Rifa Profesional WebSockets] Message received:', message.type);

          switch (message.type) {
            case 'init':
              if (message.sales) setSales(message.sales);
              if (message.raffles) {
                setRaffles(message.raffles);
                const active = message.raffles.find((r: any) => r.status === 'ACTIVE') || message.raffles[0];
                setActiveRaffle(active);
              }
              if (message.sellers) setSellers(message.sellers);
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              if (message.drawHistory) setDrawHistory(message.drawHistory);
              if (message.config) {
                setConfig(message.config);
                setAdminConfigForm({
                  allowOfflineSync: message.config.allowOfflineSync,
                  maxFailedAttempts: message.config.maxFailedAttempts,
                  commissionPercentage: message.config.commissionPercentage ?? 10,
                  currency: message.config.currency || 'USD',
                });
              }
              break;
            case 'config_updated':
              if (message.config) {
                setConfig(message.config);
                setAdminConfigForm({
                  allowOfflineSync: message.config.allowOfflineSync,
                  maxFailedAttempts: message.config.maxFailedAttempts,
                  commissionPercentage: message.config.commissionPercentage ?? 10,
                  currency: message.config.currency || 'USD',
                });
              }
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              break;
            case 'sales_updated':
              if (message.sales) setSales(message.sales);
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              break;
            case 'raffle_updated':
              if (message.raffle) {
                setActiveRaffle(message.raffle);
              }
              if (message.raffles) setRaffles(message.raffles);
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              break;
            case 'sellers_updated':
            case 'users_updated':
              if (message.sellers) setSellers(message.sellers);
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              if (message.users) {
                setCurrentUser(prevUser => {
                  if (!prevUser) return null;
                  const updatedSelf = message.users.find((u: User) => u.id === prevUser.id);
                  if (updatedSelf) {
                    if (
                      updatedSelf.isSuperAdmin !== prevUser.isSuperAdmin ||
                      updatedSelf.status !== prevUser.status ||
                      updatedSelf.role !== prevUser.role ||
                      updatedSelf.name !== prevUser.name ||
                      updatedSelf.email !== prevUser.email ||
                      updatedSelf.username !== prevUser.username
                    ) {
                      return updatedSelf;
                    }
                  }
                  return prevUser;
                });
              }
              break;
            case 'announcements_updated':
              if (message.announcements) setAnnouncements(message.announcements);
              if (message.announcementReads) setAnnouncementReads(message.announcementReads);
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              break;
            case 'draw_created':
              if (message.drawHistory) setDrawHistory(message.drawHistory);
              if (message.auditLogs) setAuditLogs(message.auditLogs);
              break;
            default:
              break;
          }
        } catch (err) {
          console.warn('[Sistema de Rifa Profesional WebSockets] Issue parsing message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`[Sistema de Rifa Profesional WebSockets] Connection closed. Reconnecting attempt ${reconnectAttempts}/${maxReconnectAttempts} in 5 seconds...`);
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000);
        } else {
          console.log('[Sistema de Rifa Profesional WebSockets] Connection closed. Max attempts reached. Falling back entirely to polling.');
        }
      };

      ws.onerror = () => {
        // Silently close without printing error event stack traces to keep console clean
        ws.close();
      };
    }

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Graceful HTTP Polling Fallback when WebSockets are disconnected (such as in serverless environments like Vercel)
  useEffect(() => {
    let pollingInterval: any = null;

    if (!wsConnected) {
      console.log('[Sistema de Rifa Profesional Polling] WebSockets not active. Initiating fallback polling every 10 seconds...');
      pollingInterval = setInterval(() => {
        fetchInitialData();
      }, 5000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [wsConnected]);

  // Load initial configurations and data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Set selected seller for buyer mode automatically when sellers list is fetched
  useEffect(() => {
    if (sellers.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const urlVendedor = params.get('vendedor');
      if (urlVendedor) {
        const found = sellers.find(s => s.username === urlVendedor || s.id === urlVendedor);
        if (found) {
          setSelectedSellerForBuyerMode(found.id);
        }
      }
    }
  }, [sellers]);

  // Sync dashboard stats when sales change
  useEffect(() => {
    if (activeRaffle) {
      fetchStats(activeRaffle.id);
    }
  }, [sales, activeRaffle]);

  // Trigger visit telemetry registration on load
  useEffect(() => {
    const registerTelemetryVisit = async () => {
      if (memoryTelemetryVisitRegistered) return;

      let device: 'MOBILE' | 'DESKTOP' | 'TABLET' = 'DESKTOP';
      const width = window.innerWidth;
      if (width < 640) device = 'MOBILE';
      else if (width < 1024) device = 'TABLET';

      let browser = 'Chrome';
      const ua = navigator.userAgent;
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';

      let referrer = 'Directo';
      const docRef = document.referrer;
      if (docRef) {
        if (docRef.includes('whatsapp') || docRef.includes('wa.me')) referrer = 'WhatsApp';
        else if (docRef.includes('facebook.com')) referrer = 'Facebook';
        else if (docRef.includes('instagram.com')) referrer = 'Instagram';
        else if (docRef.includes('google.com')) referrer = 'Google';
        else {
          try {
            referrer = new URL(docRef).hostname;
          } catch {
            referrer = 'Otro';
          }
        }
      }

      let city = memoryTelemetryCity;
      let country = memoryTelemetryCountry;
      
      if (!city) {
        const fetchIpGeolocation = async (): Promise<{ city: string; country: string }> => {
          // Tier 2: Low-Latency IP-Based Geolocation API
          try {
            const geoRes = await fetch('https://ipapi.co/json/');
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              return {
                city: geoData.city || 'Desconocida',
                country: geoData.country_name || 'Desconocido'
              };
            }
          } catch (e) {
            console.warn('[IP Geolocation API Error]', e);
          }
          return { city: 'Desconocida', country: 'Desconocido' };
        };

        const getGeoposition = (): Promise<{ city: string; country: string }> => {
          return new Promise((resolve) => {
            // Tier 1: HTML5 High-Precision Geolocation with standard fallback
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                      headers: { 'Accept-Language': 'es', 'User-Agent': 'SistemaRifaProfesional/1.0' }
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const addr = data.address || {};
                      const cityVal = addr.city || addr.town || addr.village || addr.suburb || addr.state || '';
                      const countryVal = addr.country || '';
                      if (cityVal) {
                        resolve({ city: cityVal, country: countryVal });
                        return;
                      }
                    }
                  } catch (e) {
                    console.warn('[HTML5 Geopositioning Reverse Geocode Error]', e);
                  }
                  // Fallback to IP Geolocation on error
                  fetchIpGeolocation().then(resolve);
                },
                (error) => {
                  console.info('[HTML5 Geopositioning Denied/Failed, falling back to IP]', error.message);
                  fetchIpGeolocation().then(resolve);
                },
                { timeout: 4000, enableHighAccuracy: true }
              );
            } else {
              fetchIpGeolocation().then(resolve);
            }
          });
        };

        const result = await getGeoposition();
        city = result.city;
        country = result.country;
        memoryTelemetryCity = city;
        memoryTelemetryCountry = country;
        setBuyerForm(prev => ({ ...prev, city }));
      }

      try {
        const res = await fetch('/api/telemetry/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hour: new Date().getHours(),
            city,
            country,
            device,
            browser,
            referrer,
            raffleId: activeRaffle?.id || 'r1'
          })
        });
        if (res.ok) {
          memoryTelemetryVisitRegistered = true;
        }
      } catch (err) {
        console.error('Error reporting telemetry visit:', err);
      }
    };

    if (activeRaffle) {
      registerTelemetryVisit();
    }
  }, [activeRaffle]);

  // Auto-open modal if ticket parameter is present in URL
  useEffect(() => {
    if (sales.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket');
      if (ticketParam) {
        const ticketNum = parseInt(ticketParam, 10);
        const matchedSale = sales.find(s => s.raffleId === activeRaffle?.id && s.ticketNumber === ticketNum);
        if (matchedSale) {
          if (matchedSale.status === 'RESERVED') {
            setSelectedReservationForSellerModal(matchedSale);
          } else if (matchedSale.status === 'PAID') {
            setSelectedSoldTicketForSellerModal(matchedSale);
          }
          // Remove from address bar to prevent looping on page reload
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [sales, activeRaffle]);

  // Sync raffleConfigForm with loaded activeRaffle
  useEffect(() => {
    if (activeRaffle) {
      setRaffleConfigForm({
        drawDate: activeRaffle.drawDate || '',
        drawTime: activeRaffle.drawTime || '',
        liveStreamUrl: activeRaffle.liveStreamUrl || '',
        prize: activeRaffle.prize || '',
        ticketPrice: activeRaffle.ticketPrice || 0,
        totalNumbers: activeRaffle.totalNumbers || 500,
        salesCutoffDate: activeRaffle.salesCutoffDate || '',
        salesCutoffTime: activeRaffle.salesCutoffTime || '',
        prizes: activeRaffle.prizes || [],
        salesEnabled: activeRaffle.salesEnabled !== false,
      });
      const presets = [50, 100, 150, 200, 250, 300, 400, 500, 1000];
      if (presets.includes(activeRaffle.totalNumbers || 500)) {
        setTotalNumbersType('preset');
      } else {
        setTotalNumbersType('custom');
      }
    }
  }, [activeRaffle]);

  const fetchInitialData = async () => {
    try {
      // Check if Supabase connection is established
      try {
        const resStatus = await fetch('/api/supabase-status');
        if (resStatus.ok) {
          const statusData = await resStatus.json();
          setIsSupabaseConnected(statusData.connected);
        }
      } catch (e) {
        console.warn('Error querying Supabase status:', e);
      }

      const resRaffles = await fetch('/api/raffles');
      if (!resRaffles.ok) {
        throw new Error(`Error HTTP raffles: ${resRaffles.status}`);
      }
      const ctRaffles = resRaffles.headers.get('content-type');
      if (!ctRaffles || !ctRaffles.includes('application/json')) {
        throw new Error('Servidor no retornó JSON válido para rifas (compilando o frío en Vercel)');
      }
      const dataRaffles = await resRaffles.json();
      setRaffles(dataRaffles);
      const active = dataRaffles.find((r: Raffle) => r.status === 'ACTIVE') || dataRaffles[0];
      setActiveRaffle(active);

      const resSellers = await fetch('/api/sellers');
      if (resSellers.ok && resSellers.headers.get('content-type')?.includes('application/json')) {
        const dataSellers = await resSellers.json();
        setSellers(dataSellers);

        // Dynamically resolve URL seller parameter from loaded sellers
        const params = new URLSearchParams(window.location.search);
        const urlVendedor = params.get('vendedor');
        if (urlVendedor) {
          const matchedSeller = dataSellers.find((s: Seller) => 
            s.username?.toLowerCase() === urlVendedor.toLowerCase() || 
            s.name.toLowerCase().includes(urlVendedor.toLowerCase())
          );
          if (matchedSeller) {
            setSelectedSellerForBuyerMode(matchedSeller.id);
          } else if (dataSellers.length > 0) {
            setSelectedSellerForBuyerMode(dataSellers[0].id); // Default fallback
          }
        }
      }

      const resSales = await fetch('/api/sales');
      if (resSales.ok && resSales.headers.get('content-type')?.includes('application/json')) {
        const dataSales = await resSales.json();
        setSales(dataSales);
      }

      const resLogs = await fetch('/api/audit-logs');
      if (resLogs.ok && resLogs.headers.get('content-type')?.includes('application/json')) {
        const dataLogs = await resLogs.json();
        setAuditLogs(dataLogs);
      }

      const resConfig = await fetch('/api/config');
      if (resConfig.ok && resConfig.headers.get('content-type')?.includes('application/json')) {
        const dataConfig = await resConfig.json();
        setConfig(dataConfig);
        setAdminConfigForm({
          allowOfflineSync: dataConfig.allowOfflineSync,
          maxFailedAttempts: dataConfig.maxFailedAttempts,
          commissionPercentage: dataConfig.commissionPercentage ?? 10,
          currency: dataConfig.currency || 'USD',
        });
      }

      if (active) {
        fetchStats(active.id);
      }

      // Fetch announcements and reads
      try {
        const resAnn = await fetch('/api/announcements');
        if (resAnn.ok && resAnn.headers.get('content-type')?.includes('application/json')) {
          const dataAnn = await resAnn.json();
          setAnnouncements(dataAnn);
        }
      } catch (e) {
        console.error('Error fetching announcements:', e);
      }

      try {
        const resReads = await fetch('/api/announcements/reads');
        if (resReads.ok && resReads.headers.get('content-type')?.includes('application/json')) {
          const dataReads = await resReads.json();
          setAnnouncementReads(dataReads);
        }
      } catch (e) {
        console.error('Error fetching reads:', e);
      }

      try {
        const resUsers = await fetch('/api/users');
        if (resUsers.ok && resUsers.headers.get('content-type')?.includes('application/json')) {
          const dataUsers: User[] = await resUsers.json();
          setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const updatedSelf = dataUsers.find((u: User) => u.id === prevUser.id);
            if (updatedSelf) {
              if (
                updatedSelf.isSuperAdmin !== prevUser.isSuperAdmin ||
                updatedSelf.status !== prevUser.status ||
                updatedSelf.role !== prevUser.role ||
                updatedSelf.name !== prevUser.name ||
                updatedSelf.email !== prevUser.email ||
                updatedSelf.username !== prevUser.username
              ) {
                return updatedSelf;
              }
            }
            return prevUser;
          });
        }
      } catch (e) {
        // Users sync optional
      }

      try {
        const resDraws = await fetch('/api/draw-history');
        if (resDraws.ok && resDraws.headers.get('content-type')?.includes('application/json')) {
          const dataDraws = await resDraws.json();
          setDrawHistory(dataDraws);
        }
      } catch (e) {
        console.error('Error fetching draw history:', e);
      }
    } catch (err) {
      console.warn('[Sistema de Rifa Profesional Polling] Gracefully handled polling fetch update:', err);
    }
  };

  const fetchStats = async (raffleId: string) => {
    try {
      const res = await fetch(`/api/stats/${raffleId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching raffle stats:', err);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setToken(data.token);
        // Clear login fields
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setAuthError(data.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      setAuthError('Fallo en el servidor al autenticar.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('raffle_user_session');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setRegisterSuccessMsg('');
    setRegisterVerificationLink('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }

    setIsRegisterLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
          role: registerForm.role,
          linkingCode: registerForm.role === 'VENDEDOR' ? registerForm.linkingCode : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterSuccessMsg(
          '¡Registro exitoso! Hemos enviado un correo de confirmación para activar tu cuenta. Por favor confirma tu correo electrónico para poder iniciar sesión.'
        );
        if (data.verificationLink) {
          setRegisterVerificationLink(data.verificationLink);
        }
        
        // Clear registration fields
        setRegisterForm({
          username: '',
          name: '',
          email: '',
          phone: detectedPhonePrefix || '',
          password: '',
          confirmPassword: '',
          role: 'VENDEDOR',
          linkingCode: '',
        });
      } else {
        setAuthError(data.error || 'Ocurrió un error al registrarse.');
      }
    } catch (err) {
      setAuthError('Fallo en el servidor al procesar el registro.');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoveryMsg(`Se han enviado instrucciones detalladas de reestablecimiento a ${recoveryEmail}. Por favor, verifique su bandeja de entrada.`);
    setTimeout(() => {
      setIsRecovering(false);
      setRecoveryEmail('');
      setRecoveryMsg('');
    }, 5000);
  };

  const handleCreateSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerCrudError('');
    if (!currentUser) return;

    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          sellerData: newSellerUser,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Success
        setSellers([...sellers, data]);
        setIsCreatingSeller(false);
        setNewSellerUser({
          username: '',
          pass: '',
          name: '',
          email: '',
          assignedRangeStart: 1,
          assignedRangeEnd: 100,
          phone: detectedPhonePrefix || '',
        });
        // refresh system logs
        const resLogs = await fetch('/api/audit-logs');
        const dataLogs = await resLogs.json();
        setAuditLogs(dataLogs);
      } else {
        setSellerCrudError(data.error || 'No se pudo crear el vendedor.');
      }
    } catch (err) {
      setSellerCrudError('Error de red al crear vendedor.');
    }
  };

  const handleBlockSeller = async (sellerId: string, currentStatus: string) => {
    if (!currentUser) return;
    const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          updates: { status: nextStatus },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSellers(sellers.map(s => s.id === sellerId ? data : s));
        const resLogs = await fetch('/api/audit-logs');
        const dataLogs = await resLogs.json();
        setAuditLogs(dataLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSeller = (sellerId: string) => {
    if (!currentUser) return;

    showConfirm(
      '¿Eliminar vendedor?',
      '¿Está seguro de eliminar este vendedor de forma permanente? Se eliminará su acceso y rango de boletos.',
      async () => {
        try {
          const res = await fetch(`/api/sellers/${sellerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminUserId: currentUser.id }),
          });
          if (res.ok) {
            setSellers(sellers.filter(s => s.id !== sellerId));
            const resLogs = await fetch('/api/audit-logs');
            const dataLogs = await resLogs.json();
            setAuditLogs(dataLogs);
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Register Sales / Reservations (Seller Dashboard)
  const handleRegisterSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError('');
    if (!currentUser || !activeRaffle || targetNumberForSale === null) return;

    if (activeRaffle.status === 'DRAFT') {
      setSaleError('⚠️ El sorteo se encuentra en modo BORRADOR. No se pueden registrar ventas ni reservar boletos hasta el lanzamiento oficial.');
      return;
    }

    const now = new Date();
    const salePayload = {
      raffleId: activeRaffle.id,
      ticketNumber: targetNumberForSale,
      buyerName: newSaleForm.buyerName,
      phone: newSaleForm.phone,
      email: newSaleForm.email,
      city: newSaleForm.city,
      notes: newSaleForm.notes,
      status: newSaleForm.status,
      sellerId: sellers.find(s => s.userId === currentUser.id)?.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorUserId: currentUser.id,
          saleData: salePayload,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSales([...sales, data]);
        setIsRegisteringSale(false);
        setTargetNumberForSale(null);
        // Reset form
        setNewSaleForm({
          buyerName: '',
          phone: detectedPhonePrefix || '',
          email: '',
          city: 'Madrid',
          notes: '',
          status: 'PAID',
        });
        if (data.status === 'PAID') {
          setPaymentSuccessMessageModal(data);
        }
      } else {
        setSaleError(data.error || 'No se pudo registrar la venta.');
      }
    } catch (err) {
      setSaleError('Error de red al registrar la venta.');
    }
  };

  // Handle direct buyer transactions
  const handleBuyerCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyerError('');
    setBuyerSuccessMsg('');
    if (!activeRaffle || selectedTickets.length === 0) {
      setBuyerError('Seleccione al menos un número disponible.');
      return;
    }
    if (activeRaffle.status === 'DRAFT') {
      setBuyerError('⚠️ El sorteo se encuentra en modo BORRADOR (DRAFT). No se permite la reserva de boletos hasta el lanzamiento oficial.');
      return;
    }
    if (!buyerForm.buyerName || !buyerForm.phone || !buyerForm.email) {
      setBuyerError('Complete todos los campos de contacto obligatorios.');
      return;
    }

    try {
      const successfulTickets: number[] = [];
      
      // Register each selected ticket
      for (const num of selectedTickets) {
        // Find seller corresponding to the ticket number dynamically for maximum coherence (only registered sellers)
        const recognizedSeller = sellers.find(s => num >= s.assignedRangeStart && num <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '');
        const sellerIdToUse = recognizedSeller?.id || selectedSellerForBuyerMode;
        const targetOperatorUserId = recognizedSeller?.userId || 'u2';

        const payload = {
          raffleId: activeRaffle.id,
          ticketNumber: num,
          buyerName: buyerForm.buyerName,
          phone: buyerForm.phone,
          email: buyerForm.email,
          city: buyerForm.city,
          notes: `[Reserva directa en línea] ${buyerForm.notes}`,
          status: 'RESERVED' as TicketStatus,
          sellerId: sellerIdToUse,
        };

        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorUserId: targetOperatorUserId,
            saleData: payload,
          }),
        });

        if (res.ok) {
          successfulTickets.push(num);
        } else {
          const data = await res.json();
          throw new Error(data.error || `No se pudo reservar el número #${num}.`);
        }
      }

      // Update state and clear selection
      const firstTicket = successfulTickets[0];
      const sellerObjForBuyer = sellers.find(s => firstTicket >= s.assignedRangeStart && firstTicket <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '') || sellers.find(s => s.id === selectedSellerForBuyerMode);
      setBuyerModalInfo({
        tickets: successfulTickets,
        buyerName: buyerForm.buyerName,
        phone: buyerForm.phone,
        email: buyerForm.email,
        city: buyerForm.city,
        notes: buyerForm.notes,
        sellerName: sellerObjForBuyer ? sellerObjForBuyer.name : 'Vendedor Autorizado',
        sellerPhone: sellerObjForBuyer ? sellerObjForBuyer.phone : '+34 600 000 000',
      });
      setBuyerSuccessMsg(`¡Reserva temporal creada! Dispone de 3 horas para contactar a su vendedor y completar el pago.`);
      setSelectedTickets([]);
      setIsBuyerRegisterModalOpen(false);
      setBuyerForm({
        buyerName: '',
        phone: detectedPhonePrefix || '',
        email: '',
        city: 'Madrid',
        notes: '',
      });
      // Fetch latest sales to update client UI immediately
      const resSales = await fetch('/api/sales');
      const dataSales = await resSales.json();
      setSales(dataSales);
    } catch (err: any) {
      setBuyerError(err.message || 'Error al procesar la solicitud.');
    }
  };

  const handleMarkAnnouncementAsRead = async (announcementId: string) => {
    if (!currentUser) return;
    try {
      const currentSellerObj = sellers.find(s => s.userId === currentUser.id);
      if (!currentSellerObj) return;

      const res = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerUserId: currentUser.id })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnnouncementReads(prev => {
          if (prev.some(r => r.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  // Confirm reservation payment or cancel reservation
  const handleUpdateSaleStatus = async (saleId: string, targetStatus: TicketStatus) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/sales/${saleId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorUserId: currentUser.id,
          status: targetStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSales(sales.map(s => s.id === saleId ? data : s));
        if (targetStatus === 'PAID') {
          setPaymentSuccessMessageModal(data);
        }

        // Fetch latest audit logs to keep seller/organizer audit updated
        const resLogs = await fetch('/api/audit-logs');
        if (resLogs.ok) {
          const dataLogs = await resLogs.json();
          setAuditLogs(dataLogs);
        }

        // Update raffle statistics in real time
        if (activeRaffle) {
          fetchStats(activeRaffle.id);
        }
      } else {
        alert(data.error || 'No se pudo actualizar el estado de la reserva.');
      }
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
      alert('Error de conexión al servidor al intentar actualizar la reserva.');
    }
  };

  // Admin Config updates
  const handleConfigUpdate = async (e?: React.FormEvent, customForm?: typeof adminConfigForm) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    const formToUse = customForm || adminConfigForm;
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          updates: {
            allowOfflineSync: formToUse.allowOfflineSync,
            maxFailedAttempts: formToUse.maxFailedAttempts,
            commissionPercentage: Number(formToUse.commissionPercentage ?? 10),
            currency: formToUse.currency || 'USD',
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
        setAdminConfigForm(formToUse);
        setShowConfigPanel(false);
      } else {
        alert(data.error || 'Error al actualizar la configuración.');
      }
    } catch (err) {
      console.error('Error al actualizar config:', err);
      alert('Error de red al actualizar la configuración global.');
    }
  };

  const handleRaffleUpdate = async (e?: React.FormEvent, customForm?: typeof raffleConfigForm) => {
    if (e) e.preventDefault();
    if (!currentUser || !activeRaffle) return;
    const formToUse = customForm || raffleConfigForm;
    setIsUpdatingRaffle(true);
    setRaffleUpdateMsg('');
    try {
      const res = await fetch(`/api/raffles/${activeRaffle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          updates: {
            drawDate: formToUse.drawDate,
            drawTime: formToUse.drawTime,
            liveStreamUrl: formToUse.liveStreamUrl,
            prize: formToUse.prize,
            ticketPrice: formToUse.ticketPrice,
            totalNumbers: formToUse.totalNumbers,
            salesCutoffDate: formToUse.salesCutoffDate,
            salesCutoffTime: formToUse.salesCutoffTime,
            prizes: formToUse.prizes,
            salesEnabled: formToUse.salesEnabled !== false,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRaffle(data);
        setRaffles(raffles.map(r => r.id === data.id ? data : r));
        setRaffleConfigForm(formToUse);
        setRaffleUpdateMsg('¡Configuración del sorteo actualizada con éxito!');
        setTimeout(() => setRaffleUpdateMsg(''), 4000);
      } else {
        setRaffleUpdateMsg(data.error || 'Error al actualizar el sorteo.');
      }
    } catch (err) {
      setRaffleUpdateMsg('Fallo de red al guardar la configuración del sorteo.');
    } finally {
      setIsUpdatingRaffle(false);
    }
  };

  const handleLaunchRaffle = async () => {
    if (!currentUser || !activeRaffle) return;
    
    showConfirm(
      '¿Lanzar sorteo oficialmente?',
      '¿Está seguro de que desea lanzar el sorteo oficialmente? Esto cambiará su estado de BORRADOR (DRAFT) a ACTIVO, habilitando de inmediato la reserva de boletos para compradores y la venta para vendedores.',
      async () => {
        setIsUpdatingRaffle(true);
        setRaffleUpdateMsg('');
        try {
          const res = await fetch(`/api/raffles/${activeRaffle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminUserId: currentUser.id,
              updates: {
                status: 'ACTIVE',
              },
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setActiveRaffle(data);
            setRaffles(raffles.map(r => r.id === data.id ? data : r));
            setRaffleUpdateMsg('🚀 ¡Juego lanzado con éxito! El sorteo ya está ACTIVO y público.');
            
            // Log to Audit system
            try {
              await fetch('/api/audit-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'LAUNCH_RAFFLE',
                  details: `Rifa "${activeRaffle.name}" lanzada oficialmente. Rango activo de venta iniciado.`,
                  username: currentUser.name,
                }),
              });
              const resLogs = await fetch('/api/audit-logs');
              if (resLogs.ok) {
                const dataLogs = await resLogs.json();
                setAuditLogs(dataLogs);
              }
            } catch (e) {
              console.error('Error logging audit for raffle launch:', e);
            }
            
            setTimeout(() => setRaffleUpdateMsg(''), 5000);
          } else {
            setRaffleUpdateMsg(data.error || 'Error al lanzar el sorteo.');
          }
        } catch (err) {
          setRaffleUpdateMsg('Fallo de red al lanzar el sorteo.');
        } finally {
          setIsUpdatingRaffle(false);
        }
      }
    );
  };

  const handleAutoGenerateSellers = async (rangeSize: number) => {
    if (!currentUser) return;
    setIsAutoGeneratingSellers(true);
    setAutoGenSellersMsg('');
    try {
      const res = await fetch('/api/sellers/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          rangeSize: rangeSize,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAutoGenSellersMsg(`¡Licencias autogeneradas en rangos de ${rangeSize} números con éxito!`);
        if (data.sellers) setSellers(data.sellers);
        setTimeout(() => setAutoGenSellersMsg(''), 4000);
      } else {
        setAutoGenSellersMsg(data.error || 'Error al auto-generar licencias.');
      }
    } catch (err) {
      setAutoGenSellersMsg('Fallo de red al intentar auto-generar licencias.');
    } finally {
      setIsAutoGeneratingSellers(false);
    }
  };

  // Helper/Derived states
  const sellerObj = currentUser ? sellers.find(s => s.userId === currentUser.id) : null;
  const sellerRange = sellerObj ? { start: sellerObj.assignedRangeStart, end: sellerObj.assignedRangeEnd } : { start: 1, end: 100 };

  const buyerSellerObj = sellers.find(s => s.id === selectedSellerForBuyerMode);
  const buyerRange = buyerSellerObj ? { start: buyerSellerObj.assignedRangeStart, end: buyerSellerObj.assignedRangeEnd } : { start: 1, end: activeRaffle?.totalNumbers || 500 };

  // Filtered sales for seller or organizer tables
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.phone.includes(searchQuery) || 
                          s.ticketNumber.toString() === searchQuery;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    
    let matchesSeller = true;
    if (currentUser?.role === 'VENDEDOR' && sellerObj) {
      matchesSeller = s.sellerId === sellerObj.id;
    } else if (sellerFilter !== 'ALL') {
      matchesSeller = s.sellerId === sellerFilter;
    }

    return matchesSearch && matchesStatus && matchesSeller;
  });

  return {
    // Auth & Users
    currentUser, setCurrentUser,
    token, setToken,
    loginUsername, setLoginUsername,
    loginPassword, setLoginPassword,
    authError, setAuthError,
    isLoginLoading, setIsLoginLoading,
    showPassword, setShowPassword,
    selectedSellerForBuyerMode, setSelectedSellerForBuyerMode,

    // App structures
    raffles, setRaffles,
    activeRaffle, setActiveRaffle,
    sellers, setSellers,
    sales, setSales,
    stats, setStats,
    auditLogs, setAuditLogs,
    config, setConfig,
    drawHistory, setDrawHistory,

    // CRUD sellers
    isCreatingSeller, setIsCreatingSeller,
    confirmDialog, setConfirmDialog,
    showConfirm,
    newSellerUser, setNewSellerUser,
    sellerCrudError, setSellerCrudError,

    // Reg sales
    isRegisteringSale, setIsRegisteringSale,
    targetNumberForSale, setTargetNumberForSale,
    newSaleForm, setNewSaleForm,
    saleError, setSaleError,
    sellerActiveTab, setSellerActiveTab,
    organizerSection, setOrganizerSection,

    // Announcements
    announcements, setAnnouncements,
    announcementReads, setAnnouncementReads,
    forceShowAnnouncements, setForceShowAnnouncements,

    // Buyer state
    selectedTickets, setSelectedTickets,
    buyerForm, setBuyerForm,
    buyerError, setBuyerError,
    buyerSuccessMsg, setBuyerSuccessMsg,
    buyerModalInfo, setBuyerModalInfo,

    // Interaction modals
    isBuyerRegisterModalOpen, setIsBuyerRegisterModalOpen,
    buyerMessageModal, setBuyerMessageModal,
    selectedReservationForSellerModal, setSelectedReservationForSellerModal,
    selectedSoldTicketForSellerModal, setSelectedSoldTicketForSellerModal,
    paymentSuccessMessageModal, setPaymentSuccessMessageModal,

    // Connectivity
    wsConnected, setWsConnected,
    isSupabaseConnected, setIsSupabaseConnected,
    detectedPhonePrefix,


    // Admin configs
    showConfigPanel, setShowConfigPanel,
    adminConfigForm, setAdminConfigForm,
    raffleConfigForm, setRaffleConfigForm,
    isUpdatingRaffle, setIsUpdatingRaffle,
    raffleUpdateMsg, setRaffleUpdateMsg,
    totalNumbersType, setTotalNumbersType,

    // Pass recovery
    isRecovering, setIsRecovering,
    recoveryEmail, setRecoveryEmail,
    recoveryMsg, setRecoveryMsg,

    // Register
    isRegistering, setIsRegistering,
    registerForm, setRegisterForm,
    isRegisterLoading, setIsRegisterLoading,
    registerSuccessMsg, setRegisterSuccessMsg,
    registerVerificationLink, setRegisterVerificationLink,

    // Search and filter
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sellerFilter, setSellerFilter,

    // Auto-generate sellers
    isAutoGeneratingSellers, setIsAutoGeneratingSellers,
    autoGenSellersMsg, setAutoGenSellersMsg,
    autoGenRangeSize, setAutoGenRangeSize,

    // Operations
    fetchInitialData,
    fetchStats,
    handleLoginSubmit,
    handleLogout,
    handleRegisterSubmit,
    handlePasswordRecovery,
    handleCreateSellerSubmit,
    handleBlockSeller,
    handleDeleteSeller,
    handleRegisterSaleSubmit,
    handleBuyerCheckoutSubmit,
    handleMarkAnnouncementAsRead,
    handleUpdateSaleStatus,
    handleConfigUpdate,
    handleRaffleUpdate,
    handleLaunchRaffle,
    handleAutoGenerateSellers,

    // Helper / Derived states
    sellerObj,
    sellerRange,
    buyerSellerObj,
    buyerRange,
    filteredSales,
  };
}
