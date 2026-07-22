/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Clock, Plus, ShieldAlert, X, Palette, Edit2, Lock } from 'lucide-react';
import { Raffle, GLOBAL_CURRENCIES } from '../../types';

interface ConfigSectionProps {
  activeRaffle: Raffle | null;
  adminConfigForm: {
    maxFailedAttempts: number;
    commissionPercentage?: number;
    currency?: string;
  };
  setAdminConfigForm: (f: any) => void;
  handleConfigUpdate: (e?: React.FormEvent, customForm?: any) => void;
  raffleConfigForm: {
    prize: string;
    drawDate: string;
    drawTime: string;
    liveStreamUrl: string;
    ticketPrice: number;
    totalNumbers?: number;
    salesCutoffDate?: string;
    salesCutoffTime?: string;
    prizes?: any[];
    salesEnabled?: boolean;
    autoTombola?: boolean;
  };
  setRaffleConfigForm: (f: any) => void;
  handleRaffleUpdate: (e?: React.FormEvent, customForm?: any) => void;
  raffleUpdateMsg: string;
  isUpdatingRaffle: boolean;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    username: string;
    details: string;
    action: string;
  }>;
  handleLaunchRaffle?: () => void;
}

export default function ConfigSection({
  activeRaffle,
  adminConfigForm,
  setAdminConfigForm,
  handleConfigUpdate,
  raffleConfigForm,
  setRaffleConfigForm,
  handleRaffleUpdate,
  raffleUpdateMsg,
  isUpdatingRaffle,
  auditLogs,
  handleLaunchRaffle,
}: ConfigSectionProps) {
  const [isSystemBrandingModalOpen, setIsSystemBrandingModalOpen] = useState(false);
  const [isActiveRaffleModalOpen, setIsActiveRaffleModalOpen] = useState(false);

  // Local temporary form states so changes are NOT applied while typing, ONLY when pressing Guardar
  const [localAdminForm, setLocalAdminForm] = useState(adminConfigForm);
  const [localRaffleForm, setLocalRaffleForm] = useState(raffleConfigForm);

  const openSystemBrandingModal = () => {
    setLocalAdminForm({ ...adminConfigForm });
    setIsSystemBrandingModalOpen(true);
  };

  const openActiveRaffleModal = () => {
    setLocalRaffleForm({
      ...raffleConfigForm,
      prizes: raffleConfigForm.prizes
        ? JSON.parse(JSON.stringify(raffleConfigForm.prizes))
        : [
            { name: raffleConfigForm.prize, description: 'Premio Principal', enabled: true, order: 1, budget: 0 },
            { name: '', description: 'Segundo Premio', enabled: false, order: 2, budget: 0 },
            { name: '', description: 'Tercer Premio', enabled: false, order: 3, budget: 0 }
          ]
    });
    setIsActiveRaffleModalOpen(true);
  };

  const prizesForSummary = raffleConfigForm.prizes || [
    { name: raffleConfigForm.prize, description: 'Premio Principal', enabled: true, order: 1, budget: 0 },
    { name: '', description: 'Segundo Premio', enabled: false, order: 2, budget: 0 },
    { name: '', description: 'Tercer Premio', enabled: false, order: 3, budget: 0 }
  ];

  const prizesForLocalForm = localRaffleForm.prizes || [
    { name: localRaffleForm.prize, description: 'Premio Principal', enabled: true, order: 1, budget: 0 },
    { name: '', description: 'Segundo Premio', enabled: false, order: 2, budget: 0 },
    { name: '', description: 'Tercer Premio', enabled: false, order: 3, budget: 0 }
  ];

  const handleLocalPrizeToggle = (index: number, enabled: boolean) => {
    const currentPrizes = [...prizesForLocalForm];
    while (currentPrizes.length <= index) {
      currentPrizes.push({
        id: `prize-${Date.now()}-${currentPrizes.length + 1}`,
        name: '',
        description: `Premio ${currentPrizes.length + 1}`,
        enabled: false,
        order: currentPrizes.length + 1,
        budget: 0
      });
    }
    currentPrizes[index].enabled = enabled;
    if (!enabled) {
      currentPrizes[index].name = '';
      currentPrizes[index].budget = 0;
    }
    setLocalRaffleForm({ ...localRaffleForm, prizes: currentPrizes });
  };

  const handleLocalPrizeNameChange = (index: number, name: string) => {
    const currentPrizes = [...prizesForLocalForm];
    while (currentPrizes.length <= index) {
      currentPrizes.push({
        id: `prize-${Date.now()}-${currentPrizes.length + 1}`,
        name: '',
        description: `Premio ${currentPrizes.length + 1}`,
        enabled: false,
        order: currentPrizes.length + 1,
        budget: 0
      });
    }
    currentPrizes[index].name = name;
    if (index === 0) {
      setLocalRaffleForm({ ...localRaffleForm, prize: name, prizes: currentPrizes });
    } else {
      setLocalRaffleForm({ ...localRaffleForm, prizes: currentPrizes });
    }
  };

  const handleLocalPrizeBudgetChange = (index: number, budget: number) => {
    const currentPrizes = [...prizesForLocalForm];
    while (currentPrizes.length <= index) {
      currentPrizes.push({
        id: `prize-${Date.now()}-${currentPrizes.length + 1}`,
        name: '',
        description: `Premio ${currentPrizes.length + 1}`,
        enabled: false,
        order: currentPrizes.length + 1,
        budget: 0
      });
    }
    currentPrizes[index].budget = budget;
    setLocalRaffleForm({ ...localRaffleForm, prizes: currentPrizes });
  };

  return (
    <motion.div 
      id="organizer-config-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Form Card (Summary Mode) */}
        <div className="bg-slate-900 border border-slate-800 text-white p-6 shadow-xl flex flex-col justify-between rounded-3xl">
          <div>
            <h3 className="text-base font-black font-display text-white mb-3 flex items-center gap-2">
              <Settings size={18} className="text-pink-500" />
              Ajustes del Sistema
            </h3>
            <p className="text-xs text-slate-400 mb-5">Configura las reglas de seguridad de inicio de sesión, comisión y moneda.</p>
            
            <div className="space-y-3.5 border-t border-slate-850 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Intentos de Login Permitidos</span>
                <span className="text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">{adminConfigForm.maxFailedAttempts} intentos</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Comisión del Colaborador</span>
                <span className="text-xs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full">{adminConfigForm.commissionPercentage ?? 10}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Moneda Preferida</span>
                <span className="text-xs font-semibold text-slate-300 uppercase bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">{adminConfigForm.currency || 'USD'}</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={openSystemBrandingModal}
            className="w-full mt-6 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Settings size={14} className="text-pink-500" />
            Configurar Reglas del Sistema
          </button>
        </div>

        {/* Raffle Config Card (Summary Mode) */}
        <div className="bg-slate-900 border border-slate-800 text-white p-6 shadow-xl flex flex-col justify-between rounded-3xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black font-display text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                Sorteo Activo y Premios
              </h3>

              {/* Status Badge */}
              {activeRaffle?.status === 'DRAFT' ? (
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  🔴 DESACTIVADO (OFF)
                </span>
              ) : raffleConfigForm.salesEnabled !== false ? (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  🟢 ACTIVADO (REGISTROS ACTIVOS)
                </span>
              ) : (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ⏸️ PAUSADO (REGISTROS DETENIDOS)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {activeRaffle?.status === 'DRAFT' 
                ? 'El sorteo inicia desactivado. Pulsa "Lanzar Juego Activo" para activarlo por primera vez.' 
                : 'Detalles de la rifa activa, fecha de finalización y asignación de premios.'}
            </p>

            <div className="space-y-3.5 border-t border-slate-850 pt-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Premios Configurados:</span>
                <div className="space-y-1.5">
                  <div className="text-xs flex items-center justify-between font-semibold text-slate-200">
                    <span className="truncate">🏆 1. {raffleConfigForm.prize || 'No definido'}</span>
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">
                      {prizesForSummary[0]?.budget ? `${prizesForSummary[0].budget} ${adminConfigForm.currency || 'USD'}` : 'Sin costo'}
                    </span>
                  </div>
                  {prizesForSummary[1]?.enabled && (
                    <div className="text-xs flex items-center justify-between font-semibold text-slate-200">
                      <span className="truncate">🎁 2. {prizesForSummary[1]?.name || 'No definido'}</span>
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">
                        {prizesForSummary[1]?.budget ? `${prizesForSummary[1].budget} ${adminConfigForm.currency || 'USD'}` : 'Sin costo'}
                      </span>
                    </div>
                  )}
                  {prizesForSummary[2]?.enabled && (
                    <div className="text-xs flex items-center justify-between font-semibold text-slate-200">
                      <span className="truncate">🎁 3. {prizesForSummary[2]?.name || 'No definido'}</span>
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">
                        {prizesForSummary[2]?.budget ? `${prizesForSummary[2].budget} ${adminConfigForm.currency || 'USD'}` : 'Sin costo'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Fecha Sorteo</span>
                  <span className="text-xs font-semibold text-slate-200">{raffleConfigForm.drawDate || 'Sin fecha'} - {raffleConfigForm.drawTime || 'Sin hora'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Cierre Registros</span>
                  <span className="text-xs font-semibold text-rose-400">{raffleConfigForm.salesCutoffDate || 'Sin fecha'} - {raffleConfigForm.salesCutoffTime || 'Sin hora'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                <span className="text-xs text-slate-300 font-semibold">Precio por Boleto</span>
                <span className="text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
                  {raffleConfigForm.ticketPrice} {adminConfigForm.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 mt-6">
            <button 
              type="button"
              onClick={openActiveRaffleModal}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Edit2 size={13} className="text-pink-500" />
              Editar Sorteo y Premios
            </button>

            {/* Lanzar Juego Button */}
            {activeRaffle?.status === 'DRAFT' && handleLaunchRaffle && (
              <button
                type="button"
                onClick={handleLaunchRaffle}
                disabled={isUpdatingRaffle}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                🚀 Lanzar Juego Activo
              </button>
            )}
          </div>
        </div>

        {/* Integration Center Card */}
        <div className="bg-slate-900 border border-slate-800 text-white p-6 shadow-xl flex flex-col justify-between rounded-3xl">
          <div>
            <h3 className="text-base font-black font-display text-white mb-2 flex items-center gap-2">
              <Plus size={18} className="text-purple-500" />
              Módulo de Integración
            </h3>
            <p className="text-xs text-slate-400 mb-4">La arquitectura hexagonal y el patrón repository aseguran compatibilidad inmediata para producción.</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-white">Stripe & PayPal Gateways</p>
                <p className="text-[10px] text-slate-500 font-medium">Pasarelas de cobro internacional listas</p>
              </div>
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] px-2.5 py-1 rounded font-mono font-bold">PREPARADO</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-white">WhatsApp Business API</p>
                <p className="text-[10px] text-slate-500 font-medium">Notificaciones automáticas de compra</p>
              </div>
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] px-2.5 py-1 rounded font-mono font-bold">PREPARADO</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl">
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              💡 El sistema está completamente conectado en la nube y sincronizado en tiempo real a través de la integración nativa de Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* --- SYSTEM BRANDING MODAL --- */}
      <AnimatePresence>
        {isSystemBrandingModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="branding-modal-container">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden text-left text-white"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Settings size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-black font-display text-white">Ajustes del Sistema</h3>
                    <p className="text-[10px] text-slate-400">Comisión y Seguridad</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsSystemBrandingModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleConfigUpdate(e, localAdminForm);
                setIsSystemBrandingModalOpen(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Intentos de Login Permitidos</label>
                  <input 
                    type="number" 
                    min={3}
                    max={10}
                    value={localAdminForm.maxFailedAttempts}
                    onChange={(e) => setLocalAdminForm({ ...localAdminForm, maxFailedAttempts: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Porcentaje de Comisión del Colaborador (%)</label>
                  <input 
                    type="number" 
                    min={0}
                    max={100}
                    value={localAdminForm.commissionPercentage ?? 10}
                    onChange={(e) => setLocalAdminForm({ ...localAdminForm, commissionPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Moneda Preferida de la App</label>
                  <select
                    value={localAdminForm.currency || 'USD'}
                    onChange={(e) => setLocalAdminForm({ ...localAdminForm, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                  >
                    {GLOBAL_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                        {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setIsSystemBrandingModalOpen(false)}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACTIVE RAFFLE MODAL --- */}
      <AnimatePresence>
        {isActiveRaffleModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="active-raffle-modal-container">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto text-left text-white"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-black font-display text-white">Detalles de Sorteo</h3>
                    <p className="text-[10px] text-slate-400">Premios, Horarios y Costos</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsActiveRaffleModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {activeRaffle?.status === 'ACTIVE' && (
                <div className="mb-4 p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl flex items-start gap-2 text-xs text-purple-300">
                  <Lock size={16} className="shrink-0 mt-0.5 text-purple-400" />
                  <p className="leading-relaxed">
                    <strong>Sorteo Oficial Activado:</strong> Una vez activado, el sorteo no se puede apagar ni devolver a modo borrador. Utilice el interruptor de recepción de registros a continuación si necesita pausarlo temporalmente.
                  </p>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                handleRaffleUpdate(e, localRaffleForm);
                setIsActiveRaffleModalOpen(false);
              }} className="space-y-4">
                <div className="space-y-3.5">
                  {/* Premium Prizes Form */}
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-3">
                    <h4 className="text-[11px] font-bold text-pink-400 flex items-center gap-1">
                      <Palette size={12} /> Premios del Sorteo (Hasta 3)
                    </h4>
                    
                    {/* Prize 1 */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-300">1er Premio (Principal)</label>
                      <input 
                        type="text" 
                        value={localRaffleForm.prize}
                        onChange={(e) => handleLocalPrizeNameChange(0, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        placeholder="Ej. Tesla Model 3 2026"
                        required
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">Presupuesto ({adminConfigForm.currency || 'USD'}):</span>
                        <input 
                          type="number"
                          min={0}
                          step="0.01"
                          value={prizesForLocalForm[0]?.budget || 0}
                          onChange={(e) => handleLocalPrizeBudgetChange(0, parseFloat(e.target.value) || 0)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-white w-24 font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Prize 2 */}
                    <div className="space-y-1 border-t border-slate-850 pt-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-semibold text-slate-300">2do Premio (Opcional)</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={prizesForLocalForm[1]?.enabled || false}
                            onChange={(e) => handleLocalPrizeToggle(1, e.target.checked)}
                            className="rounded border-slate-850 bg-slate-900 text-pink-500 focus:ring-pink-500 w-3 h-3 cursor-pointer"
                          />
                          <span className="text-[9px] text-slate-400 font-semibold select-none">Habilitar</span>
                        </label>
                      </div>
                      {(prizesForLocalForm[1]?.enabled) && (
                        <>
                          <input 
                            type="text" 
                            value={prizesForLocalForm[1]?.name || ''}
                            onChange={(e) => handleLocalPrizeNameChange(1, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                            placeholder="Ej. iPhone 17 Pro Max"
                            required={prizesForLocalForm[1]?.enabled}
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Presupuesto ({adminConfigForm.currency || 'USD'}):</span>
                            <input 
                              type="number"
                              min={0}
                              step="0.01"
                              value={prizesForLocalForm[1]?.budget || 0}
                              onChange={(e) => handleLocalPrizeBudgetChange(1, parseFloat(e.target.value) || 0)}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-white w-24 font-bold focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Prize 3 */}
                    <div className="space-y-1 border-t border-slate-850 pt-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-semibold text-slate-300">3er Premio (Opcional)</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={prizesForLocalForm[2]?.enabled || false}
                            onChange={(e) => handleLocalPrizeToggle(2, e.target.checked)}
                            className="rounded border-slate-850 bg-slate-900 text-pink-500 focus:ring-pink-500 w-3 h-3 cursor-pointer"
                          />
                          <span className="text-[9px] text-slate-400 font-semibold select-none">Habilitar</span>
                        </label>
                      </div>
                      {(prizesForLocalForm[2]?.enabled) && (
                        <>
                          <input 
                            type="text" 
                            value={prizesForLocalForm[2]?.name || ''}
                            onChange={(e) => handleLocalPrizeNameChange(2, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                            placeholder="Ej. MacBook Pro M4"
                            required={prizesForLocalForm[2]?.enabled}
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Presupuesto ({adminConfigForm.currency || 'USD'}):</span>
                            <input 
                              type="number"
                              min={0}
                              step="0.01"
                              value={prizesForLocalForm[2]?.budget || 0}
                              onChange={(e) => handleLocalPrizeBudgetChange(2, parseFloat(e.target.value) || 0)}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-white w-24 font-bold focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Fecha del Sorteo</label>
                      <input 
                        type="date" 
                        value={localRaffleForm.drawDate}
                        onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, drawDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Hora del Sorteo</label>
                      <input 
                        type="time" 
                        value={localRaffleForm.drawTime}
                        onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, drawTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        required
                      />
                    </div>
                  </div>

                  {/* Pause / Resume Sales Override Switch */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-pink-400 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${localRaffleForm.salesEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                        Recepción de Registros ({localRaffleForm.salesEnabled !== false ? 'ACTIVADA' : 'PAUSADA'})
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                        {localRaffleForm.salesEnabled !== false 
                          ? 'Registros ACTIVOS en línea y para colaboradores.' 
                          : 'Registros PAUSADOS temporalmente por el organizador.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                      <input 
                        type="checkbox" 
                        checked={localRaffleForm.salesEnabled !== false}
                        onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, salesEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <div>
                      <label className="block text-[11px] font-bold text-pink-400 mb-1">Cierre Registros (Fecha)</label>
                      <input 
                        type="date" 
                        value={localRaffleForm.salesCutoffDate || ''}
                        onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, salesCutoffDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-pink-400 mb-1">Cierre Registros (Hora)</label>
                      <input 
                        type="time" 
                        value={localRaffleForm.salesCutoffTime || ''}
                        onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, salesCutoffTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        required
                      />
                    </div>
                    <p className="col-span-2 text-[10px] text-slate-400 leading-relaxed">
                      * Al cumplirse este tiempo, la venta/reserva se cerrará y los números reservados se liberarán automáticamente.
                    </p>
                  </div>

                  {/* Automatic Tombola Switch */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
                        🎰 Ejecución de Tómbola Virtual ({localRaffleForm.autoTombola !== false ? 'AUTOMÁTICA' : 'MANUAL / EXTERNA'})
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                        {localRaffleForm.autoTombola !== false
                          ? 'Al cumplirse la hora programada del sorteo, la tómbola virtual girará automáticamente para cerrar el ciclo de juego.'
                          : 'Desactivado. Permite realizar el sorteo en otra app o tómbola física externa e ingresar manualmente el número ganador para cerrar el ciclo del juego.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                      <input 
                        type="checkbox" 
                        checked={localRaffleForm.autoTombola !== false}
                        onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, autoTombola: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Enlace de Transmisión en Vivo</label>
                    <input 
                      type="url" 
                      value={localRaffleForm.liveStreamUrl}
                      onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, liveStreamUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      placeholder="https://youtube.com/live/..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Precio por Boleto ({adminConfigForm.currency || 'USD'})</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={localRaffleForm.ticketPrice}
                      onChange={(e) => setLocalRaffleForm({ ...localRaffleForm, ticketPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  {raffleUpdateMsg && (
                    <p className={`text-[11px] font-semibold mb-2 ${raffleUpdateMsg.includes('éxito') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {raffleUpdateMsg}
                    </p>
                  )}

                  <div className="flex gap-2 border-t border-slate-800 pt-3">
                    <button 
                      type="button"
                      onClick={() => setIsActiveRaffleModalOpen(false)}
                      className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isUpdatingRaffle}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingRaffle ? 'Guardando...' : 'Guardar Sorteo'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Logs full width inside config */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/40">
        <h3 className="text-base font-black font-display text-white mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
          <ShieldAlert size={18} className="text-pink-500" />
          Registro de Auditoría & Seguridad (Inmutable Cloud Logs)
        </h3>
        
        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-3 shadow-sm">
              <span className="text-[9px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded shrink-0 mt-0.5 font-bold">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <div>
                <p className="text-xs text-slate-200"><span className="font-bold font-mono text-pink-400">{log.username}</span>: {log.details}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Acción: {log.action} &bull; Trazabilidad: JWT_SHA256 &bull; Estado: OK</p>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6 italic">No hay logs de auditoría disponibles.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
