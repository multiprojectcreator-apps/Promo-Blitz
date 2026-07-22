/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Users, ShieldAlert, Link, RefreshCw, UserPlus, Lock, EyeOff, Eye, ArrowLeft, ShieldCheck } from 'lucide-react';
import LegalModal from '../common/LegalModal';

interface AuthModuleProps {
  isRecovering: boolean;
  setIsRecovering: (b: boolean) => void;
  isRegistering: boolean;
  setIsRegistering: (b: boolean) => void;
  authError: string;
  setAuthError: (s: string) => void;
  loginUsername: string;
  setLoginUsername: (s: string) => void;
  loginPassword: string;
  setLoginPassword: (s: string) => void;
  showPassword: boolean;
  setShowPassword: (b: boolean) => void;
  isLoginLoading: boolean;
  handleLoginSubmit: (e: React.FormEvent) => void;
  recoveryEmail: string;
  setRecoveryEmail: (s: string) => void;
  recoveryMsg: string;
  handlePasswordRecovery: (e: React.FormEvent) => void;
  registerForm: any;
  setRegisterForm: (f: any) => void;
  isRegisterLoading: boolean;
  registerSuccessMsg: string;
  registerVerificationLink: string;
  handleRegisterSubmit: (e: React.FormEvent) => void;
}

export default function AuthModule({
  isRecovering,
  setIsRecovering,
  isRegistering,
  setIsRegistering,
  authError,
  setAuthError,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  isLoginLoading,
  handleLoginSubmit,
  recoveryEmail,
  setRecoveryEmail,
  recoveryMsg,
  handlePasswordRecovery,
  registerForm,
  setRegisterForm,
  isRegisterLoading,
  registerSuccessMsg,
  registerVerificationLink,
  handleRegisterSubmit,
}: AuthModuleProps) {
  // Local password toggles for registration form
  const [showRegPassword, setShowRegPassword] = React.useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = React.useState(false);

  // Local states for terms & conditions and age check
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [isMajor, setIsMajor] = React.useState(false);
  const [isLegalOpen, setIsLegalOpen] = React.useState(false);
  const [legalTab, setLegalTab] = React.useState<'terms' | 'privacy' | 'rules'>('terms');

  React.useEffect(() => {
    if (registerSuccessMsg) {
      setAcceptedTerms(false);
      setIsMajor(false);
    }
  }, [registerSuccessMsg]);

  return (
    <motion.div
      id="auth-module-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-md mx-auto my-12"
    >
      <div className="m3-card p-8 relative overflow-hidden transition-all duration-300 shadow-xl border border-slate-200 bg-white rounded-3xl">
        {/* Modern blur blobs for beautiful backdrop accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src="/icon.svg" alt="PromoBlitz Logo" className="w-14 h-14 rounded-2xl shadow-lg shadow-purple-500/20 object-contain hover:scale-105 transition-transform" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-800 tracking-tight">
            {isRecovering 
              ? 'Recuperar Contraseña' 
              : isRegistering 
                ? (registerForm.role === 'ORGANIZADOR' ? 'Registro de Organizador' : 'Registro de Colaborador') 
                : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            {isRecovering 
              ? 'Introduce tu correo para restablecer tu contraseña' 
              : isRegistering 
                ? 'Completa los campos para crear tu cuenta.' 
                : 'Ingresa tus credenciales para acceder.'}
          </p>
        </div>

        {authError && (
          <div id="auth-error-alert" className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-start gap-2.5 mb-5 animate-shake">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <p className="font-medium">{authError}</p>
          </div>
        )}

        {isRecovering ? (
          <form id="recovery-form" onSubmit={handlePasswordRecovery} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico Registrado <span className="text-rose-500">*</span></label>
              <input 
                id="recovery-email-input"
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="ejemplo@promoblitz.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 transition"
              />
            </div>
            {recoveryMsg && (
              <p id="recovery-success-message" className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{recoveryMsg}</p>
            )}
            <div className="flex gap-2.5 pt-2">
              <button 
                id="btn-recovery-submit"
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Recuperar Contraseña
              </button>
              <button 
                id="btn-recovery-cancel"
                type="button" 
                onClick={() => setIsRecovering(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : isRegistering ? (
          <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-4">
            {registerSuccessMsg && (
              <div id="register-success-alert" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex flex-col gap-2 mb-4 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <span className="font-bold">¡Registro Exitoso!</span>
                  <p>{registerSuccessMsg}</p>
                </div>
                {registerVerificationLink && (
                  <div className="mt-2 p-3 bg-emerald-100/50 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-semibold text-[11px] text-emerald-900 flex items-center gap-1">
                      📬 Activación rápida de la cuenta:
                    </p>
                    <a
                      id="link-register-verify"
                      href={registerVerificationLink}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg transition"
                    >
                      Verificar correo y activar cuenta
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Role selection at the top of registration screen to resolve who is registering as organizer vs seller */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Seleccione su Rol de Cuenta <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-select-role-seller"
                  type="button"
                  onClick={() => setRegisterForm({...registerForm, role: 'VENDEDOR'})}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between h-28 ${
                    registerForm.role === 'VENDEDOR'
                      ? 'border-emerald-500 bg-emerald-50/40 text-slate-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-2 rounded-xl ${registerForm.role === 'VENDEDOR' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Users size={18} />
                    </div>
                    {registerForm.role === 'VENDEDOR' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">Colaborador Autónomo</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Registra boletos usando tu código asignado</p>
                  </div>
                </button>

                <button
                  id="btn-select-role-organizer"
                  type="button"
                  onClick={() => setRegisterForm({...registerForm, role: 'ORGANIZADOR'})}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between h-28 ${
                    registerForm.role === 'ORGANIZADOR'
                      ? 'border-blue-500 bg-blue-50/40 text-slate-800 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-2 rounded-xl ${registerForm.role === 'ORGANIZADOR' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <ShieldAlert size={18} />
                    </div>
                    {registerForm.role === 'ORGANIZADOR' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">Organizador (Admin)</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Administra sorteos, colaboradores y reportes</p>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo <span className="text-rose-500">*</span></label>
                <input 
                  id="register-name-input"
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  placeholder={registerForm.role === 'ORGANIZADOR' ? "Carlos Mendoza" : "Juan Pérez"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-800 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de Usuario <span className="text-rose-500">*</span></label>
                <input 
                  id="register-username-input"
                  type="text"
                  required
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  placeholder="ej. carlos_mendoza"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-800 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico <span className="text-rose-500">*</span></label>
                <input 
                  id="register-email-input"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-800 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / Celular <span className="text-rose-500">*</span></label>
                <input 
                  id="register-phone-input"
                  type="tel"
                  required
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                  placeholder="+34 600 000 000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-800 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input 
                    id="register-password-input"
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-mono transition"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Contraseña <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input 
                    id="register-confirm-password-input"
                    type={showRegConfirmPassword ? "text" : "password"}
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-mono transition"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {registerForm.role === 'VENDEDOR' && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2 animate-fade-in">
                <label className="block text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Link size={14} className="text-emerald-600" />
                  Código de Vinculación Único <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-emerald-700/80 leading-relaxed">
                  Ingresa el código de vinculación provisto por tu Organizador para vincularte al sorteo y activar tu rango de boletos.
                </p>
                <input 
                  id="register-linking-code-input"
                  type="text"
                  required
                  value={registerForm.linkingCode || ''}
                  onChange={(e) => setRegisterForm({...registerForm, linkingCode: e.target.value.toUpperCase()})}
                  placeholder="ej. VIN-JUAN12"
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-500 uppercase tracking-widest text-center"
                />
              </div>
            )}

            {/* Términos y Mayoría de Edad */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-start gap-2.5">
                <input
                  id="register-terms-checkbox"
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="register-terms-checkbox" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLegalTab('terms');
                      setIsLegalOpen(true);
                    }}
                    className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
                  >
                    Términos de Servicio
                  </button>{' '}
                  y la{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLegalTab('privacy');
                      setIsLegalOpen(true);
                    }}
                    className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
                  >
                    Política de Privacidad (RGPD)
                  </button>{' '}
                  aplicable a mi rol en el sistema. <span className="text-rose-500">*</span>
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  id="register-age-checkbox"
                  type="checkbox"
                  required
                  checked={isMajor}
                  onChange={(e) => setIsMajor(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="register-age-checkbox" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  Declaro bajo juramento que soy <strong>mayor de edad (18+)</strong> y tengo plena capacidad legal para registrarme. <span className="text-rose-500">*</span>
                </label>
              </div>
            </div>

            <button 
              id="btn-register-submit"
              type="submit"
              disabled={isRegisterLoading || !acceptedTerms || !isMajor}
              className={`w-full bg-gradient-to-r ${
                registerForm.role === 'ORGANIZADOR' 
                  ? 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/15' 
                  : 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/15'
              } text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isRegisterLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Creando Cuenta...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Completar Registro
                </>
              )}
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                ¿Ya tienes una cuenta registrada?{' '}
                <button
                  id="link-go-to-login"
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setAuthError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form id="login-form" onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico / Usuario <span className="text-rose-500">*</span></label>
              <input 
                id="login-username-input"
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="ejemplo@promoblitz.com o usuario"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Contraseña <span className="text-rose-500">*</span></label>
                <button 
                  id="btn-forgot-password"
                  type="button" 
                  onClick={() => setIsRecovering(true)} 
                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <input 
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-mono transition"
                />
                <button 
                  id="btn-toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              id="btn-login-submit"
              type="submit"
              disabled={isLoginLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/10 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoginLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Iniciar Sesión
                </>
              )}
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                ¿No tienes una cuenta de acceso?{' '}
                <button
                  id="link-go-to-register"
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setAuthError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer transition-colors"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
      <LegalModal 
        isOpen={isLegalOpen} 
        onClose={() => setIsLegalOpen(false)} 
        initialTab={legalTab} 
      />
    </motion.div>
  );
}
