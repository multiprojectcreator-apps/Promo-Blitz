/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, CheckCircle2, UserCheck, ShieldAlert, Ticket } from 'lucide-react';
import { Sale, Raffle, Seller, TicketStatus } from '../../types';

// ==========================================
// 1. REGISTER SALE MODAL (Manual Direct Sale for Seller)
// ==========================================
interface RegisterSaleModalProps {
  targetNumberForSale: number;
  saleError: string;
  newSaleForm: {
    buyerName: string;
    phone: string;
    email: string;
    city: string;
    notes: string;
    status: TicketStatus;
  };
  setNewSaleForm: (f: any) => void;
  handleRegisterSaleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function RegisterSaleModal({
  targetNumberForSale,
  saleError,
  newSaleForm,
  setNewSaleForm,
  handleRegisterSaleSubmit,
  onClose,
}: RegisterSaleModalProps) {
  return (
    <div id="register-sale-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0b0625] border border-purple-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-4">
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-500/30">
            Registro Manual Directo
          </span>
          <h3 className="text-lg font-bold font-display text-white mt-2">Registrar Ticket #{targetNumberForSale}</h3>
          <p className="text-xs text-purple-300/80 mt-1">Ingrese los detalles del solicitante para consolidar el registro</p>
        </div>

        {saleError && (
          <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl text-xs mb-3 flex items-start gap-1">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>{saleError}</p>
          </div>
        )}

        <form onSubmit={handleRegisterSaleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1">Nombre Completo del Solicitante</label>
            <input 
              type="text" 
              required
              placeholder="Sofía Silva"
              value={newSaleForm.buyerName}
              onChange={(e) => setNewSaleForm({ ...newSaleForm, buyerName: e.target.value })}
              className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">Teléfono</label>
              <input 
                type="text" 
                required
                placeholder="+34 699 111 222"
                value={newSaleForm.phone}
                onChange={(e) => setNewSaleForm({ ...newSaleForm, phone: e.target.value })}
                className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">Ciudad</label>
              <input 
                type="text" 
                required
                placeholder="ej. Madrid"
                value={newSaleForm.city}
                onChange={(e) => setNewSaleForm({ ...newSaleForm, city: e.target.value })}
                className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              placeholder="sofia@gmail.com"
              value={newSaleForm.email}
              onChange={(e) => setNewSaleForm({ ...newSaleForm, email: e.target.value })}
              className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 p-2 bg-[#050212]/30 rounded-xl border border-purple-950/50">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white">
              <input 
                type="radio" 
                name="sale_status" 
                checked={newSaleForm.status === 'PAID'} 
                onChange={() => setNewSaleForm({ ...newSaleForm, status: 'PAID' })}
                className="form-radio text-purple-600 focus:ring-purple-500 cursor-pointer" 
              />
              Marcar Pagado
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white">
              <input 
                type="radio" 
                name="sale_status" 
                checked={newSaleForm.status === 'RESERVED'} 
                onChange={() => setNewSaleForm({ ...newSaleForm, status: 'RESERVED' })}
                className="form-radio text-amber-600 focus:ring-amber-500 cursor-pointer" 
              />
              Marcar Reservado
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1">Observaciones</label>
            <textarea 
              placeholder="Pago recibido por Bizum..."
              rows={2}
              value={newSaleForm.notes}
              onChange={(e) => setNewSaleForm({ ...newSaleForm, notes: e.target.value })}
              className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button 
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Registrar
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs transition border border-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. BUYER CONFIRMATION MODAL (Post Purchase Details & QR)
// ==========================================
interface BuyerConfirmationModalProps {
  buyerModalInfo: {
    tickets: number[];
    buyerName: string;
    phone: string;
    email: string;
    city: string;
    notes: string;
    sellerName: string;
    sellerPhone: string;
  };
  activeRaffle: Raffle | null;
  onClose: () => void;
}

export function BuyerConfirmationModal({
  buyerModalInfo,
  activeRaffle,
  onClose,
}: BuyerConfirmationModalProps) {
  return (
    <div id="buyer-confirmation-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0b0625] border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center shadow-inner border border-amber-500/30">
            <Clock size={32} className="animate-pulse" />
          </div>

          <div>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-amber-500/30">
              Reserva Temporal Autorizada
            </span>
            <h3 className="text-xl font-bold font-display text-white mt-2">¡Tickets Reservados con Éxito!</h3>
            <p className="text-xs text-purple-200/80 mt-1">Estimado/a <strong className="text-purple-300">{buyerModalInfo.buyerName}</strong>, tu solicitud se ha procesado con las siguientes condiciones:</p>
          </div>

          {/* Reserved Numbers panel */}
          <div className="p-4 bg-[#050212]/40 rounded-2xl border border-purple-950/50 space-y-2">
            <p className="text-[10px] text-purple-300/60 font-mono uppercase tracking-wider font-semibold">Tus Números Seleccionados</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {buyerModalInfo.tickets.map((t, index) => (
                <span key={`${t}-${index}`} className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-mono font-bold text-sm px-3 py-1 rounded-lg shadow-sm shadow-orange-500/10">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Timer info banner */}
          <div className="p-4 bg-amber-950/35 border border-amber-900/30 rounded-2xl flex items-start gap-2.5 text-left">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-300">Límite de Reserva: 3 Horas</p>
              <p className="text-[11px] text-amber-200/90 leading-normal">
                Tu reserva vencerá de forma ineludible en <strong>3 horas</strong>. Debes contactar de inmediato con tu colaborador autorizado para concretar la confirmación y hacer efectiva tu participación.
              </p>
            </div>
          </div>

          {/* Seller Contact Info card */}
          <div className="p-4 bg-purple-950/30 border border-purple-900/30 rounded-2xl text-left space-y-1.5">
            <p className="text-[10px] text-purple-300/50 font-mono uppercase tracking-wider font-semibold">Colaborador Autorizado Asignado</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{buyerModalInfo.sellerName}</p>
                <p className="text-xs text-purple-300/80 font-mono mt-0.5">Tel: {buyerModalInfo.sellerPhone}</p>
              </div>
              {(() => {
                const ticketListStr = buyerModalInfo.tickets.map(t => `#${t}`).join(', ');
                const firstTicket = buyerModalInfo.tickets[0];
                const baseAppUrl = window.location.origin + window.location.pathname;
                const directLink = `${baseAppUrl}?ticket=${firstTicket}`;

                const waMessageText = `Hola ${buyerModalInfo.sellerName}, acabo de realizar la reserva temporal de los siguientes números:

🎟️ Tickets: ${ticketListStr}
👤 Solicitante: ${buyerModalInfo.buyerName}
📞 Teléfono: ${buyerModalInfo.phone}
📧 Correo: ${buyerModalInfo.email || 'No proporcionado'}
📍 Ciudad: ${buyerModalInfo.city || 'No proporcionada'}
💬 Notas: ${buyerModalInfo.notes || 'Ninguna'}

🔗 Enlace de acceso directo para verificar la confirmación y activar el ticket:
${directLink}`;

                const waUrl = `https://wa.me/${buyerModalInfo.sellerPhone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(waMessageText)}`;

                return (
                  <a 
                    href={waUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer text-center animate-pulse"
                  >
                    Contactar Colaborador
                  </a>
                );
              })()}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-[#050212] hover:bg-[#0c0728] text-purple-200 font-semibold py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer border border-purple-950"
          >
            Entendido / Cerrar Ventana
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 3. BUYER DIRECT REGISTRATION MODAL (Checkout form overlay)
// ==========================================
interface BuyerDirectRegistrationModalProps {
  selectedTickets: number[];
  buyerError: string;
  buyerForm: {
    buyerName: string;
    phone: string;
    email: string;
    city: string;
    notes: string;
  };
  setBuyerForm: (f: any) => void;
  sellers: Seller[];
  selectedSellerForBuyerMode: string;
  setSelectedSellerForBuyerMode: (s: string) => void;
  handleBuyerCheckoutSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function BuyerDirectRegistrationModal({
  selectedTickets,
  buyerError,
  buyerForm,
  setBuyerForm,
  sellers,
  selectedSellerForBuyerMode,
  setSelectedSellerForBuyerMode,
  handleBuyerCheckoutSubmit,
  onClose,
}: BuyerDirectRegistrationModalProps) {
  return (
    <div id="buyer-direct-registration-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0b0625] border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-purple-950/60 pb-3">
            <div className="w-10 h-10 bg-purple-500/20 text-purple-300 rounded-full flex items-center justify-center shadow-inner shrink-0 border border-purple-500/30">
              <Ticket size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">Formulario de Reserva Temporal</h3>
              <p className="text-[11px] text-purple-300/80">Completa tu información para apartar tus números.</p>
            </div>
          </div>

          {buyerError && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl text-xs flex items-start gap-1">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{buyerError}</span>
            </div>
          )}

          <form onSubmit={handleBuyerCheckoutSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-purple-300/60 uppercase tracking-wider mb-1">Tus Tickets Elegidos</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#050212]/50 rounded-xl border border-purple-950/60">
                {selectedTickets.map((n, index) => (
                  <span key={`${n}-${index}`} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg font-mono font-bold text-xs">
                    #{n}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
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
                <label className="block text-xs font-semibold text-purple-300 mb-1">Ciudad / Ubicación</label>
                <input 
                  type="text" 
                  required
                  placeholder="ej. Madrid"
                  value={buyerForm.city}
                  onChange={(e) => setBuyerForm({ ...buyerForm, city: e.target.value })}
                  className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1">Asesor Certificado (Para Registro)</label>
                <select 
                  value={selectedSellerForBuyerMode}
                  onChange={(e) => setSelectedSellerForBuyerMode(e.target.value)}
                  className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                >
                  {sellers.map((s, index) => (
                    <option key={`${s.id}-${index}`} value={s.id} className="bg-[#0b0625] text-white">{s.name} (Rangos {s.assignedRangeStart}-{s.assignedRangeEnd})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1">Notas / Observaciones (Opcional)</label>
                <textarea 
                  placeholder="Algún detalle adicional sobre el pago..."
                  value={buyerForm.notes}
                  onChange={(e) => setBuyerForm({ ...buyerForm, notes: e.target.value })}
                  className="w-full bg-[#050212]/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Seguir Seleccionando
              </button>
              <button 
                type="submit"
                disabled={selectedTickets.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                Confirmar Registro
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 4. BUYER INFORMATIVE ALERT MODAL (Click on taken/reserved tickets)
// ==========================================
interface BuyerInformativeAlertModalProps {
  buyerMessageModal: {
    title: string;
    message: string;
    type: 'reserved' | 'paid' | 'error';
    ticketNumber: number;
  };
  onClose: () => void;
}

export function BuyerInformativeAlertModal({
  buyerMessageModal,
  onClose,
}: BuyerInformativeAlertModalProps) {
  const isError = buyerMessageModal.type === 'error';
  const isReserved = buyerMessageModal.type === 'reserved';
  
  let themeBgClass = "bg-emerald-500/5";
  let circleColorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  let badgeColorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  let badgeText = "CONFIRMADO";
  let iconComponent = <CheckCircle2 size={32} />;

  if (isError) {
    themeBgClass = "bg-rose-500/5";
    circleColorClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";
    badgeColorClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";
    badgeText = "NO DISPONIBLE";
    iconComponent = <AlertTriangle size={32} className="text-rose-400" />;
  } else if (isReserved) {
    themeBgClass = "bg-amber-500/5";
    circleColorClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    badgeColorClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    badgeText = "RESERVADO";
    iconComponent = <Clock size={32} className="animate-pulse text-amber-300" />;
  }

  return (
    <div id="buyer-informative-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0b0625] border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl ${themeBgClass}`}></div>

        <div className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-inner border ${circleColorClass}`}>
            {iconComponent}
          </div>

          <div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${badgeColorClass}`}>
              Ticket #{buyerMessageModal.ticketNumber} - {badgeText}
            </span>
            <h3 className="text-lg font-bold font-display text-white mt-2">{buyerMessageModal.title}</h3>
            <p className="text-xs text-purple-200/80 leading-relaxed mt-2">{buyerMessageModal.message}</p>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            Volver a la Lista
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 5. SELLER RESERVATION MANAGEMENT MODAL (Actions on Reservation)
// ==========================================
interface SellerReservationManagementModalProps {
  sale: Sale;
  handleUpdateSaleStatus: (saleId: string, status: TicketStatus) => void;
  onClose: () => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export function SellerReservationManagementModal({
  sale,
  handleUpdateSaleStatus,
  onClose,
  showConfirm,
}: SellerReservationManagementModalProps) {
  let remainingText = "3h 00m";
  let isExpired = false;
  if (sale.reservedAt) {
    const expiryTime = new Date(sale.reservedAt).getTime() + 3 * 60 * 60 * 1000;
    const diffMs = expiryTime - Date.now();
    if (diffMs <= 0) {
      remainingText = "Expirado (Pendiente Purga)";
      isExpired = true;
    } else {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      remainingText = `${hours}h ${minutes}m`;
    }
  }
  
  const waText = `Hola ${sale.buyerName}, te contacto desde el Sistema de Rifa Profesional referente a tu reserva del Ticket #${sale.ticketNumber}. ¿Pudiste realizar el pago?`;
  const waUrl = `https://wa.me/${sale.phone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(waText)}`;

  return (
    <div id="seller-reservation-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0b0625] border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl border-slate-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-purple-950/60 pb-3">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center shadow-inner shrink-0 border border-amber-500/30">
              <Clock size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">Control de Reserva Temporal</h3>
              <p className="text-[11px] text-purple-300/80">Ticket #{sale.ticketNumber} — Pendiente de Pago</p>
            </div>
          </div>

          {/* Remaining Time Banner */}
          <div className={`p-3 rounded-2xl flex items-center justify-between border ${isExpired ? 'bg-rose-950/50 border-rose-900/40 text-rose-300' : 'bg-amber-950/40 border-amber-900/40 text-amber-300'}`}>
            <span className="text-xs font-semibold">Plazo de Validez:</span>
            <span className="font-mono font-bold text-xs bg-[#050212]/50 px-2.5 py-1 rounded-lg shadow-xs border border-purple-950/40 flex items-center gap-1 text-white">
              <Clock size={12} className={isExpired ? "" : "animate-spin"} />
              {remainingText}
            </span>
          </div>

          {/* Buyer details summary */}
          <div className="p-4 bg-[#050212]/40 rounded-2xl border border-purple-950/50 space-y-2.5 text-xs text-slate-300">
            <p className="text-[10px] text-purple-300/50 font-mono uppercase tracking-wider font-bold border-b border-purple-950/30 pb-1">Información del Solicitante</p>
            <div>
              <span className="text-purple-300/60 block text-[10px]">Nombre:</span>
              <strong className="text-white text-sm">{sale.buyerName}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-purple-300/60 block text-[10px]">Teléfono:</span>
                <span className="font-mono text-white">{sale.phone}</span>
              </div>
              <div>
                <span className="text-purple-300/60 block text-[10px]">Ciudad:</span>
                <span className="text-white">{sale.city}</span>
              </div>
            </div>
            <div>
              <span className="text-purple-300/60 block text-[10px]">Correo:</span>
              <span className="font-mono text-white break-all">{sale.email}</span>
            </div>
            <div>
              <span className="text-purple-300/60 block text-[10px]">Fecha Registro:</span>
              <span className="text-purple-200">{sale.date} a las {sale.time}</span>
            </div>
            {sale.notes && (
              <div>
                <span className="text-purple-300/60 block text-[10px]">Observaciones del solicitante:</span>
                <p className="bg-[#050212]/60 p-2 rounded-lg border border-purple-950/40 mt-1 text-purple-200 text-[11px] leading-relaxed italic">{sale.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button 
              onClick={() => {
                if (showConfirm) {
                  showConfirm(
                    '¿Confirmar Pago?',
                    `¿Deseas confirmar el pago del Ticket #${sale.ticketNumber}? Esta acción es definitiva y no podrá revertirse.`,
                    () => {
                      handleUpdateSaleStatus(sale.id, 'PAID');
                      onClose();
                    }
                  );
                } else if (confirm(`¿Deseas confirmar el pago del Ticket #${sale.ticketNumber}? Esta acción es definitiva y no podrá revertirse.`)) {
                  handleUpdateSaleStatus(sale.id, 'PAID');
                  onClose();
                }
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer border border-purple-500/30 active:scale-95"
            >
              <UserCheck size={14} /> Confirmar Pago
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a 
                href={waUrl}
                target="_blank"
                referrerPolicy="no-referrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer text-center active:scale-95"
              >
                WhatsApp
              </a>
              <button 
                type="button"
                onClick={() => {
                  if (showConfirm) {
                    showConfirm(
                      '¿Cancelar Reserva?',
                      `¿Desea cancelar y liberar la reserva del Ticket #${sale.ticketNumber}? Esta acción devolverá el número al estado disponible.`,
                      () => {
                        handleUpdateSaleStatus(sale.id, 'CANCELLED');
                        onClose();
                      }
                    );
                  } else if (confirm(`¿Desea cancelar y liberar la reserva del Ticket #${sale.ticketNumber}? Esta acción devolverá el número al estado disponible.`)) {
                    handleUpdateSaleStatus(sale.id, 'CANCELLED');
                    onClose();
                  }
                }}
                className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                Cancelar Reserva
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 6. SELLER SOLD TICKET DETAILS MODAL (Read-Only Info)
// ==========================================
interface SellerSoldTicketDetailsModalProps {
  sale: Sale;
  onClose: () => void;
}

export function SellerSoldTicketDetailsModal({
  sale,
  onClose,
}: SellerSoldTicketDetailsModalProps) {
  return (
    <div id="seller-sold-ticket-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0b0625] border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-purple-950/60 pb-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center shadow-inner shrink-0 border border-emerald-500/30">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">Detalles de Ticket Pagado</h3>
              <p className="text-[11px] text-purple-300/80">Ticket #{sale.ticketNumber} — Registro Inmutable</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="p-4 bg-[#050212]/40 rounded-2xl border border-purple-950/50 space-y-2.5 text-xs text-slate-300">
            <p className="text-[10px] text-purple-300/50 font-mono uppercase tracking-wider font-bold border-b border-purple-950/30 pb-1">Datos de Venta Autorizada</p>
            <div>
              <span className="text-purple-300/60 block text-[10px]">Titular:</span>
              <strong className="text-white text-sm">{sale.buyerName}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-purple-300/60 block text-[10px]">Contacto:</span>
                <span className="font-mono text-white">{sale.phone}</span>
              </div>
              <div>
                <span className="text-purple-300/60 block text-[10px]">Ubicación:</span>
                <span className="text-white">{sale.city}</span>
              </div>
            </div>
            <div>
              <span className="text-purple-300/60 block text-[10px]">Reserva con tu Asesor Favorito:</span>
              <span className="font-semibold text-pink-400">{sale.sellerName || 'Asesor Directo'}</span>
            </div>
            <div>
              <span className="text-purple-300/60 block text-[10px]">Fecha Registro Completo:</span>
              <span className="text-purple-200">{sale.date} a las {sale.time}</span>
            </div>
            {sale.notes && (
              <div>
                <span className="text-purple-300/60 block text-[10px]">Notas:</span>
                <p className="bg-[#050212]/60 p-2 rounded-lg border border-purple-950/40 mt-1 text-purple-200 text-[11px] italic">{sale.notes}</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10.5px] text-emerald-300 leading-normal flex items-start gap-1.5">
            <ShieldAlert size={14} className="shrink-0 text-emerald-400 mt-0.5" />
            <span>Este cupo ha sido completamente validado. Según las políticas de transparencia e inmutabilidad, esta venta no puede alterarse ni cancelarse.</span>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 7. PAYMENT SUCCESS MODAL (WhatsApp congratulations templates)
// ==========================================
interface PaymentSuccessModalProps {
  sale: Sale;
  activeRaffle: Raffle | null;
  onClose: () => void;
}

export function PaymentSuccessModal({
  sale,
  activeRaffle,
  onClose,
}: PaymentSuccessModalProps) {
  // Fetch drawing details from active raffle
  const drawDateStr = activeRaffle?.drawDate ? activeRaffle.drawDate : '';
  const drawTimeStr = activeRaffle?.drawTime ? activeRaffle.drawTime : '';
  const liveUrl = activeRaffle?.liveStreamUrl ? activeRaffle.liveStreamUrl : '';

  let drawInfoBlock = '';
  if (drawDateStr || drawTimeStr) {
    const [year, month, day] = drawDateStr ? drawDateStr.split('-') : ['', '', ''];
    const formattedDate = (day && month && year) ? `${day}/${month}/${year}` : drawDateStr;
    
    drawInfoBlock = `\n\n📅 *Fecha y Hora del Sorteo:*
Se llevará a cabo el día *${formattedDate}* a las *${drawTimeStr || 'N/A'}*. ¡Marca tu calendario!`;
  }

  let liveStreamBlock = '';
  if (liveUrl) {
    liveStreamBlock = `\n\n🎥 *Transmisión en Vivo:*
Sigue el sorteo en directo y no te pierdas la transmisión a través de este enlace oficial:
🔗 ${liveUrl}`;
  }

  const congratulatoryText = `✨ ¡Felicitaciones, *${sale.buyerName}*! Tu cupo ha sido verificado y activado con éxito. ✨

¡Hola! Queremos informarte que tu pago para la Rifa en el Sistema de Rifa Profesional ha sido validado con éxito. Aquí tienes los detalles oficiales de tu ticket:
  
🎟️ *Ticket Adquirido:* #${sale.ticketNumber}
👤 *Titular Oficial:* ${sale.buyerName}
📞 *Contacto:* ${sale.phone}
📍 *Ubicación:* ${sale.city || 'No especificada'}
💼 *Asesor:* ${sale.sellerName || 'Asesor Directo'}${drawInfoBlock}${liveStreamBlock}

¡Te deseamos el mayor de los éxitos en este gran sorteo! Tu participación ha sido registrada oficialmente. ¡Mucha suerte! 🍀🤞`;

  const cleanPhone = sale.phone.replace(/\+/g, '').replace(/\s/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(congratulatoryText)}`;

  return (
    <div id="payment-success-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0b0625] border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center shadow-inner border border-emerald-500/30">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30">
              ¡Pago Confirmado!
            </span>
            <h3 className="text-lg font-bold font-display text-white mt-2">Ticket #{sale.ticketNumber} Activado</h3>
            <p className="text-xs text-purple-200/80 leading-relaxed mt-2">
              El pago para el cupo de <strong>{sale.buyerName}</strong> ha sido verificado y registrado exitosamente en el Sistema de Rifa Profesional.
            </p>
          </div>

          {/* Message preview details box */}
          <div className="p-4 bg-[#050212]/40 rounded-2xl border border-purple-950/50 text-left text-xs space-y-1.5 text-slate-300">
            <p className="text-[10px] text-purple-300/50 font-bold uppercase tracking-wider mb-1.5 border-b border-purple-950/30 pb-1">Detalles del Cupo</p>
            <p>👤 <strong>Titular:</strong> {sale.buyerName}</p>
            <p>📞 <strong>Contacto:</strong> {sale.phone}</p>
            <p>🎟️ <strong>Ticket:</strong> #{sale.ticketNumber}</p>
            <p>💼 <strong>Asesor:</strong> {sale.sellerName || 'Asesor Directo'}</p>
            {activeRaffle?.drawDate && (
              <p>📅 <strong>Sorteo:</strong> {activeRaffle.drawDate.split('-').reverse().join('/')} a las {activeRaffle.drawTime || 'N/A'}</p>
            )}
            {activeRaffle?.liveStreamUrl && (
              <p className="truncate">🎥 <strong>Transmisión:</strong> <a href={activeRaffle.liveStreamUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{activeRaffle.liveStreamUrl}</a></p>
            )}
          </div>

          {/* Call to action button to send WhatsApp message */}
          <div className="space-y-2 pt-2">
            <a 
              href={waUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer text-center"
            >
              Enviar Felicitación WhatsApp
            </a>
            <button 
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Unused default export to resolve modular import requirements in the central app layout.
 * The individual modals inside this file are imported as named exports when needed.
 */
export default function Modals() {
  return null;
}
