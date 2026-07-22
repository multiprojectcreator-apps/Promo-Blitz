import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserX, 
  UserCheck, 
  ShieldAlert, 
  Search, 
  Activity, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Grid,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { User } from '../../types';

interface SuperAdminPanelProps {
  currentUser: User;
}

export default function SuperAdminPanel({ currentUser }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'organizadores' | 'integraciones' | 'auditoria' | 'mantenimiento'>('organizadores');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch all users to list organizers
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error al obtener la lista de usuarios del sistema.');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users to only get ORGANIZADOR accounts
  const organizers = users.filter(user => 
    user.role === 'ORGANIZADOR' && 
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Total statistics for the dashboard headers
  const totalOrganizers = users.filter(u => u.role === 'ORGANIZADOR').length;
  const activeOrganizers = users.filter(u => u.role === 'ORGANIZADOR' && u.status === 'ACTIVE').length;
  const totalSellers = users.filter(u => u.role === 'VENDEDOR').length;

  const handleToggleStatus = async (targetUser: User) => {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    
    // Confirm blocking with custom warning since it cascades
    if (nextStatus === 'BLOCKED') {
      const confirmDeactivate = window.confirm(
        `¿Está seguro de desactivar al organizador "${targetUser.name}"?\n\n¡ATENCIÓN! Esta acción es recursiva. Al desactivar este organizador, automáticamente se desactivarán todas sus licencias, vendedores y el acceso de todos sus colaboradores asociados.`
      );
      if (!confirmDeactivate) return;
    }

    setActionLoadingId(targetUser.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/superadmin/users/${targetUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          superAdminId: currentUser.id,
          status: nextStatus
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al cambiar el estado del organizador.');
      }

      setSuccessMsg(
        nextStatus === 'BLOCKED' 
          ? `Se ha desactivado al organizador "${targetUser.name}" y todo su ecosistema colaborador correctamente.`
          : `Se ha reactivado al organizador "${targetUser.name}" con éxito.`
      );

      // Refresh users from backend
      await fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFactoryReset = async () => {
    const confirm1 = window.confirm(
      '⚠️ ¡ATENCIÓN! ESTA ACCIÓN ES IRREVERSIBLE.\n\n¿Está completamente seguro de que desea reiniciar la aplicación a su CONFIGURACIÓN DE FÁBRICA ORIGINAL?\n\nEsto eliminará absolutamente todas las ventas, vendedores, boletos, clientes, anuncios y sorteos creados. Se mantendrán únicamente las credenciales de Super Administrador.'
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      'Para confirmar la destrucción total de los datos del sorteo e iniciar la app en su configuración de fábrica, escriba exactamente "RESET DE FABRICA":'
    );
    if (confirm2 !== 'RESET DE FABRICA') {
      alert('Confirmación incorrecta. La operación de Reset de Fábrica ha sido cancelada.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/superadmin/factory-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ superAdminId: currentUser.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar el reset de fábrica.');

      setSuccessMsg('🎉 ¡La aplicación ha sido reiniciada a su Configuración de Fábrica Original con éxito!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error durante el Reset de Fábrica.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div id="super-admin-panel-container" className="bg-[#0b0326]/90 border border-purple-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-purple-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-pink-500/30 animate-pulse">
              Super Administrador Activo
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-display uppercase tracking-wide">
            Panel de Super Control Global
          </h1>
          <p className="text-xs text-purple-300/80 mt-1">
            Gestión y auditoría del sistema de rifas en tiempo real, control de organizadores y cascadas de estados.
          </p>
        </div>

        <button
          id="btn-refresh-users"
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="bg-[#120935] hover:bg-[#1c0f4d] text-purple-300 border border-purple-500/30 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw size={14} className={`text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Lista
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div id="stat-card-total-orgs" className="bg-gradient-to-br from-purple-950/40 to-pink-950/40 border border-purple-500/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-200 uppercase tracking-wide">Organizadores Totales</span>
            <Users size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalOrganizers}</div>
          <p className="text-[10px] text-purple-300/60 mt-1">Registrados en la plataforma central</p>
        </div>

        <div id="stat-card-active-orgs" className="bg-gradient-to-br from-purple-950/40 to-emerald-950/40 border border-emerald-500/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">Organizadores Activos</span>
            <UserCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeOrganizers}</div>
          <p className="text-[10px] text-emerald-300/60 mt-1">En estado operativo normal</p>
        </div>

        <div id="stat-card-total-sellers" className="bg-gradient-to-br from-purple-950/40 to-blue-950/40 border border-blue-500/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">Colaboradores Totales</span>
            <Activity size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalSellers}</div>
          <p className="text-[10px] text-blue-300/60 mt-1">Vendedores y licencias creadas</p>
        </div>
      </div>

      {/* TABS (Modular & Scalable) */}
      <div id="super-admin-tabs" className="flex border-b border-purple-500/20 gap-2 mb-6">
        <button
          id="tab-btn-organizadores"
          onClick={() => setActiveTab('organizadores')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition relative border-b-2 ${
            activeTab === 'organizadores' 
              ? 'text-pink-400 border-pink-500' 
              : 'text-purple-300/60 border-transparent hover:text-purple-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={14} />
            Organizadores
          </div>
        </button>

        <button
          id="tab-btn-integraciones"
          onClick={() => setActiveTab('integraciones')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition relative border-b-2 ${
            activeTab === 'integraciones' 
              ? 'text-pink-400 border-pink-500' 
              : 'text-purple-300/60 border-transparent hover:text-purple-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Grid size={14} />
            Futuras Integraciones
            <span className="text-[8px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.5 rounded-full ml-1">
              Próximamente
            </span>
          </div>
        </button>

        <button
          id="tab-btn-auditoria"
          onClick={() => setActiveTab('auditoria')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition relative border-b-2 ${
            activeTab === 'auditoria' 
              ? 'text-pink-400 border-pink-500' 
              : 'text-purple-300/60 border-transparent hover:text-purple-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={14} />
            Logs de Auditoría
          </div>
        </button>

        <button
          id="tab-btn-mantenimiento"
          onClick={() => setActiveTab('mantenimiento')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition relative border-b-2 ${
            activeTab === 'mantenimiento' 
              ? 'text-pink-400 border-pink-500' 
              : 'text-purple-300/60 border-transparent hover:text-purple-300'
          }`}
        >
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert size={14} />
            Reset de Fábrica
          </div>
        </button>
      </div>

      {/* FEEDBACK MESSAGES */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-red-950/60 border border-red-500/40 text-red-200 p-4 rounded-2xl flex items-start gap-2 text-xs"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error en la operación: </span>
              {errorMsg}
            </div>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 p-4 rounded-2xl flex items-start gap-2 text-xs"
          >
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Operación completada: </span>
              {successMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB CONTENT: ORGANIZADORES */}
      {activeTab === 'organizadores' && (
        <div id="superadmin-organizadores-content" className="space-y-4">
          {/* SEARCH BAR */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <Search size={16} />
            </div>
            <input
              id="search-organizers"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar organizadores por nombre, usuario o email..."
              className="w-full bg-[#120935] hover:bg-[#180d45] focus:bg-[#180d45] border border-purple-500/20 focus:border-pink-500/50 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-purple-300/40 focus:outline-none transition-all"
            />
          </div>

          {/* ORGANIZERS LIST */}
          {loading && users.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw size={24} className="text-pink-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-purple-300/60">Cargando la base de datos de organizadores...</p>
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-12 bg-[#120935]/40 border border-purple-500/10 rounded-2xl">
              <UserX size={28} className="text-purple-400/40 mx-auto mb-2" />
              <p className="text-xs text-purple-300/60">
                {searchQuery ? 'No se encontraron organizadores que coincidan con la búsqueda.' : 'No hay organizadores registrados en la plataforma.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {organizers.map((org) => {
                const isBlocked = org.status === 'BLOCKED';
                const isActionLoading = actionLoadingId === org.id;

                return (
                  <motion.div
                    id={`organizer-card-${org.id}`}
                    key={org.id}
                    layout
                    className={`p-4 rounded-2xl border transition-all ${
                      isBlocked 
                        ? 'bg-red-950/10 border-red-500/20 hover:border-red-500/30' 
                        : 'bg-[#120935]/40 border-purple-500/20 hover:border-pink-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            {org.name}
                          </h3>
                          <span className="text-[10px] text-purple-400 font-mono">
                            @{org.username}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                            isBlocked 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : org.status === 'PENDING_VERIFICATION'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {org.status === 'ACTIVE' ? 'Activo' : org.status === 'BLOCKED' ? 'Desactivado' : 'Pendiente Confirmar'}
                          </span>
                        </div>
                        <p className="text-xs text-purple-300/80">{org.email}</p>

                        {/* Metadata: Dates */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-[10px] text-purple-300/60 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-pink-400" />
                            Registro: {formatDate(org.createdAt || org.id.replace('u-', ''))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-purple-400" />
                            Último Acceso: {formatDate(org.lastAccessAt)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Toggle Button */}
                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 border-purple-500/10 pt-3 sm:pt-0">
                        {isBlocked ? (
                          <button
                            id={`btn-activate-org-${org.id}`}
                            type="button"
                            onClick={() => handleToggleStatus(org)}
                            disabled={isActionLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer"
                          >
                            {isActionLoading ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <UserCheck size={12} />
                            )}
                            Reactivar Organizador
                          </button>
                        ) : (
                          <button
                            id={`btn-deactivate-org-${org.id}`}
                            type="button"
                            onClick={() => handleToggleStatus(org)}
                            disabled={isActionLoading}
                            className="bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white border border-red-500/30 hover:border-red-500/60 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer"
                          >
                            {isActionLoading ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <UserX size={12} />
                            )}
                            Desactivar
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FUTURAS INTEGRACIONES */}
      {activeTab === 'integraciones' && (
        <div id="superadmin-integraciones-content" className="py-8 text-center bg-[#120935]/20 border border-purple-500/10 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mx-auto animate-pulse">
            <Grid size={22} />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Módulo Totalmente Escalable</h3>
          <p className="text-xs text-purple-300/70 max-w-md mx-auto leading-relaxed">
            Esta sección está lista y preparada arquitectónicamente para recibir futuras integraciones del sistema central, tales como pasarelas de pago, configuración de SMTP corporativo, o integraciones con CRM.
          </p>
        </div>
      )}

      {/* TAB CONTENT: LOGS DE AUDITORIA */}
      {activeTab === 'auditoria' && (
        <div id="superadmin-auditoria-content" className="py-8 text-center bg-[#120935]/20 border border-purple-500/10 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
            <Activity size={22} />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Logs de Auditoría Corporativos</h3>
          <p className="text-xs text-purple-300/70 max-w-md mx-auto leading-relaxed">
            Sección modular reservada para el historial de transacciones de auditoría global del sistema. Listará todas las operaciones delicadas realizadas por los organizadores y colaboradores en tiempo real.
          </p>
        </div>
      )}

      {/* TAB CONTENT: RESET DE FABRICA */}
      {activeTab === 'mantenimiento' && (
        <div id="superadmin-mantenimiento-content" className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-3xl space-y-4 text-left">
          <div className="flex items-center gap-3 border-b border-rose-500/20 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-200 uppercase tracking-wide">Restablecer la App a su Configuración de Fábrica Original</h3>
              <p className="text-xs text-rose-300/70">Operación crítica de mantenimiento reservada para la administración central.</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-rose-500/20 p-4 rounded-2xl text-xs text-slate-300 space-y-2">
            <p className="font-bold text-rose-300">⚠️ Advertencia de Destrucción de Datos de Sorteo:</p>
            <p>
              El Reset de Fábrica vaciará la base de datos de la plataforma y la reestablecerá a su estado inicial de instalación limpia:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px] pl-2">
              <li>Eliminará absolutamente todas las ventas, boletos pagados y reservas.</li>
              <li>Eliminará todos los vendedores y licencias colaboradoras generadas.</li>
              <li>Eliminará los anuncios, sponsors y visitas de telemetría.</li>
              <li>Reiniciará las rifas a la campaña inicial de demostración en estado BORRADOR.</li>
              <li>Conserva de manera segura su cuenta de Super Administrador activa.</li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="btn-trigger-factory-reset"
              type="button"
              onClick={handleFactoryReset}
              disabled={loading}
              className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs px-6 py-3 rounded-2xl transition shadow-xl shadow-rose-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-rose-400/30"
            >
              <ShieldAlert size={16} />
              Ejecutar Reset a Configuración de Fábrica Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
