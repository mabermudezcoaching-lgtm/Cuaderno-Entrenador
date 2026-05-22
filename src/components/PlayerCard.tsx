import { useState } from 'react';
import { Jugador } from '../types';
import { Shield, MapPin, Calendar, HelpCircle, Pocket, Trash2, Edit2, ShieldAlert, Eye, FileDown, Sparkles } from 'lucide-react';
import { exportPlayerToPdf } from '../lib/pdfExport';

interface PlayerCardProps {
  player: Jugador;
  isAdmin: boolean;
  onEdit: (player: Jugador) => void;
  onDelete: (id: string) => void;
  onPreview: (player: Jugador) => void;
}

export default function PlayerCard({ player, isAdmin, onEdit, onDelete, onPreview }: PlayerCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Helper to calculate age
  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Tag styling based on position
  const getPositionStyles = (pos: string) => {
    switch (pos) {
      case 'Portero':
        return 'bg-amber-950/50 text-amber-400 border-amber-800/40';
      case 'Defensa':
        return 'bg-cyan-950/50 text-cyan-400 border-cyan-800/40';
      case 'Centrocampista':
        return 'bg-blue-950/50 text-blue-400 border-blue-800/40';
      case 'Delantero':
        return 'bg-rose-950/50 text-rose-400 border-rose-800/40';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  // Get initials for failure state
  const getInitials = () => {
    const fn = player.nombre.charAt(0) || '';
    const ln = player.apellidos.charAt(0) || '';
    return `${fn}${ln}`.toUpperCase();
  };

  // Helper to render mini attribute notch progress bar
  const renderMiniBar = (val: number) => {
    return (
      <div className="flex gap-0.5 items-center">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 w-2 rounded-[1px] transition-colors ${
              idx <= val ? 'bg-blue-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-slate-700 hover:scale-[1.01] transition-all duration-300 flex flex-col group relative h-full">
      {/* Dorsal Badge on top-right */}
      <div className="absolute top-3.5 right-3.5 z-10 bg-slate-900 border border-slate-850 text-blue-400 h-8 w-8 rounded-lg flex items-center justify-center font-mono font-black text-sm shadow">
        {player.dorsal}
      </div>

      {/* Foto de Jugador / Imagen de Cabecera */}
      <div className="relative aspect-square w-full bg-slate-900 border-b border-slate-900/60 overflow-hidden flex items-center justify-center">
        {!imageError && player.foto_jugador ? (
          <img
            src={player.foto_jugador}
            alt={`${player.nombre} ${player.apellidos}`}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col items-center justify-center p-6 text-white text-center">
            {/* Jersey Vector Placeholder */}
            <div className="relative h-20 w-20 flex items-center justify-center mb-1">
              <svg className="absolute inset-0 h-full w-full text-blue-500/10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 5v3c0 5.25 3.42 10.16 8 11.42 4.58-1.26 8-6.17 8-11.42V5l-8-3z" />
              </svg>
              <div className="z-10 text-xl font-black tracking-tighter uppercase text-blue-400 font-display">
                {getInitials()}
              </div>
            </div>
            <div className="font-mono font-bold text-lg text-slate-400">#{player.dorsal}</div>
          </div>
        )}

        {/* Position Badge overlayed bottom-left */}
        <div className="absolute bottom-3 left-3">
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getPositionStyles(player.demarcacion)}`}>
            {player.demarcacion}
          </span>
        </div>
      </div>

      {/* Roster Metadata Info */}
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-widest mb-1.5 block font-display">
          {player.equipo}
        </span>
        <h3 className="font-black text-white text-lg leading-tight uppercase tracking-tight font-display group-hover:text-blue-400 transition-colors">
          {player.nombre} <span className="block text-slate-400 font-normal text-base normal-case font-sans">{player.apellidos}</span>
        </h3>

        {/* Technical Attributes */}
        <div className="mt-3.5 space-y-2 text-xs text-slate-300 border-t border-b border-slate-900 py-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">Edad:</span>
            <span className="font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {getAge(player.fecha_nacimiento)} años ({player.fecha_nacimiento})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">Lateralidad:</span>
            <span className="font-bold text-blue-400 inline-flex items-center gap-1.5 uppercase font-mono text-[11px]">
              <Pocket className="h-3.5 w-3.5 text-slate-500" />
              {player.lateralidad}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono shrink-0">Procedencia:</span>
            <span className="text-slate-200 flex items-center gap-1 truncate font-semibold">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              {player.equipo}
            </span>
          </div>
        </div>

        {/* Atributos del Jugador */}
        <div className="mt-3.5 bg-slate-900 border border-slate-850/60 rounded-xl p-3 space-y-2">
          <span className="text-[9px] uppercase font-bold text-slate-500 block font-display tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-400" /> Rendimiento Técnico / Físico
          </span>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 text-[10px] font-mono leading-none">
            <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded">
              <span className="text-slate-400 font-semibold">Velocidad:</span>
              {renderMiniBar(player.velocidad ?? 3)}
            </div>
            <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded">
              <span className="text-slate-400 font-semibold">Remate:</span>
              {renderMiniBar(player.remate ?? 3)}
            </div>
            <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded">
              <span className="text-slate-400 font-semibold">Pase:</span>
              {renderMiniBar(player.pase ?? 3)}
            </div>
            <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded">
              <span className="text-slate-400 font-semibold">Técnica:</span>
              {renderMiniBar(player.tecnica ?? 3)}
            </div>
            <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded">
              <span className="text-slate-400 font-semibold">Defensa:</span>
              {renderMiniBar(player.defensa ?? 3)}
            </div>
            <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded">
              <span className="text-slate-400 font-semibold">Actitud:</span>
              {renderMiniBar(player.actitud ?? 3)}
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {player.observaciones && (
          <div className="mt-3 bg-slate-900 rounded-lg p-3 border border-slate-850">
            <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1 font-display tracking-widest">Observaciones técnicas:</span>
            <p className="text-xs text-slate-400 italic font-mono leading-relaxed line-clamp-3">
              "{player.observaciones}"
            </p>
          </div>
        )}

        {/* Botones de Ficha y Exportación PDF */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onPreview(player)}
            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg py-2 transition-all cursor-pointer hover:shadow-md"
          >
            <Eye className="h-3.5 w-3.5 text-blue-400" />
            Ver Ficha
          </button>
          <button
            type="button"
            onClick={() => exportPlayerToPdf(player)}
            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg py-2 transition-all cursor-pointer hover:shadow-md"
          >
            <FileDown className="h-3.5 w-3.5 text-green-400" />
            Pdf Ficha
          </button>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-slate-900 flex gap-2">
            {!showConfirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(player)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg py-2 font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="inline-flex items-center justify-center text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 rounded-lg p-2 transition-colors cursor-pointer"
                  title="Eliminar jugador"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="w-full bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 text-xs text-rose-200">
                <div className="flex gap-2 items-start mb-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="font-semibold leading-normal">¿Deseas dar de baja a {player.nombre}?</span>
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(player.id);
                      setShowConfirmDelete(false);
                    }}
                    className="bg-rose-700 hover:bg-rose-600 text-white rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
