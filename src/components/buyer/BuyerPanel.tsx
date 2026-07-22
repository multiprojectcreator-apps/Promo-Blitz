/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, CheckCircle2, Ticket, Sparkles, Flame, RefreshCw, Clock, Gift, Award, Smartphone, Megaphone, ExternalLink, HelpCircle, AlertTriangle, ShieldAlert, Search, Download, Share2, Check, X } from 'lucide-react';
import { Sale, Raffle, Seller, Announcement, AppConfig, formatPrice } from '../../types';
import BuyerTour from './BuyerTour';

// In-memory flag instead of localStorage to ensure 100% online state without local footprint
let globalTourCompleted = false;

interface BuyerPanelProps {
  activeRaffle: Raffle | null;
  sales: Sale[];
  selectedTickets: number[];
  setSelectedTickets: (t: number[]) => void;
  buyerSellerObj: Seller | undefined;
  sellers: Seller[];
  selectedSellerForBuyerMode: string;
  setSelectedSellerForBuyerMode: (s: string) => void;
  buyerError: string;
  buyerSuccessMsg: string;
  buyerForm: {
    buyerName: string;
    phone: string;
    email: string;
    city: string;
    notes: string;
  };
  setBuyerForm: (f: any) => void;
  handleBuyerCheckoutSubmit: (e: React.FormEvent) => void;
  setBuyerMessageModal: (m: any) => void;
  setIsBuyerRegisterModalOpen: (b: boolean) => void;
  announcements?: Announcement[];
  config: AppConfig | null;
  onOpenLegalModal?: (tab: 'terms' | 'privacy' | 'rules') => void;
}

const generateTicketSVG = (ticketNum: number, sale: Sale, raffleName: string, rafflePrize: string, currency?: string, ticketPrice?: number) => {
  const refCode = `REF-${sale.id.substring(0, 8).toUpperCase()}`;
  const priceText = formatPrice(ticketPrice || 10, currency);
  const isPaid = sale.status === 'PAID' || sale.status === 'SOLD';
  
  // Status-specific styles
  const statusColor = isPaid ? '#10b981' : '#f59e0b';
  const statusDot = isPaid ? '#34d399' : '#fbbf24';
  const statusText = isPaid ? 'SOPORTE DE RESERVA CONFIRMADO Y VALIDADO' : 'RESERVA TEMPORAL - PENDIENTE DE CONFIRMACIÓN';
  const badgeText = isPaid ? 'CONFIRMADO' : 'RESERVA TEMPORAL';
  const badgeTextColor = isPaid ? '#a7f3d0' : '#fef3c7';

  return `
<svg width="600" height="310" viewBox="0 0 600 310" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&amp;display=swap');
      text {
        font-family: 'Inter', -apple-system, sans-serif;
      }
    </style>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d946ef;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
    <clipPath id="ticketClip">
      <rect x="0" y="0" width="600" height="310" rx="24" />
    </clipPath>
  </defs>
  
  <g clip-path="url(#ticketClip)">
    <rect width="600" height="310" fill="url(#grad)" />
    
    <circle cx="50" cy="50" r="120" fill="white" fill-opacity="0.03" />
    <circle cx="550" cy="260" r="100" fill="white" fill-opacity="0.04" />
    
    <circle cx="0" cy="155" r="18" fill="#0b0625" />
    <circle cx="600" cy="155" r="18" fill="#0b0625" />
    
    <line x1="430" y1="0" x2="430" y2="310" stroke="#ffffff" stroke-dasharray="8 6" stroke-opacity="0.3" stroke-width="2" />
    
    <rect x="35" y="25" width="120" height="20" rx="6" fill="white" fill-opacity="0.2" />
    <text x="95" y="38" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">BOLETO OFICIAL</text>
    
    <rect x="270" y="25" width="135" height="20" rx="6" fill="${statusColor}" fill-opacity="0.25" stroke="${statusColor}" stroke-opacity="0.5" stroke-width="1" />
    <text x="337" y="38" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="900" fill="${badgeTextColor}" text-anchor="middle" letter-spacing="1">${badgeText}</text>
    
    <text x="170" y="38" font-family="monospace" font-size="11" font-weight="700" fill="#f5f3ff" fill-opacity="0.8">${refCode}</text>
    
    <text x="35" y="85" font-family="'Inter', -apple-system, sans-serif" font-size="18" font-weight="900" fill="#ffffff">${raffleName}</text>
    <text x="35" y="108" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="500" fill="#f5f3ff" fill-opacity="0.9">Premio: ${rafflePrize}</text>
    
    <text x="35" y="160" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="700" fill="#e9d5ff" letter-spacing="1">TITULAR</text>
    <text x="35" y="180" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#ffffff">${sale.buyerName}</text>
    
    <text x="210" y="160" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="700" fill="#e9d5ff" letter-spacing="1">CIUDAD</text>
    <text x="210" y="180" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#ffffff">${sale.city || 'N/A'}</text>
    
    <text x="330" y="160" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="700" fill="#e9d5ff" letter-spacing="1">TELÉFONO</text>
    <text x="330" y="180" font-family="monospace" font-size="11" font-weight="700" fill="#ffffff">${sale.phone}</text>
    
    <rect x="35" y="210" width="360" height="34" rx="8" fill="${statusColor}" fill-opacity="0.2" stroke="${statusColor}" stroke-opacity="0.4" stroke-width="1" />
    <circle cx="50" cy="227" r="4" fill="${statusDot}" />
    <text x="62" y="231" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="800" fill="${statusDot}" letter-spacing="0.5">${statusText}</text>
    
    <text x="515" y="75" font-family="'Inter', -apple-system, sans-serif" font-size="8" font-weight="800" fill="#e9d5ff" text-anchor="middle" letter-spacing="1">NÚMERO</text>
    
    <rect x="460" y="90" width="110" height="60" rx="12" fill="#0f172a" fill-opacity="0.4" />
    <text x="515" y="132" font-family="monospace" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle">#${ticketNum}</text>
    
    <rect x="465" y="170" width="100" height="24" rx="8" fill="#ffffff" />
    <text x="515" y="186" font-family="'Inter', -apple-system, sans-serif" font-size="10" font-weight="900" fill="#7c3aed" text-anchor="middle">${priceText}</text>
    
    <text x="515" y="245" font-family="monospace" font-size="8" fill="#f5f3ff" fill-opacity="0.7" text-anchor="middle">REG: ${sale.date}</text>
    <text x="515" y="258" font-family="monospace" font-size="8" fill="#f5f3ff" fill-opacity="0.7" text-anchor="middle">${sale.time}</text>
  </g>
</svg>
`;
};

export default function BuyerPanel({
  activeRaffle,
  sales,
  selectedTickets,
  setSelectedTickets,
  buyerSellerObj,
  sellers,
  selectedSellerForBuyerMode,
  setSelectedSellerForBuyerMode,
  buyerError,
  buyerSuccessMsg,
  buyerForm,
  setBuyerForm,
  handleBuyerCheckoutSubmit,
  setBuyerMessageModal,
  setIsBuyerRegisterModalOpen,
  announcements = [],
  config,
  onOpenLegalModal,
}: BuyerPanelProps) {
  const isSalesClosed = (activeRaffle?.salesCutoffDate && activeRaffle?.salesCutoffTime
    ? new Date() > new Date(`${activeRaffle.salesCutoffDate}T${activeRaffle.salesCutoffTime}`)
    : false) || activeRaffle?.salesEnabled === false;

  const buyerRange = buyerSellerObj ? { start: buyerSellerObj.assignedRangeStart, end: buyerSellerObj.assignedRangeEnd } : { start: 1, end: activeRaffle?.totalNumbers || 100 };

  // --- NEW FEATURES STATES & EFFECTS ---
  const [ticketFilter, setTicketFilter] = useState<'all' | 'available' | 'reserved'>('all');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  // Terms and Age confirmation checkboxes
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isAdult, setIsAdult] = useState(false);

  // Responsive device orientation/viewport check
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Auto-reset checkboxes when selected ticket changes or is empty
  useEffect(() => {
    if (selectedTickets.length === 0) {
      setAcceptedTerms(false);
      setIsAdult(false);
    }
  }, [selectedTickets]);
  
  // Guided Onboarding Tour
  const [isTourActive, setIsTourActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Active announcement modal state
  const [activeBuyerPromoModal, setActiveBuyerPromoModal] = useState<Announcement | null>(null);

  // Floating advertisement state
  const [isFloatMinimized, setIsFloatMinimized] = useState(false);
  const [closedFloatAnnIds, setClosedFloatAnnIds] = useState<string[]>([]);

  // Check if we have an active COMPRADOR_MODAL announcement that hasn't been closed in this session
  useEffect(() => {
    const activeModals = (announcements || []).filter(
      a => {
        const isCorrect = a.status === 'ACTIVE' && a.placement === 'COMPRADOR_MODAL';
        if (!isCorrect) return false;
        if (!a.deviceTarget || a.deviceTarget === 'ALL') return true;
        if (a.deviceTarget === 'DESKTOP') return window.innerWidth >= 768;
        if (a.deviceTarget === 'MOBILE') return window.innerWidth < 768;
        return true;
      }
    );

    if (activeModals.length > 0) {
      const mostRecent = activeModals[0];
      const closedKey = `closed-promo-modal-${mostRecent.id}`;
      const isClosed = sessionStorage.getItem(closedKey);
      if (!isClosed) {
        setActiveBuyerPromoModal(mostRecent);
      }
    }
  }, [announcements]);

  // Lookup of acquired/reserved tickets states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [foundSales, setFoundSales] = useState<Sale[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const normalizePhone = (p: string) => p.replace(/\D/g, '');

  const handleTicketSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const queryNorm = searchQuery.trim().toLowerCase();
    const queryDigits = normalizePhone(queryNorm);
    
    const results = sales.filter(s => {
      if (s.raffleId !== activeRaffle?.id) return false;
      
      const emailMatch = s.email?.toLowerCase().includes(queryNorm);
      const nameMatch = s.buyerName?.toLowerCase().includes(queryNorm);
      
      let phoneMatch = false;
      if (queryDigits && s.phone) {
        const salePhoneDigits = normalizePhone(s.phone);
        phoneMatch = salePhoneDigits.includes(queryDigits) || queryDigits.includes(salePhoneDigits);
      }
      
      return emailMatch || nameMatch || phoneMatch;
    });
    
    setFoundSales(results);
    setSearchSubmitted(true);
  };

  const downloadTicket = (sale: Sale, format: 'svg' | 'png' = 'png') => {
    if (!activeRaffle) return;
    setToastMsg(`Generando boleto #${sale.ticketNumber} en formato ${format.toUpperCase()}...`);
    const svgString = generateTicketSVG(
      sale.ticketNumber, 
      sale, 
      activeRaffle.name, 
      activeRaffle.prize, 
      config?.currency,
      activeRaffle.ticketPrice
    );
    
    if (format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleto_${sale.status === 'PAID' ? 'confirmado' : 'reservado'}_${sale.ticketNumber}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToastMsg(`¡Boleto #${sale.ticketNumber}.SVG descargado con éxito! 🍀`);
    } else {
      // Create SVG to PNG conversion via canvas
      const img = new Image();
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; // high quality double resolution (SVG is 600x310)
        canvas.height = 620;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0b0625'; // Background match
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, 1200, 620);
          
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              const pngUrl = URL.createObjectURL(pngBlob);
              const link = document.createElement('a');
              link.href = pngUrl;
              link.download = `boleto_${sale.status === 'PAID' ? 'confirmado' : 'reservado'}_${sale.ticketNumber}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);
              setToastMsg(`¡Boleto #${sale.ticketNumber}.PNG descargado con éxito! 🍀`);
            }
          }, 'image/png');
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const handlePreCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTickets.length === 0) return;
    setShowConfirmModal(true);
  };

  useEffect(() => {
    if (!globalTourCompleted) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseTour = () => {
    setIsTourActive(false);
    globalTourCompleted = true;
  };

  // Countdown timer effect
  useEffect(() => {
    if (!activeRaffle?.salesCutoffDate || !activeRaffle?.salesCutoffTime) return;
    const target = new Date(`${activeRaffle.salesCutoffDate}T${activeRaffle.salesCutoffTime}`);
    
    const calculateTime = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [activeRaffle]);

  // Handle Quick Lucky Picks
  const handleQuickLuckyPick = (count: number) => {
    // Find all numbers within active raffle range that are assigned to a registered seller and NOT sold
    const availableNumbers: number[] = [];
    for (let num = 1; num <= (activeRaffle?.totalNumbers || 100); num++) {
      const assignedSeller = sellers.find(s => num >= s.assignedRangeStart && num <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '');
      if (assignedSeller) {
        const sale = sales.find(s => s.raffleId === activeRaffle?.id && s.ticketNumber === num);
        if (!sale) {
          // If the user has a preferred seller selected, let's filter by that seller's range
          if (!selectedSellerForBuyerMode || assignedSeller.id === selectedSellerForBuyerMode) {
            availableNumbers.push(num);
          }
        }
      }
    }

    if (availableNumbers.length === 0) {
      alert("No hay boletos disponibles en el rango del asesor seleccionado.");
      return;
    }

    // Shuffle and pick count numbers
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));
    
    setSelectedTickets(picked);
    
    // Auto-update recognized seller for selected tickets
    const firstNum = picked[0];
    const assignedSeller = sellers.find(s => firstNum >= s.assignedRangeStart && firstNum <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '');
    if (assignedSeller) {
      setSelectedSellerForBuyerMode(assignedSeller.id);
    }

    setIsBuyerRegisterModalOpen(true);
  };

  // Get filtered tickets list
  const getFilteredTickets = () => {
    const list: { num: number; isUnassigned: boolean; sale: any; isSelected: boolean; assignedSeller: any }[] = [];
    for (let num = 1; num <= (activeRaffle?.totalNumbers || 100); num++) {
      const assignedSeller = sellers.find(s => num >= s.assignedRangeStart && num <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '');
      const isUnassigned = !assignedSeller;
      const sale = sales.find(s => s.raffleId === activeRaffle?.id && s.ticketNumber === num);
      const isSelected = selectedTickets.includes(num);

      // If an advisor is selected, filter by that advisor's assigned numbers
      if (selectedSellerForBuyerMode) {
        if (!assignedSeller || assignedSeller.id !== selectedSellerForBuyerMode) {
          continue;
        }
      }

      let include = false;
      if (ticketFilter === 'all') {
        include = true;
      } else if (ticketFilter === 'available') {
        include = !isUnassigned && !sale;
      } else if (ticketFilter === 'reserved') {
        include = !isUnassigned && sale !== undefined;
      }

      if (include) {
        list.push({ num, isUnassigned, sale, isSelected, assignedSeller });
      }
    }
    return list;
  };

  const filteredTickets = getFilteredTickets();

  const selectedSeller = selectedSellerForBuyerMode ? sellers.find(s => s.id === selectedSellerForBuyerMode) : null;
  const totalCountToShow = selectedSeller
    ? Math.max(0, selectedSeller.assignedRangeEnd - selectedSeller.assignedRangeStart + 1)
    : (activeRaffle?.totalNumbers || 100);

  const buyerHeroAnns = (announcements || []).filter(
    a => {
      const isCorrect = a.status === 'ACTIVE' && a.placement === 'COMPRADOR_HERO';
      if (!isCorrect) return false;
      if (!a.deviceTarget || a.deviceTarget === 'ALL') return true;
      if (a.deviceTarget === 'DESKTOP') return !isMobileDevice;
      if (a.deviceTarget === 'MOBILE') return isMobileDevice;
      return true;
    }
  );

  const buyerSidebarAnns = (announcements || []).filter(
    a => {
      const isCorrect = a.status === 'ACTIVE' && a.placement === 'COMPRADOR_SIDEBAR';
      if (!isCorrect) return false;
      if (!a.deviceTarget || a.deviceTarget === 'ALL') return true;
      if (a.deviceTarget === 'DESKTOP') return !isMobileDevice;
      if (a.deviceTarget === 'MOBILE') return isMobileDevice;
      return true;
    }
  );

  const buyerFooterAnns = (announcements || []).filter(
    a => {
      const isCorrect = a.status === 'ACTIVE' && a.placement === 'COMPRADOR_FOOTER';
      if (!isCorrect) return false;
      if (!a.deviceTarget || a.deviceTarget === 'ALL') return true;
      if (a.deviceTarget === 'DESKTOP') return !isMobileDevice;
      if (a.deviceTarget === 'MOBILE') return isMobileDevice;
      return true;
    }
  );

  const buyerFloatAnns = (announcements || []).filter(
    a => {
      const isCorrect = a.status === 'ACTIVE' && a.placement === 'COMPRADOR_FLOAT';
      if (!isCorrect) return false;
      if (!a.deviceTarget || a.deviceTarget === 'ALL') return true;
      if (a.deviceTarget === 'DESKTOP') return !isMobileDevice;
      if (a.deviceTarget === 'MOBILE') return isMobileDevice;
      return true;
    }
  );

  const activeFloatAnns = buyerFloatAnns.filter(a => !closedFloatAnnIds.includes(a.id));
  const activeFloat = activeFloatAnns[0];

  return (
    <motion.div 
      id="buyer-panel-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto space-y-6 px-1 relative"
    >
      {/* Toast Notification for premium feedback */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-24 right-4 z-50 bg-[#0c0728]/95 border border-purple-500/40 text-purple-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-semibold leading-tight font-sans">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Buyer Hero Banners */}
      {buyerHeroAnns.length > 0 && (
        <div className="space-y-4" id="buyer-hero-promotions">
          {buyerHeroAnns.map((ann) => (
            <div 
              key={ann.id}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-fuchsia-950 to-pink-950 text-white p-6 md:p-8 border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
              {ann.imageUrl && (
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-20 md:opacity-30 pointer-events-none">
                  <img 
                    src={ann.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-transparent to-transparent"></div>
                </div>
              )}
              <div className="relative z-10 max-w-2xl space-y-2">
                <span className="inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] px-3.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  <Megaphone className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  Aviso de la Organización
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white leading-tight">
                  {ann.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-sans">
                  {ann.content}
                </p>
              </div>

              {ann.ctaText && ann.ctaUrl && (
                <div className="relative z-10 shrink-0">
                  <a 
                    href={ann.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-xs font-black rounded-2xl shadow-lg shadow-pink-500/20 transition duration-300 hover:scale-105"
                  >
                    <span>{ann.ctaText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Banner with visual Countdown */}
      <div className="p-6 bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 text-white border border-purple-900/30 text-center relative overflow-hidden shadow-xl rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_60%)]"></div>
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center gap-2 relative z-10">
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider">
            SISTEMA DE SOLICITUD CERTIFICADO QR
          </span>

          {/* New Countdown Component */}
          {isSalesClosed ? (
            <div className="mt-3">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] px-4 py-1 rounded-full font-bold">
                {activeRaffle?.salesEnabled === false ? '⏸️ REGISTROS PAUSADOS POR EL ORGANIZADOR' : '🚨 REGISTROS TOTALMENTE CERRADOS'}
              </span>
            </div>
          ) : (activeRaffle?.salesCutoffDate && activeRaffle?.salesCutoffTime && (
            <div className="mt-3">
              {timeLeft ? (
                <div className="flex items-center gap-2.5 bg-slate-900/80 border border-purple-950/60 px-4 py-2 rounded-2xl shadow-lg">
                  <Clock size={14} className="text-pink-400 animate-pulse" />
                  <span className="text-[11px] text-purple-300 font-medium">El juego cierra en:</span>
                  <div className="flex gap-1.5 font-mono text-xs font-black text-white">
                    <span className="bg-[#050212] px-1.5 py-0.5 rounded text-pink-400 border border-purple-950/40">{timeLeft.days}d</span>
                    <span>:</span>
                    <span className="bg-[#050212] px-1.5 py-0.5 rounded text-pink-400 border border-purple-950/40">{timeLeft.hours}h</span>
                    <span>:</span>
                    <span className="bg-[#050212] px-1.5 py-0.5 rounded text-pink-400 border border-purple-950/40">{timeLeft.minutes}m</span>
                    <span>:</span>
                    <span className="bg-[#050212] px-1.5 py-0.5 rounded text-pink-400 border border-purple-950/40">{timeLeft.seconds}s</span>
                  </div>
                </div>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold animate-pulse">
                  ⏳ Cierre de registros inminente hoy
                </span>
              )}
            </div>
          ))}
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black font-display text-white mt-5 tracking-tight flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>Elige tus Números de la Suerte 🍀</span>
          <button
            type="button"
            onClick={() => setIsTourActive(true)}
            className="inline-flex items-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-300 transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            <HelpCircle size={13} className="text-pink-400" />
            <span>Ver Guía Interactiva</span>
          </button>
        </h2>
        
        <p className="text-xs text-purple-200/80 mt-2.5 max-w-xl mx-auto leading-relaxed">
          {isSalesClosed ? (
            activeRaffle?.salesEnabled === false ? (
              <span className="text-rose-400 font-bold">Las solicitudes y reservas de boletos han sido suspendidas temporalmente por el organizador. Por favor, consulte con su asesor asignado.</span>
            ) : (
              <span className="text-rose-400 font-bold">El tiempo preestablecido para la solicitud de boletos ha concluido. El organizador ha cerrado la recepción de reservas para preparar el sorteo.</span>
            )
          ) : (
            <>
              ¡Participa ahora en nuestro sorteo transparente! Selecciona tus números directamente de la cuadrícula o utiliza el <strong>Generador de la Suerte</strong> para una elección rápida. Reserva tu boleto hoy y asegura tu oportunidad.
            </>
          )}
        </p>

        {/* Vendedor asignado o selector si es público */}
        {!window.location.search.includes('vendedor') && sellers.some(s => s.userId && s.userId.trim() !== '') && (
          <div id="tour-step-advisor" className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-2 text-xs bg-[#050212]/40 px-4 py-2.5 rounded-2xl border border-purple-950/40 inline-flex relative z-10 w-full sm:w-auto">
            <span className="text-purple-300 font-medium text-center">Reserva con tu Asesor Favorito:</span>
            <select 
              value={selectedSellerForBuyerMode}
              onChange={(e) => setSelectedSellerForBuyerMode(e.target.value)}
              className="bg-[#0c0728] border border-purple-900/40 rounded-xl px-2.5 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-inner font-sans font-semibold cursor-pointer w-full sm:w-auto text-center sm:text-left"
            >
              <option value="" className="bg-[#050212] text-white">Todos los Números</option>
              {sellers.filter(s => s.userId && s.userId.trim() !== '').map((s, index) => (
                <option key={`${s.id}-${index}`} value={s.id} className="bg-[#050212] text-white">{s.name} (Rango {s.assignedRangeStart}-{s.assignedRangeEnd})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Core selection body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tickets Selection Grid with Custom Filter and Lucky Picker */}
        <div className="p-6 lg:col-span-2 bg-[#0b0625] shadow-xl border border-purple-900/40 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-purple-950/60 pb-4">
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-1.5">
                <Gift size={16} className="text-pink-500" />
                Cuadrícula interactiva de Boletos
              </h3>
              <p className="text-[11px] text-purple-300/80 mt-0.5">Explora y selecciona tus números ganadores</p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold font-mono">
                {selectedTickets.length} Seleccionados
              </span>
            </div>
          </div>

          {/* Quick Lucky Picks Tool Header */}
          {!isSalesClosed && activeRaffle?.status !== 'DRAFT' && (
            <div id="tour-step-luckypick" className="bg-gradient-to-r from-purple-950/50 to-pink-950/50 border border-purple-900/30 p-4 rounded-2xl mb-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-pink-400 animate-pulse" />
                <span className="text-xs font-bold text-white">¿Indeciso? ¡Usa el Generador de la Suerte!</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLuckyPick(1)}
                  className="bg-[#050212]/50 hover:bg-purple-900/30 text-purple-300 border border-purple-950 hover:border-purple-500 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  🎰 Generar 1 Al Azar
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLuckyPick(3)}
                  className="bg-[#050212]/50 hover:bg-purple-900/30 text-purple-300 border border-purple-950 hover:border-purple-500 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  🎯 Generar 3 Al Azar
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLuckyPick(5)}
                  className="bg-[#050212]/50 hover:bg-purple-900/30 text-purple-300 border border-purple-950 hover:border-purple-500 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  🔥 Generar 5 Al Azar
                </button>
              </div>
            </div>
          )}

          {/* Tab Filters */}
          <div id="tour-step-filters" className="flex gap-1 bg-[#050212]/50 border border-purple-950/60 p-1 rounded-xl mb-4 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setTicketFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 flex-1 ${
                ticketFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Todos ({totalCountToShow})
            </button>
            <button
              type="button"
              onClick={() => setTicketFilter('available')}
              className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 flex-1 ${
                ticketFilter === 'available'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Disponibles
            </button>
            <button
              type="button"
              onClick={() => setTicketFilter('reserved')}
              className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 flex-1 ${
                ticketFilter === 'reserved'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Reservados
            </button>
          </div>

          {/* Range Tickets Grid for Comprador */}
          <div id="tour-step-grid" className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-[340px] overflow-y-auto pr-2 border border-purple-950/30 p-1 rounded-2xl bg-[#050212]/30">
            {filteredTickets.map(({ num, isUnassigned, sale, isSelected, assignedSeller }) => {
              let btnClass = "";
              if (isUnassigned) {
                btnClass = "bg-slate-950/40 text-slate-500 border border-slate-900/50 border-dashed cursor-not-allowed opacity-40";
              } else if (sale) {
                if (sale.status === 'PAID') {
                  btnClass = "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 hover:scale-105 shadow-xs";
                } else if (sale.status === 'RESERVED') {
                  btnClass = "bg-amber-500/10 text-amber-300 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 hover:scale-105 shadow-xs";
                } else {
                  btnClass = "bg-slate-900/50 text-slate-400 border border-slate-800 cursor-pointer hover:scale-105";
                }
              } else if (isSelected) {
                btnClass = "bg-purple-600 text-white font-black border border-purple-500 transform scale-110 shadow-lg shadow-purple-500/20 cursor-pointer animate-pulse";
              } else {
                btnClass = "bg-[#0c0728] hover:bg-purple-950/40 text-purple-200 border border-purple-950 cursor-pointer hover:scale-105 hover:border-purple-500 shadow-sm";
              }

              return (
                <button
                  key={num}
                  type="button"
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 40px' }}
                  onClick={() => {
                    if (isUnassigned) {
                      setBuyerMessageModal({
                        title: 'Número No Asignado',
                        message: `El número #${num} no ha sido asignado a ningún colaborador en este sorteo aún. Por favor, selecciona un número disponible de los rangos de nuestros colaboradores autorizados.`,
                        type: 'error',
                        ticketNumber: num
                      });
                      return;
                    }
                    if (sale) {
                      if (sale.status === 'RESERVED') {
                        setBuyerMessageModal({
                          title: 'Ticket Reservado Temporalmente',
                          message: `El Ticket #${num} se encuentra RESERVADO de forma temporal. Las reservas tienen un límite ineludible de 3 horas para reportar el pago y confirmación al asesor autorizado.`,
                          type: 'reserved',
                          ticketNumber: num
                        });
                      } else if (sale.status === 'PAID') {
                        setBuyerMessageModal({
                          title: 'Ticket Confirmado y Validado',
                          message: `El Ticket #${num} ya ha sido verificado y confirmado. Este número ya está asignado de forma definitiva. ¡Te invitamos a elegir otro fabuloso número disponible!`,
                          type: 'paid',
                          ticketNumber: num
                        });
                      }
                    } else {
                      if (activeRaffle?.status === 'DRAFT') {
                        setBuyerMessageModal({
                          title: 'Sorteo en Modo Borrador',
                          message: 'Este sorteo aún se encuentra en fase de diseño y configuración (Borrador). Las reservas de boletos están deshabilitadas hasta que el organizador realice el lanzamiento oficial (Lanzar Juego).',
                          type: 'error',
                          ticketNumber: num
                        });
                        return;
                      }
                      if (isSalesClosed) {
                        const isPaused = activeRaffle?.salesEnabled === false;
                        setBuyerMessageModal({
                          title: isPaused ? 'Registros Suspendidos' : 'Registros Cerrados',
                          message: isPaused 
                            ? 'El registro de boletos se encuentra temporalmente suspendido o deshabilitado por el organizador.' 
                            : 'El período de reservas de boletos para este sorteo ha finalizado por límite de tiempo. No se permiten nuevas reservas.',
                          type: 'error',
                          ticketNumber: num
                        });
                        return;
                      }
                      if (isSelected) {
                        const newSelected = selectedTickets.filter(t => t !== num);
                        setSelectedTickets(newSelected);
                        if (newSelected.length === 0) {
                          setSelectedSellerForBuyerMode('');
                        }
                      } else {
                        // Check if we already have selected tickets and if the new ticket belongs to the same seller
                        if (selectedTickets.length > 0) {
                          const firstSelected = selectedTickets[0];
                          const firstSelectedAdvisor = sellers.find(s => firstSelected >= s.assignedRangeStart && firstSelected <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '');
                          if (firstSelectedAdvisor && assignedSeller && firstSelectedAdvisor.id !== assignedSeller.id) {
                            setBuyerMessageModal({
                              title: 'Asesor Diferente',
                              message: `Cada comprador podrá reservar boletos de un solo asesor en una misma transacción. El número #${num} está asignado al asesor "${assignedSeller.name}". Tus boletos seleccionados actualmente están bajo la asesoría de "${firstSelectedAdvisor.name}". Si deseas reservar de este asesor, por favor hazlo de manera independiente completando o cancelando tu solicitud actual.`,
                              type: 'error',
                              ticketNumber: num
                            });
                            return;
                          }
                        }
                        setSelectedTickets([...selectedTickets, num]);
                        if (assignedSeller) {
                          setSelectedSellerForBuyerMode(assignedSeller.id);
                        }
                      }
                    }
                  }}
                  className={`p-2.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${btnClass}`}
                >
                  {num}
                </button>
              );
            })}
            {filteredTickets.length === 0 && (
              <div className="col-span-full py-8 text-center text-purple-300/40 italic">
                No hay boletos con esta clasificación en el sorteo activo.
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] text-purple-300/50 mt-5 justify-center border-t border-purple-950/60 pt-4">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#0c0728] rounded-lg border border-purple-950 shadow-xs"></span> Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-purple-600 rounded-lg shadow-sm"></span> Seleccionado</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-amber-500/15 border border-amber-500/25 rounded-lg"></span> Reservado</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-500/15 border border-emerald-500/25 rounded-lg"></span> Confirmado</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-950/40 border border-slate-900/50 border-dashed rounded-lg"></span> Sin distribuir</span>
          </div>

          {selectedTickets.length > 0 && (
            <div className="mt-5 lg:hidden flex justify-center">
              <button
                type="button"
                onClick={() => setIsBuyerRegisterModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-2xl text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 animate-pulse cursor-pointer"
              >
                <Ticket size={16} />
                Completar Reserva ({selectedTickets.length} {selectedTickets.length === 1 ? 'boleto' : 'boletos'})
              </button>
            </div>
          )}
        </div>

        {/* Reservation checkout form & Virtual Mockup Ticket Preview */}
        <div className="hidden lg:block space-y-6">
          <div id="tour-step-form" className="p-6 bg-[#0b0625] shadow-xl border border-purple-900/40 rounded-3xl">
            <h3 className="text-sm font-bold font-display text-white mb-4 border-b border-purple-950/60 pb-3 flex items-center gap-1.5">
              <Smartphone size={15} className="text-pink-500" />
              Consolidar Solicitud
            </h3>

            {buyerError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl text-xs mb-3">
                {buyerError}
              </div>
            )}

            {buyerSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs mb-3 flex items-start gap-1.5 shadow-sm">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                <p>{buyerSuccessMsg}</p>
              </div>
            )}

            {activeRaffle?.status === 'DRAFT' ? (
              <div className="p-4 bg-amber-950/40 border border-amber-900/30 text-amber-200 rounded-2xl text-xs space-y-2">
                <p className="font-bold">⚠️ Sorteo en Modo Borrador</p>
                <p className="text-amber-200/80 leading-relaxed font-sans">
                  Este sorteo se encuentra en fase de diseño y configuración (Borrador). Los solicitantes pueden visualizar los números distribuidos por el organizador, pero las reservas y el registro de boletos están deshabilitados hasta el lanzamiento oficial del sorteo por parte del organizador (Lanzar Juego).
                </p>
              </div>
            ) : isSalesClosed ? (
              <div className="p-4 bg-rose-950/40 border border-rose-900/30 text-rose-300 rounded-2xl text-xs space-y-2">
                {activeRaffle?.salesEnabled === false ? (
                  <>
                    <p className="font-bold">⏸️ Registros Suspendidos</p>
                    <p className="text-rose-300/80 leading-relaxed font-sans">
                      El organizador ha pausado o deshabilitado temporalmente el registro y reserva de boletos para este sorteo. Vuelve a consultar más tarde para ver si se habilitan de nuevo.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">🚨 Sorteo Finalizado / Registros Finalizados</p>
                    <p className="text-rose-300/80 leading-relaxed font-sans">
                      El período de reserva de boletos ha expirado. Todos los números reservados que no hayan sido confirmados han sido liberados por el sistema, permitiendo al organizador visualizar únicamente los números realmente confirmados.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handlePreCheckoutSubmit} className="space-y-4">
                <div>
                  <p className="text-[11px] text-purple-300 mb-1">Ticket elegido:</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedTickets.map(n => (
                      <span key={n} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs">
                        #{n}
                      </span>
                    ))}
                    {selectedTickets.length === 0 && (
                      <span className="text-[10px] text-rose-400 font-semibold italic">Ningún número seleccionado</span>
                    )}
                  </div>
                </div>

                {/* Automatic Seller Recognition Card */}
                {selectedTickets.length > 0 && (
                  <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-900/30 flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Colaborador Reconocido Automáticamente</span>
                    {(() => {
                      const selectedTicketNum = selectedTickets[0];
                      const recognizedSeller = sellers.find(s => selectedTicketNum >= s.assignedRangeStart && selectedTicketNum <= s.assignedRangeEnd && s.userId && s.userId.trim() !== '');
                      if (recognizedSeller) {
                        return (
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs font-bold text-white">{recognizedSeller.name}</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold font-sans">
                              Rango {recognizedSeller.assignedRangeStart} - {recognizedSeller.assignedRangeEnd}
                            </span>
                          </div>
                        );
                      } else {
                        return <span className="text-xs text-rose-400 font-semibold">Ningún colaborador asignado a este rango</span>;
                      }
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ej. Carlos Pérez"
                    value={buyerForm.buyerName}
                    onChange={(e) => setBuyerForm({ ...buyerForm, buyerName: e.target.value })}
                    className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">Teléfono (WhatsApp)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ej. +34 600 111 222"
                    value={buyerForm.phone}
                    onChange={(e) => setBuyerForm({ ...buyerForm, phone: e.target.value })}
                    className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    required
                    placeholder="ej. carlos@gmail.com"
                    value={buyerForm.email}
                    onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
                    className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">Ciudad de Origen</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ej. Madrid"
                    value={buyerForm.city}
                    onChange={(e) => setBuyerForm({ ...buyerForm, city: e.target.value })}
                    className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Checkboxes de Cumplimiento Legal */}
                <div className="space-y-3 pt-3 border-t border-purple-950/40">
                  <label className="flex items-start gap-2.5 cursor-pointer group text-left">
                    <input 
                      type="checkbox"
                      checked={isAdult}
                      onChange={(e) => setIsAdult(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-purple-500/30 text-pink-600 bg-slate-950/50 focus:ring-pink-500/50 cursor-pointer accent-pink-600"
                    />
                    <span className="text-[11px] text-purple-200/90 leading-tight font-sans select-none group-hover:text-white transition">
                      Confirmo y declaro bajo juramento que soy <strong>mayor de edad (18+ años)</strong> y tengo capacidad legal para participar en este sorteo.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer group text-left">
                    <input 
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-purple-500/30 text-pink-600 bg-slate-950/50 focus:ring-pink-500/50 cursor-pointer accent-pink-600"
                    />
                    <span className="text-[11px] text-purple-200/90 leading-tight font-sans select-none group-hover:text-white transition">
                      He leído y acepto los <button type="button" onClick={() => onOpenLegalModal?.('terms')} className="text-pink-400 font-bold hover:underline hover:text-pink-300 inline cursor-pointer">Términos de Servicio</button>, la <button type="button" onClick={() => onOpenLegalModal?.('privacy')} className="text-pink-400 font-bold hover:underline hover:text-pink-300 inline cursor-pointer">Política de Privacidad (RGPD)</button> y el <button type="button" onClick={() => onOpenLegalModal?.('rules')} className="text-pink-400 font-bold hover:underline hover:text-pink-300 inline cursor-pointer">Reglamento del Sorteo</button>.
                    </span>
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={selectedTickets.length === 0 || !acceptedTerms || !isAdult}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-purple-500/10 transition disabled:opacity-40 disabled:from-slate-800 disabled:to-slate-900 disabled:text-purple-300/40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {selectedTickets.length === 0 
                    ? "Selecciona un boleto para reservar" 
                    : (!isAdult || !acceptedTerms) 
                      ? "Confirma edad y términos para continuar" 
                      : "Reservar Tickets Seleccionados"}
                </button>
              </form>
            )}
          </div>

          {/* New Digital Ticket Preview (Live Mockup) */}
          <div id="tour-step-preview" className="p-6 bg-[#0b0625] shadow-xl border border-purple-900/40 rounded-3xl">
            <h3 className="text-sm font-bold font-display text-white mb-3 flex items-center gap-1.5">
              <Award size={15} className="text-pink-500" />
              Vista Previa de tu Boleto Digital
            </h3>
            <p className="text-[11px] text-purple-300/80 mb-4 leading-normal">
              Esta es una representación en tiempo real de cómo lucirá tu boleto registrado en los sistemas oficiales del sorteo.
            </p>

            {/* Ticket Mockup Layout */}
            <div className="relative bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-600 rounded-2xl p-4 text-white font-sans overflow-hidden border border-purple-500 shadow-xl min-h-[140px] flex flex-col justify-between">
              {/* Circular cuts on the left and right sides - colored bg-[#0b0625] to merge with dark card background */}
              <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-[#0b0625] rounded-full -translate-y-1/2 shadow-inner z-10"></div>
              <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-[#0b0625] rounded-full -translate-y-1/2 shadow-inner z-10"></div>
              {/* Dash boundary line separator */}
              <div className="absolute top-0 bottom-0 left-[72%] w-0 border-r border-dashed border-white/20"></div>

              <div className="flex justify-between h-full relative z-20">
                {/* Left side ticket content */}
                <div className="w-[68%] flex flex-col justify-between space-y-3 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase bg-white/25 px-2 py-0.5 rounded tracking-widest text-white shadow-xs">
                      BOLETO OFICIAL
                    </span>
                    <span className="text-[9px] text-purple-100 font-mono">
                      REF: #{activeRaffle?.id ? activeRaffle.id.substring(0, 6).toUpperCase() : 'B0LETO'}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-black tracking-tight truncate leading-tight">
                      {activeRaffle?.name || 'Tesla Model 3 2026'}
                    </h4>
                    <p className="text-[10px] text-purple-100 font-medium truncate mt-0.5">
                      Premio: {activeRaffle?.prize || 'Por definir'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/10 pt-2">
                    <div>
                      <span className="block text-purple-200 uppercase text-[7px] font-bold tracking-wider">Titular</span>
                      <span className="font-bold block truncate text-white">
                        {buyerForm.buyerName || 'Sin Registrar'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-purple-200 uppercase text-[7px] font-bold tracking-wider">Ciudad</span>
                      <span className="font-bold block truncate text-white">
                        {buyerForm.city || 'Madrid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side ticket stub stub content */}
                <div className="w-[25%] flex flex-col items-center justify-between text-center pl-3 py-1">
                  <span className="text-[7px] text-purple-200 uppercase tracking-wider font-extrabold">NÚMERO</span>
                  <div className="text-xl font-black font-mono tracking-tighter text-white bg-slate-900/35 px-2 py-1 rounded-lg">
                    {selectedTickets.length > 0 ? `#${selectedTickets[0]}` : '#???'}
                  </div>
                  <span className="text-[9px] bg-white text-purple-800 font-extrabold px-2 py-0.5 rounded shadow-sm">
                    {activeRaffle?.ticketPrice ? formatPrice(activeRaffle.ticketPrice, config?.currency) : formatPrice(10, config?.currency)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Sidebar public advertisements (COMPRADOR_SIDEBAR) */}
            {buyerSidebarAnns.length > 0 && (
              <div className="space-y-4 mt-4" id="buyer-sidebar-promotions">
                {buyerSidebarAnns.map((ann) => (
                  <div 
                    key={ann.id}
                    className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-purple-950 to-[#0c0728] text-white p-5 border border-purple-900/30 shadow-lg flex flex-col gap-3"
                  >
                    {ann.imageUrl && (
                      <div className="w-full h-28 rounded-2xl overflow-hidden bg-slate-900 border border-purple-950">
                        <img 
                          src={ann.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[8px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Publicidad Patrocinada
                      </span>
                      <h4 className="text-xs font-black font-display text-white mt-1 leading-snug">
                        {ann.title}
                      </h4>
                      <p className="text-[10px] text-purple-200/90 leading-relaxed font-sans">
                        {ann.content}
                      </p>
                    </div>

                    {ann.ctaText && ann.ctaUrl && (
                      <a 
                        href={ann.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-[10px] font-black rounded-xl transition shadow-md shadow-pink-500/10"
                      >
                        <span>{ann.ctaText}</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      {/* SECCIÓN DE CONSULTA Y DESCARGA DE BOLETOS */}
      <div id="search-tickets-section" className="p-6 bg-[#0b0625] shadow-xl border border-purple-900/40 rounded-3xl mt-6 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-950/60 pb-5 mb-5">
          <div>
            <h3 className="text-base font-black font-display text-white flex items-center gap-2">
              <Search size={18} className="text-pink-500" />
              Consulta y Descarga tus Boletos
            </h3>
            <p className="text-xs text-purple-300 mt-1 max-w-2xl leading-normal">
              Busca tus boletos ingresando tu número de WhatsApp, correo electrónico o nombre para descargar el certificado oficial de reserva o coordinar tu pago.
            </p>
          </div>
        </div>

        <form onSubmit={handleTicketSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <div className="flex-1 relative">
            <input 
              type="text"
              required
              placeholder="Teléfono, Correo o Nombre del Titular"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 font-sans"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-purple-500/15 transition duration-200 shrink-0 cursor-pointer"
          >
            Buscar Boletos 🍀
          </button>
        </form>

        {searchSubmitted && (
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Resultados de la Búsqueda ({foundSales.length})
            </h4>

            {foundSales.length === 0 ? (
              <div className="p-5 text-center bg-[#050212]/30 border border-purple-950/50 rounded-2xl text-xs text-purple-300/60 italic">
                No se encontraron boletos registrados con la información ingresada. Verifica los datos o comunícate con tu colaborador autorizado para validar tu registro.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {foundSales.map((sale, index) => {
                  const isPaid = sale.status === 'PAID' || sale.status === 'SOLD';
                  const assignedSeller = sellers.find(s => s.id === sale.sellerId) || 
                                         sellers.find(s => sale.ticketNumber >= s.assignedRangeStart && sale.ticketNumber <= s.assignedRangeEnd);
                  
                  const sellerPhone = assignedSeller?.phone || '';
                  const sellerName = assignedSeller?.name || 'Colaborador Autorizado';

                  // Generate whatsapp URL
                  let waUrl = '';
                  if (isPaid) {
                    const shareText = `¡Hola! Ya he verificado mi boleto oficial #${sale.ticketNumber} para el sorteo de "${activeRaffle?.name}" por el fabuloso premio "${activeRaffle?.prize}". ¡Deseame suerte! 🍀`;
                    waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                  } else {
                    const paymentText = `Hola ${sellerName}, acabo de reservar el boleto #${sale.ticketNumber} para el sorteo "${activeRaffle?.name}". Quiero coordinar la confirmación de mi boleto a nombre de ${sale.buyerName}.`;
                    waUrl = sellerPhone ? `https://wa.me/${normalizePhone(sellerPhone)}?text=${encodeURIComponent(paymentText)}` : '';
                  }

                  return (
                    <motion.div 
                      key={`${sale.id}-${index}`}
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className={`relative bg-[#050212]/60 rounded-2xl p-3 sm:p-4 border flex flex-col justify-between gap-3 shadow-lg transition duration-300 hover:border-purple-500 cursor-pointer ${
                        isPaid ? 'border-emerald-500/30 shadow-emerald-500/2' : 'border-amber-500/30 shadow-amber-500/2'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[12px] sm:text-[14px] font-black font-mono text-white bg-slate-900/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                              #{sale.ticketNumber}
                            </span>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                <Check size={10} /> Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                <Clock size={10} className="animate-pulse" /> Reserva
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1 text-[11px] sm:text-xs">
                            <p className="text-purple-200 font-semibold truncate max-w-[100px] sm:max-w-[200px]">
                              Titular: <span className="text-white font-bold">{sale.buyerName}</span>
                            </p>
                            <p className="text-purple-300/80 text-[10px] sm:text-[11px] truncate max-w-[100px] sm:max-w-[200px]">
                              Asesor: <span className="text-purple-200 font-medium">{sale.sellerName || sellerName}</span>
                            </p>
                            <p className="text-purple-400/80 text-[9px] sm:text-[10px] font-mono">
                              {sale.date}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] sm:text-[11px] font-bold text-white bg-purple-950/40 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-purple-900/30 font-mono">
                            {formatPrice(activeRaffle?.ticketPrice || 10, config?.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Info & action buttons */}
                      <div className="border-t border-purple-950/40 pt-2 sm:pt-3 flex flex-col gap-2">
                        {!isPaid && (
                          <div className="w-full text-left text-[9px] sm:text-[10px] text-amber-400/90 leading-tight mb-1 font-sans">
                            ⚠️ Expira en 3h. Paga hoy para asegurar tu número.
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 justify-end w-full">
                          <button
                            type="button"
                            onClick={() => downloadTicket(sale, 'png')}
                            className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[9px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition duration-200 shadow-sm cursor-pointer"
                          >
                            <Download size={11} />
                            Boleto Imagen (PNG)
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadTicket(sale, 'svg')}
                            className="inline-flex items-center gap-1 bg-[#0c0728]/80 hover:bg-[#0c0728] border border-purple-950/60 hover:border-purple-500 text-purple-300 hover:text-white text-[9px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition duration-200 cursor-pointer"
                          >
                            <Download size={11} />
                            Boleto SVG
                          </button>
                          {isPaid ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-slate-900/80 hover:bg-slate-900 text-purple-300 hover:text-white border border-purple-950/60 hover:border-purple-500 text-[9px] sm:text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition duration-200 cursor-pointer"
                            >
                              <Share2 size={11} className="text-pink-400" />
                              Compartir
                            </a>
                          ) : (
                            sellerPhone ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] sm:text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition duration-200 shadow-md shadow-amber-500/10 cursor-pointer"
                              >
                                <Share2 size={11} />
                                Pagar
                              </a>
                            ) : (
                              <span className="text-[9px] sm:text-[10px] text-purple-400 italic">Comunícate con tu asesor</span>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer public advertisements (COMPRADOR_FOOTER) */}
      {buyerFooterAnns.length > 0 && (
        <div className="space-y-4 mt-6" id="buyer-footer-promotions">
          {buyerFooterAnns.map((ann) => (
            <div 
              key={ann.id}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-fuchsia-950 to-pink-950 text-white p-5 border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
            >
              {ann.imageUrl && (
                <div className="absolute top-0 right-0 w-full md:w-1/3 h-full opacity-10 md:opacity-20 pointer-events-none">
                  <img 
                    src={ann.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {ann.imageUrl && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-purple-500/20 shrink-0 hidden sm:block">
                    <img 
                      src={ann.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[8px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Auspiciador Oficial
                  </span>
                  <h4 className="text-sm font-black font-display text-white mt-1">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-purple-200 leading-normal font-sans max-w-xl">
                    {ann.content}
                  </p>
                </div>
              </div>

              {ann.ctaText && ann.ctaUrl && (
                <div className="relative z-10 shrink-0 w-full md:w-auto">
                  <a 
                    href={ann.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-[11px] font-black rounded-xl shadow-md transition duration-200 hover:scale-105"
                  >
                    <span>{ann.ctaText}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Onboarding guided tour */}
      <BuyerTour onClose={handleCloseTour} active={isTourActive} />

      {/* Modal de Advertencia y Confirmación de Reserva */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-[#0b0625] border border-purple-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left"
          >
            {/* Ambient light streak */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                <AlertTriangle size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold font-display text-white mb-1">
                  Confirmación de Reserva Temporal
                </h3>
                <p className="text-xs text-purple-300">
                  Por favor, lee con atención antes de proceder con tu solicitud.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-[#050212]/50 border border-purple-950/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-400 font-semibold">Boletos elegidos:</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {selectedTickets.map(t => (
                      <span key={t} className="bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono font-bold text-xs">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-purple-950/40 pt-2">
                  <span className="text-purple-400 font-semibold">Total a pagar:</span>
                  <span className="font-bold text-white text-sm">
                    {formatPrice((activeRaffle?.ticketPrice || 10) * selectedTickets.length, config?.currency)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-2xl space-y-2.5 text-xs">
                <div className="flex gap-2 text-purple-300 leading-relaxed">
                  <Clock size={16} className="text-pink-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">Límite de 3 Horas:</strong> Esta solicitud es una <strong className="text-pink-400">reserva temporal</strong>. Tienes exactamente 3 horas para realizar la confirmación con tu asesor.
                  </p>
                </div>
                <div className="flex gap-2 text-purple-300 leading-relaxed border-t border-purple-950/30 pt-2.5">
                  <ShieldAlert size={16} className="text-purple-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">Liberación Automática:</strong> Si no reportas la confirmación dentro del tiempo límite, los números se liberarán automáticamente para que otros solicitantes los elijan.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-900/30 text-purple-300 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Modificar Selección
              </button>
              <button
                type="button"
                onClick={(e) => {
                  setShowConfirmModal(false);
                  handleBuyerCheckoutSubmit(e);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-purple-500/20 transition cursor-pointer"
              >
                Entendido y Reservar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Buyer Promotion Modal (COMPRADOR_MODAL) */}
      {activeBuyerPromoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-55 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-[#0b0625] border border-pink-500/30 rounded-3xl overflow-hidden shadow-2xl relative text-left"
          >
            {/* Top decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
            
            {/* Close button top right */}
            <button
              onClick={() => {
                sessionStorage.setItem(`closed-promo-modal-${activeBuyerPromoModal.id}`, 'true');
                setActiveBuyerPromoModal(null);
              }}
              className="absolute top-4 right-4 text-purple-300 hover:text-white bg-purple-950/40 p-1.5 rounded-full border border-purple-900/30 cursor-pointer hover:scale-105 transition-all z-20"
            >
              <X size={14} />
            </button>

            {activeBuyerPromoModal.imageUrl && (
              <div className="h-44 w-full overflow-hidden bg-slate-950 relative border-b border-purple-950">
                <img 
                  src={activeBuyerPromoModal.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0625] via-transparent to-transparent"></div>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                  <Megaphone className="w-3 h-3 text-pink-400 animate-pulse" />
                  Sorteo Patrocinado
                </span>
                <h3 className="text-lg font-black font-display text-white mt-2 leading-tight">
                  {activeBuyerPromoModal.title}
                </h3>
                <p className="text-xs text-purple-200 leading-relaxed font-sans pt-1">
                  {activeBuyerPromoModal.content}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem(`closed-promo-modal-${activeBuyerPromoModal.id}`, 'true');
                    setActiveBuyerPromoModal(null);
                  }}
                  className="flex-1 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-900/30 text-purple-300 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
                >
                  Cerrar
                </button>
                {activeBuyerPromoModal.ctaText && activeBuyerPromoModal.ctaUrl && (
                  <a 
                    href={activeBuyerPromoModal.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      sessionStorage.setItem(`closed-promo-modal-${activeBuyerPromoModal.id}`, 'true');
                      setActiveBuyerPromoModal(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-pink-500/20 transition cursor-pointer text-center"
                  >
                    <span>{activeBuyerPromoModal.ctaText}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Promo/Ads Widget (COMPRADOR_FLOAT) */}
      {activeFloat && (
        <div className="fixed bottom-6 right-6 z-55 max-w-[320px] w-full px-4 sm:px-0">
          <AnimatePresence mode="wait">
            {isFloatMinimized ? (
              <motion.button
                key="minimized"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsFloatMinimized(false)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white rounded-full shadow-2xl border border-pink-500/30 hover:shadow-pink-500/20 cursor-pointer text-xs font-black uppercase tracking-widest animate-bounce"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Promo Especial</span>
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="bg-gradient-to-br from-[#120736] via-[#1b084c] to-[#0a0422] border border-pink-500/40 rounded-3xl p-5 shadow-2xl shadow-pink-900/10 relative overflow-hidden flex flex-col gap-3"
              >
                {/* Decorative particles background */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Actions: Minimize & Close */}
                <div className="flex justify-between items-center z-10">
                  <span className="bg-pink-500/15 text-pink-300 border border-pink-500/20 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    Sorteo Destacado
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Minimize button */}
                    <button
                      onClick={() => setIsFloatMinimized(true)}
                      className="text-purple-300 hover:text-white bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-900/30 cursor-pointer text-[10px] font-bold"
                      title="Minimizar"
                    >
                      －
                    </button>
                    {/* Close button */}
                    <button
                      onClick={() => setClosedFloatAnnIds(prev => [...prev, activeFloat.id])}
                      className="text-purple-300 hover:text-white bg-purple-950/40 p-1 rounded-lg border border-purple-900/30 cursor-pointer"
                      title="Cerrar"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>

                {/* Promotional content */}
                <div className="flex gap-3 items-start z-10 mt-1">
                  {activeFloat.imageUrl && (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-purple-500/20 shrink-0">
                      <img 
                        src={activeFloat.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-black font-display text-white tracking-tight leading-snug">
                      {activeFloat.title}
                    </h4>
                    <p className="text-[10px] text-purple-200 leading-relaxed font-sans line-clamp-3">
                      {activeFloat.content}
                    </p>
                  </div>
                </div>

                {/* CTA URL */}
                {activeFloat.ctaText && activeFloat.ctaUrl && (
                  <a 
                    href={activeFloat.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 hover:from-pink-400 hover:to-purple-500 text-white text-[10px] font-black rounded-xl transition shadow-md shadow-pink-500/15 hover:scale-[1.02] cursor-pointer"
                  >
                    <span>{activeFloat.ctaText}</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
