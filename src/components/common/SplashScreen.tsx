import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Sparkles, RefreshCw } from 'lucide-react';

interface SplashScreenProps {
  isVisible: boolean;
  message?: string;
}

export default function SplashScreen({ isVisible, message = "Iniciando sistema..." }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="splash-screen-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050212]/50 backdrop-blur-xl select-none"
        >
          {/* Decorative glowing background orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] animate-pulse delay-75"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] animate-pulse delay-150"></div>

          {/* Floating Content Wrapper (No card background or borders) */}
          <motion.div
            id="splash-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="relative px-8 py-12 max-w-md w-full text-center flex flex-col items-center"
          >

            {/* Glowing/Floating Tombola animation */}
            <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
              {/* Pulsating backdrops */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 rounded-full border border-dashed border-purple-500/30 bg-purple-500/5"
              />
              <motion.div
                animate={{
                  scale: [1.1, 0.9, 1.1],
                  rotate: [360, 180, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-2 rounded-full border border-double border-pink-500/20 bg-pink-500/5"
              />

              {/* Glowing core with official PromoBlitz icon */}
              <motion.div
                animate={{
                  y: [-6, 6, -6],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10 w-20 h-20 rounded-3xl p-[2px] shadow-[0_0_35px_rgba(236,72,153,0.5)]"
              >
                <img src="/icon.svg" alt="PromoBlitz Official Logo" className="w-full h-full object-contain rounded-2xl" />
              </motion.div>

              {/* Small floating particles/tickets around */}
              <motion.div
                animate={{ x: [-20, 20, -20], y: [-15, 15, -15], rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-4 w-5 h-5 bg-pink-500/20 border border-pink-500/40 rounded-lg flex items-center justify-center"
              >
                <span className="text-[7px] text-pink-300 font-bold">77</span>
              </motion.div>
              <motion.div
                animate={{ x: [20, -20, 20], y: [15, -15, 15], rotate: [360, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1 left-2 w-6 h-6 bg-purple-500/20 border border-purple-500/40 rounded-lg flex items-center justify-center"
              >
                <span className="text-[8px] text-purple-300 font-bold">100</span>
              </motion.div>
              <motion.div
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 left-0 text-amber-400"
              >
                <Sparkles size={16} />
              </motion.div>
            </div>

            {/* App Branding */}
            <h2 className="text-3xl font-black tracking-tight font-display text-white mb-2 uppercase">
              Promo<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Blitz</span>
            </h2>
            <p className="text-[10px] text-purple-300 font-mono tracking-[0.2em] font-semibold uppercase mb-6">
              PLATAFORMA DE CAMPAÑAS Y PROMOCIONALES
            </p>

            {/* Minimal floating status loader */}
            <div className="w-full max-w-xs flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <RefreshCw size={14} className="text-pink-400 animate-spin" />
                <span>{message}</span>
              </div>
              
              {/* Dynamic loading bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>

            {/* Security/Authority note */}
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mt-6">
              CONEXIÓN SEGURA EN TIEMPO REAL
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
