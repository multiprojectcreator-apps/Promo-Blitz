/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Ticket, LogOut, LogIn, Download, WifiOff } from 'lucide-react';
import { User, Raffle } from '../../types';

interface HeaderProps {
  currentUser: User | null;
  activeRaffle: Raffle | null;
  wsConnected: boolean;
  showLogin: boolean;
  setCurrentUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  setShowLogin: (s: boolean) => void;
  pwaInstallPrompt?: any;
  onInstallPWA?: () => void;
  isOffline?: boolean;
}

export default function Header({
  currentUser,
  activeRaffle,
  wsConnected,
  showLogin,
  setCurrentUser,
  setToken,
  setShowLogin,
  pwaInstallPrompt,
  onInstallPWA,
  isOffline,
}: HeaderProps) {
  return (
    <header id="app-header" className="w-full bg-[#0c0728] border-b border-purple-950 text-white select-none shadow-md">
      <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/icon.svg" 
            alt="PromoBlitz Logo" 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-lg shadow-purple-500/30 object-contain hover:scale-105 transition-transform shrink-0" 
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display text-white leading-tight">
              Promo<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Blitz</span>
            </h1>
            <p className="text-[10px] text-purple-300 font-mono tracking-wider font-semibold uppercase">PLATAFORMA DE CAMPAÑAS Y PROMOCIONALES</p>
          </div>
        </div>

        {/* Offline Status Badge */}
        {isOffline && (
          <div id="offline-status-badge" className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl shadow-lg animate-pulse">
            <WifiOff size={14} className="text-rose-400" />
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider font-mono">Modo Offline</span>
          </div>
        )}

        {activeRaffle && !isOffline && (
          <div id="active-raffle-badge" className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl shadow-inner">
            <div className="text-right">
              <p className="text-[9px] text-purple-300 uppercase font-black tracking-widest">Sorteo Activo</p>
              <p className="text-xs font-black text-pink-400 truncate max-w-[180px]">{activeRaffle.prize}</p>
            </div>
            <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 text-[9px] px-2.5 py-1 rounded-lg border border-pink-500/30 font-black uppercase tracking-wider">
              Activo
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {/* PWA Install Button */}
          {pwaInstallPrompt && (
            <button
              id="btn-install-pwa"
              type="button"
              onClick={onInstallPWA}
              className="text-xs font-black px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer border border-emerald-400/20 active:translate-y-[1px]"
            >
              <Download size={13} className="text-white animate-bounce" />
              Instalar App
            </button>
          )}

          {/* User profile / actions */}
          {currentUser ? (
            <div id="user-profile-badge" className="flex items-center gap-3 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl shadow-sm">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-black text-white leading-none">{currentUser.name}</span>
                <span className="text-[9px] font-black mt-1 uppercase tracking-widest text-pink-400">
                  {currentUser.role}
                </span>
              </div>
              <button
                id="btn-logout"
                onClick={() => {
                  setCurrentUser(null);
                  setToken(null);
                  localStorage.removeItem('raffle_user_session');
                }}
                className="text-purple-300 hover:text-rose-400 p-1.5 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            // Public buyer / login switcher
            showLogin ? (
              <button
                id="btn-switch-to-buyer"
                type="button"
                onClick={() => setShowLogin(false)}
                className="text-xs font-black px-4.5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all shadow-md shadow-purple-500/10 flex items-center gap-1.5 cursor-pointer border border-purple-400/20"
              >
                <Ticket size={13} className="text-white" />
                Solicitar Boletos
              </button>
            ) : (
              <button
                id="btn-switch-to-staff"
                type="button"
                onClick={() => setShowLogin(true)}
                className="text-xs font-black px-4 py-2 border border-white/15 hover:border-white/35 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <LogIn size={13} />
                Iniciar Sesión
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
