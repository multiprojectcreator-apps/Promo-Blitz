/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Users, MapPin, AlertTriangle, CheckCircle, Clock, BarChart3, Globe, Smartphone, Activity, Sparkles, Ticket, Share2, Award, Zap, HelpCircle, Eye } from 'lucide-react';
import { Sale, Raffle, Seller, AppConfig, formatPrice, GlobalTelemetryStats } from '../../types';

interface StatsSectionProps {
  stats: {
    totalTickets: number;
    totalSold: number;
    totalPaid: number;
    totalReserved: number;
    totalRevenue: number;
    totalPaidRevenue: number;
    totalReservedRevenue: number;
    paidPercentage: number;
    reservedPercentage: number;
    freePercentage: number;
    salesBySeller: Array<{ sellerName: string; count: number; revenue: number }>;
    salesByCity: Array<{ city: string; count: number }>;
  } | null;
  activeRaffle: Raffle | null;
  sales: Sale[];
  sellers: Seller[];
  config: AppConfig | null;
}

export default function StatsSection({
  stats,
  activeRaffle,
  sales,
  sellers,
  config,
}: StatsSectionProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'telemetry'>('tickets');
  const [telemetryStats, setTelemetryStats] = useState<GlobalTelemetryStats | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);

  useEffect(() => {
    if (activeRaffle) {
      setLoadingTelemetry(true);
      fetch(`/api/telemetry/stats/${activeRaffle.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Error fetching stats');
          return res.json();
        })
        .then(data => {
          setTelemetryStats(data);
          setLoadingTelemetry(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingTelemetry(false);
        });
    }
  }, [activeTab, activeRaffle, sales]);

  // Compute real-time stats directly from local state to ensure 100% accuracy and reactiveness
  const totalTickets = activeRaffle?.totalNumbers || 100;
  const ticketPrice = activeRaffle?.ticketPrice || 0;

  const raffleSales = sales.filter(s => s.raffleId === activeRaffle?.id && s.status !== 'CANCELLED');
  const totalPaid = raffleSales.filter(s => s.status === 'PAID').length;
  const totalReserved = raffleSales.filter(s => s.status === 'RESERVED').length;
  const totalSold = totalPaid + raffleSales.filter(s => s.status === 'SOLD').length;

  const totalPaidRevenue = totalPaid * ticketPrice;
  const totalReservedRevenue = totalReserved * ticketPrice;
  const totalRevenue = totalPaidRevenue + totalReservedRevenue;

  const paidPercentage = totalTickets > 0 ? (totalPaid / totalTickets) * 100 : 0;
  const reservedPercentage = totalTickets > 0 ? (totalReserved / totalTickets) * 100 : 0;
  const freePercentage = Math.max(0, 100 - paidPercentage - reservedPercentage);

  // Group by seller
  const salesBySellerMap: Record<string, { count: number; revenue: number }> = {};
  sellers.forEach(s => {
    salesBySellerMap[s.name] = { count: 0, revenue: 0 };
  });

  raffleSales.forEach(s => {
    const sellerName = s.sellerName || 'Directo (Sin Colaborador)';
    if (!salesBySellerMap[sellerName]) {
      salesBySellerMap[sellerName] = { count: 0, revenue: 0 };
    }
    salesBySellerMap[sellerName].count += 1;
    if (s.status === 'PAID') {
      salesBySellerMap[sellerName].revenue += ticketPrice;
    }
  });

  const salesBySeller = Object.entries(salesBySellerMap).map(([sellerName, item]) => ({
    sellerName,
    count: item.count,
    revenue: item.revenue
  })).sort((a, b) => b.revenue - a.revenue);

  // Group by city
  const salesByCityMap: Record<string, number> = {};
  raffleSales.forEach(s => {
    if (s.city) {
      salesByCityMap[s.city] = (salesByCityMap[s.city] || 0) + 1;
    }
  });
  const salesByCity = Object.entries(salesByCityMap).map(([city, count]) => ({
    city,
    count
  })).sort((a, b) => b.count - a.count);

  const activeStats = {
    totalTickets,
    totalSold,
    totalPaid,
    totalReserved,
    totalRevenue,
    totalPaidRevenue,
    totalReservedRevenue,
    paidPercentage,
    reservedPercentage,
    freePercentage,
    salesBySeller,
    salesByCity
  };

  return (
    <motion.div 
      id="organizer-stats-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Tab Selectors */}
      <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
            activeTab === 'tickets'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Ticket size={14} />
          Boletos y Registros
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
            activeTab === 'telemetry'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Activity size={14} />
          Telemetría y Tráfico
        </button>
      </div>

      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* KPI Dashboard (4 Columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Ingresos Totales */}
            <motion.div
              whileHover={{ scale: 1.04, y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              id="kpi-total-revenue"
              className="bg-gradient-to-br from-[#120736] via-slate-900 to-[#040114] border border-slate-800 rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-300">Registros Consolidados</span>
                <DollarSign size={18} className="text-purple-400" />
              </div>
              <div>
                <h4 className="text-lg sm:text-2xl font-black font-mono tracking-tight">{formatPrice(activeStats.totalRevenue, config?.currency)}</h4>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Ingresos brutos comprometidos</p>
              </div>
            </motion.div>

            {/* Card 2: Ingresos Liquidados (PAID) */}
            <motion.div
              whileHover={{ scale: 1.04, y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              id="kpi-paid-revenue"
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">Ingresos Liquidados</span>
                <CheckCircle className="text-pink-500" size={18} />
              </div>
              <div>
                <h4 className="text-lg sm:text-2xl font-black font-mono text-white">{formatPrice(activeStats.totalPaidRevenue, config?.currency)}</h4>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Pagos validados y confirmados</p>
              </div>
            </motion.div>

            {/* Card 3: Reservas Pendientes (RESERVED) */}
            <motion.div
              whileHover={{ scale: 1.04, y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              id="kpi-reserved-revenue"
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">En Proceso / Reserva</span>
                <Clock className="text-amber-500" size={18} />
              </div>
              <div>
                <h4 className="text-lg sm:text-2xl font-black font-mono text-amber-400">{formatPrice(activeStats.totalReservedRevenue, config?.currency)}</h4>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Por cobrar (Límite temporal 3h)</p>
              </div>
            </motion.div>

            {/* Card 4: Boletos Emitidos */}
            <motion.div
              whileHover={{ scale: 1.04, y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              id="kpi-total-tickets"
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider font-mono">Boletos Emitidos</span>
                <TrendingUp className="text-purple-500" size={18} />
              </div>
              <div>
                <h4 className="text-lg sm:text-2xl font-black font-mono text-white">
                  {activeStats.totalSold}/{activeStats.totalTickets}
                </h4>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                  {activeStats.totalTickets > 0 ? ((activeStats.totalSold / activeStats.totalTickets) * 105).toFixed(1) : 0}% de ocupación
                </p>
              </div>
            </motion.div>
          </div>

          {/* Progress visual section */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/40 space-y-4">
            <div>
              <h3 className="text-sm font-black font-display text-white">Estado de la Distribución de Boletos</h3>
              <p className="text-[11px] text-slate-400 mt-1">Muestra la proporción de boletos libres, reservados y efectivamente confirmados en tiempo real.</p>
            </div>

            {/* Proportional custom bar */}
            <div className="w-full h-5 bg-slate-950 rounded-full overflow-hidden flex shadow-inner border border-slate-850">
              {activeStats.totalSold > 0 ? (
                <>
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-pink-700 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500" 
                    style={{ width: `${activeStats.paidPercentage}%` }}
                    title={`Confirmado: ${activeStats.paidPercentage.toFixed(1)}%`}
                  >
                    {activeStats.paidPercentage > 10 && `${activeStats.paidPercentage.toFixed(0)}%`}
                  </div>
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-orange-400 h-full flex items-center justify-center text-[10px] font-bold text-slate-950 transition-all duration-500" 
                    style={{ width: `${activeStats.reservedPercentage}%` }}
                    title={`Reservado: ${activeStats.reservedPercentage.toFixed(1)}%`}
                  >
                    {activeStats.reservedPercentage > 10 && `${activeStats.reservedPercentage.toFixed(0)}%`}
                  </div>
                  <div 
                    className="bg-slate-800 h-full flex items-center justify-center text-[10px] font-bold text-slate-400 transition-all duration-500" 
                    style={{ width: `${activeStats.freePercentage}%` }}
                    title={`Disponible: ${activeStats.freePercentage.toFixed(1)}%`}
                  >
                    {activeStats.freePercentage > 10 && `${activeStats.freePercentage.toFixed(0)}%`}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  100% del Sorteo Disponible para Registros
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3.5 h-3.5 rounded bg-pink-500"></span> Pagados ({activeStats.totalPaid})</span>
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3.5 h-3.5 rounded bg-amber-400"></span> Reservados ({activeStats.totalReserved})</span>
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3.5 h-3.5 rounded bg-slate-700"></span> Disponibles ({activeStats.totalTickets - activeStats.totalSold})</span>
            </div>
          </div>

          {/* Two side columns with metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Sales by Seller */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-slate-950/40">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black font-display text-white">Ranking de Colaboradores</h3>
                  <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                    Productividad del Equipo
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Muestra la cantidad de números registrados por cada colaborador autorizado.</p>
              </div>

              {activeStats.salesBySeller.length > 0 ? (
                <div className="space-y-4">
                  {activeStats.salesBySeller.map((item, index) => {
                    const maxCount = Math.max(...activeStats.salesBySeller.map(s => s.count)) || 1;
                    const pct = (item.count / maxCount) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-200">{item.sellerName}</span>
                          <span className="text-slate-400 font-mono">
                            <strong className="text-pink-400 font-black">{formatPrice(item.revenue, config?.currency)}</strong> ({item.count} tickets)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-slate-850">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No hay registros suficientes.</p>
              )}
            </div>

            {/* Chart 2: Distribución por Ciudad */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-slate-950/40">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black font-display text-white">Registros por Ciudad</h3>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                    Distribución Geográfica
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Gráfico proporcional que detalla la penetración de registros en diferentes distritos/ciudades.</p>
              </div>

              {activeStats.salesByCity.length > 0 ? (
                <div className="space-y-4">
                  {activeStats.salesByCity.map((item, index) => {
                    const total = activeStats.salesByCity.reduce((acc, c) => acc + (c as any).count, 0) || 1;
                    const pct = (((item as any).count / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <MapPin size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-200 w-24 truncate">{item.city}</span>
                        <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 w-12 text-right">{pct}% ({(item as any).count})</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No hay datos de ciudades.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {loadingTelemetry && !telemetryStats ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <p className="text-sm font-semibold animate-pulse font-mono uppercase tracking-widest text-purple-400">Cargando Telemetría en Tiempo Real...</p>
            </div>
          ) : !telemetryStats ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 font-mono">
              No hay datos de telemetría disponibles en este momento.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* KPI Row (4 Columns) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Visits */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="bg-gradient-to-br from-[#0e0a1f] via-slate-900 to-[#0a0f1d] border border-slate-800 p-4 sm:p-6 rounded-3xl text-white shadow-xl flex items-center justify-between relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition duration-500" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">Visitas Totales</span>
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-[7px] sm:text-[8px] text-emerald-400 font-bold px-1.5 py-0.5 rounded-full font-mono animate-pulse uppercase tracking-wider shrink-0">En Vivo</span>
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1">{telemetryStats.totalVisits}</h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Sesiones únicas</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-purple-500/10 text-purple-400 border border-purple-500/25 rounded-2xl shrink-0 hidden sm:block">
                    <Eye size={22} />
                  </div>
                </motion.div>

                {/* Card 2: Conversion Rate */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl text-white shadow-xl flex items-center justify-between relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition duration-500" />
                  <div>
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono font-black">Conversión</span>
                    <h4 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 text-emerald-400">{telemetryStats.conversionRate}%</h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Visitas que compran</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-2xl shrink-0 hidden sm:block">
                    <TrendingUp size={22} />
                  </div>
                </motion.div>

                {/* Card 3: Game Draws */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl text-white shadow-xl flex items-center justify-between relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition duration-500" />
                  <div>
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-pink-400 font-mono font-black">Sorteos</span>
                    <h4 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 text-pink-400">{telemetryStats.totalGamesStats.totalDraws}</h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Sorteos concluidos</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-pink-500/10 text-pink-400 border border-pink-500/25 rounded-2xl shrink-0 hidden sm:block">
                    <Award size={22} />
                  </div>
                </motion.div>

                {/* Card 4: Leader City */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl text-white shadow-xl flex items-center justify-between relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition duration-500" />
                  <div>
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono font-black">Ciudad Líder</span>
                    <h4 className="text-base sm:text-xl font-black tracking-tight mt-1 truncate max-w-[110px] sm:max-w-[150px] text-amber-400">
                      {telemetryStats.salesByCity[0]?.city || 'Sin datos'}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Mayor recaudación</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-2xl shrink-0 hidden sm:block">
                    <MapPin size={22} />
                  </div>
                </motion.div>
              </div>

              {/* 24-Hour Traffic Distribution Heatmap */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="text-purple-400 w-5 h-5" />
                      <h3 className="text-base font-black font-display text-white">Horarios de Mayor Tráfico y Actividad</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Análisis de distribución de visitas por hora del día para identificar horas pico.</p>
                  </div>
                  {(() => {
                    const maxVisit = telemetryStats.visitsByHour.reduce((prev, current) => (prev.count > current.count) ? prev : current, { hour: 0, count: 0 });
                    return (
                      <div className="bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 self-start font-mono">
                        <Zap size={12} className="text-purple-400 animate-bounce" />
                        PICO MÁXIMO: {maxVisit.hour}:00 HS ({maxVisit.count} visitas)
                      </div>
                    );
                  })()}
                </div>

                {/* Visual Hour Histogram */}
                <div className="pt-4 pb-2">
                  <div className="flex items-end justify-between h-40 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 relative overflow-hidden gap-1">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />
                    {telemetryStats.visitsByHour.map((item, index) => {
                      const maxCount = Math.max(...telemetryStats.visitsByHour.map(h => h.count)) || 1;
                      const heightPercentage = (item.count / maxCount) * 100;
                      return (
                        <div key={`${item.hour}-${index}`} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                          <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700 text-[10px] font-mono px-2 py-1 rounded shadow-xl hidden group-hover:block whitespace-nowrap z-30 text-center">
                            {item.hour}:00 hs <br />
                            <strong className="text-purple-400">{item.count} visitas</strong>
                          </div>
                          <div
                            style={{ height: `${Math.max(4, heightPercentage)}%` }}
                            className={`w-full rounded-t-sm transition-all duration-300 ${
                              heightPercentage > 75 
                                ? 'bg-gradient-to-t from-purple-600 to-pink-500 animate-pulse' 
                                : heightPercentage > 40
                                ? 'bg-gradient-to-t from-purple-700 to-purple-500'
                                : 'bg-slate-800 group-hover:bg-purple-900/60'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-center text-[9px] font-mono font-bold text-slate-500 px-2">
                    {telemetryStats.visitsByHour.map((item, index) => (
                      <div key={`${item.hour}-${index}`} className={`flex-1 ${item.hour % 4 === 0 ? 'text-slate-300' : 'hidden sm:block'}`}>
                        {item.hour % 4 === 0 ? `${item.hour}h` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Two Columns Grid: Visits Geolocation vs Sales by City */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visits Geolocation */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="text-purple-400 w-5 h-5" />
                        <h3 className="text-base font-black font-display text-white">Ubicación de los Visitantes</h3>
                      </div>
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        Tráfico Global
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Países y ciudades desde donde los usuarios acceden al sitio web del sorteo.</p>
                  </div>

                  {telemetryStats.visitsByLocation.length > 0 ? (
                    <div className="space-y-4 flex-1">
                      {telemetryStats.visitsByLocation.slice(0, 6).map((item, index) => {
                        const maxCount = telemetryStats.visitsByLocation[0]?.count || 1;
                        const percentage = ((item.count / telemetryStats.totalVisits) * 100).toFixed(1);
                        const barPct = (item.count / maxCount) * 100;
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                {item.city}, <span className="text-slate-400 text-[10px]">{item.country}</span>
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                <strong>{item.count}</strong> visitas ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-850">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 italic">No hay datos de geolocalización.</p>
                  )}
                </div>

                {/* Sales Geolocation */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-emerald-400 w-5 h-5" />
                        <h3 className="text-base font-black font-display text-white">Registros y Recaudación por Ciudad</h3>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        Conversión Geográfica
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Ciudades con mayores transacciones registradas e ingresos validados.</p>
                  </div>

                  {telemetryStats.salesByCity.length > 0 ? (
                    <div className="space-y-4 flex-1">
                      {telemetryStats.salesByCity.slice(0, 6).map((item, index) => {
                        const maxCount = telemetryStats.salesByCity[0]?.count || 1;
                        const barPct = (item.count / maxCount) * 100;
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                {item.city}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                <strong>{item.count}</strong> boletos registrados (
                                <span className="text-emerald-400 font-bold">{formatPrice(item.revenue, config?.currency)}</span>)
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-850">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 italic">No hay datos de registros por ciudad todavía.</p>
                  )}
                </div>
              </div>

              {/* Two Columns Grid: Referrers vs Devices */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Channels (Referrers) */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="text-pink-400 w-5 h-5" />
                        <h3 className="text-base font-black font-display text-white">Canales de Origen (Referidores)</h3>
                      </div>
                      <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        Referidos
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Plataformas o enlaces desde donde los visitantes fueron redirigidos a la app.</p>
                  </div>

                  {telemetryStats.visitsByReferrer.length > 0 ? (
                    <div className="space-y-4 flex-1">
                      {telemetryStats.visitsByReferrer.map((item, index) => {
                        const maxCount = telemetryStats.visitsByReferrer[0]?.count || 1;
                        const barPct = (item.count / maxCount) * 100;
                        const percentage = ((item.count / telemetryStats.totalVisits) * 100).toFixed(1);
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-200 uppercase font-mono tracking-wider text-[11px]">{item.referrer}</span>
                              <span className="text-slate-400 font-mono text-[11px]">{item.count} hits ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-850">
                              <div
                                className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 italic">No hay datos de referidores.</p>
                  )}
                </div>

                {/* Technology & Devices */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="text-amber-400 w-5 h-5" />
                        <h3 className="text-base font-black font-display text-white">Dispositivos y Navegadores</h3>
                      </div>
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        Sistemas
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Mapeo de tecnologías preferidas por los visitantes de su plataforma.</p>
                  </div>

                  <div className="space-y-6 flex-1 justify-center flex flex-col">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2.5 font-mono">Tipos de Dispositivos</span>
                      <div className="grid grid-cols-3 gap-3">
                        {['MOBILE', 'DESKTOP', 'TABLET'].map((devType) => {
                          const devData = telemetryStats.visitsByDevice.find(d => d.device === devType) || { count: 0 };
                          const pct = telemetryStats.totalVisits > 0 ? ((devData.count / telemetryStats.totalVisits) * 100).toFixed(0) : '0';
                          return (
                            <div key={devType} className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center">
                              <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">{devType}</span>
                              <p className="text-base font-black font-mono text-white mt-1">{pct}%</p>
                              <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">{devData.count} visitas</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2 font-mono">Navegadores Populares</span>
                      <div className="space-y-2">
                        {telemetryStats.visitsByBrowser.slice(0, 3).map((item, index) => {
                          const pct = telemetryStats.totalVisits > 0 ? ((item.count / telemetryStats.totalVisits) * 100).toFixed(1) : '0';
                          return (
                            <div key={`${item.browser}-${index}`} className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-300 w-16 truncate">{item.browser}</span>
                              <div className="flex-1 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                                <div 
                                  className="bg-amber-500 h-full rounded-full" 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 w-10 text-right">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lucky Numbers and Endings Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Sold Numbers */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-purple-400 w-5 h-5" />
                        <h3 className="text-base font-black font-display text-white">Números Más Buscados / Solicitados</h3>
                      </div>
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        Tendencias
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Números específicos de boletos que registran mayor demanda.</p>
                  </div>

                  {telemetryStats.popularNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-2 flex-1 content-start pt-2">
                      {telemetryStats.popularNumbers.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 hover:border-purple-500/45 transition"
                        >
                          <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 font-mono font-black text-xs flex items-center justify-center border border-purple-500/20">
                            #{item.number}
                          </span>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono">Boletos</span>
                            <span className="text-xs font-black font-mono text-white">{item.count} veces</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs italic w-full">
                      Aún no hay suficientes registros para generar tendencias de números.
                    </div>
                  )}
                </div>

                {/* Popular Endings */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-pink-400 w-5 h-5" />
                        <h3 className="text-base font-black font-display text-white">Terminaciones Favoritas (0 - 9)</h3>
                      </div>
                      <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        Patrón Solicitudes
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Análisis de los dígitos finales más seleccionados por los solicitantes.</p>
                  </div>

                  {telemetryStats.popularEndings.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2 flex-1 pt-2">
                      {telemetryStats.popularEndings.map((item, index) => {
                        const maxCount = Math.max(...telemetryStats.popularEndings.map(e => e.count)) || 1;
                        const pct = (item.count / maxCount) * 100;
                        return (
                          <div key={index} className="bg-slate-950/60 border border-slate-800 p-2 rounded-2xl text-center relative overflow-hidden flex flex-col justify-between group">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-pink-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                            <span className="text-base font-black font-mono text-white">...{item.ending}</span>
                            <p className="text-[10px] font-bold text-slate-400 font-mono mt-1">{item.count} v.</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 italic w-full">No hay datos de terminaciones.</p>
                  )}
                </div>
              </div>

              {/* Game Stats (Sorteos y Juegos) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="text-purple-400 w-5 h-5" />
                    <h3 className="text-base font-black font-display text-white">Estadísticas e Indicadores de los Sorteos</h3>
                  </div>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono font-black">
                    Juegos Concluidos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total draws card */}
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black font-mono block mb-1">Total Sorteos</span>
                      <p className="text-3xl font-black font-mono text-white mt-1">{telemetryStats.totalGamesStats.totalDraws}</p>
                      <p className="text-xs text-slate-500 mt-1">Sorteos concluidos e inscritos en el historial de ganadores.</p>
                    </div>
                    <div className="h-1 bg-purple-500 w-1/3 rounded-full mt-4" />
                  </div>

                  {/* Most Frequent drawn numbers */}
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between col-span-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black font-mono block mb-2">Números Ganadores Más Frecuentes</span>
                      {telemetryStats.totalGamesStats.mostDrawnNumbers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {telemetryStats.totalGamesStats.mostDrawnNumbers.map((item, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                              <span className="text-xs font-black font-mono text-amber-400">#{item.number}</span>
                              <span className="text-[9px] text-slate-400 font-mono">({item.count} sorteos)</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic mt-2">No se registran números ganadores recurrentes todavía.</p>
                      )}
                    </div>
                    <div className="h-1 bg-amber-500 w-12 rounded-full mt-4" />
                  </div>
                </div>

                {/* Sorteos por Categoría de Premio */}
                {telemetryStats.totalGamesStats.drawsByPrize.length > 0 && (
                  <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-400 uppercase font-black font-mono block mb-3">Distribución de Premios Entregados</span>
                    <div className="flex flex-wrap gap-4">
                      {telemetryStats.totalGamesStats.drawsByPrize.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                          <span className="text-xs text-slate-300 font-medium">{item.prizeName}:</span>
                          <strong className="text-xs font-mono text-white font-black">{item.count} sorteos</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
