/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Award,
  Sparkles,
  Info,
  Layers,
  Download,
  FileSpreadsheet,
  Users,
  ChevronRight
} from 'lucide-react';
import { Sale, Raffle, AppConfig, Seller, formatPrice } from '../../types';

interface OrganizerSalesReportProps {
  sales: Sale[];
  sellers: Seller[];
  activeRaffle: Raffle | null;
  config: AppConfig | null;
}

export default function OrganizerSalesReport({
  sales,
  sellers,
  activeRaffle,
  config
}: OrganizerSalesReportProps) {
  const [selectedSellerId, setSelectedSellerId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'resumen' | 'comisiones' | 'proyeccion' | 'cierre'>('resumen');

  // Filter sales based on selected seller
  const filteredSales = selectedSellerId === 'ALL' 
    ? sales 
    : sales.filter(s => s.sellerId === selectedSellerId);

  const selectedSellerName = selectedSellerId === 'ALL'
    ? 'Todos los Colaboradores'
    : sellers.find(s => s.id === selectedSellerId)?.name || 'Colaborador Desconocido';

  // Status breakdown
  const confirmedSales = filteredSales.filter(s => s.status === 'PAID');
  const pendingSales = filteredSales.filter(s => s.status === 'RESERVED' || s.status === 'SOLD');

  // Pricing & values
  const ticketPrice = activeRaffle?.ticketPrice || 10;
  const commissionPercentage = config?.commissionPercentage ?? 10; // defaults to 10%

  // Calculations
  const totalTickets = filteredSales.length;
  const confirmedTickets = confirmedSales.length;
  const pendingTickets = pendingSales.length;

  const totalSalesVolume = totalTickets * ticketPrice;
  const confirmedSalesVolume = confirmedTickets * ticketPrice;
  const pendingSalesVolume = pendingTickets * ticketPrice;

  // Commission Calculations
  const totalCommissionEarned = confirmedSalesVolume * (commissionPercentage / 100);
  const totalCommissionPending = pendingSalesVolume * (commissionPercentage / 100);
  const totalCommissionPotential = totalSalesVolume * (commissionPercentage / 100);

  // --- CIERRE DE REPORTE CALCULATIONS ---
  const activePrizes = activeRaffle?.prizes || [];
  const resolvedPrizes = activePrizes.length > 0 ? activePrizes : [
    { id: '1', raffleId: activeRaffle?.id || '', name: activeRaffle?.prize || 'Premio Principal', enabled: true, order: 1, budget: 0 },
    { id: '2', raffleId: activeRaffle?.id || '', name: 'Segundo Premio', enabled: false, order: 2, budget: 0 },
    { id: '3', raffleId: activeRaffle?.id || '', name: 'Tercer Premio', enabled: false, order: 3, budget: 0 }
  ];

  const prizesBudgetSum = resolvedPrizes
    .filter(p => p.enabled)
    .reduce((sum, p) => sum + (p.budget || 0), 0);

  const confirmedProfit = confirmedSalesVolume - prizesBudgetSum - totalCommissionEarned;
  const potentialProfit = totalSalesVolume - prizesBudgetSum - totalCommissionPotential;

  // Group by City helper for analytics
  const citiesMap: Record<string, number> = {};
  filteredSales.forEach(s => {
    const city = s.city || 'Desconocida';
    citiesMap[city] = (citiesMap[city] || 0) + 1;
  });
  const topCities = Object.entries(citiesMap)
    .map(([name, count]) => ({ name, count, volume: count * ticketPrice }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // CSV Export for Organizer (includes Seller Name column)
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Boleto,Solicitante,Telefono,Ciudad,Estado,Colaborador,Precio,Comision\n';

    filteredSales.forEach(s => {
      const isPaid = s.status === 'PAID';
      const comm = isPaid ? ticketPrice * (commissionPercentage / 100) : 0;
      const sellerNameStr = s.sellerName || sellers.find(sel => sel.id === s.sellerId)?.name || 'Colaborador Asignado';
      csvContent += `${s.ticketNumber},"${s.buyerName}",${s.phone || ''},"${s.city || ''}",${s.status},"${sellerNameStr}",${ticketPrice},${comm.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Comisiones_Organizador_${selectedSellerName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="organizer-sales-report-component" className="space-y-6">
      {/* Selection Control Card */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 shadow-xl rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-black font-display text-white flex items-center gap-2">
            <Users size={16} className="text-pink-500 animate-pulse" />
            Segmentación de Reportes de Registros
          </h3>
          <p className="text-[11px] text-slate-400">
            Filtre por colaborador para auditar el desempeño individual, liquidar comisiones o exportar reportes detallados.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <select
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="w-full md:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">🌟 Todos los Colaboradores (Consolidado)</option>
            {sellers.map((s, index) => (
              <option key={`${s.id}-${index}`} value={s.id} className="bg-slate-900 text-white">
                👤 {s.name} (Boletos: {s.assignedRangeStart}-{s.assignedRangeEnd})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upper Navigation Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850 max-w-xl mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'resumen'
              ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp size={14} />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('comisiones')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'comisiones'
              ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Percent size={14} />
          Comisiones
        </button>
        <button
          onClick={() => setActiveTab('proyeccion')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'proyeccion'
              ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award size={14} />
          Proyecciones
        </button>
        <button
          onClick={() => setActiveTab('cierre')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cierre'
              ? 'bg-slate-900 text-white shadow-sm border border-slate-800 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet size={14} className="text-pink-500" />
          Reporte de Cierre
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* --- TAB A: RESUMEN DE VENTAS --- */}
        {activeTab === 'resumen' && (
          <motion.div
            key="tab-resumen"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6 text-left"
          >
            {/* Quick stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Confirmed Sales Card */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/20 border border-emerald-500/30 text-white p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                      Confirmadas y Pagadas
                    </span>
                    <CheckCircle className="text-emerald-400" size={18} />
                  </div>
                  <h4 className="text-2xl font-black font-display text-emerald-400 mt-3">
                    {confirmedTickets} <span className="text-xs font-bold text-emerald-300/80">Boletos</span>
                  </h4>
                </div>
                <div className="border-t border-emerald-500/20 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-[11px] text-emerald-300 font-semibold">Total Recaudado</span>
                  <span className="text-sm font-black text-emerald-400">{formatPrice(confirmedSalesVolume, config?.currency)}</span>
                </div>
              </div>

              {/* Pending Confirmation Sales Card */}
              <div className="bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border border-amber-500/30 text-white p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
                      Por Confirmar / Reservados
                    </span>
                    <Clock className="text-amber-400" size={18} />
                  </div>
                  <h4 className="text-2xl font-black font-display text-amber-400 mt-3">
                    {pendingTickets} <span className="text-xs font-bold text-amber-300/80">Boletos</span>
                  </h4>
                </div>
                <div className="border-t border-amber-500/20 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-[11px] text-amber-300 font-semibold">Monto en Espera</span>
                  <span className="text-sm font-black text-amber-400">{formatPrice(pendingSalesVolume, config?.currency)}</span>
                </div>
              </div>

              {/* Performance Indicator Card */}
              <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/20 border border-purple-500/30 text-white p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/25">
                      Progreso de Registros
                    </span>
                    <TrendingUp className="text-pink-400" size={18} />
                  </div>
                  <h4 className="text-2xl font-black font-display text-pink-400 mt-3">
                    {totalTickets} <span className="text-xs font-bold text-pink-300/80">Emitidos</span>
                  </h4>
                </div>
                <div className="border-t border-purple-500/20 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-[11px] text-pink-300 font-semibold">Volumen Total</span>
                  <span className="text-sm font-black text-pink-400">{formatPrice(totalSalesVolume, config?.currency)}</span>
                </div>
              </div>
            </div>

            {/* Geographical Distribution & CSV Export */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location stats */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
                  <Layers className="text-pink-500" size={16} />
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                    Distribución Geográfica ({selectedSellerName})
                  </h4>
                </div>
                
                <div className="space-y-3">
                  {topCities.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-850 text-slate-300 font-mono flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-300">{c.name}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-mono text-slate-500">({c.count} boletos)</span>
                        <span className="font-bold text-pink-400 ml-2">{formatPrice(c.volume, config?.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {topCities.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center italic">Ningún registro confirmado para graficar.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white mb-2 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <Sparkles className="text-amber-500 animate-pulse" size={15} />
                    Reportes e Informes Consolidados
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Exporte los registros de {selectedSellerName} de forma directa en formato de hoja de cálculo para auditar las cuentas.
                  </p>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet size={14} /> Exportar CSV ({selectedSellerId === 'ALL' ? 'General' : 'Colaborador'})
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download size={14} /> Imprimir Reporte
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB B: DETALLE DE COMISIONES --- */}
        {activeTab === 'comisiones' && (
          <motion.div
            key="tab-comisiones"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6 text-left"
          >
            {/* Banner of Commission Settings */}
            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-850 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Percent size={120} className="stroke-white" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest font-mono">
                    Tasa de Retribución Global de Registros
                  </p>
                  <h3 className="text-xl font-bold font-display mt-1">
                    Auditoría de Comisiones de Colaboradores
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    La tasa configurada actualmente es del <span className="text-amber-400 font-bold font-mono">{commissionPercentage}%</span> por boleto ({formatPrice(ticketPrice, config?.currency)}). Cada colaborador devenga neto <span className="text-emerald-400 font-bold">{formatPrice(ticketPrice * (commissionPercentage / 100), config?.currency)}</span> por cada boleto efectivamente liquidado.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px]">
                  <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Comisión Configurada</span>
                  <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">{commissionPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Commission breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Earned and Paid */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Comisiones Liquidadas</span>
                  <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle size={14} /></span>
                </div>
                <h4 className="text-2xl font-black font-display text-emerald-400 mt-2">
                  {formatPrice(totalCommissionEarned, config?.currency)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Corresponde a {confirmedTickets} boletos confirmados y validados.
                </p>
              </div>

              {/* Pending sales */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Comisiones Pendientes</span>
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400"><Clock size={14} /></span>
                </div>
                <h4 className="text-2xl font-black font-display text-amber-400 mt-2">
                  {formatPrice(totalCommissionPending, config?.currency)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Corresponde a {pendingTickets} boletos reservados aún no confirmados.
                </p>
              </div>

              {/* Potential sum */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Comisiones Totales</span>
                  <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400"><Award size={14} /></span>
                </div>
                <h4 className="text-2xl font-black font-display text-purple-400 mt-2">
                  {formatPrice(totalCommissionPotential, config?.currency)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Suma total potencial de comisiones sobre todos los boletos emitidos.
                </p>
              </div>
            </div>

            {/* Formula display card */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl text-white">
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
                <Info size={15} className="text-pink-500" />
                Desglose Analítico del Cálculo de Comisiones para {selectedSellerName}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 border-r border-slate-850 pr-4">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Boletos confirmados/pagados:</span>
                    <span className="font-bold text-slate-200">{confirmedTickets}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Precio unitario del boleto:</span>
                    <span className="font-bold text-slate-200">{formatPrice(ticketPrice, config?.currency)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Tasa de comisión:</span>
                    <span className="font-bold text-slate-200 font-mono">{commissionPercentage}%</span>
                  </div>
                  <div className="border-t border-slate-850 pt-2 flex justify-between py-1 text-slate-100 font-bold">
                    <span>Fórmula aplicada:</span>
                    <span className="font-mono text-emerald-400">{confirmedTickets} &times; {formatPrice(ticketPrice, config?.currency)} &times; {commissionPercentage}%</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Total Liquidado</p>
                  <p className="text-3xl font-black text-emerald-400 font-display mt-1">{formatPrice(totalCommissionEarned, config?.currency)}</p>
                  <p className="text-[10px] text-slate-400 leading-snug mt-1">
                    Este valor representa el total neto devengado por {selectedSellerName} que ha sido validado.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB C: PROYECCIONES DE RENDIMIENTO --- */}
        {activeTab === 'proyeccion' && (
          <motion.div
            key="tab-proyeccion"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6 text-left"
          >
            {/* Interactive projection calculator */}
            <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl">
              <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white mb-2 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Sparkles className="text-amber-500" size={15} />
                Calculadora de Metas y Retribución del Organizador
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Visualice el volumen total de recaudación de fondos en comparación con las comisiones que corresponden a {selectedSellerName}.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Meta de Boletos Confirmados ({selectedSellerName}):</span>
                  <span className="font-mono text-pink-400 text-sm">{(confirmedTickets + 15)} boletos</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Actual: {confirmedTickets} boletos</span>
                  <span>Meta proyectada: {confirmedTickets + 15} boletos (+15)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-300 uppercase font-bold block leading-none">Volumen de Registros Proyectado</span>
                    <span className="text-lg font-black text-purple-400 mt-1 block">{formatPrice((confirmedTickets + 15) * ticketPrice, config?.currency)}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase font-bold block leading-none">Comisión Proyectada</span>
                    <span className="text-lg font-black text-emerald-400 mt-1 block">{formatPrice(((confirmedTickets + 15) * ticketPrice) * (commissionPercentage / 100), config?.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Level */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-5 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                <Award size={24} className="animate-bounce" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">Evaluación de Desempeño Comercial</h5>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">
                  El colaborador {selectedSellerName} requiere {15 - pendingTickets > 0 ? 15 - pendingTickets : 5} boletos adicionales confirmados para ascender al hito de comisiones premium del sistema.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB D: REPORTE DE CIERRE FINANCIERO --- */}
        {activeTab === 'cierre' && (
          <motion.div
            key="tab-cierre"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6 text-left font-sans"
          >
            {/* Professional Receipt/Balance Sheet Header */}
            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-850 shadow-md">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider font-mono">
                    Balance Contable Oficial
                  </span>
                  <h3 className="text-xl font-bold font-display mt-2">
                    Reporte de Cierre y Liquidación
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    Este reporte consolida el estado financiero del sorteo activo, calculando las ganancias netas tras deducir el presupuesto asignado de los premios y las comisiones ganadas por los colaboradores.
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl shrink-0 text-center md:text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Fecha de Auditoría</span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Dashboard Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Confirmed Sales Revenue */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">
                    (+) Ingresos Confirmados
                  </span>
                  <h4 className="text-xl font-black font-display text-slate-100 mt-2">
                    {formatPrice(confirmedSalesVolume, config?.currency)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Recaudados por {confirmedTickets} boletos pagados.
                  </p>
                </div>
                <div className="border-t border-slate-850 mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Monto Bruto Total:</span>
                  <span className="font-semibold text-slate-300">{formatPrice(totalSalesVolume, config?.currency)}</span>
                </div>
              </div>

              {/* Total Prizes Budget */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono block">
                    (-) Presupuesto Premios
                  </span>
                  <h4 className="text-xl font-black font-display text-amber-400 mt-2">
                    {formatPrice(prizesBudgetSum, config?.currency)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Costo de los premios habilitados.
                  </p>
                </div>
                <div className="border-t border-slate-850 mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Premios Activos:</span>
                  <span className="font-semibold text-amber-400">{resolvedPrizes.filter(p => p.enabled).length} de 3</span>
                </div>
              </div>

              {/* Total Commissions Expense */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-mono block">
                    (-) Comisiones de Registro
                  </span>
                  <h4 className="text-xl font-black font-display text-purple-400 mt-2">
                    {formatPrice(totalCommissionEarned, config?.currency)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gastos por comisiones ya confirmadas.
                  </p>
                </div>
                <div className="border-t border-slate-850 mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Tasa Liquidación:</span>
                  <span className="font-semibold text-purple-400">{commissionPercentage}%</span>
                </div>
              </div>

              {/* Net Profit Balance */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between shadow-xl ${
                confirmedProfit >= 0 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200' 
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-200'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider font-mono block text-emerald-400">
                    (=) Balance Neto de Utilidad
                  </span>
                  <h4 className="text-2xl font-black font-display mt-2">
                    {formatPrice(confirmedProfit, config?.currency)}
                  </h4>
                  <p className="text-[10px] mt-1 opacity-90 text-slate-400">
                    {confirmedProfit >= 0 
                      ? '¡Superávit! Beneficio neto real actual.' 
                      : 'Déficit comercial momentáneo.'}
                  </p>
                </div>
                <div className="border-t border-slate-800/40 mt-3 pt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Margen Neto Estimado:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {confirmedSalesVolume > 0 
                      ? `${((confirmedProfit / confirmedSalesVolume) * 100).toFixed(1)}%` 
                      : '0.0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Budget Allocation Progress Bar */}
            <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                  Asignación y Distribución del Volumen Recaudado
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Fondo Total Confirmado: {formatPrice(confirmedSalesVolume, config?.currency)}</span>
              </div>

              {confirmedSalesVolume > 0 ? (
                <div>
                  <div className="h-4 w-full bg-slate-950 rounded-lg overflow-hidden flex shadow-inner border border-slate-850">
                    {/* Prizes chunk */}
                    {prizesBudgetSum > 0 && (
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300 flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${Math.min(100, (prizesBudgetSum / confirmedSalesVolume) * 100)}%` }}
                        title={`Premios: ${((prizesBudgetSum / confirmedSalesVolume) * 100).toFixed(1)}%`}
                      >
                        {((prizesBudgetSum / confirmedSalesVolume) * 100) > 10 && 'Premios'}
                      </div>
                    )}
                    {/* Commissions chunk */}
                    {totalCommissionEarned > 0 && (
                      <div 
                        className="h-full bg-purple-500 transition-all duration-300 flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${Math.min(100, (totalCommissionEarned / confirmedSalesVolume) * 100)}%` }}
                        title={`Comisiones: ${((totalCommissionEarned / confirmedSalesVolume) * 100).toFixed(1)}%`}
                      >
                        {((totalCommissionEarned / confirmedSalesVolume) * 100) > 10 && 'Comis.'}
                      </div>
                    )}
                    {/* Net profit chunk */}
                    {confirmedProfit > 0 && (
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300 flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${Math.min(100, (confirmedProfit / confirmedSalesVolume) * 100)}%` }}
                        title={`Ganancia Neta: ${((confirmedProfit / confirmedSalesVolume) * 100).toFixed(1)}%`}
                      >
                        {((confirmedProfit / confirmedSalesVolume) * 100) > 10 && 'Ganancia'}
                      </div>
                    )}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 pt-3 justify-center text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
                      <span>Presupuesto de Premios: <span className="font-bold text-white font-mono">{((prizesBudgetSum / confirmedSalesVolume) * 100).toFixed(1)}%</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-purple-500"></div>
                      <span>Comisiones de Colaboradores: <span className="font-bold text-white font-mono">{((totalCommissionEarned / confirmedSalesVolume) * 100).toFixed(1)}%</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                      <span>Ganancia Neta (Utilidad): <span className="font-bold text-white font-mono">{confirmedProfit > 0 ? `${((confirmedProfit / confirmedSalesVolume) * 100).toFixed(1)}%` : '0.0%'}</span></span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">No se han registrado boletos pagados aún para generar el balance visual.</p>
              )}
            </div>

            {/* Prizes Configuration and Budget breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Detailed budget list */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl md:col-span-2 space-y-3 shadow-xl">
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-2 border-b border-slate-850 pb-2">
                  <Award size={15} className="text-pink-500" />
                  Presupuesto Detallado de Premios (Hasta 3)
                </h4>
                
                <div className="overflow-hidden border border-slate-850 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold text-[10px]">
                        <th className="p-3">Premio</th>
                        <th className="p-3">Nombre / Descripción</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Presupuesto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {resolvedPrizes.map((p, idx) => (
                        <tr key={p.id || idx} className={p.enabled ? 'bg-slate-900/60' : 'bg-slate-950/40 text-slate-500'}>
                          <td className="p-3 font-semibold">
                            {idx === 0 ? '1er Premio' : idx === 1 ? '2do Premio' : '3er Premio'}
                          </td>
                          <td className="p-3 font-medium">
                            {p.enabled ? (p.name || 'Sin nombre asignado') : 'Premio deshabilitado'}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              p.enabled ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border border-slate-850 text-slate-500'
                            }`}>
                              {p.enabled ? 'HABILITADO' : 'INACTIVO'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-purple-300">
                            {p.enabled ? formatPrice(p.budget || 0, config?.currency) : formatPrice(0, config?.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Closing Audit Checklist */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl space-y-3 flex flex-col justify-between shadow-xl">
                <div>
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-2 border-b border-slate-850 pb-2">
                    <CheckCircle size={15} className="text-pink-500" />
                    Auditoría de Cierre
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Verifique el cumplimiento de los indicadores clave para un cierre comercial exitoso del sorteo.
                  </p>
                </div>

                <div className="space-y-2.5 py-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    {confirmedSalesVolume >= prizesBudgetSum ? (
                      <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-slate-200">Financiamiento de Premios</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {confirmedSalesVolume >= prizesBudgetSum 
                          ? 'Los ingresos por registro de boletos cubren la inversión total de los premios.' 
                          : 'Se necesita mayor recaudación de boletos para cubrir el presupuesto de premios.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    {pendingTickets === 0 ? (
                      <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Clock size={15} className="text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-slate-200">Cuentas por Confirmar</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {pendingTickets === 0 
                          ? 'No hay reservaciones pendientes por confirmar o cancelar en el sistema.' 
                          : `Existen ${pendingTickets} boletos en reserva pendientes por liquidación comercial.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download size={14} /> Imprimir Balance Oficial
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
