/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Award, Clock, Sparkles, Percent, BarChart3, CheckCircle2, Ticket } from 'lucide-react';
import { Sale, Raffle, Seller, AppConfig, formatPrice } from '../../types';

interface SellerStatsSectionProps {
  activeRaffle: Raffle | null;
  sales: Sale[];
  sellerObj: Seller | undefined;
  config: AppConfig | null;
}

export default function SellerStatsSection({
  activeRaffle,
  sales,
  sellerObj,
  config,
}: SellerStatsSectionProps) {
  if (!sellerObj) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
        No se encontraron datos del colaborador para generar estadísticas.
      </div>
    );
  }

  // Filter sales for this seller
  const sellerSales = sales.filter((s) => s.sellerId === sellerObj.id && s.status !== 'CANCELLED');
  const paidSales = sellerSales.filter((s) => s.status === 'PAID');
  const reservedSales = sellerSales.filter((s) => s.status === 'RESERVED');

  const paidCount = paidSales.length;
  const reservedCount = reservedSales.length;
  const totalCount = paidCount + reservedCount;

  const ticketPrice = activeRaffle?.ticketPrice || 10;
  const totalRevenue = paidCount * ticketPrice;
  const commissionPercentage = config?.commissionPercentage || 10;
  const totalCommission = totalRevenue * (commissionPercentage / 100);

  // Range statistics (if the seller has an assigned range)
  const rangeStart = sellerObj.assignedRangeStart;
  const rangeEnd = sellerObj.assignedRangeEnd;
  const rangeSize = rangeEnd - rangeStart + 1;

  // Filter sales within the assigned range
  const salesInRange = sales.filter(
    (s) => s.ticketNumber >= rangeStart && s.ticketNumber <= rangeEnd && s.status !== 'CANCELLED'
  );
  const paidInRange = salesInRange.filter((s) => s.status === 'PAID').length;
  const reservedInRange = salesInRange.filter((s) => s.status === 'RESERVED').length;
  const freeInRange = rangeSize - (paidInRange + reservedInRange);

  const rangeUsagePercentage = rangeSize > 0 ? (((paidInRange + reservedInRange) / rangeSize) * 100).toFixed(0) : '0';

  // Conversion rate: Paid vs Reserved
  const conversionRate = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(0) : '0';

  // Get recent 5 sales of this seller
  const recentSales = [...sellerSales]
    .sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeB - dateTimeA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.04, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl flex items-center justify-between shadow-lg cursor-pointer"
        >
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Mis Confirmados</span>
            <h4 className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">{paidCount}</h4>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">Cobrados y validados</p>
          </div>
          <div className="p-2 sm:p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/15 hidden sm:block">
            <Ticket size={24} />
          </div>
        </motion.div>

        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.04, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl flex items-center justify-between shadow-lg cursor-pointer"
        >
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Recaudado</span>
            <h4 className="text-lg sm:text-3xl font-black font-mono text-emerald-400 mt-1">
              {formatPrice(totalRevenue, config?.currency)}
            </h4>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">Precio boleto</p>
          </div>
          <div className="p-2 sm:p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/15 hidden sm:block">
            <DollarSign size={24} />
          </div>
        </motion.div>

        {/* Commission Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.04, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl flex items-center justify-between shadow-lg cursor-pointer"
        >
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Comisión ({commissionPercentage}%)</span>
            <h4 className="text-lg sm:text-3xl font-black font-mono text-purple-400 mt-1">
              {formatPrice(totalCommission, config?.currency)}
            </h4>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">Ganancia neta</p>
          </div>
          <div className="p-2 sm:p-4 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/15 hidden sm:block">
            <Percent size={24} />
          </div>
        </motion.div>

        {/* Conversion Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.04, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl flex items-center justify-between shadow-lg cursor-pointer"
        >
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Efectividad</span>
            <h4 className="text-2xl sm:text-3xl font-black font-mono text-pink-400 mt-1">{conversionRate}%</h4>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">Reserva a venta</p>
          </div>
          <div className="p-2 sm:p-4 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/15 hidden sm:block">
            <TrendingUp size={24} />
          </div>
        </motion.div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rango Asignado y Progreso */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-emerald-400 w-5 h-5" />
              <h3 className="text-base font-black font-display text-white">Análisis de mi Rango de Boletos</h3>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
              Rango: {rangeStart} - {rangeEnd}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-400">Progreso de ocupación de rango</span>
                <span className="text-emerald-400">{rangeUsagePercentage}% ocupado</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  style={{ width: `${(paidInRange / rangeSize) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Pagados: ${paidInRange}`}
                />
                <div
                  style={{ width: `${(reservedInRange / rangeSize) * 100}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Reservados: ${reservedInRange}`}
                />
              </div>
            </div>

            {/* Grid distribution metrics */}
            <div className="grid grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Libres</span>
                <p className="text-lg font-black font-mono text-white mt-1">{freeInRange}</p>
                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full mx-auto mt-1.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Reservados</span>
                <p className="text-lg font-black font-mono text-amber-500 mt-1">{reservedInRange}</p>
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mx-auto mt-1.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pagados</span>
                <p className="text-lg font-black font-mono text-emerald-500 mt-1">{paidInRange}</p>
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mx-auto mt-1.5" />
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/40">
              💡 <span className="font-semibold text-slate-300">Guía de Gestión:</span> Su rango cuenta con un total de <strong className="text-white">{rangeSize} boletos</strong> asignados. Maximice la efectividad confirmando los <strong className="text-amber-400">{reservedCount} boletos reservados</strong> para que completen el proceso antes de que expiren.
            </div>
          </div>
        </motion.div>

        {/* Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white"
        >
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
            <Clock className="text-purple-400 w-5 h-5" />
            <h3 className="text-base font-black font-display text-white">Últimos Movimientos</h3>
          </div>

          <div className="space-y-4">
            {recentSales.map((sale, index) => (
              <div
                key={`${sale.id}-${index}`}
                className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg">
                      #{sale.ticketNumber}
                    </span>
                    <span className="text-xs font-black text-white truncate max-w-[120px]">
                      {sale.buyerName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {sale.date} — {sale.time}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                    sale.status === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {sale.status === 'PAID' ? 'PAGADO' : 'RESERVADO'}
                </span>
              </div>
            ))}

            {recentSales.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 italic">No registra actividad reciente.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
