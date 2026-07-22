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
  ChevronRight, 
  Award,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Sale, Raffle, AppConfig, formatPrice } from '../../types';

interface SalesReportProps {
  sales: Sale[];
  activeRaffle: Raffle | null;
  config: AppConfig | null;
  sellerId: string;
  sellerName: string;
}

export default function SalesReport({
  sales,
  activeRaffle,
  config,
  sellerId,
  sellerName
}: SalesReportProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'comisiones' | 'proyeccion'>('resumen');

  // Filter sales corresponding to this seller
  const sellerSales = sales.filter(s => s.sellerId === sellerId);

  // Status breakdown
  const confirmedSales = sellerSales.filter(s => s.status === 'PAID');
  const pendingSales = sellerSales.filter(s => s.status === 'RESERVED' || s.status === 'SOLD');

  // Pricing & values
  const ticketPrice = activeRaffle?.ticketPrice || 10;
  const commissionPercentage = config?.commissionPercentage ?? 10; // defaults to 10%

  // Calculations
  const totalTickets = sellerSales.length;
  const confirmedTickets = confirmedSales.length;
  const pendingTickets = pendingSales.length;

  const totalSalesVolume = totalTickets * ticketPrice;
  const confirmedSalesVolume = confirmedTickets * ticketPrice;
  const pendingSalesVolume = pendingTickets * ticketPrice;

  // Commission Calculations
  const totalCommissionEarned = confirmedSalesVolume * (commissionPercentage / 100);
  const totalCommissionPending = pendingSalesVolume * (commissionPercentage / 100);
  const totalCommissionPotential = totalSalesVolume * (commissionPercentage / 100);

  // Group by City helper for seller analytics
  const citiesMap: Record<string, number> = {};
  sellerSales.forEach(s => {
    const city = s.city || 'Desconocida';
    citiesMap[city] = (citiesMap[city] || 0) + 1;
  });
  const topCities = Object.entries(citiesMap)
    .map(([name, count]) => ({ name, count, volume: count * ticketPrice }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Simulated CSV Export
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Boleto,Solicitante,Telefono,Ciudad,Estado,Precio,Comisión\n';

    sellerSales.forEach(s => {
      const isPaid = s.status === 'PAID';
      const comm = isPaid ? ticketPrice * (commissionPercentage / 100) : 0;
      csvContent += `${s.ticketNumber},"${s.buyerName}",${s.phone || ''},"${s.city || ''}",${s.status},${ticketPrice},${comm.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Comisiones_${sellerName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="sales-report-component" className="space-y-6">
      {/* Upper Navigation Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'resumen'
              ? 'bg-slate-900 text-purple-300 shadow-md border border-slate-800'
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
              ? 'bg-slate-900 text-purple-300 shadow-md border border-slate-800'
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
              ? 'bg-slate-900 text-purple-300 shadow-md border border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award size={14} />
          Proyecciones
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* --- TAB A: RESUMEN DE RESERVAS --- */}
        {activeTab === 'resumen' && (
          <motion.div
            key="tab-resumen"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Quick stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Confirmed Sales Card */}
              <div className="bg-gradient-to-br from-pink-950/40 via-slate-900 to-slate-950 border border-pink-500/20 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-pink-300 bg-pink-500/10 px-2.5 py-0.5 rounded-md border border-pink-500/20">
                      Confirmadas y Registradas
                    </span>
                    <CheckCircle className="text-pink-500" size={18} />
                  </div>
                  <h4 className="text-2xl font-black font-display text-white mt-4">
                    {confirmedTickets} <span className="text-xs font-bold text-slate-400">Boletos</span>
                  </h4>
                </div>
                <div className="border-t border-pink-500/10 mt-4 pt-3 flex justify-between items-center">
                  <span className="text-[11px] text-slate-300 font-semibold">Total Recaudado</span>
                  <span className="text-sm font-black text-pink-400">{formatPrice(confirmedSalesVolume, config?.currency)}</span>
                </div>
              </div>

              {/* Pending Confirmation Sales Card */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/20 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                      Por Confirmar / Reservados
                    </span>
                    <Clock className="text-amber-500" size={18} />
                  </div>
                  <h4 className="text-2xl font-black font-display text-white mt-4">
                    {pendingTickets} <span className="text-xs font-bold text-slate-400">Boletos</span>
                  </h4>
                </div>
                <div className="border-t border-amber-500/10 mt-4 pt-3 flex justify-between items-center">
                  <span className="text-[11px] text-slate-300 font-semibold">Monto en Espera</span>
                  <span className="text-sm font-black text-amber-400">{formatPrice(pendingSalesVolume, config?.currency)}</span>
                </div>
              </div>

              {/* Performance Indicator Card */}
              <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/20 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20">
                      Progreso del Sorteo
                    </span>
                    <TrendingUp className="text-purple-500" size={18} />
                  </div>
                  <h4 className="text-2xl font-black font-display text-white mt-4">
                    {totalTickets} <span className="text-xs font-bold text-slate-400">Asignados</span>
                  </h4>
                </div>
                <div className="border-t border-purple-500/10 mt-4 pt-3 flex justify-between items-center">
                  <span className="text-[11px] text-slate-300 font-semibold">Volumen Total</span>
                  <span className="text-sm font-black text-purple-400">{formatPrice(totalSalesVolume, config?.currency)}</span>
                </div>
              </div>
            </div>

            {/* Geographical Distribution & CSV Export */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location stats */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-xl shadow-slate-950/40">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="text-pink-500" size={16} />
                  <h4 className="text-xs font-black font-display uppercase tracking-wider text-slate-200">
                    Distribución de Reservas por Ciudad
                  </h4>
                </div>
                
                <div className="space-y-4">
                  {topCities.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-6 h-6 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 font-mono flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-200">{c.name}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-mono text-slate-400">({c.count} boletos)</span>
                        <span className="font-bold text-pink-400 ml-3">{formatPrice(c.volume, config?.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {topCities.length === 0 && (
                    <p className="text-xs text-slate-500 py-6 text-center italic">Ninguna reserva registrada para graficar.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-xl shadow-slate-950/40 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black font-display uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-1.5">
                    <Sparkles className="text-amber-500" size={15} />
                    Exportar Reportes
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Obtén un informe listo para conciliar con el organizador. Incluye el desglose de comisiones netas y boletos registrados.
                  </p>
                </div>

                <div className="pt-5 flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 bg-slate-950 hover:bg-slate-855 border border-slate-800 text-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet size={14} /> Exportar CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-500/20 border border-purple-500/30"
                  >
                    <Download size={14} /> Imprimir
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
            className="space-y-6"
          >
            {/* Banner of Commission Settings */}
            <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Percent size={120} className="stroke-white" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest font-mono">
                    Ajuste Configurado por Organizador
                  </p>
                  <h3 className="text-xl font-black font-display text-white mt-1">
                    Esquema de Retribución por Comisión
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
                    Tu comisión actual está configurada al <span className="text-pink-400 font-extrabold font-mono">{commissionPercentage}%</span> sobre el precio del boleto ({formatPrice(ticketPrice, config?.currency)}). Obtienes un total neto de <span className="text-pink-400 font-extrabold">{formatPrice(ticketPrice * (commissionPercentage / 100), config?.currency)}</span> por cada boleto confirmado.
                  </p>
                </div>
                <div className="bg-slate-950/85 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px] shadow-2xl">
                  <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Tasa Actual</span>
                  <span className="text-3xl font-black text-pink-400 font-mono mt-1 block">{commissionPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Commission breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Earned and Paid */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl shadow-slate-950/40">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Comisión Ganada</span>
                  <span className="p-1.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20"><CheckCircle size={14} /></span>
                </div>
                <h4 className="text-2xl font-black font-display text-pink-400 mt-3">
                  {formatPrice(totalCommissionEarned, config?.currency)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Corresponde a {confirmedTickets} boletos confirmados y registrados con éxito.
                </p>
              </div>

              {/* Pending sales */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl shadow-slate-950/40">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Comisión en Espera</span>
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock size={14} /></span>
                </div>
                <h4 className="text-2xl font-black font-display text-amber-400 mt-3">
                  {formatPrice(totalCommissionPending, config?.currency)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Corresponde a {pendingTickets} boletos reservados que requieren confirmación para liberar la comisión.
                </p>
              </div>

              {/* Potential sum */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl shadow-xl shadow-slate-950/40">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Comisión Potencial</span>
                  <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Award size={14} /></span>
                </div>
                <h4 className="text-2xl font-black font-display text-purple-400 mt-3">
                  {formatPrice(totalCommissionPotential, config?.currency)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Corresponde a la suma total de boletos asignados si todos fuesen confirmados.
                </p>
              </div>
            </div>

            {/* Formula display card */}
            <div className="bg-slate-950 border border-slate-800 text-white p-5 rounded-3xl">
              <h4 className="text-xs font-black font-display uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
                <Info size={15} className="text-purple-400" />
                Desglose Analítico del Cálculo de Comisiones
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 border-r border-slate-800 pr-4">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Número de boletos confirmados:</span>
                    <span className="font-bold text-white">{confirmedTickets}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Precio unitario por boleto:</span>
                    <span className="font-bold text-white">{formatPrice(ticketPrice, config?.currency)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Tasa de comisión configurada:</span>
                    <span className="font-bold text-white font-mono">{commissionPercentage}%</span>
                  </div>
                  <div className="border-t border-slate-800 pt-3 flex justify-between py-1 text-white font-bold">
                    <span>Cálculo final:</span>
                    <span className="font-mono text-pink-400">{confirmedTickets} &times; {formatPrice(ticketPrice, config?.currency)} &times; {commissionPercentage}%</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Neto a Cobrar</p>
                  <p className="text-3xl font-black text-pink-400 font-display mt-2">{formatPrice(totalCommissionEarned, config?.currency)}</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
                    Sincronizado instantáneamente en la base de datos de administración del organizador.
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
            className="space-y-6"
          >
            {/* Interactive projection calculator */}
            <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl shadow-slate-950/40">
              <h4 className="text-xs font-black font-display uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-1.5">
                <Sparkles className="text-amber-400" size={15} />
                Calculadora de Metas y Retribución
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Establece tu meta de reservas de boletos para visualizar las ganancias por comisión proyectadas y el volumen total de recaudación de fondos.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Meta de Boletos Registrados:</span>
                  <span className="font-mono text-pink-400 text-sm">{(confirmedTickets + 15)} boletos</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                  <span>Actual: {confirmedTickets} boletos</span>
                  <span>Meta proyectada: {confirmedTickets + 15} boletos (+15)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-300 uppercase font-bold block leading-none">Volumen de Registro Proyectado</span>
                    <span className="text-lg font-black text-white mt-1 block">{formatPrice((confirmedTickets + 15) * ticketPrice, config?.currency)}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-pink-500/5 border border-pink-500/15 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-pink-300 uppercase font-bold block leading-none">Ganancia Proyectada Neto</span>
                    <span className="text-lg font-black text-white mt-1 block">{formatPrice(((confirmedTickets + 15) * ticketPrice) * (commissionPercentage / 100), config?.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement / Motivation Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-950 border border-amber-500/20 p-5 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Award size={24} className="animate-bounce text-slate-950" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">Próximo Hito: Colaborador Destacado</h5>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  Registra {15 - pendingTickets > 0 ? 15 - pendingTickets : 5} boletos confirmados adicionales para ascender al rango destacado de comisiones premium y desbloquear bonificaciones especiales.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer warning message about upcoming updates */}
      <div className="bg-purple-950/30 border border-purple-500/20 p-4 rounded-2xl flex items-start gap-3 mt-6 shadow-xl">
        <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg shrink-0 mt-0.5 border border-purple-500/20">
          <Info size={14} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">Aviso del Sistema sobre Sincronizaciones & Próximas Actualizaciones</p>
          <p className="text-[10px] text-slate-300 leading-relaxed mt-1">
            Estimado colaborador, este módulo de reporte de registros está diseñado bajo estándares 100% modulares y escalables. Actualmente se sincroniza en tiempo real vía WebSockets y base de datos Supabase. <span className="font-semibold text-pink-400">En los próximos días se habilitarán actualizaciones automatizadas</span> que incluirán liquidaciones bancarias directas, gráficos interactivos D3 y conciliación instantánea mediante pasarelas de pago.
          </p>
        </div>
      </div>
    </div>
  );
}
