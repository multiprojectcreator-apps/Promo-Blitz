/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, AlertTriangle, Trash2, Key, Link2, Share2, X } from 'lucide-react';
import { Seller, Raffle } from '../../types';

interface Interval {
  start: number;
  end: number;
}

function getFreeIntervals(totalNumbers: number, sellers: { assignedRangeStart: number; assignedRangeEnd: number }[]): Interval[] {
  let freeIntervals: Interval[] = [{ start: 1, end: totalNumbers }];

  for (const seller of sellers) {
    const nextFreeIntervals: Interval[] = [];
    const sStart = seller.assignedRangeStart;
    const sEnd = seller.assignedRangeEnd;

    for (const interval of freeIntervals) {
      if (sStart > interval.end || sEnd < interval.start) {
        nextFreeIntervals.push(interval);
      } else {
        if (sStart > interval.start) {
          nextFreeIntervals.push({ start: interval.start, end: sStart - 1 });
        }
        if (sEnd < interval.end) {
          nextFreeIntervals.push({ start: sEnd + 1, end: interval.end });
        }
      }
    }
    freeIntervals = nextFreeIntervals;
  }

  return freeIntervals.sort((a, b) => a.start - b.start);
}

function getAvailableRangesForSize(freeIntervals: Interval[], size: number): Interval[] {
  const chunks: Interval[] = [];
  for (const interval of freeIntervals) {
    let currentStart = interval.start;
    while (currentStart + size - 1 <= interval.end) {
      chunks.push({
        start: currentStart,
        end: currentStart + size - 1
      });
      currentStart += size;
    }
  }
  return chunks;
}

interface SellersSectionProps {
  sellers: Seller[];
  activeRaffle: Raffle | null;
  isCreatingSeller: boolean;
  setIsCreatingSeller: (b: boolean) => void;
  newSellerUser: {
    name: string;
    assignedRangeStart: number;
    assignedRangeEnd: number;
  };
  setNewSellerUser: (u: any) => void;
  sellerCrudError: string;
  handleCreateSellerSubmit: (e: React.FormEvent) => void;
  handleDeleteSeller: (id: string) => void;
  handleBlockSeller: (id: string, currentStatus: string) => void;
}

export default function SellersSection({
  sellers,
  activeRaffle,
  isCreatingSeller,
  setIsCreatingSeller,
  newSellerUser,
  setNewSellerUser,
  sellerCrudError,
  handleCreateSellerSubmit,
  handleDeleteSeller,
  handleBlockSeller,
}: SellersSectionProps) {
  // Local state for auto-range calculations
  const [rangeMode, setRangeMode] = React.useState<string>('50');
  const [selectedRangeOption, setSelectedRangeOption] = React.useState<string>('');

  const totalNumbers = activeRaffle?.totalNumbers || 1000;

  // Compute free intervals and chunks inside the render body for display
  const freeIntervals = React.useMemo(() => {
    return getFreeIntervals(totalNumbers, sellers);
  }, [totalNumbers, sellers]);

  const rangeSize = rangeMode === 'custom' ? 0 : (parseInt(rangeMode) || 50);

  const availableChunks = React.useMemo(() => {
    if (rangeSize === 0) return [];
    return getAvailableRangesForSize(freeIntervals, rangeSize);
  }, [freeIntervals, rangeSize]);

  // Handle changes to the rangeMode selector
  const handleRangeModeChange = (mode: string) => {
    setRangeMode(mode);
    if (mode === 'custom') {
      setSelectedRangeOption('');
    } else {
      const size = parseInt(mode) || 50;
      const chunks = getAvailableRangesForSize(freeIntervals, size);
      if (chunks.length > 0) {
        const first = chunks[0];
        const optVal = `${first.start}-${first.end}`;
        setSelectedRangeOption(optVal);
        setNewSellerUser({
          ...newSellerUser,
          assignedRangeStart: first.start,
          assignedRangeEnd: first.end
        });
      } else {
        setSelectedRangeOption('');
        setNewSellerUser({
          ...newSellerUser,
          assignedRangeStart: 0,
          assignedRangeEnd: 0
        });
      }
    }
  };

  // Handle changes to the available range dropdown options
  const handleRangeOptionChange = (optionStr: string) => {
    setSelectedRangeOption(optionStr);
    if (optionStr) {
      const [startStr, endStr] = optionStr.split('-');
      const start = parseInt(startStr) || 0;
      const end = parseInt(endStr) || 0;
      setNewSellerUser({
        ...newSellerUser,
        assignedRangeStart: start,
        assignedRangeEnd: end
      });
    }
  };

  // Sync state cleanly when the modal is opened or size parameters change
  React.useEffect(() => {
    if (isCreatingSeller && rangeMode !== 'custom') {
      const size = parseInt(rangeMode) || 50;
      const intervals = getFreeIntervals(totalNumbers, sellers);
      const chunks = getAvailableRangesForSize(intervals, size);
      if (chunks.length > 0) {
        const currentMatch = chunks.find(c => `${c.start}-${c.end}` === selectedRangeOption);
        if (!currentMatch) {
          const first = chunks[0];
          setSelectedRangeOption(`${first.start}-${first.end}`);
          setNewSellerUser(prev => ({
            ...prev,
            assignedRangeStart: first.start,
            assignedRangeEnd: first.end
          }));
        }
      } else {
        setSelectedRangeOption('');
        setNewSellerUser(prev => ({
          ...prev,
          assignedRangeStart: 0,
          assignedRangeEnd: 0
        }));
      }
    }
  }, [isCreatingSeller, rangeMode, sellers.length, totalNumbers, selectedRangeOption]);
  return (
    <motion.div 
      id="organizer-sellers-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 1. SECTION HEADER CONTAINER */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
              Control de Licencias y Colaboradores
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white mt-3">
              Asesores & Licencias
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed mt-1">
              Gestione las licencias de distribución y controle los códigos de vinculación para sus asesores y colaboradores. Cada licencia libre posee un rango de boletos exclusivo.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsCreatingSeller(true)}
            className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2 text-xs cursor-pointer border border-purple-500/30"
          >
            <Plus size={14} /> Generar Nueva Licencia
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/40">
        <AnimatePresence>
          {isCreatingSeller && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="create-license-modal-container">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden text-left"
              >
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                      <Key size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-black font-display text-white">Nueva Licencia de Colaborador</h3>
                      <p className="text-[10px] text-slate-400">Generación y reservación de rango único</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingSeller(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  handleCreateSellerSubmit(e);
                }} className="space-y-4">
                  {sellerCrudError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>{sellerCrudError}</p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-purple-950/20 border border-purple-500/15 rounded-xl text-[11px] text-slate-300 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1 text-purple-300">🛡️ Licencia Libre (Software License):</p>
                    <p>Genera un cupo desvinculado con un rango exclusivo de boletos. El sistema producirá un <strong>Código de Vinculación Único</strong> que le podrás pasar a cualquier persona para que se registre como colaborador de manera autónoma, heredando este rango automáticamente.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nombre de Referencia / Identificador de la Licencia</label>
                    <input 
                      type="text"
                      required
                      value={newSellerUser.name}
                      onChange={(e) => setNewSellerUser({ ...newSellerUser, name: e.target.value })}
                      placeholder="ej. Licencia de Distribución - Zona Norte"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      📊 Configuración de Rango de Boletos
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Cantidad de Números para la Licencia
                      </label>
                      <select
                        value={rangeMode}
                        onChange={(e) => handleRangeModeChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="50">50 números</option>
                        <option value="100">100 números</option>
                        <option value="150">150 números</option>
                        <option value="200">200 números</option>
                        <option value="250">250 números</option>
                        <option value="300">300 números</option>
                        <option value="500">500 números</option>
                        <option value="1000">1000 números</option>
                        <option value="custom">Rango Personalizado (Manual)</option>
                      </select>
                    </div>

                    {rangeMode !== 'custom' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Seleccionar Rango Disponible ({availableChunks.length} libres)
                        </label>
                        {availableChunks.length > 0 ? (
                          <select
                            value={selectedRangeOption}
                            onChange={(e) => handleRangeOptionChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer font-mono"
                          >
                            {availableChunks.map((chunk) => (
                              <option key={`${chunk.start}-${chunk.end}`} value={`${chunk.start}-${chunk.end}`}>
                                {chunk.start} al {chunk.end}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] rounded-xl flex items-start gap-1">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <p>No hay rangos continuos de {rangeMode} números disponibles. Elige una cantidad menor o usa el modo manual.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display of chosen or custom ranges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Rango Inicial</label>
                        <input
                          type="number"
                          required
                          min={1}
                          disabled={rangeMode !== 'custom'}
                          value={newSellerUser.assignedRangeStart || ''}
                          onChange={(e) => setNewSellerUser({ ...newSellerUser, assignedRangeStart: parseInt(e.target.value) || 0 })}
                          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 ${rangeMode !== 'custom' ? 'opacity-60 cursor-not-allowed bg-slate-900/40 text-purple-300 font-bold' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Rango Final</label>
                        <input
                          type="number"
                          required
                          min={1}
                          disabled={rangeMode !== 'custom'}
                          value={newSellerUser.assignedRangeEnd || ''}
                          onChange={(e) => setNewSellerUser({ ...newSellerUser, assignedRangeEnd: parseInt(e.target.value) || 0 })}
                          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 ${rangeMode !== 'custom' ? 'opacity-60 cursor-not-allowed bg-slate-900/40 text-purple-300 font-bold' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingSeller(false)}
                      className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                    >
                      Generar Licencia
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <p className="text-xs text-slate-400">Supervise y gestione las licencias y los colaboradores de la rifa. Las licencias libres pueden ser vinculadas en cualquier momento por colaboradores usando el código único.</p>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {sellers.map((s, index) => {
              const isLinked = !!s.userId;
              const sUsername = s.username || 'Por registrar';
              const sLink = isLinked ? `${window.location.origin}${window.location.pathname}?vendedor=${sUsername}` : '';
              const sQRUrl = isLinked ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=059669&data=${encodeURIComponent(sLink)}` : '';
              return (
                <motion.div 
                  key={`${s.id}-${index}`} 
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={`p-4 sm:p-5 border rounded-2xl flex flex-col justify-between shadow-xl space-y-3.5 transition-all cursor-pointer ${
                    isLinked 
                      ? 'bg-slate-950 border-slate-800 hover:border-pink-500/40 hover:shadow-pink-500/5' 
                      : 'bg-slate-950/60 border-purple-500/15 ring-1 ring-purple-500/10 hover:border-purple-500/40 hover:shadow-purple-500/5'
                  }`}
                >
                  {/* Card Header: Collaborator Name, Indicator & Action Buttons */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLinked ? 'bg-pink-500 shadow-sm shadow-pink-500/50' : 'bg-purple-500 animate-pulse shadow-sm shadow-purple-500/50'}`}></span>
                        <h4 className="text-sm sm:text-base font-bold text-white truncate font-display">{s.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 pl-4">ID: {s.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleBlockSeller(s.id, s.status || 'ACTIVE')}
                        className={`px-2.5 py-1 rounded-xl text-[9px] sm:text-[10px] uppercase font-black tracking-wider transition cursor-pointer border min-h-[28px] ${s.status === 'ACTIVE' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'}`}
                      >
                        {s.status === 'ACTIVE' ? 'Activo' : 'Bloqueado'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteSeller(s.id)}
                        className="text-slate-500 hover:text-rose-400 p-2 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                        title="Eliminar Licencia"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Card Main Info Block */}
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Rango Asignado:</span>
                      <strong className="text-white font-mono font-bold bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800 text-xs">#{s.assignedRangeStart} al #{s.assignedRangeEnd}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Estado:</span>
                      <span className={`font-bold text-[11px] ${isLinked ? 'text-pink-400' : 'text-purple-400 animate-pulse'}`}>
                        {isLinked ? 'VINCULADO (Cuenta activa)' : 'LICENCIA LIBRE (Listo para vincular)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 mt-1">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        <Key size={12} className="text-slate-500" /> CÓDIGO DE ENLACE:
                      </span>
                      <span className="font-mono font-bold text-[11px] bg-slate-950 text-pink-400 px-2.5 py-1 rounded-lg border border-slate-800 select-all tracking-wider">
                        {s.linkingCode}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: QR & Link Sharing */}
                  {isLinked ? (
                    <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                      <img 
                        src={sQRUrl} 
                        alt="Colaborador QR" 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl border border-slate-800 shrink-0 object-cover" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Enlace del Colaborador</p>
                        <p className="text-xs font-semibold text-slate-200 truncate font-mono mt-0.5">{sLink}</p>
                        <div className="flex gap-3 mt-1.5">
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(sLink);
                              alert("¡Enlace del colaborador copiado al portapapeles!");
                            }}
                            className="text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Link2 size={12} /> Copiar enlace
                          </button>
                          <a 
                            href={sQRUrl}
                            target="_blank"
                            rel="noreferrer"
                            referrerPolicy="no-referrer"
                            className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Share2 size={12} /> Ver QR grande
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-purple-300 leading-relaxed bg-purple-950/20 p-3 rounded-2xl border border-purple-900/30">
                      💡 Comparte el <strong>Código de Enlace</strong> anterior con la persona que vaya a ser tu colaborador para que se registre por sí misma.
                    </div>
                  )}
                </motion.div>
              );
            })}
            {sellers.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-8 text-slate-500 font-medium">
                No hay licencias registradas para esta rifa. Haga clic en "Generar Nueva Licencia" para comenzar.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
