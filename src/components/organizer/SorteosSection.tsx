/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Sparkles, 
  HelpCircle, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Trash2, 
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';
import { Raffle, Sale, DrawHistory, AuditLog, User, PrizeConfig } from '../../types';

interface SorteosSectionProps {
  currentUser: User | null;
  activeRaffle: Raffle | null;
  sales: Sale[];
  drawHistory: DrawHistory[];
  setDrawHistory: (history: DrawHistory[]) => void;
  setAuditLogs: (logs: AuditLog[]) => void;
}

export default function SorteosSection({
  currentUser,
  activeRaffle,
  sales,
  drawHistory,
  setDrawHistory,
  setAuditLogs
}: SorteosSectionProps) {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('MAIN');
  const [drawMethod, setDrawMethod] = useState<'digital' | 'manual'>('digital');
  const [winningNumberInput, setWinningNumberInput] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [animatedNumber, setAnimatedNumber] = useState<number | null>(null);
  const [currentWinnerResult, setCurrentWinnerResult] = useState<DrawHistory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isManualDrawModalOpen, setIsManualDrawModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  // Fetch full game cycle report
  const fetchGameCycleReport = async () => {
    if (!activeRaffle) return;
    setIsLoadingReport(true);
    try {
      const res = await fetch(`/api/game-cycle/report/${activeRaffle.id}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setIsReportModalOpen(true);
      } else {
        alert('Error al obtener el reporte del ciclo de juego.');
      }
    } catch (e) {
      alert('Error de conexión al cargar el reporte.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Clean messages on mount
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  if (!activeRaffle) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white p-8 rounded-3xl text-center shadow-2xl max-w-xl mx-auto">
        <AlertTriangle className="mx-auto text-pink-500 mb-3 animate-pulse" size={44} />
        <h3 className="text-base font-black text-white">Ningún Sorteo Configurado</h3>
        <p className="text-xs mt-1 text-slate-400">Debe crear y configurar una rifa en la pestaña de Configuración antes de ingresar al módulo de sorteos.</p>
      </div>
    );
  }

  // Get active prizes
  const prizesList: { id: string; name: string }[] = [{ id: 'MAIN', name: `Premio Principal: ${activeRaffle.prize}` }];
  if (activeRaffle.prizes) {
    activeRaffle.prizes
      .filter(p => p.enabled)
      .sort((a, b) => a.order - b.order)
      .forEach(p => {
        prizesList.push({ id: p.id, name: `${p.order}° Premio: ${p.name}` });
      });
  }

  const selectedPrizeName = prizesList.find(p => p.id === selectedPrizeId)?.name || activeRaffle.prize;

  // Filter sales list to PAID tickets only for digital tombola selection
  const paidSales = sales.filter(s => s.raffleId === activeRaffle.id && s.status === 'PAID');

  const handleDigitalDraw = async () => {
    if (!currentUser) return;
    setErrorMessage('');
    setSuccessMessage('');
    setCurrentWinnerResult(null);

    if (paidSales.length === 0) {
      setErrorMessage('No se pueden realizar sorteos digitales porque no hay ningún boleto registrado como "PAGADO" en este sorteo. Venda o valide algún boleto primero.');
      return;
    }

    setIsDrawing(true);
    let counter = 0;
    
    // Play beautiful drumming animation
    const interval = setInterval(() => {
      // Show random numbers in the grid/drum
      const randomIdx = Math.floor(Math.random() * paidSales.length);
      setAnimatedNumber(paidSales[randomIdx].ticketNumber);
      counter += 100;
      if (counter >= 3000) {
        clearInterval(interval);
        
        // Final selection
        const finalWinnerSale = paidSales[Math.floor(Math.random() * paidSales.length)];
        executeDrawApi(finalWinnerSale.ticketNumber);
      }
    }, 100);
  };

  const handleManualDrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMessage('');
    setSuccessMessage('');
    setCurrentWinnerResult(null);

    const ticketNum = parseInt(winningNumberInput, 10);
    if (isNaN(ticketNum) || ticketNum < 1 || ticketNum > activeRaffle.totalNumbers) {
      setErrorMessage(`El número del boleto debe ser un valor entero entre 1 y ${activeRaffle.totalNumbers}.`);
      return;
    }

    executeDrawApi(ticketNum);
  };

  const executeDrawApi = async (winningNumber: number) => {
    try {
      const res = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser?.id,
          raffleId: activeRaffle.id,
          prizeId: selectedPrizeId === 'MAIN' ? '' : selectedPrizeId,
          winningNumber: winningNumber
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentWinnerResult(data);
        setIsManualDrawModalOpen(false);
        // Refresh draw history in real time
        const resHistory = await fetch('/api/draw-history');
        if (resHistory.ok) {
          const updatedHistory = await resHistory.json();
          setDrawHistory(updatedHistory);
        }

        // Refresh audit logs
        const resLogs = await fetch('/api/audit-logs');
        if (resLogs.ok) {
          const updatedLogs = await resLogs.json();
          setAuditLogs(updatedLogs);
        }

        setSuccessMessage(`🎉 ¡Sorteo realizado con éxito! Ganador registrado para: ${selectedPrizeName}`);
        setWinningNumberInput('');
      } else {
        setErrorMessage(data.error || 'Error al procesar el sorteo.');
      }
    } catch (err) {
      setErrorMessage('Error de red al registrar el sorteo.');
    } finally {
      setIsDrawing(false);
      setAnimatedNumber(null);
    }
  };

  // Export to CSV helper
  const exportDrawHistoryCSV = () => {
    const headers = ['ID', 'Fecha', 'Hora', 'Premio', 'Numero Ganador', 'Ganador', 'Telefono', 'Ciudad', 'Asesor/Colaborador'];
    const rows = drawHistory
      .filter(d => d.raffleId === activeRaffle.id)
      .map(d => [
        d.id,
        d.drawDate,
        d.drawTime,
        `"${d.prizeName.replace(/"/g, '""')}"`,
        d.winningNumber,
        `"${(d.winnerName || 'Sin Ganador').replace(/"/g, '""')}"`,
        `"${d.winnerPhone || ''}"`,
        `"${d.winnerCity || ''}"`,
        `"${(d.sellerName || 'Asignado').replace(/"/g, '""')}"`
      ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ganadores_Sorteo_${activeRaffle.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF/Printable View helper
  const exportDrawHistoryPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilite las ventanas emergentes para ver el reporte de ganadores.');
      return;
    }

    const filteredHistory = drawHistory.filter(d => d.raffleId === activeRaffle.id);
    const tableRows = filteredHistory.map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 12px 8px; font-weight: bold; color: #7c3aed;">#${d.winningNumber}</td>
        <td style="padding: 12px 8px; font-weight: 600;">${d.prizeName}</td>
        <td style="padding: 12px 8px;">${d.winnerName || 'Sin Ganador'}</td>
        <td style="padding: 12px 8px; font-family: monospace;">${d.winnerPhone || '—'}</td>
        <td style="padding: 12px 8px;">${d.winnerCity || '—'}</td>
        <td style="padding: 12px 8px; font-weight: 500;">${d.sellerName || 'Directo/Asignado'}</td>
        <td style="padding: 12px 8px; font-size: 11px; color: #64748b;">${d.drawDate} ${d.drawTime}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Oficial de Ganadores - ${activeRaffle.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #e2e8f0; padding-bottom: 20px; }
            h1 { color: #4f46e5; margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
            .subheader { font-size: 12px; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; padding: 12px 8px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #475569; }
            .footer { margin-top: 60px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #e0f2fe; color: #0369a1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sistema de Rifa Profesional</h1>
            <div style="font-size: 16px; font-weight: bold; color: #334155; margin-top: 8px;">Acta Oficial de Ganadores y Sorteos Realizados</div>
            <div class="subheader">
              <strong>Campaña:</strong> ${activeRaffle.name} &bull; 
              <strong>Fecha Emisión:</strong> ${new Date().toLocaleString()} &bull; 
              <strong>Sorteos Registrados:</strong> ${filteredHistory.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Boleto</th>
                <th>Premio Asignado</th>
                <th>Nombre del Ganador</th>
                <th>Contacto</th>
                <th>Ciudad</th>
                <th>Asesor/Colaborador</th>
                <th>Fecha Sorteo</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.length > 0 ? tableRows : '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">No se han ejecutado sorteos para este sorteo aún.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            Este documento constituye un acta oficial generada por el sistema de gestión de sorteos.
            Todos los sorteos son vinculantes, verificados y certificados por la organización.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter local history based on search query
  const filteredHistory = drawHistory
    .filter(d => d.raffleId === activeRaffle.id)
    .filter(d => {
      const q = searchQuery.toLowerCase();
      return (
        d.winningNumber.toString().includes(q) ||
        (d.winnerName || '').toLowerCase().includes(q) ||
        (d.prizeName || '').toLowerCase().includes(q) ||
        (d.winnerCity || '').toLowerCase().includes(q) ||
        (d.sellerName || '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. SECTION HEADER CONTAINER */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="bg-purple-500/30 border border-purple-400/20 text-purple-200 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Control de Resultados e Inmutabilidad
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight">
              Tómbola & Sorteos en Vivo
            </h2>
            <p className="text-xs text-purple-100 max-w-xl leading-relaxed">
              Seleccione los premios secundarios o principales para activar el sorteo. Puede elegir la tómbola digital de boletos pagados o ingresar un boleto ganador de forma física externa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={fetchGameCycleReport}
              disabled={isLoadingReport}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition shadow-lg shadow-purple-500/20 cursor-pointer border border-purple-400/20"
            >
              📊 {isLoadingReport ? 'Cargando Reporte...' : 'Reporte del Ciclo de Juego'}
            </button>
            <button 
              onClick={exportDrawHistoryCSV}
              disabled={filteredHistory.length === 0}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              CSV
            </button>
            <button 
              onClick={exportDrawHistoryPDF}
              disabled={filteredHistory.length === 0}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            >
              <Printer size={15} />
              Acta PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. LIVE DRAWING BOX */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 shadow-xl rounded-3xl flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <h3 className="text-base font-black font-display text-white mb-4 flex items-center gap-2 border-b border-slate-850 pb-2">
                <Sparkles size={18} className="text-pink-500 animate-spin-slow animate-pulse" />
                Ejecutar Sorteo
              </h3>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs mb-4">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs mb-4 flex items-start gap-1.5">
                  <CheckCircle size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                  <p>{successMessage}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* SELECT PRIZE */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">1. Seleccionar Premio a Sortear</label>
                  <select 
                    value={selectedPrizeId}
                    onChange={(e) => setSelectedPrizeId(e.target.value)}
                    disabled={isDrawing}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {prizesList.map((p, index) => (
                      <option key={`${p.id}-${index}`} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* DRAW METHOD SELECTOR */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">2. Método del Sorteo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isDrawing}
                      onClick={() => setDrawMethod('digital')}
                      className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                        drawMethod === 'digital'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-[14px]">🎰</span>
                      <span className="mt-0.5 font-semibold">Tómbola Digital</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDrawing}
                      onClick={() => setDrawMethod('manual')}
                      className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                        drawMethod === 'manual'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-[14px]">✍️</span>
                      <span className="mt-0.5 font-semibold">Registro Físico</span>
                    </button>
                  </div>
                </div>

                {/* FORM SPECIFICS */}
                {drawMethod === 'digital' ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-center space-y-3">
                    <div className="text-[10px] text-pink-400 uppercase tracking-widest font-extrabold">Filtro de Seguridad Tómbola</div>
                    <div className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-pink-500 tracking-tight">
                      {paidSales.length}
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold">
                      Boletos "PAGADOS" elegibles para ganar.
                    </div>
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      La tómbola digital es 100% aleatoria y transparente. Selecciona solo boletos con pago verificado en la blockchain/nube.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsManualDrawModalOpen(true)}
                      className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-3 rounded-2xl text-xs transition duration-150 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer border border-purple-400/20"
                    >
                      ✍️ Registrar Boleto Ganador Físico
                    </button>
                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                      Ingrese el número de boleto obtenido de la tómbola física en una ventana modal limpia y segura.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION TRIGGERS FOR TOMBOLA */}
            {drawMethod === 'digital' && (
              <div className="pt-4 border-t border-slate-850 mt-4 relative z-10 space-y-2">
                {activeRaffle.autoTombola !== false ? (
                  <div className="p-3 bg-purple-950/70 border border-purple-500/30 rounded-2xl text-[11px] text-purple-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-pink-400">
                      <Clock size={14} />
                      <span>Tómbola Automática Programada</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      La tómbola virtual se ejecutará automáticamente a las <strong>{activeRaffle.drawDate} {activeRaffle.drawTime}</strong>. No es posible ni necesario iniciarla manualmente.
                    </p>
                    <p className="text-[9px] text-slate-400 italic">
                      * Para realizar sorteos manuales o ingresar números ganadores externos, desactive la tómbola automática en Configuración del Sorteo o utilice "Registro Físico".
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDigitalDraw}
                    disabled={isDrawing || paidSales.length === 0}
                    className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-3 rounded-2xl text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-45 disabled:cursor-not-allowed border border-purple-400/20"
                  >
                    <Play size={14} className="fill-white" />
                    {isDrawing ? 'Sorteando...' : 'Iniciar Sorteo Digital Manual'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. VISUAL TOMBOLA DISPLAY & LIVE RESULTS */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          
          {/* VISUAL DRUM OR WINNER DISPLAY */}
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[260px]">
            {/* Grid background effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2d124d_1px,transparent_1px),linear-gradient(to_bottom,#2d124d_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>

            <AnimatePresence mode="wait">
              {isDrawing ? (
                <motion.div 
                  key="drumming"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="space-y-4 relative z-10"
                >
                  {/* Rotating tombola sphere */}
                  <div className="relative w-36 h-36 rounded-full border-4 border-purple-500/40 shadow-2xl flex items-center justify-center mx-auto mb-3 overflow-hidden bg-slate-950 backdrop-blur-md">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      className="absolute inset-2 rounded-full border-2 border-dashed border-purple-500/25 flex items-center justify-center"
                    >
                      {/* Bouncing colorful balls inside */}
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-pink-500 top-2 left-6"></span>
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-purple-500 bottom-4 right-8"></span>
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-blue-500 top-8 right-4"></span>
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-teal-500 bottom-6 left-10"></span>
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-amber-500 top-12 left-16"></span>
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-fuchsia-500 bottom-12 right-12"></span>
                    </motion.div>
                    
                    {/* Active number flashing in the center */}
                    <div className="relative z-10 w-22 h-22 bg-slate-900 border border-slate-800 rounded-full flex flex-col items-center justify-center shadow-lg">
                      <span className="text-3xl font-black font-mono text-purple-400">
                        {animatedNumber !== null ? animatedNumber : '??'}
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-purple-300 font-extrabold animate-pulse mt-0.5">MEZCLANDO</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xs font-black font-display uppercase tracking-widest text-purple-400 animate-pulse">
                    Girando Tómbola Digital
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">Seleccionando al azar de boletos pagados...</p>
                </motion.div>
              ) : currentWinnerResult ? (
                <motion.div 
                  key="winner"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="space-y-4 relative z-10 w-full"
                >
                  {/* Confetti celebration effect overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    {Array.from({ length: 35 }).map((_, i) => {
                      const size = Math.random() * 8 + 4;
                      const delay = Math.random() * 2;
                      const duration = Math.random() * 2.5 + 1.5;
                      const left = Math.random() * 100;
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
                      const randomColor = colors[Math.floor(Math.random() * colors.length)];
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ y: -30, x: `${left}%`, rotate: 0, opacity: 1 }}
                          animate={{ 
                            y: 300, 
                            x: `${left + (Math.random() * 16 - 8)}%`, 
                            rotate: 360,
                            opacity: 0
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: duration, 
                            delay: delay, 
                            ease: "linear" 
                          }}
                          style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            backgroundColor: randomColor,
                            borderRadius: Math.random() > 0.5 ? '50%' : '20%',
                          }}
                        />
                      );
                    })}
                  </div>

                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
                    <Award size={26} className="animate-bounce" />
                  </div>
                  
                  <div>
                    <span className="bg-emerald-500/10 text-emerald-300 text-[10px] px-3.5 py-1 rounded-full font-extrabold uppercase tracking-widest border border-emerald-500/20">
                      ¡Ganador Confirmado!
                    </span>
                    <h4 className="text-xs text-slate-300 mt-2.5 font-semibold">Premio: {currentWinnerResult.prizeName}</h4>
                  </div>

                  <div className="text-5xl md:text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 tracking-tighter">
                    #{currentWinnerResult.winningNumber}
                  </div>

                  <div className="max-w-md mx-auto bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-1.5 text-left text-xs">
                    <div className="flex justify-between border-b border-slate-850 pb-1.5 mb-1.5 text-slate-400">
                      <span className="font-semibold text-[10px] uppercase tracking-wider">Ganador</span>
                      <span className="font-bold text-white text-right">{currentWinnerResult.winnerName}</span>
                    </div>
                    {currentWinnerResult.winnerPhone && (
                      <div className="flex justify-between text-slate-400">
                        <span>Teléfono:</span>
                        <span className="font-mono text-white">{currentWinnerResult.winnerPhone}</span>
                      </div>
                    )}
                    {currentWinnerResult.winnerCity && (
                      <div className="flex justify-between text-slate-400">
                        <span>Ciudad:</span>
                        <span className="text-white">{currentWinnerResult.winnerCity}</span>
                      </div>
                    )}
                    {currentWinnerResult.sellerName && (
                      <div className="flex justify-between text-slate-400">
                        <span>Asesor / Colaborador:</span>
                        <span className="font-semibold text-pink-400">{currentWinnerResult.sellerName}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2 relative z-10"
                >
                  <Award size={44} className="mx-auto text-pink-500 mb-2 animate-pulse" />
                  <h4 className="text-sm font-bold text-pink-400 font-display uppercase tracking-widest">Esperando Sorteo</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Presione el botón para realizar un sorteo digital o registre el boleto de un sorteo manual físico. Los resultados se guardarán de forma permanente.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* WINNERS HISTORY TABLE */}
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-850 pb-2.5 relative z-10">
              <h3 className="text-sm font-black font-display text-white">Historial Oficial de Ganadores</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Buscar ganador, boleto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-[11px] text-white focus:outline-none w-full sm:w-48 font-sans focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold bg-slate-950">
                    <th className="py-2.5 px-2">Boleto</th>
                    <th className="py-2.5 px-2">Premio</th>
                    <th className="py-2.5 px-2">Ganador</th>
                    <th className="py-2.5 px-2">Asesor / Colaborador</th>
                    <th className="py-2.5 px-2">Ciudad</th>
                    <th className="py-2.5 px-2">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs">
                  {filteredHistory.map((d, index) => (
                    <tr key={`${d.id}-${index}`} className="hover:bg-slate-950 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">#{d.winningNumber}</td>
                      <td className="py-3 px-2 font-semibold text-white">{d.prizeName}</td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-white">{d.winnerName || 'Sin Ganador'}</div>
                        {d.winnerPhone && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.winnerPhone}</div>}
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-300">{d.sellerName || 'Directo/Asignado'}</td>
                      <td className="py-3 px-2 text-slate-400">{d.winnerCity || '—'}</td>
                      <td className="py-3 px-2 text-[10px] text-slate-500 font-mono">
                        {d.drawDate.split('-').reverse().join('/')} &bull; {d.drawTime}
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                        No hay registros de ganadores para mostrar en este sorteo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL PARA REGISTRO DE GANADOR FÍSICO */}
      <AnimatePresence>
        {isManualDrawModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="manual-draw-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6 text-left text-white"
            >
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✍️</span>
                  <div>
                    <h3 className="text-sm font-black font-display text-white">Registrar Ganador Físico</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{selectedPrizeName}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsManualDrawModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs bg-slate-950 hover:bg-slate-850 border border-slate-800 px-2 py-1 rounded-lg transition cursor-pointer font-bold"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleManualDrawSubmit} className="space-y-4">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Número de Boleto Ganador</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max={activeRaffle.totalNumbers}
                    placeholder={`1 - ${activeRaffle.totalNumbers}`}
                    value={winningNumberInput}
                    onChange={(e) => setWinningNumberInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
                    Ingrese el número obtenido de la tómbola física. El sistema buscará de manera automática el solicitante registrado y su respectivo colaborador para asociarlos al premio.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManualDrawModalOpen(false)}
                    className="w-1/3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-purple-500/10 cursor-pointer"
                  >
                    Registrar y Buscar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PARA REPORTE COMPLETO DEL CICLO DE JUEGO */}
      <AnimatePresence>
        {isReportModalOpen && reportData && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" id="report-cycle-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative p-6 text-left text-white my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Ciclo de Juego Completo
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      reportData.raffle.status === 'FINISHED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {reportData.raffle.status === 'FINISHED' ? 'Finalizado' : 'En Curso / Activo'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black font-display text-white">
                    Reporte General: {reportData.raffle.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estadísticas integrales de ventas, comisiones de vendedores, ganadores y rendimiento medible.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs bg-slate-950 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl transition cursor-pointer font-bold"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar flex-1">
                {/* 1. Metric Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recaudado Bruto</div>
                    <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                      ${reportData.summary.grossRevenue.toLocaleString()} {reportData.summary.currency}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{reportData.summary.paidTicketsCount} boletos pagados</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comisiones Vendedores</div>
                    <div className="text-xl font-black text-amber-400 mt-1 font-mono">
                      ${reportData.summary.totalCommissionsPaid.toLocaleString()} {reportData.summary.currency}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Calculado sobre comisiones</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilidad Neta Organizador</div>
                    <div className="text-xl font-black text-purple-400 mt-1 font-mono">
                      ${reportData.summary.netRevenue.toLocaleString()} {reportData.summary.currency}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Ingreso neto libre de comisiones</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa de Conversión</div>
                    <div className="text-xl font-black text-pink-400 mt-1 font-mono">
                      {reportData.telemetry.conversionRate}%
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{reportData.telemetry.totalAppVisits} visitas a la app</div>
                  </div>
                </div>

                {/* 2. Inventory Progress Breakdown */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Estado del Inventario ({reportData.summary.totalNumbers} números)</span>
                    <span className="text-purple-400">{reportData.summary.paidTicketsPercentage.toFixed(1)}% Vendido</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${reportData.summary.paidTicketsPercentage}%` }}
                      title={`Pagados: ${reportData.summary.paidTicketsCount}`}
                    ></div>
                    <div 
                      className="bg-amber-500 h-full" 
                      style={{ width: `${reportData.summary.reservedTicketsPercentage}%` }}
                      title={`Reservados: ${reportData.summary.reservedTicketsCount}`}
                    ></div>
                    <div 
                      className="bg-slate-800 h-full" 
                      style={{ width: `${reportData.summary.availableTicketsPercentage}%` }}
                      title={`Disponibles: ${reportData.summary.availableTicketsCount}`}
                    ></div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Pagados: {reportData.summary.paidTicketsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      Reservados: {reportData.summary.reservedTicketsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-700 inline-block"></span>
                      Disponibles: {reportData.summary.availableTicketsCount}
                    </span>
                  </div>
                </div>

                {/* 3. Sellers Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">
                    Rendimiento y Comisiones de Vendedores
                  </h4>
                  <div className="overflow-x-auto bg-slate-950 border border-slate-850 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] text-slate-400 uppercase font-extrabold bg-slate-900/50">
                          <th className="py-2.5 px-3">Asesor / Licencia</th>
                          <th className="py-2.5 px-3">Rango Asignado</th>
                          <th className="py-2.5 px-3">Boletos Vendidos</th>
                          <th className="py-2.5 px-3">Recaudado Bruto</th>
                          <th className="py-2.5 px-3">Comisión Ganada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {reportData.sellerStats.map((s: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-bold text-white">{s.sellerName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">{s.range}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-300">{s.ticketsSold}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-400">${s.grossSales.toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-amber-400">${s.commissionEarned.toLocaleString()}</td>
                          </tr>
                        ))}
                        {reportData.sellerStats.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                              No hay vendedores o licencias registrados aún.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Winners History */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider">
                    Ganadores Certificados del Sorteo
                  </h4>
                  <div className="overflow-x-auto bg-slate-950 border border-slate-850 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] text-slate-400 uppercase font-extrabold bg-slate-900/50">
                          <th className="py-2.5 px-3">Boleto #</th>
                          <th className="py-2.5 px-3">Premio</th>
                          <th className="py-2.5 px-3">Nombre del Ganador</th>
                          <th className="py-2.5 px-3">Contacto</th>
                          <th className="py-2.5 px-3">Asesor / Colaborador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {reportData.winners.map((w: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-pink-400">#{w.winningNumber}</td>
                            <td className="py-2.5 px-3 font-semibold text-white">{w.prizeName}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-300">{w.winnerName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">{w.winnerPhone || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-300">{w.sellerName || 'Directo'}</td>
                          </tr>
                        ))}
                        {reportData.winners.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                              El sorteo aún no registra números ganadores ejecutados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={exportDrawHistoryCSV}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet size={14} />
                    Exportar CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportDrawHistoryPDF}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
                  >
                    <Printer size={14} />
                    Imprimir Informe Oficial
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
