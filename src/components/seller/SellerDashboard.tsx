/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Ticket, Users, Clock, Share2, Search, UserCheck, Megaphone, FileText, TrendingUp, ArrowLeft, Download } from 'lucide-react';
import { Sale, Raffle, Seller, User, TicketStatus, Announcement, AnnouncementRead, AppConfig } from '../../types';
import { downloadTicketFile } from '../../utils';
import SalesReport from './SalesReport';
import SellerStatsSection from './SellerStatsSection';

interface SellerDashboardProps {
  currentUser: User;
  activeRaffle: Raffle | null;
  sales: Sale[];
  filteredSales: Sale[];
  sellerObj: Seller | undefined;
  sellerActiveTab: 'grid' | 'buyers' | 'report' | 'stats' | null;
  setSellerActiveTab: (t: 'grid' | 'buyers' | 'report' | 'stats' | null) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  setTargetNumberForSale: (n: number | null) => void;
  setIsRegisteringSale: (b: boolean) => void;
  setSelectedReservationForSellerModal: (s: Sale | null) => void;
  setSelectedSoldTicketForSellerModal: (s: Sale | null) => void;
  handleUpdateSaleStatus: (saleId: string, status: TicketStatus) => void;
  announcements?: Announcement[];
  reads?: AnnouncementRead[];
  onViewAnnouncements?: () => void;
  config: AppConfig | null;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export default function SellerDashboard({
  currentUser,
  activeRaffle,
  sales,
  filteredSales,
  sellerObj,
  sellerActiveTab,
  setSellerActiveTab,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  setTargetNumberForSale,
  setIsRegisteringSale,
  setSelectedReservationForSellerModal,
  setSelectedSoldTicketForSellerModal,
  handleUpdateSaleStatus,
  announcements = [],
  reads = [],
  onViewAnnouncements,
  config,
  showConfirm,
}: SellerDashboardProps) {
  // Filter announcements for this seller
  const activeAnns = announcements.filter(a => a.status === 'ACTIVE');
  const applicableAnns = activeAnns.filter(a => 
    sellerObj && (a.targetType === 'ALL' || a.targetSellerId === sellerObj.id)
  );
  const sellerReads = reads.filter(r => sellerObj && r.sellerId === sellerObj.id);
  const unreadCount = applicableAnns.filter(a => 
    !sellerReads.some(r => r.announcementId === a.id)
  ).length;
  const hasUnread = unreadCount > 0;

  const start = sellerObj ? sellerObj.assignedRangeStart : 1;
  const end = sellerObj ? sellerObj.assignedRangeEnd : (activeRaffle?.totalNumbers || 100);

  return (
    <div id="seller-dashboard-container" className="space-y-6">
      
      {sellerActiveTab === null ? (
        <div className="space-y-6">
          {/* Range Info & Offline Sync Controls banner */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 relative overflow-hidden flex flex-wrap gap-4 items-center justify-between border border-slate-800 shadow-xl shadow-purple-950/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider">
                Panel del Colaborador Autorizado
              </span>
              <h2 className="text-2xl font-black font-display text-white mt-4">¡Bienvenido de vuelta, {currentUser.name}!</h2>
              <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                Tiene acceso de registro a <strong className="text-pink-400 font-extrabold">los números de su rango asignado ({start} - {end})</strong> del sorteo. Una vez registrado un número, este quedará reservado y asignado de manera segura para el solicitante.
              </p>
            </div>
          </div>

          {/* Sección de Comunicados de la Administración */}
          {applicableAnns.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-lg relative">
                  <Megaphone className="w-5 h-5 animate-pulse" />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Avisos y Comunicados de la Administración</p>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {hasUnread 
                      ? `Tienes ${unreadCount} comunicado(s) importante(s) sin leer de la organización.` 
                      : 'Has leído todos los comunicados oficiales. Puedes volver a consultarlos en cualquier momento.'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2 z-10">
                <button
                  type="button"
                  onClick={onViewAnnouncements}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-purple-500/20 flex items-center gap-1.5"
                >
                  <span>{hasUnread ? `Leer Comunicados (${unreadCount})` : `Consultar Avisos (${applicableAnns.length})`}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Grid de Módulos (Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* CARD 1: Cuadrícula */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => setSellerActiveTab('grid')}
              className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-3 group-hover:bg-emerald-500/20 group-hover:text-white transition-all">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Registro de Boletos</h4>
            </motion.div>

            {/* CARD 2: Solicitantes y Reservas (Unified) */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => setSellerActiveTab('buyers')}
              className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 mb-3 group-hover:bg-teal-500/20 group-hover:text-white transition-all relative">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                {sales.filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id).length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                    {sales.filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id).length}
                  </span>
                )}
              </div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Solicitantes y Reservas</h4>
            </motion.div>

            {/* CARD 3: Reporte */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => setSellerActiveTab('report')}
              className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 mb-3 group-hover:bg-blue-500/20 group-hover:text-white transition-all">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Reporte de Registros</h4>
            </motion.div>

            {/* CARD 4: Estadísticas */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={() => setSellerActiveTab('stats')}
              className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 p-4 rounded-3xl cursor-pointer shadow-lg aspect-square flex flex-col items-center justify-center text-center group transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 mb-3 group-hover:bg-purple-500/20 group-hover:text-white transition-all">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-black font-display text-white uppercase tracking-wider leading-tight">Estadísticas</h4>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cabecera para módulos con botón de Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-950/30 mb-4">
            <button
              type="button"
              onClick={() => setSellerActiveTab(null)}
              className="w-fit bg-[#0c0728] hover:bg-[#1a0f4a] text-purple-300 border border-purple-500/30 px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:translate-y-[2px]"
            >
              <ArrowLeft size={14} className="text-purple-400" /> Volver al Menú Principal
            </button>
            <div className="sm:text-right">
              <h2 className="text-lg font-black text-white font-display uppercase tracking-wide">
                {sellerActiveTab === 'grid' && 'Cuadrícula de Reservas & QR'}
                {sellerActiveTab === 'buyers' && 'Control de Reservas y Solicitantes'}
                {sellerActiveTab === 'report' && 'Historial y Reporte de Registros'}
                {sellerActiveTab === 'stats' && 'Estadísticas e Indicadores'}
              </h2>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider font-sans">Módulo Operativo del Colaborador</p>
            </div>
          </div>
        </div>
      )}

      {sellerActiveTab === 'grid' && (
        <div id="seller-grid-tab-content" className="space-y-6">
          {/* Ticket Grid and QR Share column */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Column 1: Ticket grid of seller's range */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 xl:col-span-2 shadow-xl shadow-slate-950/40">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black font-display text-white">Cuadrícula de Números</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Haga clic en cualquier número disponible para registrar o reservar inmediatamente.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-slate-800/80 text-slate-300 border border-slate-750 px-2.5 py-1 rounded font-medium">Disponible</span>
                  <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded font-medium">Reservado</span>
                  <span className="bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2.5 py-1 rounded font-medium">Confirmado / Pago</span>
                </div>
              </div>

              {/* Range Tickets Grid scrollable */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[350px] overflow-y-auto pr-2">
                {Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => {
                  const num = start + i;
                  const sale = sales.find(s => s.raffleId === activeRaffle?.id && s.ticketNumber === num);
                  let btnClass = "bg-slate-850/50 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500 cursor-pointer hover:scale-105 shadow-inner";
                  if (sale) {
                    if (sale.status === 'PAID') {
                      btnClass = "bg-gradient-to-br from-pink-600 to-pink-800 text-white border border-pink-500 cursor-pointer hover:scale-105 shadow-md shadow-pink-600/20";
                    } else if (sale.status === 'RESERVED') {
                      btnClass = "bg-gradient-to-br from-amber-600 to-amber-700 text-white border border-amber-500 cursor-pointer hover:scale-105 shadow-md shadow-amber-600/20";
                    } else {
                      btnClass = "bg-gradient-to-br from-pink-500/20 to-pink-700/20 text-pink-300 border border-pink-500/30 cursor-pointer hover:scale-105";
                    }
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
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
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-slate-950/40">
              <div>
                <h3 className="text-base font-black font-display text-white mb-2 flex items-center gap-2">
                  <Share2 size={18} className="text-pink-500" />
                  Enlaces & Códigos QR Autogenerados
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">Los solicitantes podrán ingresar mediante este QR único para elegir números.</p>
              </div>

              {(() => {
                const sellerShareUrl = `${window.location.origin}${window.location.pathname}?vendedor=${currentUser.username}`;
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=d946ef&data=${encodeURIComponent(sellerShareUrl)}`;
                return (
                  <>
                    {/* Functional beautiful QR using reliable public server */}
                    <div className="bg-slate-950 p-4 rounded-3xl w-44 h-44 mx-auto flex flex-col justify-center items-center shadow-2xl border border-slate-800">
                      <img 
                        src={qrApiUrl} 
                        alt={`Código QR de ${currentUser.name}`} 
                        className="w-36 h-36 rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-3 mt-4">
                      <p className="text-[10px] text-slate-400 font-mono text-center leading-normal">
                        URL Personalizada (Tu Huella Digital):<br/>
                        <span className="text-pink-400 font-bold break-all block mt-1">
                          {sellerShareUrl}
                        </span>
                      </p>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sellerShareUrl);
                          alert(`¡Tu enlace único de colaborador (${currentUser.name}) ha sido copiado al portapapeles!`);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer border border-purple-500/30"
                      >
                        <Share2 size={12} /> Copiar Enlace Autorizado
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {sellerActiveTab === 'buyers' && (
        <div id="seller-buyers-tab-content" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black font-display text-white">Control de Reservas y Solicitantes</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Monitoree y gestione todos los registros de boletos bajo su asesoría. Confirme pagos de reservas temporales (plazo de 3 horas) o descargue y envíe los boletos confirmados.
              </p>
            </div>
            
            {/* Filtros e Indicador */}
            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto justify-between lg:justify-end">
              {/* Indicador de reservas pendientes */}
              {sales.filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id).length > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold px-3 py-1.5 rounded-xl animate-pulse">
                  <Clock size={12} />
                  <span>{sales.filter(s => s.status === 'RESERVED' && s.sellerId === sellerObj?.id).length} Reservas Pendientes</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <span className="absolute left-3 top-2.5 text-slate-500"><Search size={14} /></span>
                  <input 
                    type="text" 
                    placeholder="Buscar por solicitante, ticket..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-sans focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="PAID">Solo Confirmados</option>
                  <option value="RESERVED">Solo Reservados (Pendientes)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-300 border-b border-slate-800 uppercase text-[10px] tracking-wider font-bold">
                  <th className="p-3">Ticket</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Ciudad</th>
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Tiempo Restante</th>
                  <th className="p-3">Observaciones</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones de Gestión</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s, index) => {
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
                    <tr key={`${s.id}-${index}`} className="border-b border-slate-800 hover:bg-slate-900/40 text-slate-300 transition-colors">
                      <td className="p-3 font-mono font-bold text-pink-400 text-sm">#{s.ticketNumber}</td>
                      <td className="p-3 text-white font-semibold">{s.buyerName}</td>
                      <td className="p-3 font-mono">
                        <span className="block text-slate-200">{s.phone}</span>
                        <span className="text-[10px] text-slate-400">{s.email}</span>
                      </td>
                      <td className="p-3 text-slate-300">{s.city}</td>
                      <td className="p-3 font-mono">
                        <span className="block text-slate-200">{s.date}</span>
                        <span className="text-[10px] text-slate-400">{s.time}</span>
                      </td>
                      <td className="p-3">
                        {s.status === 'RESERVED' ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${isExpired ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse'}`}>
                            <Clock size={10} />
                            {remainingText}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">- Concluido -</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 max-w-[150px] truncate" title={s.notes}>
                        {s.notes || <span className="text-slate-500 italic">Sin observaciones</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${s.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'}`}>
                          {s.status === 'PAID' ? 'Confirmado' : 'Reservado'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end items-center">
                          {s.status === 'RESERVED' ? (
                            <>
                              {/* Confirmar pago */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (showConfirm) {
                                    showConfirm(
                                      '¿Validar Registro?',
                                      `¿Desea marcar el ticket #${s.ticketNumber} como CONFIRMADO? Una vez confirmado, no se podrá modificar.`,
                                      () => handleUpdateSaleStatus(s.id, 'PAID')
                                    );
                                  } else if (confirm(`¿Desea marcar el ticket #${s.ticketNumber} como CONFIRMADO? Una vez confirmado, no se podrá modificar.`)) {
                                    handleUpdateSaleStatus(s.id, 'PAID');
                                  }
                                }}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-1 px-2.5 rounded-xl text-[10px] transition shadow-md shadow-purple-500/25 flex items-center gap-1 cursor-pointer border border-purple-500/30 active:scale-95"
                                title="Confirmar Pago y Registrar Oficialmente"
                              >
                                <UserCheck size={12} /> Confirmar Pago
                              </button>
                              
                              {/* Recordar pago whatsapp */}
                              <a
                                href={`https://wa.me/${s.phone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`Hola ${s.buyerName}, te contacto para coordinar el pago de tu boleto reservado #${s.ticketNumber} para la rifa "${activeRaffle?.name}". Recuerda que las reservas expiran en un límite de 3 horas. ¡Gracias!`)}`}
                                target="_blank"
                                rel="noreferrer"
                                referrerPolicy="no-referrer"
                                className="bg-[#25D366] hover:bg-[#20ba56] text-white py-1 px-2.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Enviar Recordatorio por WhatsApp"
                              >
                                <Share2 size={12} /> Recordar
                              </a>
                            </>
                          ) : (
                            <>
                              {/* Descargar boleto */}
                              <button
                                type="button"
                                onClick={() => downloadTicketFile(s, activeRaffle?.name || 'Rifa', activeRaffle?.prize || 'Premio', config?.currency, activeRaffle?.ticketPrice)}
                                className="bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/20 py-1 px-2.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Descargar Boleto Oficial (SVG)"
                              >
                                <Download size={12} /> Descargar
                              </button>
                              
                              {/* Compartir por whatsapp */}
                              <a
                                href={`https://wa.me/${s.phone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`¡Felicidades ${s.buyerName}! Tu boleto oficial #${s.ticketNumber} para la rifa de "${activeRaffle?.name}" ha sido verificado y pagado. ¡Mucha suerte! 🍀`)}`}
                                target="_blank"
                                rel="noreferrer"
                                referrerPolicy="no-referrer"
                                className="bg-[#25D366] hover:bg-[#20ba56] text-white py-1 px-2.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Enviar Boleto por WhatsApp"
                              >
                                <Share2 size={12} /> WhatsApp
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500 font-medium">
                      No se encontraron solicitantes o reservas que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sellerActiveTab === 'report' && (
        <SalesReport
          sales={sales}
          activeRaffle={activeRaffle}
          config={config}
          sellerId={sellerObj?.id || ''}
          sellerName={currentUser.name}
        />
      )}

      {sellerActiveTab === 'stats' && (
        <SellerStatsSection
          activeRaffle={activeRaffle}
          sales={sales}
          sellerObj={sellerObj}
          config={config}
        />
      )}
    </div>
  );
}
