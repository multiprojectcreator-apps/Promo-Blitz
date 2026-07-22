/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Users, Download, FileText, Search, Sparkles } from 'lucide-react';
import { Sale, Raffle, Seller } from '../../types';

interface SalesSectionProps {
  sales: Sale[];
  filteredSales: Sale[];
  sellers: Seller[];
  activeRaffle: Raffle | null;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sellerFilter: string;
  setSellerFilter: (s: string) => void;
  exportToCSV: (data: any[], title: string) => void;
  exportToPDF: (data: any[], title: string) => void;
}

export default function SalesSection({
  sales,
  filteredSales,
  sellers,
  activeRaffle,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sellerFilter,
  setSellerFilter,
  exportToCSV,
  exportToPDF,
}: SalesSectionProps) {
  return (
    <motion.div 
      id="organizer-sales-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Large Buyers log table (full width) */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/40">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="text-pink-500" size={18} />
              <h3 className="text-base font-black font-display text-white">
                Lista de Solicitantes (Orden Numérico)
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  const dataToExport = [...filteredSales].sort((a, b) => a.ticketNumber - b.ticketNumber);
                  exportToCSV(dataToExport, 'Sistema_Sorteo_Profesional_Solicitantes_Ordenado');
                }}
                className="bg-slate-950 hover:bg-slate-850 text-slate-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-800 transition cursor-pointer font-bold"
              >
                <Download size={14} /> CSV
              </button>
              <button 
                type="button"
                onClick={() => {
                  const dataToExport = [...filteredSales].sort((a, b) => a.ticketNumber - b.ticketNumber);
                  exportToPDF(dataToExport, activeRaffle?.prize || 'Premio de Sorteo');
                }}
                className="bg-slate-950 hover:bg-slate-850 text-slate-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-800 transition cursor-pointer font-bold"
              >
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>

          {/* Search & filters inside log */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <div className="relative col-span-1">
              <span className="absolute left-3 top-2.5 text-slate-500"><Search size={14} /></span>
              <input 
                type="text" 
                placeholder="Buscar ticket/solicitante..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-semibold"
              />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-sans focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PAID">Confirmado</option>
              <option value="RESERVED">Reservado</option>
              <option value="SOLD">Registrado (Sin confirmar)</option>
            </select>

            <select 
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-sans focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
            >
              <option value="ALL">Todos los Colaboradores</option>
              {sellers.map((s, index) => (
                <option key={`${s.id}-${index}`} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Buyers List (Ordered by Ticket number) */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-bold">
                  <th className="p-3">Ticket</th>
                  <th className="p-3">Solicitante</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Ciudad</th>
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Observaciones</th>
                  <th className="p-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredSales]
                  .sort((a, b) => a.ticketNumber - b.ticketNumber)
                  .map((s) => {
                    const vsellerName = sellers.find(sel => sel.id === s.sellerId)?.name || 'Directo (Sin Colaborador)';
                    return (
                      <tr key={s.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition">
                        <td className="p-3 font-mono font-black text-pink-400 text-sm">#{s.ticketNumber}</td>
                        <td className="p-3 text-white font-bold">{s.buyerName}</td>
                        <td className="p-3 font-mono text-slate-300">
                          <span className="block">{s.phone}</span>
                          <span className="text-slate-500 text-[11px]">{s.email}</span>
                        </td>
                        <td className="p-3 text-slate-300">{s.city}</td>
                        <td className="p-3 font-mono text-slate-300">
                          <span className="block">{s.date}</span>
                          <span className="text-slate-500 text-[11px]">{s.time}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-purple-500/10 text-purple-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-purple-500/20">
                            {vsellerName}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 max-w-[150px] truncate" title={s.notes}>
                          {s.notes || <span className="text-slate-500 italic">Sin observaciones</span>}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            s.status === 'PAID' 
                              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">
                      Ningún solicitante registrado coincide con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
