/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Users, ShieldAlert, Settings, HelpCircle, FileText } from 'lucide-react';
import { Sale, Raffle, Seller, AppConfig } from '../../types';

import StatsSection from './StatsSection';
import SalesSection from './SalesSection';
import SellersSection from './SellersSection';
import ConfigSection from './ConfigSection';
import OrganizerSalesReport from './OrganizerSalesReport';

interface OrganizerDashboardProps {
  organizerSection: 'estadisticas' | 'ventas' | 'vendedores' | 'configuracion' | 'comisiones';
  setOrganizerSection: (s: 'estadisticas' | 'ventas' | 'vendedores' | 'configuracion' | 'comisiones') => void;
  
  // Stats
  stats: any;
  activeRaffle: Raffle | null;
  sales: Sale[];
  sellers: Seller[];

  // Sales
  filteredSales: Sale[];
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sellerFilter: string;
  setSellerFilter: (s: string) => void;
  exportToCSV: (data: any[], title: string) => void;
  exportToPDF: (data: any[], title: string) => void;

  // Sellers
  isCreatingSeller: boolean;
  setIsCreatingSeller: (b: boolean) => void;
  newSellerUser: any;
  setNewSellerUser: (u: any) => void;
  sellerCrudError: string;
  handleCreateSellerSubmit: (e: React.FormEvent) => void;
  handleDeleteSeller: (id: string) => void;
  handleBlockSeller: (id: string, currentStatus: string) => void;

  // Config
  adminConfigForm: any;
  setAdminConfigForm: (f: any) => void;
  handleConfigUpdate: (e: React.FormEvent) => void;
  raffleConfigForm: any;
  setRaffleConfigForm: (f: any) => void;
  handleRaffleUpdate: (e: React.FormEvent) => void;
  raffleUpdateMsg: string;
  isUpdatingRaffle: boolean;
  auditLogs: any[];
  config: AppConfig | null;
}

export default function OrganizerDashboard({
  organizerSection,
  setOrganizerSection,
  
  stats,
  activeRaffle,
  sales,
  sellers,

  filteredSales,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sellerFilter,
  setSellerFilter,
  exportToCSV,
  exportToPDF,

  isCreatingSeller,
  setIsCreatingSeller,
  newSellerUser,
  setNewSellerUser,
  sellerCrudError,
  handleCreateSellerSubmit,
  handleDeleteSeller,
  handleBlockSeller,

  adminConfigForm,
  setAdminConfigForm,
  handleConfigUpdate,
  raffleConfigForm,
  setRaffleConfigForm,
  handleRaffleUpdate,
  raffleUpdateMsg,
  isUpdatingRaffle,
  auditLogs,
  config,
}: OrganizerDashboardProps) {
  return (
    <div id="organizer-dashboard" className="space-y-6">
      {/* Simulation Info Board */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider">
            Consola del Organizador (Root Admin)
          </span>
          <h2 className="text-2xl font-black font-display tracking-tight text-white mt-4">Panel de Control General</h2>
          <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
            Supervise registros en tiempo real, gestione colaboradores autorizados y revise el historial de actividad reciente.
          </p>
        </div>
      </div>

      {/* Tab Navigation for Organizer Dashboard */}
      <div id="organizer-tabs" className="flex flex-wrap border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setOrganizerSection('estadisticas')}
          className={`px-5 py-3 text-xs font-bold transition-all rounded-t-xl flex items-center gap-2 border-t-2 border-x ${
            organizerSection === 'estadisticas'
              ? 'bg-slate-900 border-purple-500 text-purple-300 border-x border-slate-800'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp size={14} />
          Estadísticas en Tiempo Real
        </button>
        <button
          type="button"
          onClick={() => setOrganizerSection('ventas')}
          className={`px-5 py-3 text-xs font-bold transition-all rounded-t-xl flex items-center gap-2 border-t-2 border-x ${
            organizerSection === 'ventas'
              ? 'bg-slate-900 border-purple-500 text-purple-300 border-x border-slate-800'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={14} />
          Lista de Solicitudes
        </button>
        <button
          type="button"
          onClick={() => setOrganizerSection('vendedores')}
          className={`px-5 py-3 text-xs font-bold transition-all rounded-t-xl flex items-center gap-2 border-t-2 border-x ${
            organizerSection === 'vendedores'
              ? 'bg-slate-900 border-purple-500 text-purple-300 border-x border-slate-800'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={14} />
          Colaboradores y Licencias
        </button>
        <button
          type="button"
          onClick={() => setOrganizerSection('configuracion')}
          className={`px-5 py-3 text-xs font-bold transition-all rounded-t-xl flex items-center gap-2 border-t-2 border-x ${
            organizerSection === 'configuracion'
              ? 'bg-slate-900 border-purple-500 text-purple-300 border-x border-slate-800'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings size={14} />
          Ajustes de Rifa y Logs
        </button>
        <button
          type="button"
          onClick={() => setOrganizerSection('comisiones')}
          className={`px-5 py-3 text-xs font-bold transition-all rounded-t-xl flex items-center gap-2 border-t-2 border-x ${
            organizerSection === 'comisiones'
              ? 'bg-slate-900 border-purple-500 text-purple-300 border-x border-slate-800'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={14} />
          Reporte de Comisiones
        </button>
      </div>

      {/* Render Active Subsection */}
      <div id="organizer-active-tab-container">
        <AnimatePresence mode="wait">
          {organizerSection === 'comisiones' && (
            <motion.div
              key="comisiones-report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <OrganizerSalesReport
                sales={sales}
                sellers={sellers}
                activeRaffle={activeRaffle}
                config={config}
              />
            </motion.div>
          )}
          {organizerSection === 'estadisticas' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <StatsSection 
                stats={stats}
                activeRaffle={activeRaffle}
                sales={sales}
                sellers={sellers}
                config={config}
              />
            </motion.div>
          )}

          {organizerSection === 'ventas' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <SalesSection 
                sales={sales}
                filteredSales={filteredSales}
                sellers={sellers}
                activeRaffle={activeRaffle}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sellerFilter={sellerFilter}
                setSellerFilter={setSellerFilter}
                exportToCSV={exportToCSV}
                exportToPDF={exportToPDF}
              />
            </motion.div>
          )}

          {organizerSection === 'vendedores' && (
            <motion.div
              key="sellers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <SellersSection 
                sellers={sellers}
                activeRaffle={activeRaffle}
                isCreatingSeller={isCreatingSeller}
                setIsCreatingSeller={setIsCreatingSeller}
                newSellerUser={newSellerUser}
                setNewSellerUser={setNewSellerUser}
                sellerCrudError={sellerCrudError}
                handleCreateSellerSubmit={handleCreateSellerSubmit}
                handleDeleteSeller={handleDeleteSeller}
                handleBlockSeller={handleBlockSeller}
              />
            </motion.div>
          )}

          {organizerSection === 'configuracion' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ConfigSection 
                activeRaffle={activeRaffle}
                adminConfigForm={adminConfigForm}
                setAdminConfigForm={setAdminConfigForm}
                handleConfigUpdate={handleConfigUpdate}
                raffleConfigForm={raffleConfigForm}
                setRaffleConfigForm={setRaffleConfigForm}
                handleRaffleUpdate={handleRaffleUpdate}
                raffleUpdateMsg={raffleUpdateMsg}
                isUpdatingRaffle={isUpdatingRaffle}
                auditLogs={auditLogs}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
