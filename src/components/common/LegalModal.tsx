/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Scale, FileText, Sparkles, Check, Download, Info, ShieldAlert, HeartHandshake } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'rules';
}

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'rules'>(initialTab);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 print:p-0 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-[#0d072c] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] print:max-h-none print:border-none print:bg-white print:text-slate-900 print:shadow-none"
        >
          {/* Decorative ambient light streak */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 via-purple-500 to-transparent print:hidden"></div>

          {/* Modal Header */}
          <div className="p-6 border-b border-purple-950/60 flex items-center justify-between bg-[#08031d]/60 backdrop-blur-sm print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-pink-400 rounded-xl">
                <ShieldCheck size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black font-display text-white tracking-tight flex items-center gap-2">
                  Centro de Cumplimiento Legal y Transparencia
                </h3>
                <p className="text-[11px] text-purple-300 font-medium">Estándares legales internacionales (RGPD, Juego Responsable y Transparencia SaaS)</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 bg-purple-950/20 hover:bg-purple-950/50 border border-purple-900/30 text-purple-300 hover:text-white rounded-xl transition duration-150 cursor-pointer"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-purple-950/40 bg-[#08031d]/30 px-6 pt-2 overflow-x-auto gap-2 scrollbar-none print:hidden shrink-0">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition duration-150 shrink-0 cursor-pointer ${
                activeTab === 'terms'
                  ? 'border-pink-500 text-white bg-white/5 rounded-t-xl'
                  : 'border-transparent text-purple-300/75 hover:text-white'
              }`}
            >
              <Scale size={14} className={activeTab === 'terms' ? 'text-pink-400' : ''} />
              Términos de Servicio
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition duration-150 shrink-0 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'border-pink-500 text-white bg-white/5 rounded-t-xl'
                  : 'border-transparent text-purple-300/75 hover:text-white'
              }`}
            >
              <FileText size={14} className={activeTab === 'privacy' ? 'text-pink-400' : ''} />
              Política de Privacidad (RGPD)
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition duration-150 shrink-0 cursor-pointer ${
                activeTab === 'rules'
                  ? 'border-pink-500 text-white bg-white/5 rounded-t-xl'
                  : 'border-transparent text-purple-300/75 hover:text-white'
              }`}
            >
              <HeartHandshake size={14} className={activeTab === 'rules' ? 'text-pink-400' : ''} />
              Reglamento de Sorteos & Juego
            </button>
          </div>

          {/* Content Area (Scrollable) */}
          <div className="p-6 md:p-8 overflow-y-auto text-sm text-purple-100/90 leading-relaxed space-y-6 flex-1 print:overflow-visible print:p-0 print:text-slate-900">
            {activeTab === 'terms' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2.5 text-pink-400 border-b border-pink-500/15 pb-2">
                  <Scale size={18} />
                  <h4 className="text-sm font-extrabold font-display tracking-wide uppercase">Términos y Condiciones Generales de Uso</h4>
                </div>
                
                <p className="text-xs text-purple-300 italic">Última actualización: 19 de Julio de 2026</p>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">1. Relación Contractual y Naturaleza del Servicio</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    El presente software es un aplicativo de modelo SaaS (Software como Servicio) desarrollado para facilitar la reserva y gestión de boletos en sorteos promocionales y benéficos organizados por terceros independientes (denominados "El Organizador").
                  </p>
                  <div className="p-3 bg-purple-950/25 border border-purple-900/30 rounded-xl flex gap-2 text-[11px] text-purple-300 mt-2">
                    <Info size={16} className="text-pink-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Nota Legal Crucial:</strong> El propietario de este software o plataforma de desarrollo NO es organizador, fideicomisario, ni beneficiario de los sorteos listados. Toda la responsabilidad contractual, entrega de premios, y validez del sorteo recae de forma exclusiva sobre el organizador del evento debidamente individualizado en el panel de control.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">2. Requisitos de Elegibilidad y Edad Mínima</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Para registrar una reserva de boleto, participar en los sorteos promocionales, actuar como colaborador autónomo o registrarse como organizador en el sistema, es un requisito legal e indispensable:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-purple-200/80 space-y-1 font-sans">
                    <li>Tener al menos <strong>18 años de edad</strong> (o la mayoría de edad legal aplicable en su jurisdicción de residencia).</li>
                    <li>Suministrar información de contacto verídica, exacta y actualizada (nombre, correo electrónico, teléfono móvil).</li>
                    <li>No encontrarse afectado por interdicciones o exclusiones voluntarias de participación en juegos de azar.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">3. Mecanismo de Reserva Temporal de 3 Horas</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Para salvaguardar la transparencia y evitar el acaparamiento improductivo de números en detrimento de la comunidad, el sistema implementa un <strong>Mecanismo de Cierre en Segundo Plano (Event-Driven Worker)</strong>:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-purple-200/80 space-y-1 font-sans">
                    <li>Al seleccionar un boleto y consolidar la solicitud de pre-registro, el sistema reserva el número por un tiempo de gracia improrrogable de <strong>3 horas</strong>.</li>
                    <li>Dentro de este plazo de 3 horas, el solicitante deberá reportar y verificar la confirmación de forma coordinada con el colaborador asignado.</li>
                    <li>Vencido el plazo sin confirmación fehaciente en el panel de control, el sistema liberará automáticamente el número, dejándolo disponible para el público general. El organizador no se hace responsable de pérdidas de números debido a expiración de reservas.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">4. Políticas de No-Reembolso</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Dado el carácter digital e instantáneo del bloqueo y reserva de boletos en la grilla pública, todas las reservas consolidadas y confirmadas son de carácter <strong>definitivo, no acumulable y no reembolsable</strong>, salvo en casos específicos de cancelación total del sorteo por fuerza mayor atribuible al organizador principal. En tales escenarios extremos, el organizador informará los canales y plazos para las devoluciones directas.
                  </p>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">5. Exclusión de Garantías y Limitación de Responsabilidad</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    La plataforma provee sus servicios de software "tal cual" y "según disponibilidad". No garantizamos que el servicio de internet sea ininterrumpido o libre de errores de red en el dispositivo local del usuario. Bajo ninguna circunstancia el desarrollador o licenciante del SaaS responderá por disputas comerciales, depósitos directos a colaboradores particulares, o la adjudicación material de los premios.
                  </p>
                </section>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2.5 text-pink-400 border-b border-pink-500/15 pb-2">
                  <FileText size={18} />
                  <h4 className="text-sm font-extrabold font-display tracking-wide uppercase">Política de Privacidad y Protección de Datos (Reglamento RGPD)</h4>
                </div>

                <p className="text-xs text-purple-300 italic">Última actualización: 19 de Julio de 2026</p>

                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded-xl flex gap-2 text-[11px] mb-4">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Cumplimiento RGPD Completo:</strong> Esta plataforma ha sido diseñada bajo el estándar de privacidad desde el diseño ("Privacy by Design"). No utilizamos rastreadores de comportamiento masivo, ni comerciamos sus datos de contacto con terceros comercializadores.
                  </p>
                </div>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">1. Responsable del Tratamiento de los Datos</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    El organizador registrado del sorteo actúa como "Responsable del Tratamiento" de los datos personales ingresados por los solicitantes para la adjudicación de las participaciones. La plataforma SaaS Promo Blitz actúa estrictamente en calidad de "Encargado del Tratamiento", procesando las solicitudes únicamente bajo instrucciones técnicas.
                  </p>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">2. Datos Recopilados y Finalidad</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Para la reserva y emisión del boleto digital, recopilamos única y exclusivamente los siguientes datos de carácter básico y no sensible:
                  </p>
                  <table className="w-full text-left text-xs bg-purple-950/20 border border-purple-900/30 rounded-xl overflow-hidden font-sans">
                    <thead>
                      <tr className="bg-[#050212]/60 border-b border-purple-900/40 text-purple-300">
                        <th className="p-2.5 font-bold">Dato Recopilado</th>
                        <th className="p-2.5 font-bold">Propósito de Tratamiento</th>
                        <th className="p-2.5 font-bold">Base de Licitud</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20 text-purple-200/90">
                      <tr>
                        <td className="p-2.5 font-medium">Nombre Completo</td>
                        <td className="p-2.5">Identificar de forma inequívoca al titular del número ganador.</td>
                        <td className="p-2.5">Ejecución del contrato (reserva).</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Teléfono (WhatsApp)</td>
                        <td className="p-2.5">Enviar confirmación de reserva, alertas de expiración y coordinar pago.</td>
                        <td className="p-2.5">Ejecución del contrato.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Correo Electrónico</td>
                        <td className="p-2.5">Enviar resguardo digital oficial del boleto y notificaciones administrativas.</td>
                        <td className="p-2.5">Ejecución del contrato.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Ciudad de Origen</td>
                        <td className="p-2.5">Segmentación geográfica requerida por regulaciones locales de loterías.</td>
                        <td className="p-2.5">Cumplimiento de obligación legal.</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">3. Retención de Datos y Plazo de Conservación</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Los datos de las reservas temporales expiradas se eliminan o anonimizan de forma automática a los pocos días de transcurrido el evento. Los registros de boletos debidamente confirmados se conservan únicamente por el período que dure el sorteo y la posterior entrega verificada del premio, tras lo cual podrán ser eliminados a solicitud del usuario, a menos que existan obligaciones fiscales vigentes para el organizador.
                  </p>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">4. Derechos del Interesado (Acceso, Rectificación y Supresión)</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    De conformidad con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea y leyes análogas de América Latina, usted posee el derecho inalienable a:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-purple-200/80 space-y-1 font-sans">
                    <li><strong>Acceder</strong> a los registros de boletos asociados a su correo o teléfono ingresados en la barra de búsqueda pública.</li>
                    <li><strong>Rectificar</strong> errores ortográficos en su nombre comunicándose de forma expedita con su colaborador antes del sorteo.</li>
                    <li><strong>Solicitar la supresión</strong> ("derecho al olvido") de sus datos una vez finalizado el sorteo correspondiente y auditados los resultados.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">5. Medidas de Seguridad de la Información</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Implementamos medidas de seguridad de vanguardia, incluyendo encriptación SSL de extremo a extremo, resguardo de base de datos en nube con acceso limitado y control de roles estrictos para evitar el acceso no autorizado por parte de terceros. No capturamos ni procesamos números de tarjetas de crédito o credenciales de cuentas bancarias en nuestro servidor.
                  </p>
                </section>
              </motion.div>
            )}

            {activeTab === 'rules' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2.5 text-pink-400 border-b border-pink-500/15 pb-2">
                  <HeartHandshake size={18} />
                  <h4 className="text-sm font-extrabold font-display tracking-wide uppercase">Reglamento Oficial de Sorteos & Juego Responsable</h4>
                </div>

                <p className="text-xs text-purple-300 italic">Última actualización: 19 de Julio de 2026</p>

                <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl flex gap-3 text-xs text-purple-300">
                  <ShieldAlert size={20} className="text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-xs mb-1">Cláusula de Juego Responsable</h5>
                    <p className="text-[11px] text-purple-300 leading-relaxed font-sans">
                      La actividad y los sorteos benéficos/promocionales deben ser interpretados únicamente como una actividad de recreación y de apoyo solidario. Recomendamos establecer límites financieros personales estrictos y abstenerse de participar utilizando recursos destinados a necesidades vitales familiares.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">1. Transparencia Absoluta del Sorteo</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Para asegurar la igualdad de condiciones de todos los participantes y eliminar cualquier suspicacia de manipulación:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-purple-200/80 space-y-1 font-sans">
                    <li>La cuadrícula de números refleja en tiempo real el estado de cada boleto para toda la red. No se duplican números bajo ninguna circunstancia.</li>
                    <li>Los números libres, reservados de forma pendiente y confirmados de forma definitiva son visibles públicamente las 24 horas del día.</li>
                    <li>El sorteo ganador es transmitido en vivo utilizando canales oficiales verificables, como las redes sociales integradas por el organizador (disponibles en el botón de transmisión oficial).</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">2. Metodología de Adjudicación de Ganadores</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    El organizador determinará de forma anticipada el método oficial para la extracción del número ganador. Los métodos aprobados por estándares de transparencia incluyen:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-purple-200/80 space-y-1 font-sans">
                    <li><strong>Lotería Nacional / Sorteos de Referencia Oficiales:</strong> El boleto ganador se define utilizando los últimos dígitos del primer premio de una lotería oficial especificada públicamente de forma previa por el organizador.</li>
                    <li><strong>Tómbola Física Auditada:</strong> Extracción de esferas numeradas grabada en transmisión directa con presencia de testigos imparciales o inspectores autorizados.</li>
                    <li><strong>Mecanismo Digital Verificado:</strong> Uso de generadores de aleatoriedad criptográficamente seguros y con semilla transparente certificable en video.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">3. Reclamación e Identificación para el Cobro de Premios</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Para reclamar el premio adjudicado, el titular deberá presentar de forma presencial o digital los siguientes respaldos:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-purple-200/80 space-y-1 font-sans">
                    <li>El documento nacional de identidad original (DNI / Cédula / Pasaporte) que coincida exactamente con el <strong>Nombre Completo</strong> ingresado en la reserva del boleto ganador.</li>
                    <li>El resguardo del boleto digital (archivo SVG oficial o código de referencia único) generado por el sistema y enviado a su correo electrónico.</li>
                    <li>Mensaje de WhatsApp o comprobante bancario del pago de la reserva realizado dentro de las 3 horas de margen permitidas. No se entregarán premios a números que registren estado de "Reserva Pendiente" no saldada al momento del cierre de registros.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-purple-300">4. Destino de los Premios no Reclamados</h5>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Transcurrido un plazo de 30 días calendario contados desde la realización del sorteo oficial sin que el legítimo ganador se haya comunicado o acreditado sus datos de identidad, el premio se considerará desierto o se destinará a una segunda ronda de extracción, o bien se donará de forma íntegra a la organización sin fines de lucro auspiciante, según lo dictado previamente por los lineamientos específicos del organizador y normativas locales aplicables.
                  </p>
                </section>
              </motion.div>
            )}
          </div>

          {/* Modal Footer / Download / Print */}
          <div className="p-5 border-t border-purple-950/60 bg-[#08031d]/80 flex flex-wrap items-center justify-between gap-4 shrink-0 print:hidden">
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <ShieldCheck size={14} className="text-pink-400" />
              <span>Navegación segura cifrada SSL de extremo a extremo.</span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-900/30 text-purple-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                <Download size={13} />
                Imprimir Documento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition duration-150 cursor-pointer shadow-lg shadow-purple-500/10"
              >
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
