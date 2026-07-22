/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, Users, TrendingUp, ShieldAlert, DollarSign, Download, 
  Plus, RefreshCw, LogOut, CheckCircle2, UserCheck, AlertTriangle, 
  MapPin, HelpCircle, Share2, Wifi, WifiOff, FileText, Lock, Eye, EyeOff, Search, Settings, Clock, UserPlus, Link,
  Megaphone, Award, ArrowLeft, ExternalLink
} from 'lucide-react';
import { User, Raffle, Seller, Sale, AuditLog, AppConfig, DashboardStats, TicketStatus, Announcement, AnnouncementRead, DrawHistory, PrizeConfig } from './types';
import { exportToCSV, exportToPDF, downloadTicketFile } from './utils';

// Import Modularized Components
import Header from './components/common/Header';
import AuthModule from './components/auth/AuthModule';
import { 
  RegisterSaleModal, 
  BuyerConfirmationModal, 
  BuyerDirectRegistrationModal, 
  BuyerInformativeAlertModal, 
  SellerReservationManagementModal, 
  SellerSoldTicketDetailsModal, 
  PaymentSuccessModal 
} from './components/common/Modals';
import OrganizerDashboard from './components/organizer/OrganizerDashboard';
import SellerDashboard from './components/seller/SellerDashboard';
import BuyerPanel from './components/buyer/BuyerPanel';
import AnnouncementsManager from './components/organizer/AnnouncementsManager';
import AnnouncementModal from './components/common/AnnouncementModal';
import SalesReport from './components/seller/SalesReport';
import OrganizerSalesReport from './components/organizer/OrganizerSalesReport';
import SorteosSection from './components/organizer/SorteosSection';
import ConfigSection from './components/organizer/ConfigSection';
import StatsSection from './components/organizer/StatsSection';
import SellerStatsSection from './components/seller/SellerStatsSection';
import SalesSection from './components/organizer/SalesSection';
import SellersSection from './components/organizer/SellersSection';
import ConfirmModal from './components/common/ConfirmModal';
import SplashScreen from './components/common/SplashScreen';
import LegalModal from './components/common/LegalModal';
import ComplianceBanner from './components/common/ComplianceBanner';
import SuperAdminPanel from './components/superadmin/SuperAdminPanel';
import SEOHead from './components/common/SEOHead';

import { useRaffleSystem } from './hooks/useRaffleSystem';

export default function App() {
  const {
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
    isSupabaseConnected,

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
  } = useRaffleSystem();

  const [selectedOrgModule, setSelectedOrgModule] = useState<'vendedores' | 'ventas' | 'configuracion' | 'estadisticas' | 'publicidad' | 'comisiones' | 'sorteos' | 'superadmin' | null>(null);
  const [selectedSelModule, setSelectedSelModule] = useState<'grid' | 'buyers' | 'report' | 'stats' | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Auto-close SuperAdmin panel if privileges are revoked in Supabase in real time
  useEffect(() => {
    if (selectedOrgModule === 'superadmin' && currentUser && !currentUser.isSuperAdmin) {
      setSelectedOrgModule(null);
    }
  }, [currentUser?.isSuperAdmin, selectedOrgModule, currentUser]);

  // Progressive Web App (PWA) Integration States
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('🎉 [PWA] ¡Promo Blitz instalada exitosamente!');
      setPwaInstallPrompt(null);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!pwaInstallPrompt) return;
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    console.log(`👤 [PWA] Elección de instalación del usuario: ${outcome}`);
    setPwaInstallPrompt(null);
  };

  useEffect(() => {
    if (!currentUser) {
      setSelectedOrgModule(null);
      setSelectedSelModule(null);
    } else {
      setShowLogin(false);
    }
  }, [currentUser]);

  const [showSplash, setShowSplash] = useState(true);
  const [splashMessage, setSplashMessage] = useState("Iniciando sistema...");
  const prevUserRef = React.useRef<User | null>(null);

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'rules'>('terms');

  const openLegalModalWithTab = (tab: 'terms' | 'privacy' | 'rules') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    if (currentUser && !prevUser) {
      setSplashMessage(`Iniciando sesión segura... ¡Bienvenido, ${currentUser.name}!`);
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3600);
      prevUserRef.current = currentUser;
      return () => clearTimeout(timer);
    } else if (!currentUser && prevUser) {
      prevUserRef.current = null;
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#050212] text-slate-200 flex flex-col font-sans pb-10 select-none">
      <SEOHead activeRaffle={activeRaffle} />
      
      {/* HEADER BAR */}
      <Header
        currentUser={currentUser}
        activeRaffle={activeRaffle}
        wsConnected={wsConnected}
        showLogin={showLogin}
        setCurrentUser={setCurrentUser}
        setToken={setToken}
        setShowLogin={setShowLogin}
        pwaInstallPrompt={pwaInstallPrompt}
        onInstallPWA={handleInstallPWA}
        isOffline={isOffline}
      />

      {/* PWA Offline Awareness Banner */}
      <AnimatePresence>
        {isOffline && (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-4">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-pink-500/10 border border-red-500/30 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/15 border border-red-500/20 text-red-400 rounded-xl mt-0.5 shrink-0">
                  <WifiOff size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Sin Conexión a Internet
                  </h4>
                  <p className="text-xs text-red-200/80 leading-relaxed mt-1">
                    Estás navegando en modo offline. Los datos se cargan desde el caché de tu dispositivo y algunas funciones como la creación de sorteos, registro de ventas o sincronización en tiempo real pueden verse limitadas hasta restablecer la red.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="shrink-0 text-xs font-black px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 active:translate-y-[1px]"
              >
                <RefreshCw size={13} />
                Reintentar Conexión
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supabase Connection Alert Banner */}
      {!isSupabaseConnected && (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/30 backdrop-blur-md rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-gradient-to-b from-amber-500 via-purple-500 to-pink-500" />
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-xl mt-0.5 shrink-0">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Base de Datos Supabase Desconectada
                </h4>
                <p className="text-xs text-amber-200/80 leading-relaxed mt-1">
                  La aplicación se encuentra operando en modo de demostración debido a que no se han configurado las claves de Supabase. Para sincronizar de forma permanente y en tiempo real en todos tus dispositivos, añade las variables de entorno <code className="bg-[#0b0625] px-1.5 py-0.5 rounded border border-purple-500/30 font-mono text-pink-400 text-[10px]">SUPABASE_URL</code> y <code className="bg-[#0b0625] px-1.5 py-0.5 rounded border border-purple-500/30 font-mono text-pink-400 text-[10px]">SUPABASE_KEY</code> en la pestaña <strong>Settings (Secrets)</strong> de AI Studio.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex gap-2">
              <a 
                href="https://ai.studio/build" 
                target="_blank" 
                rel="noreferrer"
                className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                Configurar en AI Studio
                <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* CORE BODY OF MODULES */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          
          {/* --- MODULE A: LOGGED OUT / LOGIN & REGISTER PANEL --- */}
          {!currentUser && showLogin && (
            <AuthModule
               isRecovering={isRecovering}
               setIsRecovering={setIsRecovering}
               isRegistering={isRegistering}
               setIsRegistering={setIsRegistering}
               authError={authError}
               setAuthError={setAuthError}
               loginUsername={loginUsername}
               setLoginUsername={setLoginUsername}
               loginPassword={loginPassword}
               setLoginPassword={setLoginPassword}
               showPassword={showPassword}
               setShowPassword={setShowPassword}
               isLoginLoading={isLoginLoading}
               handleLoginSubmit={handleLoginSubmit}
               recoveryEmail={recoveryEmail}
               setRecoveryEmail={setRecoveryEmail}
               recoveryMsg={recoveryMsg}
               handlePasswordRecovery={handlePasswordRecovery}
               registerForm={registerForm}
               setRegisterForm={setRegisterForm}
               isRegisterLoading={isRegisterLoading}
               registerSuccessMsg={registerSuccessMsg}
               registerVerificationLink={registerVerificationLink}
               handleRegisterSubmit={handleRegisterSubmit}
            />
          )}

          {/* --- MODULE B: ORGANIZADOR PANEL --- */}
          {currentUser && currentUser.role === 'ORGANIZADOR' && (
            <motion.div 
              key="organizer-module"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Navegación Modular para el Organizador */}
              <AnimatePresence mode="wait">
                {selectedOrgModule === null ? (
                  <motion.div 
                    key="org-menu-grid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      {/* CARD 1: Estadísticas */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('estadisticas');
                          setOrganizerSection('estadisticas');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-pink-500/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(217,70,239,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-pink-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 group-hover:bg-purple-500/40 flex items-center justify-center text-purple-200 group-hover:text-white border border-purple-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">KPIs y Estadísticas</h4>
                      </motion.div>

                      {/* CARD 2: Ventas */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('ventas');
                          setOrganizerSection('ventas');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-pink-500/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(217,70,239,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl group-hover:bg-pink-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/20 group-hover:bg-pink-500/40 flex items-center justify-center text-pink-200 group-hover:text-white border border-pink-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Aprobación y Venta de Boletos</h4>
                      </motion.div>

                      {/* CARD 3: Vendedores */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('vendedores');
                          setOrganizerSection('vendedores');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-blue-500/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center text-blue-200 group-hover:text-white border border-blue-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Gestión de Colaboradores</h4>
                      </motion.div>

                      {/* CARD 4: Sorteos */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('sorteos');
                          setOrganizerSection('sorteos');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-amber-500/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/40 flex items-center justify-center text-amber-200 group-hover:text-white border border-amber-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <Award className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Sorteos y Ganadores</h4>
                      </motion.div>

                      {/* CARD 5: Comisiones */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('comisiones');
                          setOrganizerSection('comisiones');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-emerald-500/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/40 flex items-center justify-center text-emerald-200 group-hover:text-white border border-emerald-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Reporte de Comisiones</h4>
                      </motion.div>

                      {/* CARD 6: Publicidad */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('publicidad');
                          setOrganizerSection('publicidad');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-violet-500/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 group-hover:bg-violet-500/40 flex items-center justify-center text-violet-200 group-hover:text-white border border-violet-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <Megaphone className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Avisos y Comunicados</h4>
                      </motion.div>

                      {/* CARD 7: Configuración */}
                      <motion.div
                        whileHover={{ scale: 1.07, y: -6 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        onClick={() => {
                          setSelectedOrgModule('configuracion');
                          setOrganizerSection('configuracion');
                        }}
                        className="relative overflow-hidden bg-gradient-to-br from-[#120a36] via-[#1a0c47] to-[#21093b] border border-purple-500/30 border-b-4 border-b-purple-900/90 hover:border-slate-400/80 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(148,163,184,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                      >
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/10 rounded-full blur-xl group-hover:bg-slate-500/20 transition-all"></div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-500/20 group-hover:bg-slate-500/40 flex items-center justify-center text-slate-200 group-hover:text-white border border-slate-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                          <Settings className="w-6 h-6" />
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Configuración y Precios</h4>
                      </motion.div>

                      {/* CARD 8: Super Admin */}
                      {currentUser.isSuperAdmin && (
                        <motion.div
                          whileHover={{ scale: 1.07, y: -6 }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                          onClick={() => {
                            setSelectedOrgModule('superadmin');
                            setOrganizerSection('superadmin');
                          }}
                          className="relative overflow-hidden bg-gradient-to-br from-[#2b081e] via-[#3a0928] to-[#1e0314] border border-pink-500/40 border-b-4 border-b-pink-900/90 hover:border-pink-500/90 p-4 rounded-3xl cursor-pointer shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(236,72,153,0.45),inset_0_1px_0_0_rgba(255,255,255,0.3)] aspect-square flex flex-col items-center justify-center text-center group transition-all duration-300 backdrop-blur-md"
                        >
                          <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/15 rounded-full blur-xl group-hover:bg-pink-500/30 transition-all"></div>
                          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 group-hover:bg-pink-500/40 flex items-center justify-center text-pink-200 group-hover:text-white border border-pink-400/30 mb-3 transition-all duration-300 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                            <ShieldAlert className="w-6 h-6 text-pink-300 animate-pulse" />
                          </div>
                          <h4 className="text-[11px] sm:text-xs font-black font-display text-white uppercase tracking-wider leading-tight">Control de Propietarios</h4>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key={`org-module-${selectedOrgModule}`}
                    initial={{ opacity: 0, scale: 0.92, y: 18, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="space-y-6"
                  >
                    {/* Cabecera limpia con indicador de módulo activo y botón para volver */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/40 bg-gradient-to-r from-purple-950/30 via-transparent to-transparent p-4 rounded-2xl border border-purple-500/20 shadow-md">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.93 }}
                        type="button"
                        onClick={() => setSelectedOrgModule(null)}
                        className="w-fit bg-[#120935] hover:bg-[#1c0f4d] text-purple-300 border border-purple-500/30 border-b-2 border-b-purple-900/90 px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                      >
                        <ArrowLeft size={14} className="text-purple-400" /> Volver al Menú Principal
                      </motion.button>
                      <div className="sm:text-right space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-black text-purple-300 uppercase tracking-widest shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          Módulo Activo
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide flex items-center justify-end gap-2">
                          {selectedOrgModule === 'estadisticas' && 'KPIs y Estadísticas'}
                          {selectedOrgModule === 'ventas' && 'Aprobación y Venta de Boletos'}
                          {selectedOrgModule === 'vendedores' && 'Gestión de Colaboradores'}
                          {selectedOrgModule === 'sorteos' && 'Sorteos y Ganadores'}
                          {selectedOrgModule === 'comisiones' && 'Reporte de Comisiones'}
                          {selectedOrgModule === 'publicidad' && 'Avisos y Comunicados'}
                          {selectedOrgModule === 'configuracion' && 'Configuración y Precios'}
                          {selectedOrgModule === 'superadmin' && 'Control de Propietarios'}
                        </h2>
                        <p className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">Gestión, auditoría y administración del sistema</p>
                      </div>
                    </div>

                  {/* SECCIÓN EXTRA: REPORTE DE COMISIONES (Segmentación por Colaborador) */}
                  {selectedOrgModule === 'comisiones' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <OrganizerSalesReport
                        sales={sales}
                        sellers={sellers}
                        activeRaffle={activeRaffle}
                        config={config}
                      />
                    </motion.div>
                  )}

                  {/* SECCIÓN 1: ESTADÍSTICAS (KPIs & Charts) */}
                  {selectedOrgModule === 'estadisticas' && (
                    <StatsSection 
                      stats={stats}
                      activeRaffle={activeRaffle}
                      sales={sales}
                      sellers={sellers}
                      config={config}
                    />
                  )}

                  {/* SECCIÓN 2: VENTAS (Buyers log table) */}
                  {selectedOrgModule === 'ventas' && (
                    <SalesSection 
                      sales={sales}
                      filteredSales={filteredSales}
                      sellers={sellers}
                      activeRaffle={activeRaffle}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      sellerFilter={sellerFilter}
                      setSellerFilter={setSellerFilter}
                      exportToCSV={exportToCSV}
                      exportToPDF={exportToPDF}
                    />
                  )}

                  {/* SECCIÓN 3: VENDEDORES (Manage and CRUD sellers) */}
                  {selectedOrgModule === 'vendedores' && (
                    <SellersSection 
                      sellers={sellers}
                      activeRaffle={activeRaffle}
                      isCreatingSeller={isCreatingSeller}
                      setIsCreatingSeller={setIsCreatingSeller}
                      newSellerUser={newSellerUser}
                      setNewSellerUser={setNewSellerUser}
                      sellerCrudError={sellerCrudError}
                      handleCreateSellerSubmit={handleCreateSellerSubmit}
                      handleDeleteSeller={handleDeleteSeller}
                      handleBlockSeller={handleBlockSeller}
                    />
                  )}

                  {/* SECCIÓN 3: CONFIGURACIÓN DE RIFA (Modular component) */}
                  {selectedOrgModule === 'configuracion' && (
                    <ConfigSection 
                      activeRaffle={activeRaffle}
                      adminConfigForm={adminConfigForm}
                      setAdminConfigForm={setAdminConfigForm}
                      handleConfigUpdate={handleConfigUpdate}
                      raffleConfigForm={raffleConfigForm}
                      setRaffleConfigForm={setRaffleConfigForm}
                      handleRaffleUpdate={handleRaffleUpdate}
                      raffleUpdateMsg={raffleUpdateMsg}
                      isUpdatingRaffle={isUpdatingRaffle}
                      auditLogs={auditLogs}
                      handleLaunchRaffle={handleLaunchRaffle}
                    />
                  )}

                  {selectedOrgModule === 'sorteos' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <SorteosSection
                        currentUser={currentUser}
                        activeRaffle={activeRaffle}
                        sales={sales}
                        drawHistory={drawHistory}
                        setDrawHistory={setDrawHistory}
                        setAuditLogs={setAuditLogs}
                      />
                    </motion.div>
                  )}

                  {selectedOrgModule === 'publicidad' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <AnnouncementsManager
                        currentUser={currentUser}
                        sellers={sellers}
                        showConfirm={showConfirm}
                        onAddAuditLog={async (action, details) => {
                          try {
                            await fetch('/api/audit-logs', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action, details, username: currentUser.name })
                            });
                            const resLogs = await fetch('/api/audit-logs');
                            const dataLogs = await resLogs.json();
                            setAuditLogs(dataLogs);
                          } catch (err) {
                            console.error('Error saving audit log:', err);
                          }
                        }}
                      />
                    </motion.div>
                  )}

                  {selectedOrgModule === 'superadmin' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <SuperAdminPanel currentUser={currentUser} />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            </motion.div>
          )}

          {currentUser && currentUser.role === 'VENDEDOR' && (
            <>
              <SellerDashboard
                currentUser={currentUser}
                activeRaffle={activeRaffle}
                sales={sales}
                filteredSales={filteredSales}
                sellerObj={sellerObj}
                sellerActiveTab={selectedSelModule}
                setSellerActiveTab={(t) => setSelectedSelModule(t)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                setTargetNumberForSale={setTargetNumberForSale}
                setIsRegisteringSale={setIsRegisteringSale}
                setSelectedReservationForSellerModal={setSelectedReservationForSellerModal}
                setSelectedSoldTicketForSellerModal={setSelectedSoldTicketForSellerModal}
                handleUpdateSaleStatus={handleUpdateSaleStatus}
                announcements={announcements}
                reads={announcementReads}
                onViewAnnouncements={() => setForceShowAnnouncements(true)}
                config={config}
                showConfirm={showConfirm}
              />

              {/* Register sale dialog modal */}
              {isRegisteringSale && targetNumberForSale !== null && (
                <RegisterSaleModal
                  targetNumberForSale={targetNumberForSale}
                  saleError={saleError}
                  newSaleForm={newSaleForm}
                  setNewSaleForm={setNewSaleForm}
                  handleRegisterSaleSubmit={handleRegisterSaleSubmit}
                  onClose={() => {
                    setIsRegisteringSale(false);
                    setTargetNumberForSale(null);
                  }}
                />
              )}
            </>
          )}

          {/* DEPRECATED INLINE SELLER VIEW */}
          {false && (
            <motion.div 
              key="seller-module"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              {/* Sección de Comunicados de la Administración */}
              {(() => {
                const activeSellerAnns = announcements.filter(a => a.status === 'ACTIVE');
                const currentSellerObj = sellers.find(s => s.userId === currentUser.id);
                const applicableSellerAnns = activeSellerAnns.filter(a => 
                  currentSellerObj && (a.targetType === 'ALL' || a.targetSellerId === currentSellerObj.id)
                );
                const sellerReads = announcementReads.filter(r => currentSellerObj && r.sellerId === currentSellerObj.id);
                const unreadAnnCount = applicableSellerAnns.filter(a => 
                  !sellerReads.some(r => r.announcementId === a.id)
                ).length;
                const hasUnreadAnn = unreadAnnCount > 0;

                if (applicableSellerAnns.length === 0) return null;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs relative">
                        <Megaphone className="w-5 h-5" />
                        {hasUnreadAnn && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Avisos y Comunicados de la Administración</p>
                        <p className="text-[10px] text-slate-500">
                          {hasUnreadAnn 
                            ? `Tienes ${unreadAnnCount} comunicado(s) importante(s) sin leer de la organización.` 
                            : 'Has leído todos los comunicados oficiales. Puedes volver a consultarlos en cualquier momento.'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => setForceShowAnnouncements(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <span>{hasUnreadAnn ? `Leer Comunicados (${unreadAnnCount})` : `Consultar Avisos (${applicableSellerAnns.length})`}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Tab Navigation for Seller Panel */}
              {selectedSelModule === null ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {/* CARD 1: Cuadrícula */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      onClick={() => {
                        setSelectedSelModule('grid');
                        setSellerActiveTab('grid');
                      }}
                      className="bg-gradient-to-br from-[#061814] to-[#010807] border border-emerald-950/30 hover:border-emerald-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-3 group-hover:bg-emerald-500/20 group-hover:text-white transition-all">
                        <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Registro de Boletos</h4>
                    </motion.div>

                    {/* CARD 2: Lista de Compradores */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      onClick={() => {
                        setSelectedSelModule('buyers');
                        setSellerActiveTab('buyers');
                      }}
                      className="bg-gradient-to-br from-[#061814] to-[#010807] border border-emerald-950/30 hover:border-emerald-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 mb-3 group-hover:bg-teal-500/20 group-hover:text-white transition-all">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Solicitantes</h4>
                    </motion.div>

                    {/* CARD 3: Gestión de Reservas */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      onClick={() => {
                        setSelectedSelModule('reservations');
                        setSellerActiveTab('reservations');
                      }}
                      className="bg-gradient-to-br from-[#061814] to-[#010807] border border-emerald-950/30 hover:border-emerald-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-3 group-hover:bg-amber-500/20 group-hover:text-white transition-all relative">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                        {sales.filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id).length > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Reservas Activas</h4>
                    </motion.div>

                    {/* CARD 4: Reporte */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      onClick={() => {
                        setSelectedSelModule('report');
                        setSellerActiveTab('report');
                      }}
                      className="bg-gradient-to-br from-[#061814] to-[#010807] border border-emerald-950/30 hover:border-emerald-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 mb-3 group-hover:bg-blue-500/20 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Reporte de Registros</h4>
                    </motion.div>

                    {/* CARD 5: Estadísticas */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      onClick={() => {
                        setSelectedSelModule('stats');
                      }}
                      className="bg-gradient-to-br from-[#061814] to-[#010807] border border-emerald-950/30 hover:border-emerald-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 mb-3 group-hover:bg-purple-500/20 group-hover:text-white transition-all">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Estadísticas</h4>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/30 mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedSelModule(null)}
                    className="w-fit bg-[#061814] hover:bg-[#0c2e27] text-emerald-300 border border-emerald-500/30 px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:translate-y-[2px]"
                  >
                    <ArrowLeft size={14} className="text-emerald-400" /> Volver al Menú Principal
                  </button>
                  <div className="sm:text-right">
                    <h2 className="text-lg font-black text-white font-display uppercase tracking-wide">
                      {selectedSelModule === 'grid' && 'Cuadrícula de Reservas & QR'}
                      {selectedSelModule === 'buyers' && 'Auditoría de Solicitantes'}
                      {selectedSelModule === 'reservations' && 'Control de Reservas (3 horas máx)'}
                      {selectedSelModule === 'report' && 'Historial y Reporte de Registros'}
                      {selectedSelModule === 'stats' && 'Estadísticas e Indicadores'}
                    </h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Módulo Operativo del Colaborador</p>
                  </div>
                </div>
              )}

              {selectedSelModule === 'grid' && (
                <>
                  {/* Ticket Grid and QR Share column */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Column 1: Ticket grid of seller's range */}
                    <div className="m3-card p-6 xl:col-span-2 bg-slate-900/60 border border-purple-500/20 shadow-xl shadow-purple-950/10">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-purple-500/20 pb-3">
                        <div>
                          <h3 className="text-base font-bold font-display text-white">Cuadrícula de Números</h3>
                          <p className="text-[11px] text-purple-200/70">Haga clic en cualquier número disponible para registrar o reservar inmediatamente.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="bg-purple-950/40 px-2.5 py-1 rounded border border-purple-500/20 text-purple-200 font-medium">Disponible</span>
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded font-medium">Reservado</span>
                          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded font-medium">Confirmado / Pago</span>
                        </div>
                      </div>

                      {/* Range Tickets Grid scrollable */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[350px] overflow-y-auto pr-2">
                        {Array.from({ length: activeRaffle?.totalNumbers || 100 }, (_, i) => {
                          const num = i + 1;
                          const sale = sales.find(s => s.raffleId === activeRaffle?.id && s.ticketNumber === num);
                          let btnClass = "bg-purple-950/30 hover:bg-purple-500/20 text-purple-100 border border-purple-500/20";
                          if (sale) {
                            if (sale.status === 'PAID') {
                              btnClass = "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 shadow-sm shadow-emerald-500/10";
                            } else if (sale.status === 'RESERVED') {
                              btnClass = "bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white border border-amber-400/40 shadow-sm shadow-amber-500/10";
                            } else {
                              btnClass = "bg-emerald-600/50 text-emerald-100 border border-emerald-500/25";
                            }
                          }

                          return (
                            <button
                               key={num}
                              onClick={() => {
                                if (activeRaffle?.status === 'DRAFT') {
                                  alert('⚠️ Sorteo en Modo Borrador: El registro manual y reservas de boletos están deshabilitados hasta que el organizador realice el lanzamiento oficial (Lanzar Sorteo). Todo el contenido actual es puramente visual.');
                                  return;
                                }
                                if (!sale) {
                                  setTargetNumberForSale(num);
                                  setIsRegisteringSale(true);
                                } else if (sale.status === 'RESERVED') {
                                  setSelectedReservationForSellerModal(sale);
                                } else {
                                  setSelectedSoldTicketForSellerModal(sale);
                                }
                              }}
                              className={`p-2 rounded-xl text-xs font-bold font-mono transition-all text-center ${btnClass}`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Share direct purchase link and QR simulation */}
                    <div className="m3-card p-6 flex flex-col justify-between bg-slate-900/60 border border-purple-500/20 shadow-xl shadow-purple-950/10">
                      <div>
                        <h3 className="text-base font-bold font-display text-white mb-2 flex items-center gap-2">
                          <Share2 size={18} className="text-pink-400" />
                          Enlaces & Códigos QR Autogenerados
                        </h3>
                        <p className="text-xs text-purple-200/70 mb-4">Los solicitantes podrán ingresar mediante este QR único para elegir números.</p>
                      </div>

                      {(() => {
                        const sellerShareUrl = `${window.location.origin}${window.location.pathname}?vendedor=${currentUser.username}`;
                        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=059669&data=${encodeURIComponent(sellerShareUrl)}`;
                        return (
                          <>
                            {/* Functional beautiful QR using reliable public server */}
                            <div className="bg-purple-950/50 p-4 rounded-2xl w-44 h-44 mx-auto flex flex-col justify-center items-center shadow-lg border border-purple-500/20">
                              <img 
                                src={qrApiUrl} 
                                alt={`Código QR de ${currentUser.name}`} 
                                className="w-36 h-36 rounded-md"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="space-y-2 mt-4">
                              <p className="text-[10px] text-purple-200/50 font-mono text-center">
                                URL Personalizada (Tu Huella Digital):<br/>
                                <span className="text-pink-400 font-bold break-all block mt-1">
                                  {sellerShareUrl}
                                </span>
                              </p>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(sellerShareUrl);
                                  alert(`¡Tu enlace único de colaborador (${currentUser.name}) ha sido copiado al portapapeles!`);
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Share2 size={12} /> Copiar Enlace Autorizado
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Log/Search table of seller's sales specifically */}
                  <div className="m3-card p-6 bg-slate-900/60 border border-purple-500/20 shadow-xl shadow-purple-950/10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <h3 className="text-base font-bold font-display text-white">Registros Recientes</h3>
                      <div className="relative w-full sm:w-64">
                        <span className="absolute left-3 top-2 text-purple-400"><Search size={14} /></span>
                        <input 
                          type="text" 
                          placeholder="Buscar solicitante/ticket..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-purple-950/40 border border-purple-800/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-purple-950/60 text-purple-200 border-b border-purple-900/30 uppercase text-[10px] tracking-wider font-bold">
                            <th className="p-3">Número</th>
                            <th className="p-3">Solicitante</th>
                            <th className="p-3">Ciudad</th>
                            <th className="p-3">Contacto</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((s, index) => (
                            <tr key={`${s.id}-${index}`} className="border-b border-purple-950 hover:bg-purple-950/30">
                              <td className="p-3 font-mono font-bold text-pink-400">#{s.ticketNumber}</td>
                              <td className="p-3 text-slate-100 font-semibold">{s.buyerName}</td>
                              <td className="p-3 text-slate-300">{s.city}</td>
                              <td className="p-3 font-mono text-purple-200/70">{s.phone} <br/> {s.email}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${s.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] text-purple-200/50 italic">No modificable</span>
                              </td>
                            </tr>
                          ))}
                          {filteredSales.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-6 text-purple-200/50">Ningún registro encontrado en su rango.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {selectedSelModule === 'buyers' && (
                <div className="m3-card p-6 bg-slate-900/60 border border-purple-500/20 shadow-xl shadow-purple-950/10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-purple-500/20 pb-3">
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Lista de Solicitantes</h3>
                      <p className="text-[11px] text-purple-200/70">Toda la información registrada de forma definitiva.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative w-full sm:w-64">
                        <span className="absolute left-3 top-2 text-purple-400"><Search size={14} /></span>
                        <input 
                          type="text" 
                          placeholder="Buscar solicitante, ticket, ciudad..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-purple-950/40 border border-purple-800/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-purple-950/50 border border-purple-800/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 cursor-pointer"
                      >
                        <option value="ALL">Todos los Estados</option>
                        <option value="PAID">PAGADO</option>
                        <option value="RESERVED">RESERVADO</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-purple-950/60 text-purple-200 border-b border-purple-900/30 uppercase text-[10px] tracking-wider font-bold">
                          <th className="p-3">Ticket</th>
                          <th className="p-3">Solicitante</th>
                          <th className="p-3">Contacto</th>
                          <th className="p-3">Ciudad</th>
                          <th className="p-3">Fecha y Hora</th>
                          <th className="p-3">Colaborador</th>
                          <th className="p-3">Observaciones</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((s, index) => (
                          <tr key={`${s.id}-${index}`} className="border-b border-purple-950 hover:bg-purple-950/30">
                            <td className="p-3 font-mono font-bold text-pink-400 text-sm">#{s.ticketNumber}</td>
                            <td className="p-3 text-slate-100 font-semibold">{s.buyerName}</td>
                            <td className="p-3 font-mono text-purple-200/70">
                              <span className="block">{s.phone}</span>
                              <span className="text-purple-300/40 text-[11px]">{s.email}</span>
                            </td>
                            <td className="p-3 text-slate-300">{s.city}</td>
                            <td className="p-3 font-mono text-purple-200/70">
                              <span className="block">{s.date}</span>
                              <span className="text-purple-300/40 text-[11px]">{s.time}</span>
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                {s.sellerName || sellerObj?.name || 'Colaborador'}
                              </span>
                            </td>
                            <td className="p-3 text-purple-200/60 max-w-[200px] truncate" title={s.notes}>
                              {s.notes || <span className="text-purple-300/30 italic">Sin observaciones</span>}
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                {s.status === 'PAID' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => downloadTicketFile(s, activeRaffle?.name || 'Rifa', activeRaffle?.prize || 'Premio', config?.currency, activeRaffle?.ticketPrice)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                      title="Descargar Boleto Oficial (SVG)"
                                    >
                                      <Download size={12} /> Descargar
                                    </button>
                                    <a
                                      href={`https://wa.me/${s.phone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`¡Felicidades ${s.buyerName}! Tu boleto oficial #${s.ticketNumber} para la rifa de "${activeRaffle?.name}" ha sido verificado y pagado. ¡Mucha suerte! 🍀`)}`}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="bg-[#25D366] hover:bg-[#20ba56] text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                      title="Enviar por WhatsApp"
                                    >
                                      <Share2 size={12} /> WhatsApp
                                    </a>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        showConfirm(
                                          '¿Confirmar Pago?',
                                          `¿Desea marcar el ticket #${s.ticketNumber} como PAGADO? Una vez confirmado, no se podrá modificar.`,
                                          () => handleUpdateSaleStatus(s.id, 'PAID')
                                        );
                                      }}
                                      className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                      title="Registrar Pago"
                                    >
                                      <UserCheck size={12} /> Confirmar Pago
                                    </button>
                                    <a
                                      href={`https://wa.me/${s.phone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`Hola ${s.buyerName}, te contacto para coordinar el pago de tu boleto reservado #${s.ticketNumber} para la rifa "${activeRaffle?.name}". Recuerda que las reservas expiran en un límite de 3 horas. ¡Gracias!`)}`}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                      title="Recordatorio de Pago WhatsApp"
                                    >
                                      <Clock size={12} /> Recordar Pago
                                    </a>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredSales.length === 0 && (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-purple-200/50">
                              Ningún solicitante registrado coincide con los filtros.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedSelModule === 'reservations' && (
                <div className="m3-card p-6 bg-slate-900/60 border border-purple-500/20 shadow-xl shadow-purple-950/10 rounded-2xl">
                  <div className="mb-4 border-b border-purple-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="text-amber-500 animate-pulse" size={20} />
                      <h3 className="text-base font-bold font-display text-white">
                        Gestión de Reservas Activas (Plazo de 3 Horas)
                      </h3>
                    </div>
                    <p className="text-[11px] text-purple-200/70 mt-1 leading-relaxed">
                      Estas reservas fueron creadas por solicitantes que escanearon su código QR o usaron su enlace. Las reservas tienen una validez de 3 horas. Una vez recibido el pago, marque el número como <strong>PAGADO</strong> para asegurar el cupo del solicitante definitivamente. Las reservas confirmadas quedan registradas oficialmente.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-purple-950/60 text-purple-200 border-b border-purple-900/30 uppercase text-[9px] tracking-wider font-bold">
                          <th className="p-3">Ticket</th>
                          <th className="p-3">Solicitante</th>
                          <th className="p-3">Contacto</th>
                          <th className="p-3">Ciudad</th>
                          <th className="p-3">Registrado el</th>
                          <th className="p-3">Tiempo Restante</th>
                          <th className="p-3">Observaciones</th>
                          <th className="p-3 text-center">Estado</th>
                          <th className="p-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales
                          .filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id)
                          .map((s, index) => {
                            // Calculate remaining time relative to Date.now()
                            let remainingText = "3h 00m";
                            let isExpired = false;
                            if (s.reservedAt) {
                              const expiryTime = new Date(s.reservedAt).getTime() + 3 * 60 * 60 * 1000;
                              const diffMs = expiryTime - Date.now();
                              if (diffMs <= 0) {
                                remainingText = "Expirado (Pendiente Purga)";
                                isExpired = true;
                              } else {
                                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                remainingText = `${hours}h ${minutes}m`;
                              }
                            } else {
                              remainingText = "3h 00m";
                            }

                            return (
                              <tr key={`${s.id}-${index}`} className="border-b border-purple-950 hover:bg-purple-950/30">
                                <td className="p-3 font-mono font-bold text-pink-400 text-sm">#{s.ticketNumber}</td>
                                <td className="p-3 text-slate-100 font-semibold">{s.buyerName}</td>
                                <td className="p-3 font-mono text-purple-200/70">
                                  <span className="block">{s.phone}</span>
                                  <span className="text-purple-300/40 text-[10px]">{s.email}</span>
                                </td>
                                <td className="p-3 text-slate-300">{s.city}</td>
                                <td className="p-3 font-mono text-purple-200/70">
                                  <span className="block">{s.date}</span>
                                  <span className="text-purple-300/40 text-[10px]">{s.time}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${isExpired ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'}`}>
                                    <Clock size={10} />
                                    {remainingText}
                                  </span>
                                </td>
                                <td className="p-3 text-purple-200/60 max-w-[150px] truncate" title={s.notes}>
                                  {s.notes || <span className="text-purple-300/30 italic">Sin observaciones</span>}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/30">
                                    RESERVADO
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      showConfirm(
                                        '¿Confirmar Pago?',
                                        `¿Desea marcar el ticket #${s.ticketNumber} como PAGADO? Una vez confirmado, no se podrá modificar.`,
                                        () => handleUpdateSaleStatus(s.id, 'PAID')
                                      );
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded-lg text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer mx-auto"
                                  >
                                    <UserCheck size={12} /> Confirmar Pago
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {sales.filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id).length === 0 && (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-purple-200/50 font-medium">
                              No tiene reservas pendientes de pago en este momento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedSelModule === 'report' && (
                <SalesReport
                  sales={sales}
                  activeRaffle={activeRaffle}
                  config={config}
                  sellerId={sellerObj?.id || ''}
                  sellerName={currentUser?.name || ''}
                />
              )}

              {selectedSelModule === 'stats' && (
                <SellerStatsSection
                  activeRaffle={activeRaffle}
                  sales={sales}
                  sellerObj={sellerObj}
                  config={config}
                />
              )}

              {/* Register sale dialog modal */}
              {isRegisteringSale && targetNumberForSale !== null && (
                <RegisterSaleModal
                  targetNumberForSale={targetNumberForSale}
                  saleError={saleError}
                  newSaleForm={newSaleForm}
                  setNewSaleForm={setNewSaleForm}
                  handleRegisterSaleSubmit={handleRegisterSaleSubmit}
                  onClose={() => {
                    setIsRegisteringSale(false);
                    setTargetNumberForSale(null);
                  }}
                />
              )}

            </motion.div>
          )}

          {/* --- MODULE D: COMPRADOR INTERACTIVE VIEW --- */}
          {!currentUser && !showLogin && (
            <BuyerPanel
              activeRaffle={activeRaffle}
              sales={sales}
              selectedTickets={selectedTickets}
              setSelectedTickets={setSelectedTickets}
              buyerSellerObj={buyerSellerObj}
              sellers={sellers}
              selectedSellerForBuyerMode={selectedSellerForBuyerMode}
              setSelectedSellerForBuyerMode={setSelectedSellerForBuyerMode}
              buyerError={buyerError}
              buyerSuccessMsg={buyerSuccessMsg}
              buyerForm={buyerForm}
              setBuyerForm={setBuyerForm}
              handleBuyerCheckoutSubmit={handleBuyerCheckoutSubmit}
              setBuyerMessageModal={setBuyerMessageModal}
              setIsBuyerRegisterModalOpen={setIsBuyerRegisterModalOpen}
              announcements={announcements}
              config={config}
              onOpenLegalModal={openLegalModalWithTab}
            />
          )}

          {/* --- MODULE D: COMPRADOR INTERACTIVE VIEW (DEPRECATED INLINE) --- */}
          {false && (
            <motion.div 
              key="buyer-module"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              
              {/* Custom buyer info panel */}
              <div className="m3-card p-6 bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-100 text-center relative overflow-hidden shadow-sm">
                <div className="absolute -top-10 -left-10 w-44 h-44 bg-purple-500/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-pink-500/5 rounded-full blur-3xl"></div>

                <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Acceso Autorizado por QR / Enlace Personalizado
                </span>
                
                <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 mt-4">
                  Selecciona tus Números de la Gran Rifa
                </h2>
                
                <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto">
                  ¡Tu próximo gran premio está a un clic de distancia! Explora nuestra cuadrícula de números de la suerte, elige tu favorito y participa con total seguridad y transparencia. Una vez que registres tu boleto, tu reserva estará asegurada para el gran sorteo.
                </p>

                {/* Vendedor asignado o selector si es público */}
                {!window.location.search.includes('vendedor') && sellers.length > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs flex-wrap bg-white/40 px-3 py-1.5 rounded-xl border border-purple-100/50 inline-flex">
                    <span className="text-slate-500">Elige tu colaborador favorito:</span>
                    <select 
                      value={selectedSellerForBuyerMode}
                      onChange={(e) => setSelectedSellerForBuyerMode(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] text-slate-800 focus:outline-none shadow-sm"
                    >
                      {sellers.map((s, index) => (
                        <option key={`${s.id}-${index}`} value={s.id}>{s.name} (Rangos {s.assignedRangeStart}-{s.assignedRangeEnd})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Core selection body */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Tickets Selection Grid */}
                <div className="m3-card p-6 lg:col-span-2 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-bold font-display text-slate-800">Cuadrícula de Números Disponibles</h3>
                    <span className="text-xs text-slate-500">
                      {selectedTickets.length} seleccionados
                    </span>
                  </div>

                  {/* Range Tickets Grid for Comprador */}
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {Array.from({ length: buyerRange.end - buyerRange.start + 1 }, (_, i) => {
                       const num = buyerRange.start + i;
                      const sale = sales.find(s => s.raffleId === activeRaffle?.id && s.ticketNumber === num);
                      const isSelected = selectedTickets.includes(num);

                      let btnClass = "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer hover:scale-105";
                      if (sale) {
                        if (sale.status === 'PAID') {
                          btnClass = "bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer hover:bg-emerald-250 hover:scale-105";
                        } else if (sale.status === 'RESERVED') {
                          btnClass = "bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer hover:bg-amber-250 hover:scale-105";
                        } else {
                          btnClass = "bg-slate-100 text-slate-400 border border-slate-200 cursor-pointer hover:scale-105";
                        }
                      } else if (isSelected) {
                        btnClass = "bg-purple-600 text-white font-bold border border-purple-500 transform scale-105 shadow-md shadow-purple-500/10 cursor-pointer";
                      }

                      return (
                        <button
                          key={num}
                          onClick={() => {
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
                              if (isSelected) {
                                setSelectedTickets(selectedTickets.filter(n => n !== num));
                              } else {
                                setSelectedTickets([...selectedTickets, num]);
                                setIsBuyerRegisterModalOpen(true);
                              }
                            }
                          }}
                          className={`p-2 rounded-xl text-xs font-mono font-bold transition-all text-center ${btnClass}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mt-4 justify-center">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-50 rounded border border-slate-200"></span> Libre</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-purple-600 rounded"></span> Seleccionado</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></span> Reservado (3h Máx)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></span> Confirmado / Pago</span>
                  </div>
                </div>

                {/* Reservation checkout form */}
                <div className="m3-card p-6 bg-white shadow-sm">
                  <h3 className="text-sm font-bold font-display text-slate-800 mb-4 border-b border-slate-200 pb-2">Consolidar Solicitud</h3>

                  {buyerError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-3">
                      {buyerError}
                    </div>
                  )}

                  {buyerSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs mb-3 flex items-start gap-1.5 shadow-sm">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                      <p>{buyerSuccessMsg}</p>
                    </div>
                  )}

                  <form onSubmit={handleBuyerCheckoutSubmit} className="space-y-4">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1">Tickets elegidos:</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {selectedTickets.map(n => (
                          <span key={n} className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-mono font-bold text-xs">
                            #{n}
                          </span>
                        ))}
                        {selectedTickets.length === 0 && (
                          <span className="text-[10px] text-rose-600 font-semibold italic">Ningún número seleccionado</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ej. Carlos Pérez"
                        value={buyerForm.buyerName}
                        onChange={(e) => setBuyerForm({ ...buyerForm, buyerName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono (WhatsApp)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ej. +34 600 111 222"
                        value={buyerForm.phone}
                        onChange={(e) => setBuyerForm({ ...buyerForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        required
                        placeholder="ej. carlos@gmail.com"
                        value={buyerForm.email}
                        onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ciudad de Origen</label>
                      <select 
                        value={buyerForm.city}
                        onChange={(e) => setBuyerForm({ ...buyerForm, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans"
                      >
                        <option value="Madrid">Madrid</option>
                        <option value="Barcelona">Barcelona</option>
                        <option value="Bogotá">Bogotá</option>
                        <option value="Santiago">Santiago</option>
                        <option value="CDMX">CDMX</option>
                        <option value="Lima">Lima</option>
                        <option value="Buenos Aires">Buenos Aires</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      disabled={selectedTickets.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-purple-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reservar Tickets Seleccionados
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Buyer Confirmation Modal (3-Hour Reservation) */}
      {buyerModalInfo && (
        <BuyerConfirmationModal
          buyerModalInfo={buyerModalInfo}
          activeRaffle={activeRaffle}
          onClose={() => setBuyerModalInfo(null)}
        />
      )}

      {/* Buyer Direct Registration Modal */}
      {isBuyerRegisterModalOpen && (
        <BuyerDirectRegistrationModal
          selectedTickets={selectedTickets}
          buyerError={buyerError}
          buyerForm={buyerForm}
          setBuyerForm={setBuyerForm}
          sellers={sellers}
          selectedSellerForBuyerMode={selectedSellerForBuyerMode}
          setSelectedSellerForBuyerMode={setSelectedSellerForBuyerMode}
          handleBuyerCheckoutSubmit={handleBuyerCheckoutSubmit}
          onClose={() => setIsBuyerRegisterModalOpen(false)}
        />
      )}

      {/* Buyer Informative Alert Modal (for Reserved or Paid tickets) */}
      {buyerMessageModal && (
        <BuyerInformativeAlertModal
          buyerMessageModal={buyerMessageModal}
          onClose={() => setBuyerMessageModal(null)}
        />
      )}

      {/* Seller Reservation Management Modal (with Direct Change to Paid option) */}
      {selectedReservationForSellerModal && (
        <SellerReservationManagementModal
          sale={selectedReservationForSellerModal}
          handleUpdateSaleStatus={handleUpdateSaleStatus}
          onClose={() => setSelectedReservationForSellerModal(null)}
          showConfirm={showConfirm}
        />
      )}

      {/* Seller Sold/Paid Ticket Details Modal */}
      {selectedSoldTicketForSellerModal && (
        <SellerSoldTicketDetailsModal
          sale={selectedSoldTicketForSellerModal}
          onClose={() => setSelectedSoldTicketForSellerModal(null)}
        />
      )}

      {/* WhatsApp Congratulatory and Payment Success Confirmation Modal */}
      {paymentSuccessMessageModal && (
        <PaymentSuccessModal
          sale={paymentSuccessMessageModal}
          activeRaffle={activeRaffle}
          onClose={() => setPaymentSuccessMessageModal(null)}
        />
      )}

      {/* Modal de Comunicados de la Administración (Segmentación y Triggers) */}
      {currentUser && currentUser.role === 'VENDEDOR' && (
        <AnnouncementModal
          announcements={announcements}
          reads={forceShowAnnouncements ? [] : announcementReads}
          currentSeller={sellers.find(s => s.userId === currentUser.id) || null}
          onMarkAsRead={async (annId) => {
            await handleMarkAnnouncementAsRead(annId);
            setForceShowAnnouncements(false);
          }}
          placement={forceShowAnnouncements ? undefined : 'LOGIN'}
        />
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-purple-300/40 border-t border-purple-950/40 max-w-7xl mx-auto w-full mt-12 print:hidden">
        <p>© 2026 Sistema de Rifa Profesional, Inc. Todos los derechos reservados.</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[11px] text-pink-400 font-bold">
          <button onClick={() => openLegalModalWithTab('terms')} className="hover:text-pink-300 hover:underline cursor-pointer transition">Términos de Servicio</button>
          <span>•</span>
          <button onClick={() => openLegalModalWithTab('privacy')} className="hover:text-pink-300 hover:underline cursor-pointer transition">Política de Privacidad (RGPD)</button>
          <span>•</span>
          <button onClick={() => openLegalModalWithTab('rules')} className="hover:text-pink-300 hover:underline cursor-pointer transition">Reglamento del Sorteo & Juego Responsable</button>
        </div>
      </footer>

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      <ComplianceBanner
        onOpenLegalModal={openLegalModalWithTab}
      />

      <ConfirmModal
        isOpen={!!confirmDialog?.isOpen}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />

      <SplashScreen isVisible={showSplash} message={splashMessage} />
    </div>
  );
}
