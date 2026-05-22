import React, { useState, useEffect, useRef } from 'react';
import { Jugador } from '../types';
import { 
  Users, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2,
  Sparkles,
  Search,
  ArrowRight,
  Info,
  X,
  FileDown
} from 'lucide-react';
import { exportTacticalBoardToPdf } from '../lib/pdfExport';

interface TacticalBoardProps {
  players: Jugador[];
}

interface Coordinate {
  x: number;
  y: number;
  label?: string;
  role?: string;
}

// Default System Positions for Team (Us) - Vertical Layout (Attacking upwards)
const FORMATIONS_US: Record<string, Coordinate[]> = {
  '1-4-3-3': [
    { x: 50, y: 88, label: 'POR', role: 'Portero' }, // GK
    { x: 20, y: 72, label: 'LD', role: 'Lateral Derecho' }, // LD
    { x: 40, y: 75, label: 'DFC L', role: 'Central Izquierdo' }, // DFC
    { x: 60, y: 75, label: 'DFC R', role: 'Central Derecho' }, // DFC
    { x: 80, y: 72, label: 'LI', role: 'Lateral Izquierdo' }, // LI
    { x: 50, y: 56, label: 'MCD', role: 'Pivote Defensivo' }, // MCD
    { x: 35, y: 46, label: 'MC L', role: 'Interior Izquierdo' }, // MC
    { x: 65, y: 46, label: 'MC R', role: 'Interior Derecho' }, // MC
    { x: 20, y: 22, label: 'ED', role: 'Extremo Derecho' }, // ED
    { x: 50, y: 16, label: 'DC', role: 'Delantero Centro' }, // DC
    { x: 80, y: 22, label: 'EI', role: 'Extremo Izquierdo' }, // EI
  ],
  '1-4-4-2': [
    { x: 50, y: 88, label: 'POR', role: 'Portero' },
    { x: 18, y: 72, label: 'LD', role: 'Lateral Derecho' },
    { x: 38, y: 74, label: 'DFC', role: 'Central Izquierdo' },
    { x: 62, y: 74, label: 'DFC', role: 'Central Derecho' },
    { x: 82, y: 72, label: 'LI', role: 'Lateral Izquierdo' },
    { x: 18, y: 48, label: 'MD', role: 'Volante Derecho' },
    { x: 38, y: 50, label: 'MC', role: 'Medio Centro' },
    { x: 62, y: 50, label: 'MC', role: 'Medio Centro' },
    { x: 82, y: 48, label: 'MI', role: 'Volante Izquierdo' },
    { x: 38, y: 22, label: 'DC', role: 'Delantero' },
    { x: 62, y: 22, label: 'DC', role: 'Delantero' },
  ],
  '1-3-5-2': [
    { x: 50, y: 88, label: 'POR', role: 'Portero' },
    { x: 30, y: 74, label: 'DFC', role: 'Central Izquierdo' },
    { x: 50, y: 76, label: 'DFC', role: 'Central Líbero' },
    { x: 70, y: 74, label: 'DFC', role: 'Central Derecho' },
    { x: 15, y: 48, label: 'CAD', role: 'Carrilero Derecho' },
    { x: 38, y: 54, label: 'MC', role: 'Interior Izquierdo' },
    { x: 50, y: 56, label: 'MCD', role: 'Mediocentro Defensivo' },
    { x: 62, y: 54, label: 'MC', role: 'Interior Derecho' },
    { x: 85, y: 48, label: 'CAI', role: 'Carrilero Izquierdo' },
    { x: 38, y: 22, label: 'DC', role: 'Delantero' },
    { x: 62, y: 22, label: 'DC', role: 'Delantero' },
  ],
  '1-4-2-3-1': [
    { x: 50, y: 88, label: 'POR', role: 'Portero' },
    { x: 18, y: 72, label: 'LD', role: 'Lateral Derecho' },
    { x: 38, y: 74, label: 'DFC', role: 'Central Izquierdo' },
    { x: 62, y: 74, label: 'DFC', role: 'Central Derecho' },
    { x: 82, y: 72, label: 'LI', role: 'Lateral Izquierdo' },
    { x: 35, y: 58, label: 'MCD', role: 'Pivote Defensivo' },
    { x: 65, y: 58, label: 'MCD', role: 'Pivote Defensivo' },
    { x: 20, y: 38, label: 'MCO D', role: 'Media Punta Extremo D' },
    { x: 50, y: 36, label: 'MCO', role: 'Media Punta Central' },
    { x: 80, y: 38, label: 'MCO I', role: 'Media Punta Extremo I' },
    { x: 50, y: 18, label: 'DC', role: 'Delantero Único' },
  ],
  '1-5-4-1': [
    { x: 50, y: 88, label: 'POR', role: 'Portero' },
    { x: 15, y: 72, label: 'LD', role: 'Carrilero Derecho' },
    { x: 32, y: 74, label: 'DFC', role: 'Central Izquierdo' },
    { x: 50, y: 76, label: 'DFC', role: 'Central Central' },
    { x: 68, y: 74, label: 'DFC', role: 'Central Derecho' },
    { x: 85, y: 72, label: 'LI', role: 'Carrilero Izquierdo' },
    { x: 22, y: 48, label: 'MD', role: 'Medio Derecho' },
    { x: 40, y: 50, label: 'MC', role: 'Medio Pivot' },
    { x: 60, y: 50, label: 'MC', role: 'Medio Pivot' },
    { x: 78, y: 48, label: 'MI', role: 'Medio Izquierdo' },
    { x: 50, y: 22, label: 'DC', role: 'Delantero Único' },
  ],
  '1-3-4-3': [
    { x: 50, y: 88, label: 'POR', role: 'Portero' },
    { x: 28, y: 74, label: 'DFC', role: 'Central Izquierdo' },
    { x: 50, y: 76, label: 'DFC', role: 'Central Central' },
    { x: 72, y: 74, label: 'DFC', role: 'Central Derecho' },
    { x: 20, y: 50, label: 'MD', role: 'Interior Derecho' },
    { x: 42, y: 52, label: 'MC', role: 'Medio Pivote' },
    { x: 58, y: 52, label: 'MC', role: 'Medio Pivote' },
    { x: 80, y: 50, label: 'MI', role: 'Interior Izquierdo' },
    { x: 22, y: 24, label: 'ED', role: 'Extremo Derecho' },
    { x: 50, y: 18, label: 'DC', role: 'Delantero Centro' },
    { x: 78, y: 24, label: 'EI', role: 'Extremo Izquierdo' },
  ]
};

// Default System Positions for Rival Team - Defensive block at Top
const FORMATIONS_RIVAL: Record<string, Coordinate[]> = {
  '1-4-4-2': [
    { x: 50, y: 12, label: 'RPOR' }, // OK Rival Goalkeeper at top
    { x: 82, y: 28, label: 'RLD' },
    { x: 62, y: 26, label: 'RDFC' },
    { x: 38, y: 26, label: 'RDFC' },
    { x: 18, y: 28, label: 'RLI' },
    { x: 82, y: 52, label: 'RMD' },
    { x: 62, y: 50, label: 'RMC' },
    { x: 38, y: 50, label: 'RMC' },
    { x: 18, y: 52, label: 'RMI' },
    { x: 62, y: 78, label: 'RDC' },
    { x: 38, y: 78, label: 'RDC' },
  ],
  '1-4-3-3': [
    { x: 50, y: 12, label: 'RPOR' },
    { x: 82, y: 28, label: 'RLD' },
    { x: 62, y: 26, label: 'RDFC' },
    { x: 38, y: 26, label: 'RDFC' },
    { x: 18, y: 28, label: 'RLI' },
    { x: 75, y: 52, label: 'RMC' },
    { x: 50, y: 48, label: 'RMCD' },
    { x: 25, y: 52, label: 'RMC' },
    { x: 80, y: 78, label: 'RED' },
    { x: 50, y: 84, label: 'RDC' },
    { x: 20, y: 78, label: 'REI' },
  ],
  '1-5-4-1': [
    { x: 50, y: 12, label: 'RPOR' },
    { x: 85, y: 28, label: 'RLD' },
    { x: 68, y: 26, label: 'RDFC' },
    { x: 50, y: 24, label: 'RDFC' },
    { x: 32, y: 26, label: 'RDFC' },
    { x: 15, y: 28, label: 'RLI' },
    { x: 78, y: 52, label: 'RMD' },
    { x: 60, y: 50, label: 'RMC' },
    { x: 40, y: 50, label: 'RMC' },
    { x: 22, y: 52, label: 'RMI' },
    { x: 50, y: 78, label: 'RDC' },
  ]
};

// Colors of Jersey graphics style
const JERSEY_COLORS = {
  us: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-300',
    text: 'text-white shadow-emerald-950/40'
  },
  rival: {
    bg: 'bg-rose-700',
    border: 'border-rose-400',
    text: 'text-white shadow-rose-950/40'
  }
};

export default function TacticalBoard({ players }: TacticalBoardProps) {
  const pitchRef = useRef<HTMLDivElement>(null);

  // Tactical setup states
  const [usFormation, setUsFormation] = useState<string>('1-4-3-3');
  const [rivalFormation, setRivalFormation] = useState<string>('1-4-4-2');
  const [showRivals, setShowRivals] = useState<boolean>(true);
  
  // Custom interactive layout coordinate states
  const [ourCoords, setOurCoords] = useState<Coordinate[]>([]);
  const [rivalCoords, setRivalCoords] = useState<Coordinate[]>([]);
  
  // Slot mappings: index in coordinate array maps to player ID (or null)
  const [ourAssignedIds, setOurAssignedIds] = useState<Record<number, string>>({});
  
  // Active dragging tracking
  const [dragging, setDragging] = useState<{ team: 'us' | 'rival'; index: number } | null>(null);
  
  // Selecting player for slot state
  const [activeSelectorSlot, setActiveSelectorSlot] = useState<number | null>(null);
  // Modal to select which slot to put a selected bench player on
  const [benchPlayerToPlace, setBenchPlayerToPlace] = useState<Jugador | null>(null);
  
  const [searchRoster, setSearchRoster] = useState('');
  
  // Saved state feedback
  const [showSaveMessage, setShowSaveMessage] = useState<boolean>(false);

  // Initialize from defaults or localStorage
  useEffect(() => {
    // Migrate old names of formations automatically if they exist
    let savedUsFormation = localStorage.getItem('tactical_us_formation') || '1-4-3-3';
    if (savedUsFormation === '4-3-3') savedUsFormation = '1-4-3-3';
    if (savedUsFormation === '4-4-2') savedUsFormation = '1-4-4-2';
    if (savedUsFormation === '3-5-2') savedUsFormation = '1-3-5-2';
    if (savedUsFormation === '4-2-3-1') savedUsFormation = '1-4-2-3-1';
    if (savedUsFormation === '5-4-1') savedUsFormation = '1-5-4-1';
    if (savedUsFormation === '3-4-3') savedUsFormation = '1-3-4-3';

    let savedRivalFormation = localStorage.getItem('tactical_rival_formation') || '1-4-4-2';
    if (savedRivalFormation === '4-4-2') savedRivalFormation = '1-4-4-2';
    if (savedRivalFormation === '4-3-3') savedRivalFormation = '1-4-3-3';
    if (savedRivalFormation === '5-4-1') savedRivalFormation = '1-5-4-1';
    
    const savedShowRivalsStr = localStorage.getItem('tactical_show_rivals');
    
    setUsFormation(savedUsFormation);
    setRivalFormation(savedRivalFormation);
    if (savedShowRivalsStr !== null) {
      setShowRivals(savedShowRivalsStr === 'true');
    }

    // Load custom positions if they exist in localStorage
    const savedUsCoords = localStorage.getItem(`tactical_coords_us_${savedUsFormation}`);
    const savedRivalCoords = localStorage.getItem(`tactical_coords_rival_${savedRivalFormation}`);
    const savedAssignments = localStorage.getItem(`tactical_assignments_${savedUsFormation}`);

    if (savedUsCoords) {
      setOurCoords(JSON.parse(savedUsCoords));
    } else {
      setOurCoords(FORMATIONS_US[savedUsFormation] || FORMATIONS_US['1-4-3-3']);
    }

    if (savedRivalCoords) {
      setRivalCoords(JSON.parse(savedRivalCoords));
    } else {
      setRivalCoords(FORMATIONS_RIVAL[savedRivalFormation] || FORMATIONS_RIVAL['1-4-4-2']);
    }

    if (savedAssignments) {
      setOurAssignedIds(JSON.parse(savedAssignments));
    } else {
      setOurAssignedIds({});
    }
  }, []);

  // Sync coords when user switches formations
  const changeUsFormation = (formationName: string) => {
    setUsFormation(formationName);
    localStorage.setItem('tactical_us_formation', formationName);
    
    const savedCoords = localStorage.getItem(`tactical_coords_us_${formationName}`);
    const savedAssignments = localStorage.getItem(`tactical_assignments_${formationName}`);
    
    if (savedCoords) {
      setOurCoords(JSON.parse(savedCoords));
    } else {
      setOurCoords(FORMATIONS_US[formationName] || FORMATIONS_US['1-4-3-3']);
    }

    if (savedAssignments) {
      setOurAssignedIds(JSON.parse(savedAssignments));
    } else {
      // Clear or preserve what we can
      setOurAssignedIds({});
    }
  };

  const changeRivalFormation = (formationName: string) => {
    setRivalFormation(formationName);
    localStorage.setItem('tactical_rival_formation', formationName);
    const savedCoords = localStorage.getItem(`tactical_coords_rival_${formationName}`);
    if (savedCoords) {
      setRivalCoords(JSON.parse(savedCoords));
    } else {
      setRivalCoords(FORMATIONS_RIVAL[formationName] || FORMATIONS_RIVAL['1-4-4-2']);
    }
  };

  // Reset to default coordinates
  const handleResetSystem = () => {
    const defaultUs = FORMATIONS_US[usFormation] || FORMATIONS_US['1-4-3-3'];
    const defaultRival = FORMATIONS_RIVAL[rivalFormation] || FORMATIONS_RIVAL['1-4-4-2'];
    
    setOurCoords(defaultUs);
    setRivalCoords(defaultRival);
    
    localStorage.removeItem(`tactical_coords_us_${usFormation}`);
    localStorage.removeItem(`tactical_coords_rival_${rivalFormation}`);
    localStorage.removeItem(`tactical_assignments_${usFormation}`);
    setOurAssignedIds({});
  };

  // Save layout parameters
  const handleSaveToLocalStorage = () => {
    localStorage.setItem(`tactical_coords_us_${usFormation}`, JSON.stringify(ourCoords));
    localStorage.setItem(`tactical_coords_rival_${rivalFormation}`, JSON.stringify(rivalCoords));
    localStorage.setItem(`tactical_assignments_${usFormation}`, JSON.stringify(ourAssignedIds));
    localStorage.setItem('tactical_show_rivals', String(showRivals));
    
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  // Drag and drop mechanics using universal Pointer Events (mouse/touch friendly)
  const handlePointerDown = (e: React.PointerEvent, team: 'us' | 'rival', index: number) => {
    e.preventDefault();
    const element = e.currentTarget as HTMLElement;
    element.setPointerCapture(e.pointerId);
    setDragging({ team, index });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate mouse/finger relative percentage of pitch container
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain position between 3% and 97% to prevent overflowing the borders
    x = Math.max(3, Math.min(97, x));
    y = Math.max(3, Math.min(97, y));

    if (dragging.team === 'us') {
      const updated = [...ourCoords];
      if (updated[dragging.index]) {
        updated[dragging.index] = { ...updated[dragging.index], x, y };
        setOurCoords(updated);
      }
    } else {
      const updated = [...rivalCoords];
      if (updated[dragging.index]) {
        updated[dragging.index] = { ...updated[dragging.index], x, y };
        setRivalCoords(updated);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent, team: 'us' | 'rival', index: number) => {
    if (dragging) {
      const element = e.currentTarget as HTMLElement;
      try {
        element.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe check
      }
      setDragging(null);
    }
  };

  // Assign player to board node
  const assignPlayerToSlot = (slotIndex: number, playerId: string | null) => {
    const updated = { ...ourAssignedIds };
    if (playerId === null) {
      delete updated[slotIndex];
    } else {
      // If player is assigned elsewhere on the same system, remove them from that other spot
      Object.keys(updated).forEach((key) => {
        const idx = Number(key);
        if (updated[idx] === playerId) {
          delete updated[idx];
        }
      });
      // Set to new spot
      updated[slotIndex] = playerId;
    }
    setOurAssignedIds(updated);
    setActiveSelectorSlot(null);
  };

  // Find player details mapped
  const getPlayerInSlot = (slotIndex: number): Jugador | undefined => {
    const id = ourAssignedIds[slotIndex];
    if (!id) return undefined;
    return players.find(p => p.id === id);
  };

  // List of players currently NOT on the field
  const getBenchPlayers = () => {
    const activeIds = Object.values(ourAssignedIds);
    return players.filter(p => !activeIds.includes(p.id));
  };

  // Filter roster search
  const filteredBench = getBenchPlayers().filter(p => {
    const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
    return fullName.includes(searchRoster.toLowerCase()) || p.dorsal.toString() === searchRoster;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header and controls of tactical board */}
      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white font-display">
                PIZARRA TÁCTICA & CAMPOGRAMA INTERACTIVO
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Arrastra y recoloca a los futbolistas en cualquier coordenada del campo. Diseña e improvisa enfrentamientos contra el bloque rival.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reset */}
            <button
              type="button"
              onClick={handleResetSystem}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer font-bold font-mono"
              title="Restaurar coordenadas de sistemas predefinidos"
            >
              <RefreshCw className="h-4 w-4 text-amber-500" />
              POR DEFECTO
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveToLocalStorage}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl px-4 py-2.5 transition-all font-black uppercase tracking-wider shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              GUARDAR ALINEACIÓN
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={() => {
                exportTacticalBoardToPdf(
                  usFormation,
                  ourAssignedIds,
                  ourCoords,
                  players,
                  showRivals,
                  rivalFormation,
                  rivalCoords
                );
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl px-4 py-2.5 transition-all font-black uppercase tracking-wider shadow-lg shadow-emerald-950/50 cursor-pointer"
              title="Exportar alineación y pizarra táctica actual en formato PDF"
            >
              <FileDown className="h-4 w-4" />
              EXPORTAR PDF
            </button>
          </div>

        </div>

        {/* Feedback Alert Banner */}
        {showSaveMessage && (
          <div className="bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold font-mono animate-fadeIn">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            ¡TÁCTICA Y ALINEACIONES GUARDADAS CORRECTAMENTE EN EL DISPOSITIVO!
          </div>
        )}

        {/* Action Controls panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 border-t border-slate-900 pt-4">
          
          {/* US Formation system selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-mono">
              Sistema del Equipo (Nuestro)
            </label>
            <div className="flex gap-2">
              <select
                value={usFormation}
                onChange={(e) => changeUsFormation(e.target.value)}
                className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-205 py-3 font-bold"
                aria-label="Our Team Formation"
              >
                {Object.keys(FORMATIONS_US).map((f) => (
                  <option key={f} value={f}>Sistema {f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* RIVAL Formation system selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-mono">
              Formación Bloque Rival
            </label>
            <select
              disabled={!showRivals}
              value={rivalFormation}
              onChange={(e) => changeRivalFormation(e.target.value)}
              className="w-full text-xs px-3.5 py-3 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-slate-205 py-3 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Rival Team Formation"
            >
              {Object.keys(FORMATIONS_RIVAL).map((f) => (
                <option key={f} value={f}>Sistema Rival {f}</option>
              ))}
            </select>
          </div>

          {/* Toggle Rivals display */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-transparent block font-mono">
              Rival toggle
            </label>
            <button
              type="button"
              onClick={() => setShowRivals(!showRivals)}
              className={`w-full inline-flex items-center justify-center gap-2 text-xs font-black uppercase py-3 border rounded-xl transition-all cursor-pointer select-none ${
                showRivals
                  ? 'bg-rose-950/20 text-rose-350 border-rose-900/40 hover:bg-rose-950/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-350'
              }`}
            >
              {showRivals ? (
                <>
                  <Eye className="h-4 w-4 text-rose-500" />
                  Ocultar Bloque Rival
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Mostrar Bloque Rival
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 2. Tactical Pitch & Bench Roster Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Pitch Display Area (8cols) */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* Vertical Soccer Pitch Canvas wrapper */}
          <div 
            ref={pitchRef}
            onPointerMove={handlePointerMove}
            className="w-full aspect-[3/4] max-w-[500px] mx-auto bg-emerald-900 border-4 border-white/60 rounded-3xl relative overflow-hidden shadow-2xl select-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #065f46 25%, #064e3b 80%)',
              touchAction: 'none' // Crucial for preventing default drag/scroll on mobile
            }}
          >
            {/* PITCH LINES MARKINGS IN CSS/SVG */}
            {/* Outer margin line */}
            <div className="absolute inset-2 border border-white/30 rounded-2xl pointer-events-none" />

            {/* Halfway line */}
            <div className="absolute top-1/2 left-2 right-2 h-[1px] bg-white/30 pointer-events-none" />

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 w-[24%] aspect-square -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-white/50 rounded-full pointer-events-none" />

            {/* Top Penalty Area (Rival's half) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[55%] h-[18%] border-b border-x border-white/30 pointer-events-none" />
            {/* Top Goal Area */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[25%] h-[6%] border-b border-x border-white/30 pointer-events-none" />
            {/* Top Penalty circle mark */}
            <div className="absolute top-[18px] left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-white/40 pointer-events-none" />

            {/* Bottom Penalty Area (Our half) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[55%] h-[18%] border-t border-x border-white/30 pointer-events-none" />
            {/* Bottom Goal Area */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[25%] h-[6%] border-t border-x border-white/30 pointer-events-none" />
            {/* Bottom Penalty circle mark */}
            <div className="absolute bottom-[18px] left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-white/40 pointer-events-none" />

            {/* RIVAL PLAYERS NODES (Rendered at top section) */}
            {showRivals && rivalCoords.map((coord, idx) => (
              <div
                key={`rival-${idx}`}
                onPointerDown={(e) => handlePointerDown(e, 'rival', idx)}
                onPointerUp={(e) => handlePointerUp(e, 'rival', idx)}
                className="absolute -translate-x-1/2 -translate-y-1/2 touch-none z-20 cursor-grab active:cursor-grabbing text-center group"
                style={{
                  left: `${coord.x}%`,
                  top: `${coord.y}%`,
                }}
              >
                {/* Red Player visual badge */}
                <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center font-black text-xs border bg-red-700 border-red-400 text-white shadow-lg shadow-red-950/50 hover:scale-110 active:scale-95 transition-transform`}>
                  R{idx + 1}
                </div>
                {/* Micro info on hover or compact label */}
                <span className="block mt-0.5 text-[7px] font-black bg-slate-950/80 text-rose-350 px-1 py-0.2 rounded border border-rose-900/30 uppercase tracking-wide font-mono select-none">
                  {coord.label || `Riv ${idx + 1}`}
                </span>
              </div>
            ))}

            {/* OUR PLAYERS NODES */}
            {ourCoords.map((coord, idx) => {
              const assignedPlayer = getPlayerInSlot(idx);
              const isGK = idx === 0;

              return (
                <div
                  key={`us-${idx}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 touch-none z-30 text-center"
                  style={{
                    left: `${coord.x}%`,
                    top: `${coord.y}%`,
                  }}
                >
                  {/* Draggable container circle */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'us', idx)}
                    onPointerUp={(e) => handlePointerUp(e, 'us', idx)}
                    className="cursor-grab active:cursor-grabbing inline-block"
                  >
                    {assignedPlayer ? (
                      /* ASSIGNED PLAYER VISUAL KEYRING CARD */
                      <div className="relative">
                        {/* Compact Circular user profile badge */}
                        <div className={`w-11 h-11 rounded-full border-2 bg-slate-900 shadow-xl overflow-hidden hover:scale-110 active:scale-95 transition-transform flex items-center justify-center ${
                          isGK ? 'border-amber-400 shadow-amber-950/40' : 'border-emerald-500 shadow-emerald-950/40'
                        }`}>
                          {assignedPlayer.foto_jugador ? (
                            <img
                              src={assignedPlayer.foto_jugador}
                              alt={assignedPlayer.nombre}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover pointer-events-none"
                              onError={(e) => {
                                // Fallback display
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xs font-black text-white">
                              {assignedPlayer.nombre.substring(0, 1)}{assignedPlayer.apellidos.substring(0, 1)}
                            </span>
                          )}
                          {/* Top mini dorsal overlay inside */}
                          <div className={`absolute -top-1 -right-1 font-mono text-[8px] font-extrabold px-1 rounded-full ${
                            isGK ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                          }`}>
                            {assignedPlayer.dorsal}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* EMPTY SLOT PLACEHOLDER NODE */
                      <button
                        type="button"
                        onClick={() => setActiveSelectorSlot(idx)}
                        className={`w-10 h-10 rounded-full border border-dashed flex flex-col items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg ${
                          isGK 
                            ? 'bg-amber-950/20 text-amber-500 border-amber-500 hover:bg-amber-950/30' 
                            : 'bg-slate-950/80 text-slate-400 border-slate-600 hover:bg-slate-900'
                        }`}
                        title="Hacer clic para asignar un jugador de la plantilla"
                      >
                        <span className="text-[9px] font-extrabold font-mono tracking-tight leading-none">
                          {coord.label}
                        </span>
                        <span className="text-[7px] text-slate-500 mt-0.5 leading-none">SIN</span>
                      </button>
                    )}
                  </div>

                  {/* Player labels name sub-panel beneath */}
                  <div className="mt-0.5 flex flex-col items-center pointer-events-auto">
                    {assignedPlayer ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setActiveSelectorSlot(idx)}
                          className="bg-slate-950/90 text-white font-black text-[8px] tracking-tight px-1.5 py-0.5 rounded border border-slate-800 leading-none shadow hover:bg-slate-850 cursor-pointer text-center block max-w-20 truncate"
                        >
                          {assignedPlayer.nombre}
                        </button>
                        <span className="text-[6.5px] font-mono text-emerald-300 uppercase tracking-widest leading-none bg-emerald-950/40 px-1 rounded">
                          {coord.label}
                        </span>
                      </div>
                    ) : (
                      <span className="block text-[6px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/60 px-0.8 rounded">
                        {coord.role}
                      </span>
                    )}
                  </div>

                </div>
              );
            })}

          </div>

          <div className="max-w-[500px] w-full mx-auto mt-3.5 bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-start gap-2">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
              * Presiona y arrastra a cualquier jugador en el campo para cambiar de sitio. Pincha sobre un marcador vacío o sobre el nombre de un jugador para sustituirlo o asignar tu plantilla oficial.
            </p>
          </div>

        </div>

        {/* Bench Sidebar (4cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Bench Roster List */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-xl space-y-4.5">
            
            <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">SUPLENTES Y ROSTER</span>
                <h3 className="text-sm font-extrabold text-white font-display">
                  FUTBOLISTAS DISPONIBLES
                </h3>
              </div>
              <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg font-mono">
                {getBenchPlayers().length} DISP
              </span>
            </div>

            {/* Quick search input bench */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar suplentes..."
                value={searchRoster}
                onChange={(e) => setSearchRoster(e.target.value)}
                className="w-full text-xs pl-8.5 pr-3 py-2.5 border border-slate-850 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            {/* Roster Bench scroll container */}
            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1.5 custom-scrollbar">
              {getBenchPlayers().length === 0 ? (
                <div className="py-8 text-center bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                  <span className="text-slate-550 text-xs font-mono block">★ PLANTILLA TITULAR COMPLETA ★</span>
                  <p className="text-[10px] text-slate-500">No quedan futbolistas en el banquillo; todos han sido ubicados.</p>
                </div>
              ) : filteredBench.length === 0 ? (
                <div className="py-4 text-center text-[10px] text-slate-500">Ningún suplente coincide con el filtro.</div>
              ) : (
                filteredBench.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        {item.foto_jugador ? (
                          <img
                            src={item.foto_jugador}
                            alt={item.nombre}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400">#{item.dorsal}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black tracking-tight text-white block truncate">
                          {item.nombre} {item.apellidos}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 uppercase">
                          {item.demarcacion} • Lado: {item.lateralidad[0]}
                        </span>
                      </div>
                    </div>

                    {/* Quick Add button */}
                    <button
                      type="button"
                      onClick={() => {
                        setBenchPlayerToPlace(item);
                      }}
                      className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-400 hover:text-white bg-slate-950 hover:bg-emerald-600 border border-slate-800 hover:border-emerald-500 rounded-lg px-2 py-1.5 transition-all cursor-pointer"
                    >
                      Alinear <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Clear Board Actions */}
            {Object.keys(ourAssignedIds).length > 0 && (
              <button
                type="button"
                onClick={() => setOurAssignedIds({})}
                className="w-full inline-flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-rose-300 hover:text-white bg-rose-950/25 hover:bg-rose-950 border border-rose-900/40 rounded-xl py-3 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Vaciar alineación titular
              </button>
            )}

          </div>

        </div>

      </div>

      {/* 3. Dropdown Menu modal popup to assign players into a specific coordinate index */}
      {activeSelectorSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">SECTOR TÁCTICO: {ourCoords[activeSelectorSlot]?.label}</span>
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">
                  Asignar posición activa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSelectorSlot(null);
                  setSearchRoster('');
                }}
                className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="p-4 border-b border-slate-850 bg-slate-950/20">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar jugador..."
                  value={searchRoster}
                  onChange={(e) => setSearchRoster(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2.5 border border-slate-850 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Scorllable Selection */}
            <div className="overflow-y-auto max-h-[300px] p-4 space-y-2">
              
              {/* Option to clear/unassign if currently full */}
              {getPlayerInSlot(activeSelectorSlot) && (
                <button
                  type="button"
                  onClick={() => assignPlayerToSlot(activeSelectorSlot, null)}
                  className="w-full p-2.5 text-left text-xs text-rose-455 font-bold hover:bg-rose-955 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center justify-between cursor-pointer"
                >
                  <span>Remover jugador asignado</span>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {players.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No hay jugadores registrados en la base de datos de la plantilla.</div>
              ) : (
                players
                  .filter(p => {
                    const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
                    return fullName.includes(searchRoster.toLowerCase());
                  })
                  .map((p) => {
                    const isAlreadyAssigned = Object.values(ourAssignedIds).includes(p.id);
                    const isCurrentlyInThisSlot = ourAssignedIds[activeSelectorSlot] === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => assignPlayerToSlot(activeSelectorSlot, p.id)}
                        disabled={isCurrentlyInThisSlot}
                        className={`w-full p-2.5 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                          isCurrentlyInThisSlot
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50'
                            : 'bg-slate-950 hover:bg-slate-850 text-white border-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                            {p.foto_jugador ? (
                              <img
                                src={p.foto_jugador}
                                alt={p.nombre}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400">#{p.dorsal}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black block truncate text-slate-200">
                              #{p.dorsal} - {p.nombre} {p.apellidos}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">
                              {p.demarcacion} • Lado: {p.lateralidad}
                            </span>
                          </div>
                        </div>

                        {/* Status Label */}
                        {isAlreadyAssigned && !isCurrentlyInThisSlot && (
                          <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-slate-450 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            CAMBIAR SITIO
                          </span>
                        )}
                      </button>
                    );
                  })
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-850 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveSelectorSlot(null);
                  setSearchRoster('');
                }}
                className="text-xs font-bold font-mono uppercase bg-slate-900 text-slate-350 hover:text-white px-4 py-2 rounded-lg border border-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Select target position/slot on pitch for the sidebar bench player */}
      {benchPlayerToPlace !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">SELECCIONAR POSICIÓN DE DESTINO</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                  Alinear a {benchPlayerToPlace.nombre} {benchPlayerToPlace.apellidos}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBenchPlayerToPlace(null)}
                className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950/40 border-b border-slate-850 text-xs text-slate-300">
              <p>Selecciona la demarcación en la que deseas posicionar a este jugador dentro del sistema <strong className="text-white">{usFormation}</strong>. No estás obligado a empezar por el portero:</p>
            </div>

            {/* Scrollable list of 11 positions */}
            <div className="overflow-y-auto max-h-[350px] p-4 space-y-2">
              {ourCoords.map((coord, idx) => {
                const assignedPlayer = getPlayerInSlot(idx);
                return (
                  <button
                    key={`place-slot-${idx}`}
                    type="button"
                    onClick={() => {
                      assignPlayerToSlot(idx, benchPlayerToPlace.id);
                      setBenchPlayerToPlace(null);
                    }}
                    className="w-full p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Circle badge representing the slot */}
                      <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-black font-mono text-slate-300 shrink-0 group-hover:border-emerald-500 group-hover:text-emerald-400">
                        {coord.label}
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                          {coord.role}
                        </span>
                        {assignedPlayer ? (
                          <span className="text-xs text-rose-300 font-bold block">
                            Ocupado por: #{assignedPlayer.dorsal} {assignedPlayer.nombre} (Se reemplazará)
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-400 font-extrabold block">
                            ★ Vacante - Disponible
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-400 group-hover:text-white bg-slate-900 group-hover:bg-emerald-600 px-2.5 py-1.5 rounded-lg border border-slate-800 group-hover:border-emerald-500 transition-all font-mono">
                      Seleccionar
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-850 flex justify-end">
              <button
                type="button"
                onClick={() => setBenchPlayerToPlace(null)}
                className="text-xs font-bold font-mono uppercase bg-slate-900 text-slate-350 hover:text-white px-4 py-2 rounded-lg border border-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
