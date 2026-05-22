import React, { useState } from 'react';
import { supabase, getSupabaseConfigState, setLocalUser } from '../lib/supabase';
import { Mail, Lock, UserPlus, LogIn, X, Info, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const config = getSupabaseConfigState();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (config.isMock) {
      // Simulate OAuth/Auth in Mock Mode
      setTimeout(() => {
        setLoading(false);
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        const mockUser = {
          id: 'mock-user-12345',
          email: email.trim(),
          role: 'authenticated',
          isMock: true,
        };
        setLocalUser(mockUser);
        onAuthSuccess(mockUser);
        onClose();
      }, 800);
      return;
    }

    try {
      if (!supabase) throw new Error('Cliente Supabase no inicializado');

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        
        // Supabase sends a confirmation email by default
        setMessage('¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar la cuenta (si tu proyecto Supabase lo requiere).');
        if (data.user) {
          // If auto login is enabled on Supabase
          if (data.session) {
            onAuthSuccess(data.user);
            onClose();
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        
        if (data.user) {
          onAuthSuccess(data.user);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header         <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
            {isSignUp ? <UserPlus className="h-5 w-5 text-emerald-500" /> : <LogIn className="h-5 w-5 text-emerald-500" />}
            {isSignUp ? 'Crear Ficha Técnica' : 'Acceso Cuerpo Técnico'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Mock Banner */}
        {config.isMock && (
          <div className="px-6 py-3.5 bg-amber-950/20 text-xs text-amber-200 border-b border-amber-900/40 flex gap-2 font-mono">
            <Info className="h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <strong>Simulación local activa:</strong> Inserta credenciales ficticias para ingresar al instante y realizar pruebas.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/40 text-rose-300 rounded-lg text-xs font-semibold flex items-start gap-2 border border-rose-900/60 font-mono">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-950/40 text-emerald-300 rounded-lg text-xs border border-emerald-900/60 font-mono">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                placeholder="entrenador@equipo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-11 pr-4 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pass" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                id="pass"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-11 pr-4 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-black uppercase tracking-widest text-xs rounded-lg py-3 shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer"
          >
            {loading ? 'Validando Ficha...' : isSignUp ? 'Confirmar Registro' : 'Autorizar Acceso'}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isSignUp ? '¿Ya estás registrado? Inicia sesión aquí' : '¿Nuevo entrenador? Regístrate en la central'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
