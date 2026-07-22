/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Plus, Trash2, Edit2, Eye, ShieldAlert, CheckCircle, 
  ToggleLeft, ToggleRight, User, Layout, ArrowRight, X, ExternalLink, 
  FileText, Sparkles, BarChart2, Laptop, Tablet, AlertCircle, Smartphone
} from 'lucide-react';
import { Announcement, Seller, User as AppUser } from '../../types';

const compressImage = (file: File, maxWidth: number = 600, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

interface AnnouncementsManagerProps {
  currentUser: AppUser;
  sellers: Seller[];
  onAddAuditLog?: (action: string, details: string) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export default function AnnouncementsManager({
  currentUser,
  sellers,
  onAddAuditLog,
  showConfirm
}: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reads, setReads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Floating Modal Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [hasCta, setHasCta] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    targetType: 'ALL' as 'ALL' | 'SPECIFIC',
    targetSellerId: '',
    placement: 'COMPRADOR_HERO' as 'COMPRADOR_HERO' | 'VENDEDOR_PANEL' | 'MODAL_ALERTA' | 'LOGIN' | 'DASHBOARD' | 'BOTH' | 'COMPRADOR_SIDEBAR' | 'COMPRADOR_FOOTER' | 'COMPRADOR_MODAL' | 'COMPRADOR_FLOAT',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    ctaText: '',
    ctaUrl: '',
    deviceTarget: 'ALL' as 'ALL' | 'DESKTOP' | 'MOBILE'
  });

  // Selected announcement for detailed preview / stats
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  // --- AUSPICIANTES (SPONSORS) CORE STATES & HANDLERS ---
  const [activeSubTab, setActiveSubTab] = useState<'publicidad' | 'interna' | 'auspiciantes'>('publicidad');
  const [sponsorsList, setSponsorsList] = useState<any[]>([]);
  const [isSponsorsLoading, setIsSponsorsLoading] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [isEditingSponsor, setIsEditingSponsor] = useState(false);
  const [editingSponsorId, setEditingSponsorId] = useState('');
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    text: '',
    imageUrl: '',
    designLayout: 'IMAGE_ONLY' as 'IMAGE_ONLY' | 'IMAGE_TEXT' | 'TEXT_ONLY',
    enabled: true,
    order: 0
  });

  // Preview modal states
  const [isAnnPreviewModalOpen, setIsAnnPreviewModalOpen] = useState(false);
  const [isSponsorPreviewModalOpen, setIsSponsorPreviewModalOpen] = useState(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const fetchSponsors = async () => {
    setIsSponsorsLoading(true);
    try {
      const res = await fetch('/api/sponsors');
      if (res.ok) {
        const data = await res.json();
        setSponsorsList(data);
      }
    } catch (err) {
      console.error('Error fetching sponsors:', err);
    } finally {
      setIsSponsorsLoading(false);
    }
  };

  const handleResetSponsorForm = () => {
    setSponsorForm({
      name: '',
      text: '',
      imageUrl: '',
      designLayout: 'IMAGE_ONLY',
      enabled: true,
      order: sponsorsList.length
    });
    setIsEditingSponsor(false);
    setEditingSponsorId('');
  };

  const handleSubmitSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!sponsorForm.name.trim()) {
      setError('El nombre del auspiciante es requerido.');
      return;
    }

    try {
      const url = isEditingSponsor ? `/api/sponsors/${editingSponsorId}` : '/api/sponsors';
      const method = isEditingSponsor ? 'PUT' : 'POST';

      const payload = {
        adminUserId: currentUser.id,
        sponsorData: {
          name: sponsorForm.name,
          text: sponsorForm.text,
          imageUrl: sponsorForm.imageUrl || undefined,
          designLayout: sponsorForm.designLayout,
          enabled: sponsorForm.enabled,
          order: Number(sponsorForm.order) || 0
        }
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el auspiciante.');

      setSuccessMsg(isEditingSponsor ? 'Auspiciante actualizado correctamente.' : 'Auspiciante creado con éxito.');
      setIsSponsorModalOpen(false);
      handleResetSponsorForm();
      await fetchSponsors();

      if (onAddAuditLog) {
        onAddAuditLog(
          isEditingSponsor ? 'UPDATE_SPONSOR' : 'CREATE_SPONSOR',
          `Auspiciante: "${sponsorForm.name}"`
        );
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud.');
    }
  };

  const handleEditSponsorClick = (sp: any) => {
    setIsEditingSponsor(true);
    setEditingSponsorId(sp.id);
    setSponsorForm({
      name: sp.name,
      text: sp.text || '',
      imageUrl: sp.imageUrl || '',
      designLayout: sp.designLayout,
      enabled: sp.enabled,
      order: sp.order || 0
    });
    setError('');
    setIsSponsorModalOpen(true);
  };

  const handleDeleteSponsorClick = (id: string, name: string) => {
    const doDelete = async () => {
      setError('');
      setSuccessMsg('');

      try {
        const res = await fetch(`/api/sponsors/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminUserId: currentUser.id })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el auspiciante.');

        setSuccessMsg('Auspiciante eliminado.');
        await fetchSponsors();

        if (onAddAuditLog) {
          onAddAuditLog('DELETE_SPONSOR', `Eliminado: "${name}"`);
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err: any) {
        setError(err.message || 'Error al eliminar el auspiciante.');
      }
    };

    if (showConfirm) {
      showConfirm(
        '¿Eliminar auspiciante?',
        `¿Estás seguro de que deseas eliminar permanentemente al auspiciante "${name}"? Se quitará de los boletos emitidos.`,
        doDelete
      );
    } else if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al auspiciante "${name}"?`)) {
      doDelete();
    }
  };

  const handleToggleSponsorStatus = async (sp: any) => {
    try {
      const newEnabled = !sp.enabled;
      const res = await fetch(`/api/sponsors/${sp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          sponsorData: { enabled: newEnabled }
        })
      });

      if (!res.ok) throw new Error('No se pudo cambiar el estado.');
      await fetchSponsors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [annRes, readRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/announcements/reads')
      ]);

      if (!annRes.ok || !readRes.ok) throw new Error('Error al conectar con el servidor.');

      const annData = await annRes.json();
      const readData = await readRes.json();

      setAnnouncements(annData);
      setReads(readData);
      if (annData.length > 0 && !selectedAnn) {
        setSelectedAnn(annData[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los anuncios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSponsors();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'publicidad' || activeSubTab === 'interna') {
      const currentTabAnns = announcements.filter(ann => {
        const isPublic = ['COMPRADOR_HERO', 'LOGIN', 'COMPRADOR_SIDEBAR', 'COMPRADOR_FOOTER', 'COMPRADOR_MODAL', 'COMPRADOR_FLOAT'].includes(ann.placement);
        return activeSubTab === 'publicidad' ? isPublic : !isPublic;
      });
      if (currentTabAnns.length > 0) {
        if (!selectedAnn || !currentTabAnns.some(a => a.id === selectedAnn.id)) {
          setSelectedAnn(currentTabAnns[0]);
        }
      } else {
        setSelectedAnn(null);
      }
    } else {
      setSelectedAnn(null);
    }
  }, [activeSubTab, announcements]);

  const handleResetForm = (tab = activeSubTab) => {
    setForm({
      title: '',
      content: '',
      imageUrl: '',
      targetType: 'ALL',
      targetSellerId: sellers[0]?.id || '',
      placement: tab === 'publicidad' ? 'COMPRADOR_HERO' : 'VENDEDOR_PANEL',
      status: 'ACTIVE',
      ctaText: '',
      ctaUrl: '',
      deviceTarget: 'ALL'
    });
    setHasCta(false);
    setIsEditing(false);
    setEditingId('');
    setError('');
  };

  const handleOpenCreateModal = () => {
    handleResetForm();
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (form.targetType === 'SPECIFIC' && !form.targetSellerId) {
      setError('Debes seleccionar un colaborador específico.');
      return;
    }

    if (hasCta && (!form.ctaText || !form.ctaUrl)) {
      setError('Si habilitas el botón de llamada a la acción (CTA), debes ingresar el texto y el enlace de destino.');
      return;
    }

    try {
      const url = isEditing ? `/api/announcements/${editingId}` : '/api/announcements';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        adminUserId: currentUser.id,
        announcementData: {
          title: form.title,
          content: form.content,
          imageUrl: form.imageUrl || undefined,
          targetType: form.targetType,
          targetSellerId: form.targetType === 'SPECIFIC' ? form.targetSellerId : undefined,
          placement: form.placement,
          status: form.status,
          ctaText: hasCta ? form.ctaText : '',
          ctaUrl: hasCta ? form.ctaUrl : '',
          deviceTarget: form.deviceTarget
        }
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el aviso.');

      const isPublic = ['COMPRADOR_HERO', 'LOGIN', 'COMPRADOR_SIDEBAR', 'COMPRADOR_FOOTER', 'COMPRADOR_MODAL', 'COMPRADOR_FLOAT'].includes(form.placement);
      setSuccessMsg(
        isEditing 
          ? (isPublic ? 'Publicidad actualizada correctamente.' : 'Mensaje de comunicación interna actualizado correctamente.') 
          : (isPublic ? 'Publicidad creada con éxito.' : 'Mensaje de comunicación interna enviado con éxito.')
      );
      setIsFormModalOpen(false);
      handleResetForm();
      await fetchData();

      // Update currently selected preview if we edited it
      if (isEditing && selectedAnn?.id === editingId) {
        setSelectedAnn(data);
      }

      if (onAddAuditLog) {
        onAddAuditLog(
          isEditing ? 'UPDATE_ANNOUNCEMENT' : 'CREATE_ANNOUNCEMENT',
          `${isPublic ? 'Publicidad' : 'Mensajería Interna'}: "${form.title}"`
        );
      }
      
      // Auto-clear success message after 4s
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud.');
    }
  };

  const handleEditClick = (ann: Announcement) => {
    setIsEditing(true);
    setEditingId(ann.id);
    const usesCta = !!(ann.ctaText && ann.ctaUrl);
    setHasCta(usesCta);
    setForm({
      title: ann.title,
      content: ann.content,
      imageUrl: ann.imageUrl || '',
      targetType: ann.targetType,
      targetSellerId: ann.targetSellerId || (sellers[0]?.id || ''),
      placement: ann.placement as any,
      status: ann.status,
      ctaText: ann.ctaText || '',
      ctaUrl: ann.ctaUrl || '',
      deviceTarget: ann.deviceTarget || 'ALL'
    });
    setError('');
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (id: string, title: string) => {
    const doDelete = async () => {
      setError('');
      setSuccessMsg('');

      try {
        const res = await fetch(`/api/announcements/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminUserId: currentUser.id })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el aviso.');

        setSuccessMsg('Anuncio eliminado.');
        if (selectedAnn?.id === id) {
          setSelectedAnn(null);
        }
        await fetchData();

        if (onAddAuditLog) {
          onAddAuditLog('DELETE_ANNOUNCEMENT', `Eliminado: "${title}"`);
        }
        
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err: any) {
        setError(err.message || 'Error al eliminar el aviso.');
      }
    };

    if (showConfirm) {
      showConfirm(
        '¿Eliminar anuncio?',
        `¿Estás seguro de que deseas eliminar permanentemente el anuncio "${title}"?`,
        doDelete
      );
    } else if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el anuncio "${title}"?`)) {
      doDelete();
    }
  };

  const handleToggleStatus = async (ann: Announcement) => {
    try {
      const newStatus = ann.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`/api/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          announcementData: { status: newStatus }
        })
      });

      if (!res.ok) throw new Error('No se pudo cambiar el estado.');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getTargetLabel = (ann: Announcement) => {
    if (ann.targetType === 'ALL') return '📢 Todos';
    const s = sellers.find(seller => seller.id === ann.targetSellerId);
    return `👤 Colaborador: ${s ? s.name : 'No asignado'}`;
  };

  const getPlacementLabel = (p: string) => {
    switch (p) {
      case 'COMPRADOR_HERO': return '🍀 Comprador - Banner Principal';
      case 'COMPRADOR_SIDEBAR': return '🍀 Comprador - Barra Lateral (Sidebar)';
      case 'COMPRADOR_FOOTER': return '🍀 Comprador - Pie de Página (Footer)';
      case 'COMPRADOR_MODAL': return '🍀 Comprador - Alerta Emergente al entrar (Modal)';
      case 'COMPRADOR_FLOAT': return '🍀 Comprador - Tarjeta Flotante Esquina (Floating Widget)';
      case 'VENDEDOR_PANEL': return '📊 Colaborador - Panel / Dashboard';
      case 'MODAL_ALERTA': return '🚨 Modal Alerta Emergente';
      case 'LOGIN': return '🚪 Al iniciar sesión';
      case 'DASHBOARD': return '📊 Panel del colaborador (Legacy)';
      case 'BOTH': return '🔄 Ambos (Legacy)';
      default: return p;
    }
  };

  // Get reading count for an announcement
  const getReadCount = (annId: string) => {
    return reads.filter(r => r.announcementId === annId).length;
  };

  const publicPlacements = ['COMPRADOR_HERO', 'LOGIN', 'COMPRADOR_SIDEBAR', 'COMPRADOR_FOOTER', 'COMPRADOR_MODAL', 'COMPRADOR_FLOAT'];
  const publicAnnouncements = announcements.filter(a => publicPlacements.includes(a.placement));
  const internalAnnouncements = announcements.filter(a => !publicPlacements.includes(a.placement));

  const filteredAnnouncements = activeSubTab === 'publicidad' 
    ? publicAnnouncements 
    : activeSubTab === 'interna' 
      ? internalAnnouncements 
      : [];

  const activeAdsCount = filteredAnnouncements.filter(a => a.status === 'ACTIVE').length;
  const currentTabReadsCount = reads.filter(r => filteredAnnouncements.some(a => a.id === r.announcementId)).length;

  return (
    <div className="space-y-6">
      {/* Top Header Section with Stats */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider">
              {activeSubTab === 'auspiciantes' 
                ? 'Módulo de Patrocinios, Marcas y Auspiciantes Oficiales'
                : activeSubTab === 'publicidad'
                  ? 'Módulo de Publicidad y Campañas al Público General'
                  : 'Módulo de Comunicados Oficiales y Mensajería Interna para Asesores'}
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white mt-4 flex items-center gap-2">
              <Megaphone className="w-8 h-8 text-pink-400 animate-pulse" />
              {activeSubTab === 'auspiciantes' 
                ? 'Auspiciantes y Patrocinios'
                : activeSubTab === 'publicidad'
                  ? 'Publicidad al Público'
                  : 'Mensajería Interna (Asesores)'}
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
              {activeSubTab === 'auspiciantes'
                ? 'Configura la publicidad de tus auspiciantes de manera elegante en el pie de los boletos. Soporta logotipos, slogans y tres modos de diseño completamente no intrusivos.'
                : activeSubTab === 'publicidad'
                  ? 'Crea y gestiona campañas de publicidad dirigidas al público en general. Los anuncios se muestran en banners destacados del portal de compra y en la vista pública.'
                  : 'Redacta comunicados, alertas operativas o directrices exclusivas para tus asesores. Estos avisos aparecerán directamente en sus paneles privados de trabajo.'}
            </p>
          </div>
          
          {activeSubTab !== 'auspiciantes' ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-xs cursor-pointer border border-purple-400/20"
            >
              <Plus className="w-4 h-4 font-bold" />
              {activeSubTab === 'publicidad' ? 'Crear Publicidad' : 'Crear Mensaje Interno'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { handleResetSponsorForm(); setIsSponsorModalOpen(true); }}
              className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-xs cursor-pointer border border-purple-400/20"
            >
              <Plus className="w-4 h-4 font-bold" />
              Configurar Auspiciante
            </button>
          )}
        </div>

        {/* Mini stats cards inside banner (conditional on active sub-tab) */}
        {activeSubTab !== 'auspiciantes' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                {activeSubTab === 'publicidad' ? 'Anuncios Totales' : 'Mensajes Totales'}
              </span>
              <span className="text-xl font-black block mt-1 font-mono text-purple-300">{filteredAnnouncements.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                {activeSubTab === 'publicidad' ? 'Anuncios Activos' : 'Mensajes Activos'}
              </span>
              <span className="text-xl font-black block mt-1 font-mono text-emerald-400">{activeAdsCount}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Visualizaciones</span>
              <span className="text-xl font-black block mt-1 font-mono text-pink-400">{currentTabReadsCount}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Efectividad</span>
              <span className="text-xl font-black block mt-1 font-mono text-teal-400">
                {filteredAnnouncements.length > 0 ? `${Math.round((currentTabReadsCount / filteredAnnouncements.length) * 10) / 10} lect/anun` : '0'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Auspiciantes Totales</span>
              <span className="text-xl font-black block mt-1 font-mono text-purple-300">{sponsorsList.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Auspiciantes Activos</span>
              <span className="text-xl font-black block mt-1 font-mono text-emerald-400">
                {sponsorsList.filter(s => s.enabled).length}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Espacios Disponibles</span>
              <span className="text-xl font-black block mt-1 font-mono text-pink-400">1 por Boleto</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Política de Diseño</span>
              <span className="text-xs font-black block mt-2 text-teal-400 uppercase tracking-widest">NO INTRUSIVA</span>
            </div>
          </div>
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6 mt-4">
        <button
          type="button"
          onClick={() => { setActiveSubTab('publicidad'); setError(''); }}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
            activeSubTab === 'publicidad' 
              ? 'text-pink-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Publicidad</span>
          {activeSubTab === 'publicidad' && (
            <motion.div layoutId="subTabBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('interna'); setError(''); }}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
            activeSubTab === 'interna' 
              ? 'text-pink-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Mensajería Interna</span>
          {activeSubTab === 'interna' && (
            <motion.div layoutId="subTabBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('auspiciantes'); setError(''); }}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
            activeSubTab === 'auspiciantes' 
              ? 'text-pink-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            Auspiciantes (Tickets)
            <span className="bg-pink-500/10 text-pink-300 text-[8px] px-2 py-0.5 rounded-full border border-pink-500/20 font-black tracking-widest">NUEVO</span>
          </span>
          {activeSubTab === 'auspiciantes' && (
            <motion.div layoutId="subTabBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full" />
          )}
        </button>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-sm"
        >
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </motion.div>
      )}

      {/* Sub-Tab 1: List and Live Preview of Announcements */}
      {(activeSubTab === 'publicidad' || activeSubTab === 'interna') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Side: List of Advertisements */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-white">
            <div>
              <h3 className="text-sm font-black font-display uppercase tracking-wider text-white mb-4 flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  {activeSubTab === 'publicidad' ? 'Campañas Publicitarias' : 'Mensajería Interna'}
                </span>
                {isLoading && <span className="text-xs text-slate-400 font-normal animate-pulse">Cargando...</span>}
              </h3>

              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-16 bg-slate-950 border border-dashed border-slate-850 rounded-2xl">
                  <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">
                    {activeSubTab === 'publicidad' 
                      ? 'No hay ninguna campaña publicitaria.' 
                      : 'No hay mensajes o comunicados de mensajería interna.'}
                  </p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    {activeSubTab === 'publicidad'
                      ? 'Haz clic en el botón superior derecho "Crear Publicidad" para abrir el formulario flotante y lanzar tu primera campaña de impacto.'
                      : 'Haz clic en el botón superior derecho "Crear Mensaje Interno" para redactar un comunicado importante para tus asesores.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredAnnouncements.map((ann, index) => (
                    <div
                      key={`${ann.id}-${index}`}
                      onClick={() => setSelectedAnn(ann)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group ${
                        selectedAnn?.id === ann.id
                          ? 'bg-purple-500/10 border-purple-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-850 hover:bg-slate-850/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            ann.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {ann.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </span>
                          
                          <span className="text-[9px] text-slate-500 font-mono font-bold">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-white truncate">{ann.title}</h4>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <User size={11} className="text-slate-500" />
                            {getTargetLabel(ann)}
                          </span>
                          <span className="text-slate-800">|</span>
                          <span className="flex items-center gap-1 text-purple-300 font-semibold">
                            <Layout size={11} className="text-purple-400" />
                            {getPlacementLabel(ann.placement)}
                          </span>
                          <span className="text-slate-800">|</span>
                          <span className="flex items-center gap-1 text-teal-300 font-semibold" title="Filtro de visualización en dispositivos">
                            <Laptop size={11} className="text-teal-400" />
                            {ann.deviceTarget === 'DESKTOP' ? 'Escritorio' : ann.deviceTarget === 'MOBILE' ? 'Móvil' : 'Todos'}
                          </span>
                          {ann.ctaText && (
                            <>
                              <span className="text-slate-800">|</span>
                              <span className="bg-pink-500/10 text-pink-300 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-pink-500/20">
                                Con CTA ⚡
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[9px] font-black px-2 py-1 rounded-xl flex items-center gap-1.5 mr-1" title="Visualizaciones confirmadas">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{getReadCount(ann.id)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ann)}
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                          title={ann.status === 'ACTIVE' ? 'Desactivar Anuncio' : 'Activar Anuncio'}
                        >
                          {ann.status === 'ACTIVE' ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditClick(ann)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                          title="Editar anuncio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClick(ann.id, ann.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                          title="Eliminar anuncio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Real-time Live Preview depending on placement! */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between text-white shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
              
              <div>
                <h3 className="text-xs font-black font-display uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  Vista Previa de Impacto en Vivo
                </h3>

                {selectedAnn ? (
                  <div className="space-y-4">
                    {/* Selector of Mockup context */}
                    <div className="bg-slate-950 border border-slate-850 p-1.5 rounded-xl text-[10px] font-black text-slate-300 inline-flex items-center gap-1.5 mb-2">
                      <Laptop size={12} className="text-slate-500" />
                      <span>ENTORNO SELECCIONADO:</span>
                      <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-purple-400 font-bold uppercase tracking-wider shadow-inner">
                        {selectedAnn.placement}
                      </span>
                    </div>

                    {/* Render based on placement choice */}
                    {selectedAnn.placement === 'COMPRADOR_SIDEBAR' ? (
                      /* Sidebar Banner Mockup for Buyer */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-lg">
                        <div className="p-2 bg-slate-900 text-[9px] text-slate-400 font-mono text-center border-b border-slate-850">
                          VISTA BARRA LATERAL (COMPRADOR PANEL)
                        </div>
                        <div className="p-4 bg-gradient-to-b from-[#120a3a] to-[#07041a] text-white space-y-3 relative overflow-hidden">
                          <span className="bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full block w-max">
                            ANUNCIO LATERAL
                          </span>
                          <h4 className="text-xs font-black tracking-tight">{selectedAnn.title}</h4>
                          <p className="text-[10px] text-purple-200 leading-normal line-clamp-4">{selectedAnn.content}</p>
                          {selectedAnn.imageUrl && (
                            <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                              <img src={selectedAnn.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                            <a 
                              href={selectedAnn.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 w-full py-2 bg-pink-500 hover:bg-pink-400 text-white text-[10px] font-black rounded-lg shadow-sm transition"
                            >
                              <span>{selectedAnn.ctaText}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : selectedAnn.placement === 'COMPRADOR_FOOTER' ? (
                      /* Footer Banner Mockup for Buyer */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-lg">
                        <div className="p-2 bg-slate-900 text-[9px] text-slate-400 font-mono text-center border-b border-slate-850">
                          VISTA PIE DE PÁGINA (COMPRADOR PANEL)
                        </div>
                        <div className="p-4 bg-gradient-to-r from-[#0d072e] via-[#1a0e4c] to-[#0d072e] text-white flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                          <div className="flex items-center gap-3">
                            {selectedAnn.imageUrl && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                <img src={selectedAnn.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full block w-max">
                                AUSPICIO OFICIAL
                              </span>
                              <h4 className="text-xs font-black tracking-tight mt-1">{selectedAnn.title}</h4>
                              <p className="text-[10px] text-purple-200 leading-normal line-clamp-1">{selectedAnn.content}</p>
                            </div>
                          </div>
                          {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                            <a 
                              href={selectedAnn.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] font-black rounded-lg shadow-sm transition shrink-0"
                            >
                              <span>{selectedAnn.ctaText}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : selectedAnn.placement === 'COMPRADOR_MODAL' ? (
                      /* Floating Popup Modal Mockup for Buyer */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950/30 backdrop-blur-sm p-4 flex justify-center items-center">
                        <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden border-t-8 border-t-pink-500 relative">
                          <div className="p-2 bg-slate-950 text-[8px] text-slate-500 font-mono text-center border-b border-slate-850">
                            ALERTA EMERGENTE DEL COMPRADOR
                          </div>
                          {selectedAnn.imageUrl && (
                            <div className="h-32 w-full overflow-hidden bg-slate-950">
                              <img src={selectedAnn.imageUrl} alt="" className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <span className="bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-max">
                              PROMO EXCLUSIVA
                            </span>
                            <h4 className="text-xs font-black text-white leading-tight">{selectedAnn.title}</h4>
                            <p className="text-[10px] text-slate-400 leading-normal line-clamp-3">{selectedAnn.content}</p>
                            <div className="flex justify-end gap-2 border-t border-slate-850 pt-3 mt-4">
                              <button className="text-[9px] font-bold text-slate-500 hover:text-slate-300 px-2 py-1">Cerrar</button>
                              {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                                <a 
                                  href={selectedAnn.ctaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-pink-600 hover:bg-pink-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                                >
                                  <span>{selectedAnn.ctaText}</span>
                                  <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : selectedAnn.placement === 'COMPRADOR_FLOAT' ? (
                      /* Floating Corner Card Mockup for Buyer */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950/40 backdrop-blur-sm p-6 flex justify-end items-end min-h-[220px] relative">
                        <div className="absolute top-4 left-4 text-[9px] text-slate-400 font-mono">
                          VISTA TARJETA FLOTANTE (ESQUINA INFERIOR)
                        </div>
                        <div className="w-64 bg-gradient-to-br from-[#1c0d4a] to-[#0d0728] border border-pink-500/30 rounded-2xl shadow-xl overflow-hidden p-4 space-y-3 relative">
                          <button className="absolute top-2 right-2 text-slate-400 hover:text-white text-[10px] font-bold">×</button>
                          <div className="flex gap-2.5 items-start">
                            {selectedAnn.imageUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                <img src={selectedAnn.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="space-y-1 min-w-0">
                              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full block w-max">
                                DESTACADO
                              </span>
                              <h4 className="text-[11px] font-black text-white leading-tight truncate">{selectedAnn.title}</h4>
                              <p className="text-[9px] text-purple-200 leading-snug line-clamp-2">{selectedAnn.content}</p>
                            </div>
                          </div>
                          {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                            <a 
                              href={selectedAnn.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 w-full py-1.5 bg-pink-500 hover:bg-pink-400 text-white text-[9px] font-black rounded-lg transition"
                            >
                              <span>{selectedAnn.ctaText}</span>
                              <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : selectedAnn.placement === 'LOGIN' ? (
                      /* Login screen mockup */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-lg">
                        <div className="p-2 bg-slate-900 text-[9px] text-slate-400 font-mono text-center border-b border-slate-850">
                          BANNER DE PANTALLA DE INICIO / LOGIN
                        </div>
                        <div className="p-5 bg-gradient-to-r from-slate-950 via-[#10072d] to-slate-950 text-white text-center relative overflow-hidden min-h-[140px] flex flex-col justify-center items-center gap-2">
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[8px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                            BIENVENIDO AL PORTAL
                          </span>
                          <h4 className="text-sm font-black tracking-tight">{selectedAnn.title}</h4>
                          <p className="text-[10px] text-purple-200 leading-normal max-w-xs">{selectedAnn.content}</p>
                          {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                            <a 
                              href={selectedAnn.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[9px] font-black rounded-lg shadow-sm"
                            >
                              <span>{selectedAnn.ctaText}</span>
                              <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : selectedAnn.placement === 'COMPRADOR_HERO' ? (
                      /* Hero Banner Mockup for Buyer */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-lg">
                        <div className="p-2 bg-slate-900 text-[9px] text-slate-400 font-mono text-center border-b border-slate-850">
                          VISTA BANNER PRINCIPAL (COMPRADOR PANEL)
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-900/60 to-pink-950/60 p-6 text-white relative min-h-[140px] flex flex-col justify-between overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>
                          {selectedAnn.imageUrl && (
                            <div className="absolute top-0 right-0 w-1/3 h-full opacity-40 z-0">
                              <img src={selectedAnn.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          
                          <div className="relative z-10 max-w-[70%]">
                            <span className="bg-white/10 text-white border border-white/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                              ANUNCIO PATROCINADO
                            </span>
                            <h4 className="text-base font-black tracking-tight mt-2">{selectedAnn.title}</h4>
                            <p className="text-[11px] text-purple-100 mt-1 leading-normal line-clamp-2">{selectedAnn.content}</p>
                          </div>

                          {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                            <div className="mt-4 relative z-10">
                              <a 
                                href={selectedAnn.ctaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-[11px] font-black rounded-xl shadow-md transition"
                              >
                                <span>{selectedAnn.ctaText}</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedAnn.placement === 'MODAL_ALERTA' ? (
                      /* Floating Popup Alerta Mockup */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950/30 backdrop-blur-sm p-4 flex justify-center items-center">
                        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden border-t-8 border-t-purple-600 relative">
                          <div className="p-2.5 bg-slate-950 text-[8px] text-slate-500 font-mono text-center border-b border-slate-850">
                            MOCKUP DE ALERTA EMERGENTE (CUALQUIER ROL)
                          </div>

                          {selectedAnn.imageUrl && (
                            <div className="h-48 w-full overflow-hidden relative bg-slate-950 flex items-center justify-center">
                              {selectedAnn.imageUrl.startsWith('data:video/') || selectedAnn.imageUrl.endsWith('.mp4') ? (
                                <video src={selectedAnn.imageUrl} muted loop autoPlay className="w-full h-full object-contain" />
                              ) : (
                                <img src={selectedAnn.imageUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          )}

                          <div className="p-4">
                            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-max mb-1.5">
                              AVISO IMPORTANTE
                            </span>
                            <h4 className="text-xs font-black text-white mb-1 leading-tight">{selectedAnn.title}</h4>
                            <p className="text-[10px] text-slate-400 leading-normal line-clamp-3 whitespace-pre-wrap">{selectedAnn.content}</p>

                            <div className="mt-4 flex justify-between gap-2 border-t border-slate-800 pt-3">
                              <button className="text-[10px] font-bold text-slate-500 hover:text-slate-300 px-2 py-1">
                                Cerrar
                              </button>
                              
                              {selectedAnn.ctaText && selectedAnn.ctaUrl ? (
                                <a 
                                  href={selectedAnn.ctaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                                >
                                  <span>{selectedAnn.ctaText}</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <button className="bg-slate-950 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg border border-slate-850">
                                  Entendido
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Seller Dashboard Card Mockup */
                      <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950 shadow-md">
                        <div className="p-2 bg-slate-900 text-[9px] text-slate-400 font-mono text-center border-b border-slate-850">
                          VISTA TARJETA DE DASHBOARD (PANEL COLABORADOR)
                        </div>

                        <div className="p-4 border-l-4 border-l-pink-500 flex gap-4 items-start">
                          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 shrink-0">
                            <Megaphone size={16} className="animate-bounce" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-extrabold uppercase bg-pink-500/10 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20">
                              Comunicado de la Organización
                            </span>
                            <h4 className="text-xs font-black text-white mt-1">{selectedAnn.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{selectedAnn.content}</p>
                            
                            {selectedAnn.ctaText && selectedAnn.ctaUrl && (
                              <div className="mt-2.5">
                                <a 
                                  href={selectedAnn.ctaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-slate-900 text-white text-[9px] font-extrabold px-3 py-1 rounded-lg border border-slate-800 hover:bg-slate-850"
                                >
                                  <span>{selectedAnn.ctaText}</span>
                                  <ExternalLink size={8} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata display */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 border border-slate-850 rounded-2xl p-4 font-sans">
                      <div>
                        <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Ubicación física</span>
                        <span className="font-bold text-slate-300">{getPlacementLabel(selectedAnn.placement)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Segmento Colaboradores</span>
                        <span className="font-bold text-slate-300">{getTargetLabel(selectedAnn)}</span>
                      </div>
                      <div className="col-span-2 border-t border-slate-850 pt-2 mt-1 flex justify-between">
                        <div>
                          <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Filtro de Dispositivo (Viewport)</span>
                          <span className="font-bold text-teal-400">
                            {selectedAnn.deviceTarget === 'DESKTOP' ? '💻 Solo Escritorio' : selectedAnn.deviceTarget === 'MOBILE' ? '📱 Solo Dispositivos Móviles' : '📱💻 Todos los Dispositivos'}
                          </span>
                        </div>
                      </div>
                      {selectedAnn.ctaText && (
                        <div className="col-span-2 border-t border-slate-850 pt-2 mt-1">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Botón Llamada a la Acción (CTA)</span>
                          <a 
                            href={selectedAnn.ctaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-bold text-purple-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            <span>[{selectedAnn.ctaText}]</span>
                            <span className="text-slate-500 text-[9px] font-mono font-normal truncate">({selectedAnn.ctaUrl})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 italic">
                    Selecciona un anuncio de la lista para ver su previsualización en vivo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Sponsor Management Dashboard */}
      {activeSubTab === 'auspiciantes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column: Sponsors list */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-3">
                <h3 className="text-sm font-black font-display uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  Marcas y Auspiciantes Registrados
                </h3>
                {isSponsorsLoading && <span className="text-xs text-slate-400 font-normal animate-pulse">Cargando...</span>}
              </div>

              {sponsorsList.length === 0 ? (
                <div className="text-center py-16 bg-slate-950 border border-dashed border-slate-850 rounded-2xl">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">No hay ningún auspiciante configurado.</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Haz clic en el botón superior derecho <strong>"Configurar Auspiciante"</strong> para registrar tu primera marca patrocinadora de manera elegante.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {[...sponsorsList].sort((a,b) => (a.order || 0) - (b.order || 0)).map((sp, index) => (
                    <div
                      key={`${sp.id}-${index}`}
                      onClick={() => {}}
                      className="p-4 rounded-2xl border bg-slate-950 border-slate-850 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        {sp.imageUrl ? (
                          <img src={sp.imageUrl} alt={sp.name} className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 object-contain shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold font-display text-sm shrink-0 uppercase">
                            {sp.name.slice(0, 2)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              sp.enabled
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {sp.enabled ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="text-[9px] text-purple-300 font-mono font-bold">
                              Layout: {sp.designLayout}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-white truncate">{sp.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{sp.text || <span className="italic text-slate-600">Sin slogan / texto</span>}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleSponsorStatus(sp)}
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                          title={sp.enabled ? 'Desactivar Auspiciante' : 'Activar Auspiciante'}
                        >
                          {sp.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditSponsorClick(sp)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                          title="Editar Auspiciante"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSponsorClick(sp.id, sp.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                          title="Eliminar Auspiciante"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic layout guidelines & visual explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between text-white shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
              
              <div>
                <h3 className="text-xs font-black font-display uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-purple-400" />
                  Diseño de Publicidad No Invasiva
                </h3>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                  Para asegurar que la publicidad de tus auspiciantes sea <strong>no invasiva ni intrusiva</strong>, las marcas se renderizan de manera elegante y sutil en una sub-tarjeta integrada al pie de cada boleto oficial emitido.
                </p>

                <div className="space-y-3.5">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl">
                    <span className="text-[9px] font-black uppercase text-pink-400 block mb-1">📐 Layout: Solo Imagen</span>
                    <p className="text-[10px] text-slate-400">Excelente para logotipos horizontales limpios. Oculta el slogan y prioriza el reconocimiento de marca directo.</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl">
                    <span className="text-[9px] font-black uppercase text-pink-400 block mb-1">📐 Layout: Imagen + Texto</span>
                    <p className="text-[10px] text-slate-400">Combina un logotipo pequeño a la izquierda con el nombre de la empresa y una frase publicitaria corta a la derecha.</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl">
                    <span className="text-[9px] font-black uppercase text-pink-400 block mb-1">📐 Layout: Solo Texto</span>
                    <p className="text-[10px] text-slate-400">Ideal si no cuentas con una imagen limpia o transparente. Muestra un elegante título del auspiciador oficial junto con su slogan.</p>
                  </div>
                </div>

                <div className="bg-purple-950/20 border border-purple-900/30 p-3.5 rounded-2xl mt-4 flex items-start gap-2 text-[10px] text-purple-300">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-purple-400" />
                  <p>Si activas múltiples auspiciantes, el sistema tomará automáticamente el primero habilitado según su orden de prioridad para mantener el diseño libre de amontonamientos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL FORM: CREATE / EDIT ANNOUNCEMENT */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Card content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.4 } }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 border-t-8 border-t-purple-600 flex flex-col my-8 text-white"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 overflow-y-auto max-h-[85vh]">
                <div className="flex items-center gap-2.5 mb-4 border-b border-slate-850 pb-3">
                  <div className="bg-purple-500/10 text-purple-400 p-2.5 rounded-2xl border border-purple-500/20">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display uppercase tracking-wider text-white">
                      {isEditing 
                        ? (activeSubTab === 'publicidad' ? 'Editar Publicidad' : 'Editar Mensaje Interno') 
                        : (activeSubTab === 'publicidad' ? 'Crear Nueva Publicidad' : 'Enviar Nuevo Mensaje Interno')}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {activeSubTab === 'publicidad' 
                        ? 'Configure la campaña de publicidad general' 
                        : 'Configure el comunicado exclusivo para asesores'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {activeSubTab === 'publicidad' ? 'Título de la Publicidad *' : 'Título del Comunicado *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      placeholder={activeSubTab === 'publicidad' ? 'ej. ¡Súper Promo de Hoy!' : 'ej. ¡Anuncio importante sobre comisiones!'}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                    />
                  </div>

                  {/* Contenido / Mensaje */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {activeSubTab === 'publicidad' ? 'Mensaje o Descripción de la Publicidad *' : 'Mensaje o Contenido del Comunicado *'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      maxLength={280}
                      placeholder={activeSubTab === 'publicidad' ? 'Describe la oferta o anuncio para el público. Máximo 280 caracteres.' : 'Describe la directriz o aviso para tus asesores. Máximo 280 caracteres.'}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-sans resize-none"
                    />
                  </div>

                  {/* Donde mostrar selector (The requested feature: 3 distinct functions) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">¿Dónde mostrar el anuncio? (Ubicación) *</label>
                    <select
                      value={form.placement}
                      onChange={(e) => setForm({ ...form, placement: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {activeSubTab === 'publicidad' || (isEditing && ['COMPRADOR_HERO', 'LOGIN', 'COMPRADOR_SIDEBAR', 'COMPRADOR_FOOTER', 'COMPRADOR_MODAL', 'COMPRADOR_FLOAT'].includes(form.placement)) ? (
                        <>
                          <option value="COMPRADOR_HERO" className="bg-slate-900 text-white">🍀 Comprador - Banner Principal</option>
                          <option value="LOGIN" className="bg-slate-900 text-white">🚪 Al iniciar sesión / Público General</option>
                          <option value="COMPRADOR_SIDEBAR" className="bg-slate-900 text-white">🍀 Comprador - Barra Lateral (Sidebar)</option>
                          <option value="COMPRADOR_FOOTER" className="bg-slate-900 text-white">🍀 Comprador - Pie de Página (Footer)</option>
                          <option value="COMPRADOR_MODAL" className="bg-slate-900 text-white">🍀 Comprador - Alerta Emergente al entrar (Modal)</option>
                          <option value="COMPRADOR_FLOAT" className="bg-slate-900 text-white">🍀 Comprador - Tarjeta Flotante Esquina (Floating Widget)</option>
                        </>
                      ) : (
                        <>
                          <option value="VENDEDOR_PANEL" className="bg-slate-900 text-white">📊 Colaborador - Panel / Dashboard</option>
                          <option value="MODAL_ALERTA" className="bg-slate-900 text-white">🚨 Modal Alerta Emergente (Colaboradores)</option>
                          <option value="DASHBOARD" className="bg-slate-900 text-white">📊 Panel del colaborador (Legacy)</option>
                          <option value="BOTH" className="bg-slate-900 text-white">🔄 Ambos (Legacy)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* File upload local */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Archivo Multimedia Opcional (Imagen local)</label>
                      <button
                        type="button"
                        onClick={() => setIsAnnPreviewModalOpen(true)}
                        className="text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 flex items-center gap-1 font-semibold cursor-pointer transition-all"
                      >
                        <Eye size={11} /> Vista Previa del Anuncio
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type.startsWith('image/')) {
                              try {
                                const compressedUrl = await compressImage(file, 800, 0.7);
                                setForm({ ...form, imageUrl: compressedUrl });
                              } catch (err: any) {
                                setError('Error al procesar la imagen.');
                              }
                            } else {
                              if (file.size > 15 * 1024 * 1024) {
                                 setError('El archivo supera el límite de 15MB.');
                                 return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setForm({ ...form, imageUrl: event.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-purple-500/10 file:text-purple-300 hover:file:bg-purple-500/20 cursor-pointer"
                      />
                      {form.imageUrl && (
                        <div className="bg-purple-500/5 border border-purple-500/20 p-3 rounded-2xl space-y-2 mt-1 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1 truncate">
                              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> ¡Archivo multimedia local cargado!
                            </span>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, imageUrl: '' })}
                              className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline font-bold cursor-pointer transition-colors"
                            >
                              Quitar
                            </button>
                          </div>
                          
                          {/* Vista en miniatura con relación de aspecto original */}
                          <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center p-1.5 max-h-40 group">
                            {form.imageUrl.startsWith('data:video/') || form.imageUrl.endsWith('.mp4') ? (
                              <video src={form.imageUrl} muted loop autoPlay className="max-h-36 w-auto max-w-full rounded-lg object-contain shadow-md" />
                            ) : (
                              <img src={form.imageUrl} alt="Miniatura de anuncio" className="max-h-36 w-auto max-w-full rounded-lg object-contain shadow-md" referrerPolicy="no-referrer" />
                            )}
                            <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-[8px] font-bold text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                              Aspecto Original
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call to Action Button Toggle and Options (The requested feature: Opcion de agregar boton) */}
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-[11px] font-bold text-slate-300">Agregar botón de llamada a la acción (CTA)</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={hasCta}
                        onChange={(e) => setHasCta(e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-slate-800 rounded focus:ring-purple-500 cursor-pointer bg-slate-900"
                      />
                    </div>

                    {hasCta && (
                      <div className="grid grid-cols-2 gap-3 pt-1 animate-fadeIn">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Texto del Botón *</label>
                          <input
                            type="text"
                            required={hasCta}
                            placeholder="ej. ¡Comprar Ahora!"
                            value={form.ctaText}
                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Enlace de Destino (URL) *</label>
                          <input
                            type="text"
                            required={hasCta}
                            placeholder="ej. https://wa.me/..."
                            value={form.ctaUrl}
                            onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Segmentación / Destinatario */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Segmentación</label>
                      <select
                        value={form.targetType}
                        onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-slate-900">📢 Todos los asesores</option>
                        <option value="SPECIFIC" className="bg-slate-900">👤 Asesor Específico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estado del Anuncio</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="ACTIVE" className="bg-slate-900">✅ Activo (Publicado)</option>
                        <option value="INACTIVE" className="bg-slate-900">❌ Inactivo (Borrador)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filtro de Dispositivo (Viewport)</label>
                      <select
                        value={form.deviceTarget}
                        onChange={(e) => setForm({ ...form, deviceTarget: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-slate-900">📱💻 Mostrar en todos los dispositivos (Híbrido)</option>
                        <option value="DESKTOP" className="bg-slate-900">💻 Solo pantallas grandes (Escritorio / Laptop)</option>
                        <option value="MOBILE" className="bg-slate-900">📱 Solo pantallas pequeñas (Celulares / Tablets)</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Utiliza esta opción para optimizar la experiencia visual según la orientación de tus imágenes o videos horizontales/verticales.
                      </p>
                    </div>

                    {form.targetType === 'SPECIFIC' && (
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Colaborador Destino *</label>
                        <select
                          value={form.targetSellerId}
                          onChange={(e) => setForm({ ...form, targetSellerId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="" className="bg-slate-900">-- Seleccionar Asesor --</option>
                          {sellers.map((s, index) => (
                            <option key={`${s.id}-${index}`} value={s.id} className="bg-slate-900">{s.name} ({s.assignedRangeStart}-{s.assignedRangeEnd})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Buttons inside Modal */}
                  <div className="flex gap-2 pt-4 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsFormModalOpen(false)}
                      className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center border border-slate-800"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                    >
                      {isEditing ? 'Guardar Cambios' : (activeSubTab === 'publicidad' ? 'Publicar Campaña' : 'Enviar Comunicado')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {isSponsorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSponsorModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Card content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.4 } }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 border-t-8 border-t-pink-600 flex flex-col my-8 text-white"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsSponsorModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 overflow-y-auto max-h-[85vh]">
                <div className="flex items-center gap-2.5 mb-4 border-b border-slate-850 pb-3">
                  <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-2xl border border-pink-500/20">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display uppercase tracking-wider text-white">
                      {isEditingSponsor ? 'Editar Auspiciante Oficial' : 'Registrar Nuevo Auspiciante'}
                    </h3>
                    <p className="text-[10px] text-slate-400">Configure la marca y su disposición en el boleto</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitSponsor} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre de la Empresa o Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Pepsi, Banco General, Barbería Leo"
                      value={sponsorForm.name}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-sans"
                    />
                  </div>

                  {/* Selector de Diseño (IMAGE_ONLY | IMAGE_TEXT | TEXT_ONLY) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Disposición de Publicidad (Diseño) *</label>
                    <select
                      value={sponsorForm.designLayout}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, designLayout: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                    >
                      <option value="IMAGE_ONLY" className="bg-slate-900 text-white">📐 Solo Imagen (Logotipo horizontal limpio)</option>
                      <option value="IMAGE_TEXT" className="bg-slate-900 text-white">📐 Imagen + Texto (Logotipo a la izq. + Slogan a la der.)</option>
                      <option value="TEXT_ONLY" className="bg-slate-900 text-white">📐 Solo Texto (Nombre destacado + Slogan)</option>
                    </select>
                  </div>

                  {/* Slogan o Texto Publicitario */}
                  {sponsorForm.designLayout !== 'IMAGE_ONLY' && (
                    <div className="animate-fadeIn">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Frase Publicitaria o Slogan *</label>
                      <input
                        type="text"
                        required={sponsorForm.designLayout !== 'IMAGE_ONLY'}
                        placeholder="ej. Patrocinador Oficial de tu Suerte"
                        value={sponsorForm.text}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, text: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-sans"
                      />
                    </div>
                  )}

                  {/* Imagen local del auspiciante (Logotipo) */}
                  {sponsorForm.designLayout !== 'TEXT_ONLY' && (
                    <div className="animate-fadeIn">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-semibold text-slate-400">Logotipo del Auspiciante (Imagen local) *</label>
                        <button
                          type="button"
                          onClick={() => setIsSponsorPreviewModalOpen(true)}
                          className="text-[10px] bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/20 flex items-center gap-1 font-semibold cursor-pointer transition-all"
                        >
                          <Eye size={11} /> Vista Previa del Auspiciante
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          required={!isEditingSponsor && !sponsorForm.imageUrl}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedUrl = await compressImage(file, 600, 0.7);
                                setSponsorForm({ ...sponsorForm, imageUrl: compressedUrl });
                              } catch (err: any) {
                                setError('Error al procesar la imagen.');
                              }
                            }
                          }}
                          className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-pink-500/10 file:text-pink-300 hover:file:bg-pink-500/20 cursor-pointer"
                        />
                        {sponsorForm.imageUrl && (
                          <div className="bg-pink-500/5 border border-pink-500/20 p-3 rounded-2xl space-y-2 mt-1 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-pink-300 font-bold flex items-center gap-1 truncate">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> ¡Logotipo cargado correctamente!
                              </span>
                              <button
                                type="button"
                                onClick={() => setSponsorForm({ ...sponsorForm, imageUrl: '' })}
                                className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline font-bold cursor-pointer transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                            
                            {/* Vista en miniatura con relación de aspecto original */}
                            <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center p-1.5 max-h-32 group">
                              <img src={sponsorForm.imageUrl} alt="Miniatura de logotipo" className="max-h-28 w-auto max-w-full rounded-lg object-contain shadow-md" referrerPolicy="no-referrer" />
                              <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-[8px] font-bold text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/20">
                                Aspecto Original
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estado y prioridad */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prioridad (Orden)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={sponsorForm.order}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, order: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estado</label>
                      <select
                        value={sponsorForm.enabled ? 'true' : 'false'}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, enabled: e.target.value === 'true' })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="true" className="bg-slate-900">✅ Activo (Mostrar)</option>
                        <option value="false" className="bg-slate-900">❌ Inactivo (Ocultar)</option>
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Buttons inside Modal */}
                  <div className="flex gap-2 pt-4 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsSponsorModalOpen(false)}
                      className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center border border-slate-800"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                    >
                      {isEditingSponsor ? 'Guardar Cambios' : 'Registrar Auspiciante'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- MODAL DE VISTA PREVIA INTERACTIVA DE ANUNCIOS --- */}
        {isAnnPreviewModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl font-sans text-white"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold">Simulación de Vista Previa</h3>
                    <p className="text-[10px] text-slate-400">Visualiza en tiempo real cómo verán los usuarios tu publicidad</p>
                  </div>
                </div>
                
                {/* Device Selector */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDeviceMode('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      previewDeviceMode === 'desktop'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop size={13} /> Escritorio
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDeviceMode('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      previewDeviceMode === 'mobile'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={13} /> Móvil
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAnnPreviewModalOpen(false)}
                  className="p-1 rounded-full bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Simulation Stage */}
              <div className="p-6 overflow-y-auto bg-slate-950/20 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                {/* Segment exclusion check */}
                {((previewDeviceMode === 'mobile' && form.deviceTarget === 'DESKTOP') ||
                  (previewDeviceMode === 'desktop' && form.deviceTarget === 'MOBILE')) ? (
                  <div className="w-full max-w-2xl mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Este anuncio <strong>no se mostrará</strong> en este dispositivo porque está segmentado exclusivamente para{' '}
                      {form.deviceTarget === 'DESKTOP' ? 'Solo pantallas grandes (Escritorio)' : 'Solo pantallas pequeñas (Celulares/Tablets)'}.
                    </span>
                  </div>
                ) : null}

                {/* Simulated Device Frame */}
                <div
                  className={`border border-slate-800 bg-slate-950 transition-all duration-300 rounded-2xl relative shadow-inner overflow-hidden ${
                    previewDeviceMode === 'mobile'
                      ? 'w-[360px] h-[580px] p-4 flex flex-col justify-start'
                      : 'w-full max-w-2xl p-6 min-h-[220px] flex items-center justify-center'
                  }`}
                >
                  {/* Watermark of device type */}
                  <div className="absolute top-2 right-3 text-[9px] font-bold text-slate-600 font-mono select-none uppercase tracking-widest z-10">
                    {previewDeviceMode === 'mobile' ? '📱 Simulación Móvil' : '💻 Simulación Escritorio'}
                  </div>

                  {/* RENDER ACCORDING TO PLACEMENT */}
                  {form.placement === 'MODAL_ALERTA' ? (
                    /* SIMULATION FOR MODAL_ALERTA */
                    <div className="inset-0 absolute bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative animate-scaleUp">
                        {/* Header bar */}
                        <div className="flex justify-between items-center p-3 border-b border-slate-850 bg-slate-950/40">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-mono">📢 Comunicado Oficial</span>
                          <X size={14} className="text-slate-500 cursor-pointer" />
                        </div>

                        {/* File element */}
                        {form.imageUrl && (
                          <div className="w-full h-40 overflow-hidden relative bg-slate-950 flex items-center justify-center border-b border-slate-850">
                            {form.imageUrl.startsWith('data:video/') || form.imageUrl.endsWith('.mp4') ? (
                              <video src={form.imageUrl} muted loop autoPlay className="w-full h-full object-contain" />
                            ) : (
                              <img src={form.imageUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        )}

                        <div className="p-4 space-y-2">
                          <h4 className="text-xs font-bold text-white leading-tight">{form.title || 'Título del Anuncio'}</h4>
                          <p className="text-[10px] text-slate-400 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto">
                            {form.content || 'Este es el texto del anuncio oficial. Aquí se darán los detalles de las promociones o actualizaciones de la rifa.'}
                          </p>
                          
                          {hasCta && form.ctaText && (
                            <div className="pt-2">
                              <a
                                href={form.ctaUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.preventDefault()}
                                className="w-full py-1.5 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:brightness-110 transition shadow"
                              >
                                {form.ctaText}
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SIMULATION FOR BANNERS (COMPRADOR_HERO / VENDEDOR_PANEL) */
                    <div className="w-full">
                      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch justify-between min-h-[140px] group shadow-xl">
                        {/* Gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-pink-950/40 z-0"></div>

                        {/* Text and buttons column */}
                        <div className="p-5 flex-1 flex flex-col justify-between min-w-0 z-10 relative">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 bg-purple-500/15 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider font-mono">
                              {form.placement === 'COMPRADOR_HERO' 
                                ? '🍀 Banner Principal Comprador' 
                                : form.placement === 'COMPRADOR_SIDEBAR'
                                  ? '🍀 Barra Lateral Comprador'
                                  : form.placement === 'COMPRADOR_FOOTER'
                                    ? '🍀 Pie de Página Comprador'
                                    : form.placement === 'COMPRADOR_MODAL'
                                      ? '🍀 Alerta Emergente Comprador'
                                      : form.placement === 'COMPRADOR_FLOAT'
                                        ? '🍀 Tarjeta Flotante Comprador'
                                        : form.placement === 'LOGIN'
                                          ? '🚪 Al Iniciar Sesión'
                                          : '📊 Panel Vendedor'}
                            </span>
                            <h3 className="text-xs md:text-sm font-extrabold text-white leading-tight tracking-tight mt-1 truncate">
                              {form.title || '¡Gran Oportunidad de Ganar!'}
                            </h3>
                            <p className="text-[10px] text-slate-300 leading-relaxed max-w-md line-clamp-3">
                              {form.content || 'Completa tus boletos y sé el próximo feliz ganador. Apoya a nuestros auspiciantes.'}
                            </p>
                          </div>

                          {hasCta && form.ctaText && (
                            <div className="pt-3">
                              <a
                                href={form.ctaUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.preventDefault()}
                                className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
                              >
                                {form.ctaText}
                                <ArrowRight size={10} className="text-white" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Image area */}
                        {form.imageUrl && (
                          <div className="md:w-1/3 relative shrink-0 min-h-[120px] md:min-h-0 bg-slate-950 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-800/60 overflow-hidden z-10">
                            {form.imageUrl.startsWith('data:video/') || form.imageUrl.endsWith('.mp4') ? (
                              <video src={form.imageUrl} muted loop autoPlay className="w-full h-full object-cover" />
                            ) : (
                              <img src={form.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAnnPreviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- MODAL DE VISTA PREVIA INTERACTIVA DE AUSPICIANTES --- */}
        {isSponsorPreviewModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl font-sans text-white"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <div>
                    <h3 className="text-sm font-bold">Vista Previa del Patrocinador</h3>
                    <p className="text-[10px] text-slate-400">Diseño publicitario del auspiciante</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsSponsorPreviewModalOpen(false)}
                  className="p-1 rounded-full bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Simulation Content */}
              <div className="p-6 overflow-y-auto bg-slate-950/20 flex flex-col items-center justify-center min-h-[250px] space-y-4">
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Maqueta de Auspiciante en la Tarjeta de Rifa</span>
                
                {/* Simulated Card Frame */}
                <div className="w-full max-w-sm bg-slate-950 border border-slate-850 p-5 rounded-2xl relative shadow-inner overflow-hidden">
                  <div className="absolute top-2 right-2 text-[8px] bg-pink-500/10 border border-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-bold font-mono">
                    AUSPICIANTE
                  </div>

                  {/* DESIGN LAYOUT RENDER */}
                  {sponsorForm.designLayout === 'TEXT_ONLY' ? (
                    <div className="text-center py-4 space-y-1">
                      <span className="text-[9px] text-pink-400/80 font-bold tracking-widest uppercase">
                        {sponsorForm.name || 'Nombre del Auspiciante'}
                      </span>
                      <p className="text-xs italic text-slate-200 font-medium">
                        "{sponsorForm.text || 'La frase publicitaria más inspiradora irá justo en este lugar.'}"
                      </p>
                    </div>
                  ) : sponsorForm.designLayout === 'IMAGE_ONLY' ? (
                    <div className="flex flex-col items-center justify-center py-3 space-y-2">
                      <div className="h-16 w-full flex items-center justify-center bg-slate-900/60 p-2 border border-slate-800 rounded-xl">
                        {sponsorForm.imageUrl ? (
                          <img
                            src={sponsorForm.imageUrl}
                            alt={sponsorForm.name}
                            className="max-h-full max-w-full object-contain filter brightness-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Sin logotipo cargado</div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300">
                        {sponsorForm.name || 'Nombre del Auspiciante'}
                      </span>
                    </div>
                  ) : (
                    /* IMAGE_TEXT layout */
                    <div className="flex items-center gap-4 py-2">
                      <div className="w-16 h-16 shrink-0 bg-slate-900/60 border border-slate-800 p-1.5 rounded-xl flex items-center justify-center overflow-hidden">
                        {sponsorForm.imageUrl ? (
                          <img
                            src={sponsorForm.imageUrl}
                            alt={sponsorForm.name}
                            className="max-h-full max-w-full object-contain filter brightness-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-[9px] text-slate-500 text-center font-bold">LOGO</div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-[11px] font-black text-white tracking-wide uppercase truncate">
                          {sponsorForm.name || 'Nombre del Auspiciante'}
                        </h4>
                        <p className="text-[10px] leading-relaxed text-slate-300 italic line-clamp-2">
                          "{sponsorForm.text || 'Frase publicitaria de apoyo e impulso.'}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-400">
                    Estilo actual del diseño:{' '}
                    <span className="font-bold text-pink-400">
                      {sponsorForm.designLayout === 'IMAGE_ONLY'
                        ? 'Solo Logotipo'
                        : sponsorForm.designLayout === 'TEXT_ONLY'
                        ? 'Solo Frase Slogan'
                        : 'Logotipo y Frase Híbrido'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSponsorPreviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
