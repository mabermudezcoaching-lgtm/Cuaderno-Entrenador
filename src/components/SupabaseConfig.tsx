import React, { useState, useRef } from 'react';
import { getSupabaseConfigState, SUPABASE_SQL_CODE } from '../lib/supabase';
import { Database, Copy, Check, Info, Settings, ShieldAlert, Award, ExternalLink } from 'lucide-react';

export default function SupabaseConfig() {
  const config = getSupabaseConfigState();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(config.supabaseUrl);
  const [keyInput, setKeyInput] = useState(config.supabaseKey);
  const sqlTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopySql = () => {
    if (sqlTextAreaRef.current) {
      sqlTextAreaRef.current.select();
      try {
        navigator.clipboard.writeText(SUPABASE_SQL_CODE);
      } catch (err) {
        // Fallback for iframe environments
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && keyInput.trim()) {
      localStorage.setItem('supabase_url', urlInput.trim());
      localStorage.setItem('supabase_key', keyInput.trim());
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
    }
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    window.location.reload();
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl shadow-lg mb-6 overflow-hidden">
      {/* Banner de Estado */}
      <div className={`px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
        config.isMock 
          ? 'bg-amber-950/20 border-amber-900/30 text-amber-300' 
          : 'bg-blue-950/20 border-blue-900/30 text-blue-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <Database className={`h-5 w-5 ${config.isMock ? 'text-amber-400' : 'text-blue-400'}`} />
          <div>
            <span className="font-semibold text-xs tracking-wider uppercase text-slate-300 font-display">CONECTIVIDAD: </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
              config.isMock 
                ? 'bg-amber-905/40 text-amber-300 border border-amber-800/20' 
                : 'bg-blue-955/40 text-blue-300 border border-blue-800/20'
            }`}>
              {config.isMock ? 'SIMULACIÓN (MEMORIA LOCAL)' : 'SUPABASE ACTIVO ✔'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-blue-400" />
            {isOpen ? 'OCULTAR PANEL' : 'CONECTOR BD'}
          </button>
        </div>
      </div>

      {config.isMock && (
        <div className="p-4 bg-amber-950/10 text-xs text-amber-200 flex gap-2 border-b border-amber-900/10">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <div className="leading-relaxed">
            La aplicación está iniciada con <strong className="text-amber-300">20 jugadores precargados</strong> en almacenamiento local. 
            Puedes agregar, editar, filtrar y subir fotos en este modo demo. Para persistir datos y vincular fotos con 
            <strong> Supabase Storage</strong> real, haz clic en "CONECTOR BD" e introduce las credenciales de tu proyecto.
          </div>
        </div>
      )}

      {/* Panel de Configuración Expandido */}
      {isOpen && (
        <div className="p-6 bg-slate-900 border-t border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Formulario de credenciales */}
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-display mb-2 flex items-center gap-2">
                Conectividad Supabase
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Introduce las credenciales API que proporciona Supabase en 
                <span className="bg-slate-950 px-1 py-0.5 rounded font-mono break-all font-semibold text-blue-400 text-[10px]"> Settings &gt; API</span>. 
                Los datos se guardarán de forma segura en tu navegador de forma local.
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="supa-url" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    id="supa-url"
                    type="url"
                    required
                    placeholder="https://your-project.supabase.co"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-slate-100"
                  />
                </div>

                <div>
                  <label htmlFor="supa-key" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    id="supa-key"
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-slate-100"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs rounded-lg py-2.5 px-4 shadow-lg shadow-blue-900/20 transition-colors cursor-pointer"
                  >
                    Guardar y Conectar
                  </button>
                  {(config.supabaseUrl || config.supabaseKey) && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="bg-slate-950 hover:bg-slate-800 text-rose-400 border border-slate-800 font-bold uppercase tracking-wider text-xs rounded-lg py-2.5 px-4 transition-colors cursor-pointer"
                    >
                      Restablecer Demo Local
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider font-display flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
                  Prerrequisito en Supabase Storage
                </h4>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-normal font-mono">
                  <li>Inicia sesión en tu cuenta de <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5">Supabase <ExternalLink className="h-3 w-3" /></a>.</li>
                  <li>Ve a la sección <strong>Storage</strong> en el menú lateral izquierdo.</li>
                  <li>Crea un bucket público haciendo clic en <strong>New Bucket</strong>.</li>
                  <li>Nómbralo exactamente <strong className="bg-slate-900 px-1 rounded font-mono text-[11px] text-blue-400">jugadores</strong>.</li>
                  <li>Marca la casilla <strong>Public Bucket</strong> para permitir el acceso público a las imágenes de los jugadores.</li>
                </ul>
              </div>
            </div>

            {/* SQL de Supabase */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-blue-400" />
                  Ejecutar SQL en Supabase
                </h3>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copiar SQL
                  </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Copia este script SQL y pégalo en el panel de <strong>SQL Editor &gt; New Query</strong> de Supabase para crear la tabla <code className="font-semibold text-xs font-mono bg-slate-950 px-1 py-0.5 rounded text-blue-400">jugadores</code> con sus políticas de seguridad (RLS).
              </p>

              <div className="relative flex-1 min-h-[160px] bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800">
                <textarea
                  ref={sqlTextAreaRef}
                  readOnly
                  value={SUPABASE_SQL_CODE}
                  className="w-full h-full p-3 font-mono text-[10px] leading-normal text-slate-300 bg-transparent resize-none focus:outline-none overflow-y-auto"
                  aria-label="SQL Script for Supabase Table and Policies"
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
