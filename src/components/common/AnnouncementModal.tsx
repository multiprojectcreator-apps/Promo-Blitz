/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, ArrowRight, CheckCircle, Volume2, ExternalLink } from 'lucide-react';
import { Announcement, AnnouncementRead, Seller } from '../../types';

interface AnnouncementModalProps {
  announcements: Announcement[];
  reads: AnnouncementRead[];
  currentSeller: Seller | null;
  onMarkAsRead: (announcementId: string) => Promise<void>;
  placement?: 'LOGIN' | 'DASHBOARD' | 'BOTH';
}

export default function AnnouncementModal({
  announcements,
  reads,
  currentSeller,
  onMarkAsRead,
  placement
}: AnnouncementModalProps) {
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Responsive device orientation/viewport check
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Filter unread announcements on load or update
  useEffect(() => {
    if (!currentSeller) {
      setIsOpen(false);
      return;
    }

    // 1. Filter announcements that are active
    let activeAnns = announcements.filter(a => a.status === 'ACTIVE');

    // 2. Filter by placement if specified
    if (placement) {
      if (placement === 'LOGIN') {
        activeAnns = activeAnns.filter(a => 
          a.placement === 'LOGIN' || 
          a.placement === 'BOTH' || 
          a.placement === 'MODAL_ALERTA'
        );
      } else if (placement === 'DASHBOARD') {
        activeAnns = activeAnns.filter(a => 
          a.placement === 'DASHBOARD' || 
          a.placement === 'BOTH' || 
          a.placement === 'VENDEDOR_PANEL'
        );
      }
    }

    // 3. Filter by seller targeting (either 'ALL' or specific to this seller)
    const targetedAnns = activeAnns.filter(a => 
      a.targetType === 'ALL' || a.targetSellerId === currentSeller.id
    );

    // 4. Filter by device target (ALL, DESKTOP, MOBILE)
    const deviceFilteredAnns = targetedAnns.filter(a => {
      if (!a.deviceTarget || a.deviceTarget === 'ALL') return true;
      if (a.deviceTarget === 'DESKTOP') return !isMobileDevice;
      if (a.deviceTarget === 'MOBILE') return isMobileDevice;
      return true;
    });

    // 5. Filter out announcements already read by this seller
    const sellerReads = reads.filter(r => r.sellerId === currentSeller.id);
    const unread = deviceFilteredAnns.filter(a => 
      !sellerReads.some(r => r.announcementId === a.id)
    );

    setUnreadAnnouncements(unread);
    setCurrentIndex(0);
    setIsOpen(unread.length > 0);
  }, [announcements, reads, currentSeller, placement, isMobileDevice]);

  if (!isOpen || unreadAnnouncements.length === 0) return null;

  const currentAnn = unreadAnnouncements[currentIndex];

  const handleNext = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Mark current as read
      await onMarkAsRead(currentAnn.id);

      // Go to next or close
      if (currentIndex < unreadAnnouncements.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Just close the modal, but do not mark as read (will pop up again in dashboard/login)
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Overlay blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0b0625] border border-purple-900/40 rounded-3xl shadow-2xl overflow-hidden z-10 border-t-8 border-t-purple-600"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Banner image or video if exists */}
          {currentAnn.imageUrl && (
            <div className="h-48 w-full overflow-hidden relative bg-slate-950 flex items-center justify-center">
              {currentAnn.imageUrl.startsWith('data:video/') || currentAnn.imageUrl.endsWith('.mp4') ? (
                <video
                  src={currentAnn.imageUrl}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={currentAnn.imageUrl}
                  alt="Comunicado"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Floating icon */}
              <div className="absolute bottom-4 left-4 bg-purple-600/95 text-white p-2.5 rounded-2xl shadow-lg border border-purple-400/50 z-10">
                <Volume2 className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          )}

          <div className="p-6">
            {!currentAnn.imageUrl && (
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-950/50 text-purple-400 p-3 rounded-2xl border border-purple-900/30">
                  <Megaphone className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <span className="bg-purple-500/20 text-purple-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-purple-500/30">
                    Comunicado Oficial
                  </span>
                  <h4 className="text-[10px] text-purple-300/60 font-semibold uppercase mt-0.5 tracking-wider">Aviso de la Administración</h4>
                </div>
              </div>
            )}

            {currentAnn.imageUrl && (
              <div className="mb-2">
                <span className="bg-purple-500/20 text-purple-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-purple-500/30">
                  Comunicado Oficial
                </span>
              </div>
            )}

            <h3 className="text-base sm:text-lg font-bold text-white font-display leading-snug mb-2">
              {currentAnn.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap bg-[#050212]/50 border border-purple-950/50 rounded-2xl p-4">
              {currentAnn.content}
            </p>

            {currentAnn.ctaText && currentAnn.ctaUrl && (
              <div className="mt-4">
                <a 
                  href={currentAnn.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-purple-500/20 transition duration-200"
                >
                  <span>{currentAnn.ctaText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Pagination helper */}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300/50 uppercase tracking-wider">
                Anuncio {currentIndex + 1} de {unreadAnnouncements.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <span>{currentIndex === unreadAnnouncements.length - 1 ? 'Entendido y Cerrar' : 'Siguiente Aviso'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
