/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Ticket, Filter, CheckCircle2, Award, X, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  targetId?: string;
  icon: React.ReactNode;
}

interface BuyerTourProps {
  onClose: () => void;
  active: boolean;
}

export default function BuyerTour({ onClose, active }: BuyerTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; position: 'above' | 'below' | 'center' }>({ top: 0, left: 0, position: 'center' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      title: "¡Te damos la bienvenida a PromoBlitz! ⚡",
      description: "Sigue esta breve visita guiada de 1 minuto para aprender cómo elegir, simular y reservar tus números de la suerte con total seguridad y transparencia.",
      icon: <img src="/icon.svg" alt="PromoBlitz Logo" className="w-6 h-6 rounded-lg object-contain shadow-sm" />
    },
    {
      title: "Asesor Autorizado 👤",
      description: "Si accediste con un enlace o código QR de un colaborador, aparecerá preseleccionado. Si es una solicitud directa, puedes elegir tu asesor preferido de la lista de confianza.",
      targetId: "tour-step-advisor",
      icon: <User className="w-5 h-5 text-purple-400" />
    },
    {
      title: "Generador de la Suerte 🎰",
      description: "¿Indeciso? Elige rápido utilizando el generador automático. Selecciona 1, 3 o 5 números libres al azar para que el sistema los asigne en un instante.",
      targetId: "tour-step-luckypick",
      icon: <Sparkles className="w-5 h-5 text-pink-400" />
    },
    {
      title: "Filtros de Cuadrícula 🔍",
      description: "Optimiza tu búsqueda. Filtra para ver exclusivamente números disponibles, reservados temporalmente o boletos ya verificados y confirmados.",
      targetId: "tour-step-filters",
      icon: <Filter className="w-5 h-5 text-indigo-400" />
    },
    {
      title: "Cuadrícula Interactiva 🎫",
      description: "Los números en azul oscuro están libres y listos. Haz clic en un número libre para seleccionarlo (cambiará a morado). Si haces clic en uno ocupado, verás su información.",
      targetId: "tour-step-grid",
      icon: <Ticket className="w-5 h-5 text-pink-400" />
    },
    {
      title: "Consolida tu Solicitud 📝",
      description: "Ingresa tus datos de contacto básicos, declara que eres mayor de edad (18+) y acepta los términos legales. El botón de reserva se habilitará de inmediato una vez marques estas opciones obligatorias.",
      targetId: "tour-step-form",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      title: "Tu Boleto Digital Real 💳",
      description: "¡Mira la magia en vivo! Aquí se renderiza en tiempo real tu boleto oficial dinámico con tus datos, número de la suerte elegido, precio y código de referencia.",
      targetId: "tour-step-preview",
      icon: <Award className="w-5 h-5 text-amber-400" />
    }
  ];

  const step = steps[currentStep];

  // Update bounding coordinates and calculate smart tooltip placement relative to viewport (fixed overlay)
  useEffect(() => {
    if (!active) return;

    const updateCoordsAndPosition = () => {
      if (!step.targetId) {
        setCoords(null);
        setTooltipPos({ top: 0, left: 0, position: 'center' });
        return;
      }

      const element = document.getElementById(step.targetId);
      if (element) {
        // Gently scroll element into view with padding
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const calculate = () => {
          const freshElement = document.getElementById(step.targetId!);
          if (!freshElement) return;

          const rect = freshElement.getBoundingClientRect();
          // Use viewport-relative coordinates because container is fixed inset-0
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });

          const isMobile = window.innerWidth < 768;
          const tooltipWidth = Math.min(420, window.innerWidth - 32);
          const tooltipHeight = 220; // estimated card height
          const gap = 14;

          if (isMobile) {
            // On mobile, anchor at top or bottom to avoid covering the element
            const isUpperHalf = rect.top < window.innerHeight / 2;
            setTooltipPos({
              top: isUpperHalf ? window.innerHeight - tooltipHeight - 20 : 20,
              left: 16,
              position: isUpperHalf ? 'below' : 'above'
            });
            return;
          }

          // Desktop smart placement: prefer below if room, otherwise above
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;

          let placement: 'above' | 'below' = 'below';
          let top = rect.bottom + gap;

          if (spaceBelow < tooltipHeight + gap && spaceAbove > spaceBelow) {
            placement = 'above';
            top = Math.max(16, rect.top - tooltipHeight - gap);
          } else {
            top = Math.min(window.innerHeight - tooltipHeight - 16, top);
          }

          // Horizontal centering with target element
          let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

          setTooltipPos({
            top,
            left,
            position: placement
          });
        };

        // Calculate immediately and after scroll animation settles
        calculate();
        setTimeout(calculate, 150);
        setTimeout(calculate, 300);
      } else {
        setCoords(null);
        setTooltipPos({ top: 0, left: 0, position: 'center' });
      }
    };

    updateCoordsAndPosition();

    window.addEventListener('resize', updateCoordsAndPosition);
    window.addEventListener('scroll', updateCoordsAndPosition, true);

    return () => {
      window.removeEventListener('resize', updateCoordsAndPosition);
      window.removeEventListener('scroll', updateCoordsAndPosition, true);
    };
  }, [currentStep, active, step.targetId]);

  if (!active) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCenterMode = !step.targetId || tooltipPos.position === 'center';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* Non-intrusive backdrop (completely transparent on desktop to allow clear interaction/view, light dim on mobile) */}
      <div 
        className={`absolute inset-0 transition-all duration-300 pointer-events-auto ${
          isCenterMode ? 'bg-[#050212]/50 backdrop-blur-[1px]' : 'bg-transparent md:bg-[#050212]/15'
        }`}
        onClick={onClose}
      />

      {/* Target Element Premium Highlighting Frame */}
      <AnimatePresence>
        {coords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            style={{
              position: 'absolute',
              top: coords.top - 6,
              left: coords.left - 6,
              width: coords.width + 12,
              height: coords.height + 12,
            }}
            className="rounded-2xl border-2 border-dashed border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.25)] bg-pink-500/5 z-40 pointer-events-none"
          >
            {/* Glowing ring corners */}
            <span className="absolute -top-1.5 -left-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover/Tooltip Container */}
      <div 
        className={`absolute w-full px-4 z-50 transition-all duration-300 flex ${
          isCenterMode 
            ? 'inset-0 items-center justify-center' // Centered welcome or mobile bottom sheet
            : 'pointer-events-none'
        }`}
        style={
          !isCenterMode 
            ? {
                top: tooltipPos.top,
                left: tooltipPos.left,
                maxWidth: '420px',
              }
            : undefined
        }
      >
        <motion.div
          ref={tooltipRef}
          initial={isCenterMode ? { opacity: 0, y: 50, scale: 0.95 } : { opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={isCenterMode ? { opacity: 0, y: 50, scale: 0.95 } : { opacity: 0, scale: 0.93 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className={`w-full max-w-[420px] bg-gradient-to-b from-[#110a35] to-[#08041a] border border-purple-500/30 p-5 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.6)] text-slate-200 pointer-events-auto relative ${
            isCenterMode && step.targetId ? 'fixed bottom-4 left-1/2 -translate-x-1/2 mb-2 w-[calc(100%-2rem)]' : ''
          }`}
        >
          {/* Subtle glow accent */}
          <div className="absolute -top-10 -left-10 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Elegant Indicator Pointer Arrow (Only shown on Desktop floating) */}
          {!isCenterMode && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t border-purple-500/30 bg-[#110a35] ${
                tooltipPos.position === 'above' 
                  ? '-bottom-2 border-r border-b border-l-0 border-t-0' 
                  : '-top-2'
              }`}
            />
          )}

          {/* Title & Step Header */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-300 shadow-inner">
                {step.icon}
              </div>
              <span className="text-[9px] text-pink-300 font-black tracking-widest uppercase bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/15">
                Paso {currentStep + 1} de {steps.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Omitir Guía"
            >
              <X size={14} />
            </button>
          </div>

          {/* Description Content */}
          <div className="mt-3 relative z-10">
            <h4 className="text-sm sm:text-base font-black font-display tracking-tight text-white">
              {step.title}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1.5 font-sans font-normal">
              {step.description}
            </p>
          </div>

          {/* Progress Indicator & Controls Footer */}
          <div className="mt-5 pt-3.5 border-t border-purple-950/40 flex items-center justify-between gap-4 relative z-10">
            {/* Step indicators */}
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-350 ${
                    idx === currentStep ? 'w-3.5 bg-pink-500' : 'w-1 bg-purple-950'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-2.5 py-1.5 hover:bg-white/5 border border-purple-950/50 text-purple-300 hover:text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={11} />
                  <span>Atrás</span>
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-[11px] font-black rounded-xl shadow-md shadow-pink-500/10 transition hover:scale-[1.02] flex items-center gap-1 cursor-pointer"
              >
                <span>{currentStep === steps.length - 1 ? '¡Listo!' : 'Siguiente'}</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

