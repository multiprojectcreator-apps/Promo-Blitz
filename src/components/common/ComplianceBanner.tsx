/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, ExternalLink, Scale, HelpCircle } from 'lucide-react';

interface ComplianceBannerProps {
  onOpenLegalModal: (tab: 'terms' | 'privacy' | 'rules') => void;
}

// In-memory flag instead of localStorage to ensure 100% online state without local footprint
let globalConsentAccepted = false;

export default function ComplianceBanner({ onOpenLegalModal }: ComplianceBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted the legal consent terms
    if (!globalConsentAccepted) {
      // Small delay to make it feel premium
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    globalConsentAccepted = true;
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 print:hidden">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-[#0b0625]/95 border border-purple-500/40 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden"
        >
          {/* Top colored aesthetic bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"></div>

          <button
            onClick={handleAccept}
            className="absolute top-3 right-3 text-purple-400 hover:text-white p-1 rounded-lg transition"
            title="Cerrar y aceptar"
          >
            <X size={14} />
          </button>

          <div className="flex gap-3 items-start">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-pink-400 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck size={18} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Consentimiento de Transparencia y Datos (RGPD)
              </h4>
              <p className="text-[10px] text-purple-200/80 leading-relaxed font-sans">
                Utilizamos cookies locales esenciales para resguardar tus reservas temporales de boletos por 3 horas y procesar la información de contacto estrictamente para la adjudicación del premio. No compartimos tus datos comerciales.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('privacy')}
                  className="inline-flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 font-bold transition cursor-pointer"
                >
                  <Scale size={10} />
                  Ver Política de Privacidad
                  <ExternalLink size={8} />
                </button>
                <span className="text-purple-600 text-[10px]">•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('terms')}
                  className="inline-flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 font-bold transition cursor-pointer"
                >
                  Términos de Servicio
                </button>
              </div>

              <div className="flex gap-2.5 pt-2.5">
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('rules')}
                  className="flex-1 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-900/30 text-purple-300 hover:text-white text-[10px] font-bold py-2 px-3 rounded-xl transition cursor-pointer"
                >
                  Reglamento de Campaña
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-md transition cursor-pointer"
                >
                  Aceptar y Continuar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
