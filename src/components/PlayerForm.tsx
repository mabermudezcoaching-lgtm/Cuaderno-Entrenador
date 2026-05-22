import React, { useState, useRef } from 'react';
import { Jugador } from '../types';
import { supabase, getSupabaseConfigState } from '../lib/supabase';
import { X, Upload, Check, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react';

interface PlayerFormProps {
  player?: Jugador;
  onClose: () => void;
  onSave: (player: Partial<Jugador>) => void;
}

export default function PlayerForm({ player, onClose, onSave }: PlayerFormProps) {
  const config = getSupabaseConfigState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(player?.nombre || '');
  const [apellidos, setApellidos] = useState(player?.apellidos || '');
  const [dorsal, setDorsal] = useState<number | ''>(player?.dorsal ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(player?.fecha_nacimiento || '');
  const [demarcacion, setDemarcacion] = useState<Jugador['demarcacion']>(player?.demarcacion || 'Centrocampista');
  const [lateralidad, setLateralidad] = useState<Jugador['lateralidad']>(player?.lateralidad || 'Diestro');
  const [equipo, setEquipo] = useState(player?.equipo || 'Gestor de Plantilla FC');
  const [fotoJugador, setFotoJugador] = useState(player?.foto_jugador || '');
  const [observaciones, setObservaciones] = useState(player?.observaciones || '');

  // Atributos cuantitativos
  const [velocidad, setVelocidad] = useState<number>(player?.velocidad ?? 3);
  const [remate, setRemate] = useState<number>(player?.remate ?? 3);
  const [pase, setPase] = useState<number>(player?.pase ?? 3);
  const [tecnica, setTecnica] = useState<number>(player?.tecnica ?? 3);
  const [defensa, setDefensa] = useState<number>(player?.defensa ?? 3);
  const [actitud, setActitud] = useState<number>(player?.actitud ?? 3);

  // Helper template for attribute selector
  const renderRatingSelector = (label: string, value: number, onChange: (val: number) => void) => {
    return (
      <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
        <span className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono">{label}</span>
        <div className="flex gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer border flex items-center justify-center ${
                value === num
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950 scale-110'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Form states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecciona únicamente archivos de imagen (PNG, JPG, WEBP).');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setFileSuccess(false);

    if (config.isMock) {
      // Convert to Base64 in Mock Mode
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoJugador(reader.result as string);
        setUploading(false);
        setFileSuccess(true);
      };
      reader.onerror = () => {
        setUploadError('Error al procesar la imagen de forma local.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Connected Supabase Mode
    try {
      if (!supabase) throw new Error('Cliente Supabase no inicializado');

      const fileExt = file.name.split('.').pop();
      const fileName = `jugador-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('jugadores')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('jugadores').getPublicUrl(filePath);
      
      if (!data?.publicUrl) {
        throw new Error('No se pudo generar la dirección pública de la foto guardada.');
      }

      setFotoJugador(data.publicUrl);
      setFileSuccess(true);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error al subir la foto a Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !apellidos.trim() || dorsal === '' || !fechaNacimiento || !equipo.trim()) {
      alert('Por favor rellena todos los campos obligatorios (*).');
      return;
    }

    onSave({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      dorsal: Number(dorsal),
      fecha_nacimiento: fechaNacimiento,
      demarcacion,
      lateralidad,
      equipo: equipo.trim(),
      foto_jugador: fotoJugador,
      observaciones: observaciones.trim(),
      velocidad,
      remate,
      pase,
      tecnica,
      defensa,
      actitud,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col my-8 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-display">
              {player ? `Editar Ficha: ${player.nombre}` : 'Inscribir Nuevo Futbolista'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Nombre *
              </label>
              <input
                id="nombre"
                type="text"
                required
                placeholder="Nombre de pila"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="apellidos" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Apellidos *
              </label>
              <input
                id="apellidos"
                type="text"
                required
                placeholder="Apellidos completos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium"
              />
            </div>

            {/* Dorsal */}
            <div>
              <label htmlFor="dorsal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Dorsal/Número *
              </label>
              <input
                id="dorsal"
                type="number"
                required
                min={1}
                max={99}
                placeholder="1 - 99"
                value={dorsal}
                onChange={(e) => setDorsal(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium"
              />
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <label htmlFor="dob" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Fecha de Nacimiento *
              </label>
              <input
                id="dob"
                type="date"
                required
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium whitespace-nowrap"
              />
            </div>

            {/* Demarcación */}
            <div>
              <label htmlFor="demarcacion" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Posición / Demarcación *
              </label>
              <select
                id="demarcacion"
                value={demarcacion}
                onChange={(e) => setDemarcacion(e.target.value as Jugador['demarcacion'])}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium"
              >
                <option value="Portero">Portero</option>
                <option value="Defensa">Defensa</option>
                <option value="Centrocampista">Centrocampista</option>
                <option value="Delantero">Delantero</option>
              </select>
            </div>

            {/* Lateralidad */}
            <div>
              <label htmlFor="lateralidad" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Lateralidad / Pie dominante *
              </label>
              <select
                id="lateralidad"
                value={lateralidad}
                onChange={(e) => setLateralidad(e.target.value as Jugador['lateralidad'])}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium"
              >
                <option value="Diestro">Diestro / Derecho</option>
                <option value="Zurdo">Zurdo / Izquierdo</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>

            {/* Equipo */}
            <div className="md:col-span-2">
              <label htmlFor="equipo" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                Equipo de Procedencia / Actual *
              </label>
              <input
                id="equipo"
                type="text"
                required
                placeholder="Club de origen o escuadra actual"
                value={equipo}
                onChange={(e) => setEquipo(e.target.value)}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-medium"
              />
            </div>
          </div>

          {/* Atributos Cuantitativos */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">
                Ficha de Rendimiento Cuantitativo (1 al 5)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderRatingSelector('Velocidad / Ritmo', velocidad, setVelocidad)}
              {renderRatingSelector('Remate / Finalización', remate, setRemate)}
              {renderRatingSelector('Pase / Asociación', pase, setPase)}
              {renderRatingSelector('Técnica / Control', tecnica, setTecnica)}
              {renderRatingSelector('Defensa / Entrada', defensa, setDefensa)}
              {renderRatingSelector('Actitud / Compromiso', actitud, setActitud)}
            </div>
          </div>

          {/* Foto de jugador - Upload Section */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
              Foto de Perfil ({config.isMock ? 'Simulación Local Base64' : 'Supabase Bucket jugadores'})
            </span>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileBrowser}
              className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-950/20' 
                  : 'border-slate-800 hover:border-emerald-500 hover:bg-slate-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload player profile photo"
              />

              {fotoJugador ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-800">
                    <img
                      src={fotoJugador}
                      alt="Vista previa de perfil de jugador"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <span className="text-green-400 font-black block mb-1">✓ Imagen registrada</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFotoJugador('');
                        setFileSuccess(false);
                      }}
                      className="text-rose-405 hover:underline text-xs"
                    >
                      Remover foto
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className={`h-8 w-8 mb-2 ${uploading ? 'text-emerald-500 animate-bounce' : 'text-slate-500'}`} />
                  <p className="text-xs text-slate-300 font-bold mb-1">
                    {uploading ? 'Subiendo imagen...' : 'Arrastra una foto aquí o haz clic para buscar'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Formatos recomendados: JPG, PNG o WEBP (máx. 3MB)
                  </p>
                </>
              )}
            </div>

            {/* Upload Feedback */}
            {uploadError && (
              <div className="mt-2.5 text-rose-300 bg-rose-950/40 border border-rose-900/60 text-xs p-2.5 rounded-lg flex items-center gap-1.5 leading-normal">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}
            
            {fileSuccess && (
              <div className="mt-2.5 text-green-300 bg-green-950/40 border border-green-905-65 text-xs p-2.5 rounded-lg flex items-center gap-1.5 leading-normal">
                <Check className="h-4 w-4 shrink-0 text-green-400" />
                <span>Foto procesada con éxito y vinculada a la ficha.</span>
              </div>
            )}

            {/* Manual URL input fallback */}
            <div className="mt-3">
              <label htmlFor="foto-url" className="text-[10px] text-slate-505 font-medium block mb-1.5 font-mono">
                O bien, especifica una URL web de la foto directamente:
              </label>
              <input
                id="foto-url"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={fotoJugador}
                onChange={(e) => setFotoJugador(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-850 rounded-lg focus:outline-none bg-slate-900 text-slate-205"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="observaciones" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
              Observaciones del Cuerpo Técnico
            </label>
            <textarea
              id="observaciones"
              rows={3}
              placeholder="Cualidades tácticas, estado físico, historial de rendimiento o detalles scouts..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-100 font-mono resize-y"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3 shrink-0 col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-405 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-900/40 transition-colors cursor-pointer"
            >
              {player ? 'Ac Ficha' : 'Inscribir Futbolista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
