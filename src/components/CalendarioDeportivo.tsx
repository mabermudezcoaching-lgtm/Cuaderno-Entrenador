import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseConfigState } from '../lib/supabase';
import { CalendarioEvento, IndiceCarga } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  SlidersHorizontal, 
  PlusCircle, 
  CalendarRange, 
  Info,
  Layers,
  Activity,
  UserCheck,
  BookOpen,
  CheckCircle2,
  X
} from 'lucide-react';

const LOCAL_STORAGE_CALENDAR_KEY = 'futbol_app_calendario_eventos';

const SEED_CALENDAR_EVENTS = (): CalendarioEvento[] => {
  const now = new Date();
  
  // Helper to get formatted date string offset from today
  const getOffsetDateString = (daysOffset: number): string => {
    const d = new Date();
    d.setDate(now.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'seed-evt-1',
      titulo: 'Sesión de Recuperación y Crioterápia',
      tipo_evento: 'entrenamiento',
      fecha: getOffsetDateString(-3),
      hora: '10:30',
      indice_carga: 'Recuperación',
      notas: 'Trabajo regenerativo en campo de hierba natural y pileta fría. Suave carrera continua e hidromasaje.'
    },
    {
      id: 'seed-evt-2',
      titulo: 'Análisis de Vídeo y Charla Técnica',
      tipo_evento: 'entrenamiento',
      fecha: getOffsetDateString(-1),
      hora: '18:00',
      indice_carga: 'Charla',
      notas: 'Visualización del rival de liga. Fortalezas en transición ofensiva y vulnerabilidades a balón parado.'
    },
    {
      id: 'seed-evt-3',
      titulo: 'Sesión Táctica: Presión Alta y Bloque Medio',
      tipo_evento: 'entrenamiento',
      fecha: getOffsetDateString(0), // Today
      hora: '16:30',
      indice_carga: 'Alta',
      notas: 'Carga técnica y táctica elevada. Rondos de presión tras pérdida, posesiones en espacio reducido y partido condicionado.'
    },
    {
      id: 'seed-evt-4',
      titulo: 'Trabajo de Prevención de Lesiones',
      tipo_evento: 'entrenamiento',
      fecha: getOffsetDateString(1), // Tomorrow
      hora: '11:00',
      indice_carga: 'Preventivo',
      notas: 'Trabajo de core, ejercicios excéntricos de isquiotibiales y movilidad de cadera supervisada por fisio.'
    },
    {
      id: 'seed-evt-5',
      titulo: 'Nuestra Plantilla F.C. vs rival liguero',
      tipo_evento: 'partido',
      fecha: getOffsetDateString(2), // Day after tomorrow
      hora: '12:00',
      indice_carga: 'Alta',
      notas: 'Jornada oficial de Liga en casa. Convocatoria obligatoria 1 hora y media antes en vestuario.'
    },
    {
      id: 'seed-evt-6',
      titulo: 'Entrenamiento de Carga Moderada: Transiciones',
      tipo_evento: 'entrenamiento',
      fecha: getOffsetDateString(4),
      hora: '17:00',
      indice_carga: 'Media',
      notas: 'Fase de juego defensiva y salidas de balón rápido por los carrileros. Remates tras centro lateral.'
    }
  ];
};

export default function CalendarioDeportivo() {
  const config = getSupabaseConfigState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<CalendarioEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Calendar dates navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayString, setSelectedDayString] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filters
  const [filterType, setFilterType] = useState<'todo' | 'entrenamiento' | 'partido'>('todo');
  const [filterLoad, setFilterLoad] = useState<'todo' | IndiceCarga>('todo');

  // Form states to create calendar event
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'entrenamiento' | 'partido'>('entrenamiento');
  const [newDate, setNewDate] = useState(selectedDayString);
  const [newTime, setNewTime] = useState('17:00');
  const [newLoad, setNewLoad] = useState<IndiceCarga>('Media');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // SQL table copy alert code variable helper
  const [sqlCopySuccess, setSqlCopySuccess] = useState(false);

  // Check auth and fetch events on mount
  useEffect(() => {
    checkAdmin();
    fetchEvents();
  }, []);

  const checkAdmin = async () => {
    if (config.isMock) {
      const storedUser = localStorage.getItem('futbol_app_mock_user');
      setIsAdmin(!!storedUser);
    } else if (supabase) {
      const { data } = await supabase.auth.getSession();
      setIsAdmin(!!data.session?.user);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    setDbError(null);

    if (config.isMock || !supabase) {
      // Local load
      loadLocalEvents();
    } else {
      try {
        const { data, error } = await supabase
          .from('calendario_deportivo')
          .select('*')
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true });

        if (error) {
          // Check if table missing
          if (error.code === '42P01') {
            throw new Error('missing_table');
          }
          throw error;
        }

        setEvents(data || []);
      } catch (err: any) {
        console.error('Error fetching calendar events:', err);
        if (err.message === 'missing_table') {
          setDbError('La tabla de Calendario Deportivo aún no existe en Supabase. Se cargará el respaldo dinámico local para garantizar el funcionamiento.');
        } else {
          setDbError('Error al contactar con Supabase o tabla de calendario. Se requiere inicialización.');
        }
        loadLocalEvents();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadLocalEvents = () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_CALENDAR_KEY);
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch {
        const seed = SEED_CALENDAR_EVENTS();
        setEvents(seed);
        localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(seed));
      }
    } else {
      const seed = SEED_CALENDAR_EVENTS();
      setEvents(seed);
      localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(seed));
    }
    setIsLoading(false);
  };

  // Create event action
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime) return;

    setIsSubmitLoading(true);

    const eventPayload: Omit<CalendarioEvento, 'id' | 'created_at'> = {
      titulo: newTitle.trim(),
      tipo_evento: newType,
      fecha: newDate,
      hora: newTime,
      indice_carga: newLoad,
      notas: newNotes.trim()
    };

    if (config.isMock || !supabase || dbError) {
      // Offline / LocalStorage save
      const mockEvent: CalendarioEvento = {
        ...eventPayload,
        id: `mock-evt-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      const updated = [...events, mockEvent].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
      setEvents(updated);
      localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(updated));
      resetForm();
    } else {
      try {
        const { data, error } = await supabase
          .from('calendario_deportivo')
          .insert([eventPayload])
          .select();

        if (error) throw error;
        if (data && data[0]) {
          const updated = [...events, data[0]].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
          setEvents(updated);
        } else {
          fetchEvents();
        }
        resetForm();
      } catch (err: any) {
        console.error('Error insert calendar entry:', err);
        // Fallback local insertion to not break workflow
        const mockEvent: CalendarioEvento = {
          ...eventPayload,
          id: `mock-evt-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        const updated = [...events, mockEvent].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
        setEvents(updated);
        localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(updated));
        resetForm();
      }
    }
    setIsSubmitLoading(false);
  };

  // Delete event action
  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este evento del calendario?')) return;

    if (config.isMock || !supabase || dbError) {
      const updated = events.filter(ev => ev.id !== id);
      setEvents(updated);
      localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase
          .from('calendario_deportivo')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setEvents(events.filter(ev => ev.id !== id));
      } catch (err: any) {
        console.error('Error deleting calendar event:', err);
        const updated = events.filter(ev => ev.id !== id);
        setEvents(updated);
        localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(updated));
      }
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewType('entrenamiento');
    setNewLoad('Media');
    setNewNotes('');
    setShowAddForm(false);
  };

  // Helper styles for loads representation
  const getLoadBadgeColors = (load: IndiceCarga) => {
    switch (load) {
      case 'Alta':
        return 'bg-red-950/50 text-red-400 border border-red-900/40';
      case 'Media':
        return 'bg-amber-950/50 text-amber-400 border border-amber-900/40';
      case 'Baja':
        return 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40';
      case 'Charla':
        return 'bg-blue-950/50 text-blue-400 border border-blue-900/40';
      case 'Preventivo':
        return 'bg-teal-950/50 text-teal-400 border border-teal-900/40';
      case 'Recuperación':
        return 'bg-purple-950/50 text-purple-400 border border-purple-900/40';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  const getLoadBulletColor = (load: IndiceCarga) => {
    switch (load) {
      case 'Alta': return 'bg-red-500';
      case 'Media': return 'bg-amber-500';
      case 'Baja': return 'bg-emerald-500';
      case 'Charla': return 'bg-blue-500';
      case 'Preventivo': return 'bg-teal-500';
      case 'Recuperación': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getLoadLabelName = (load: IndiceCarga) => {
    switch (load) {
      case 'Alta': return '🔥 Carga Alta';
      case 'Media': return '⚡ Carga Media';
      case 'Baja': return '🔋 Carga Baja';
      case 'Charla': return '🗣️ Charla / Táctica';
      case 'Preventivo': return '🛡️ Preventivo';
      case 'Recuperación': return '🛁 Recuperación';
      default: return load;
    }
  };

  // Calendar Math Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    // Return standard ISO format starting with Monday instead of Sunday
    // Sunday in JS returns 0, let's remap it
    const jsDay = new Date(y, m, 1).getDay();
    return jsDay === 0 ? 6 : jsDay - 1; 
  };

  const numDays = getDaysInMonth(year, month);
  const firstDayCell = getFirstDayOfMonth(year, month);

  // Build grid calendar values representing weeks
  const calendarCells: (Date | null)[] = [];
  for (let i = 0; i < firstDayCell; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= numDays; d++) {
    calendarCells.push(new Date(year, month, d));
  }

  // Pre-calculate cells list grouped to block of 7 so weeks render beautifully
  const rowsCount = Math.ceil(calendarCells.length / 7);
  const remappedCellsGrid: (Date | null)[][] = [];
  for (let r = 0; r < rowsCount; r++) {
    remappedCellsGrid.push(calendarCells.slice(r * 7, (r + 1) * 7));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthsSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Map checking for active events on a specific date YYYY-MM-DD
  const getEventsForDate = (dateString: string) => {
    return events.filter(ev => ev.fecha === dateString);
  };

  // Sort and filter events listed underneath or aside
  const filteredEventsList = events.filter(ev => {
    const matchesType = filterType === 'todo' || ev.tipo_evento === filterType;
    const matchesLoad = filterLoad === 'todo' || ev.indice_carga === filterLoad;
    return matchesType && matchesLoad;
  });

  // Calculate stats cards values based on filtered month
  const currentMonthEvents = events.filter(ev => {
    if (!ev.fecha) return false;
    const evDate = new Date(ev.fecha);
    return evDate.getFullYear() === year && evDate.getMonth() === month;
  });

  const totalTrainings = currentMonthEvents.filter(ev => ev.tipo_evento === 'entrenamiento').length;
  const totalMatches = currentMonthEvents.filter(ev => ev.tipo_evento === 'partido').length;
  
  // Count heavy load events
  const heavyActivities = currentMonthEvents.filter(ev => ev.indice_carga === 'Alta').length;

  const sqlCodeForSupabase = `
-- TABLA DE CALENDARIO DEPORTIVO CON ÍNDICES DE CARGA
CREATE TABLE IF NOT EXISTS calendario_deportivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(250) NOT NULL,
  tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('entrenamiento', 'partido')),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  indice_carga VARCHAR(100) NOT NULL CHECK (indice_carga IN ('Alta', 'Media', 'Baja', 'Charla', 'Preventivo', 'Recuperación')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS
ALTER TABLE calendario_deportivo ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS
CREATE POLICY "Permitir lectura publica de calendario" ON calendario_deportivo
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura completa de calendario a autenticados" ON calendario_deportivo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  `.trim();

  return (
    <div className="space-y-6">
      
      {/* TITLE FRAME CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/30 text-emerald-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider font-display">Planificación & Agenda</h1>
            <p className="text-xs text-slate-400 mt-0.5">Calendario de entrenamientos y partidos con índice de carga neuromuscular y fisiológica.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setNewDate(selectedDayString);
                setShowAddForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/30 font-mono"
            >
              <Plus className="h-4 w-4" />
              PLANIFICAR EVENTO
            </button>
          )}
        </div>
      </div>

      {dbError && (
        <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-300 flex flex-col gap-2 leading-relaxed">
          <div className="flex gap-2 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5 text-amber-200">Base de datos fuera de sincronismo:</strong>
              {dbError}
            </div>
          </div>
          
          <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-850 mt-1 space-y-3">
            <p className="text-[10px] text-slate-400 font-mono">
              Para tener los datos totalmente guardados en tu panel de Supabase SQL, ve a la sección o editor SQL ("Query Editor") de Supabase y ejecuta este código:
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400 font-mono max-h-36 overflow-y-auto select-all">
                {sqlCodeForSupabase}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sqlCodeForSupabase);
                  setSqlCopySuccess(true);
                  setTimeout(() => setSqlCopySuccess(false), 2000);
                }}
                className="absolute right-2 top-2 bg-slate-950 px-2 py-1 border border-slate-800 rounded font-mono text-[9px] text-slate-350 hover:text-white"
              >
                {sqlCopySuccess ? '¡COPIADO!' : 'COPIAR SQL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS HIGHLIGHTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">ACTIVIDADES DEL MES</span>
            <span className="text-xl font-mono font-black text-white mt-1 block">
              {currentMonthEvents.length} <span className="text-xs text-slate-500 font-normal">eventos</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-blue-400">
            <CalendarRange className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">SESIONES DE ENTRENAMIENTO</span>
            <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">
              {totalTrainings} <span className="text-xs text-slate-500 font-normal">entrenos</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">ALTO COEFICIENTE DE IMPACTO</span>
            <span className="text-xl font-mono font-black text-red-400 mt-1 block">
              {heavyActivities} <span className="text-xs text-slate-500 font-normal">sesiones de carga alta</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-red-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* WORK SPACE CALENDAR PANEL AND AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MONTH GRID CALCULATOR (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl space-y-0">
          
          {/* Calendar Controller Header */}
          <div className="p-4 bg-slate-900/60 border-b border-slate-850/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white uppercase tracking-wider font-display">
                {monthsSpanish[month]} {year}
              </span>
              <span className="text-[10px] font-mono font-black bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 uppercase">
                VISTA GENERAL
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1.5 text-[9px] bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                HOY
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout Container */}
          <div className="p-4">
            
            {/* Days letters of week */}
            <div className="grid grid-cols-7 text-center font-mono text-[9px] font-black uppercase text-slate-500 tracking-wider pb-2.5 border-b border-slate-850/50">
              <span>LUN</span>
              <span>MAR</span>
              <span>MIÉ</span>
              <span>JUE</span>
              <span>VIE</span>
              <span>SÁB</span>
              <span>DOM</span>
            </div>

            {/* Main Calendar Months day numbers loop */}
            <div className="grid grid-cols-7 divide-y divide-x divide-slate-850/40 border border-slate-850/40 rounded-xl overflow-hidden mt-2 bg-slate-900/10">
              
              {remappedCellsGrid.map((week, weekIdx) => (
                <React.Fragment key={weekIdx}>
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return (
                        <div 
                          key={`empty-${weekIdx}-${dayIdx}`} 
                          className="h-24 bg-slate-950/40 border-slate-850/40"
                        />
                      );
                    }

                    const dateStr = day.toISOString().split('T')[0];
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isSelected = selectedDayString === dateStr;
                    const dayEvents = getEventsForDate(dateStr);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDayString(dateStr)}
                        className={`h-24 p-2 flex flex-col justify-between cursor-pointer transition-all border-slate-850/40 relative ${
                          isToday ? 'bg-blue-955/20' : ''
                        } ${
                          isSelected ? 'bg-slate-900 border-2 border-emerald-500/50 rounded-lg shadow-inner' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Day Number and status dots */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-mono font-bold ${
                            isToday 
                              ? 'inline-flex h-5 w-5 rounded-full bg-blue-600 text-white items-center justify-center font-black shadow-sm' 
                              : isSelected
                              ? 'text-emerald-400 font-extrabold'
                              : 'text-slate-400'
                          }`}>
                            {day.getDate()}
                          </span>

                          {/* Quick dot representation */}
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5">
                              {dayEvents.slice(0, 3).map((ev, idx) => (
                                <span
                                  key={idx}
                                  className={`h-1.5 w-1.5 rounded-full ${getLoadBulletColor(ev.indice_carga)}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Event summaries list (Up to 1 line, mini layout) */}
                        <div className="space-y-1 overflow-hidden mt-1 select-none">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className={`px-1 py-0.5 rounded text-[8px] font-semibold leading-tight truncate ${
                                ev.tipo_evento === 'partido' 
                                  ? 'bg-rose-950/40 text-rose-300 border border-rose-900/30' 
                                  : 'bg-slate-850 text-slate-300 border border-slate-800'
                              }`}
                              title={`${ev.titulo} (${getLoadLabelName(ev.indice_carga)})`}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${getLoadBulletColor(ev.indice_carga)}`} />
                              {ev.titulo}
                            </div>
                          ))}
                          
                          {dayEvents.length > 2 && (
                            <span className="text-[7.5px] font-mono text-slate-500 pl-1 block">
                              +{dayEvents.length - 2} eventos más
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

            </div>

          </div>

          <div className="p-4 bg-slate-900/20 border-t border-slate-850/80 flex flex-wrap gap-x-5 gap-y-2.5 items-center justify-center text-[10px] font-mono font-semibold text-slate-400 uppercase select-none">
            <span className="text-slate-500 font-bold">Leyenda de carga neuromuscular:</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Alta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Media
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Baja
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500" /> Preventivo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Charla Táctica
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Recuperación
            </span>
          </div>

        </div>

        {/* SIDEBAR AGENDA EVENTS & FORMS (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* FILTER CONTROLLERS */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl shadow-xl space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850/80">
              <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider font-display">Filtros de Agenda</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block mb-1">Tipo de actividad</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full text-xs bg-slate-900 border border-slate-850 text-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  aria-label="Filter events by type"
                >
                  <option value="todo">Todos los tipos</option>
                  <option value="entrenamiento">Sesiones de Entrenamiento</option>
                  <option value="partido">Partidos Oficiales / Amistosos</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block mb-1">Criterio de Carga</label>
                <select
                  value={filterLoad}
                  onChange={(e) => setFilterLoad(e.target.value as any)}
                  className="w-full text-xs bg-slate-900 border border-slate-850 text-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  aria-label="Filter events by load index"
                >
                  <option value="todo">Cualquier nivel de carga</option>
                  <option value="Alta">Alta intensidad</option>
                  <option value="Media">Media intensidad</option>
                  <option value="Baja">Baja / Descompresión</option>
                  <option value="Charla">Charla teórica</option>
                  <option value="Preventivo">Preventivo de lesiones</option>
                  <option value="Recuperación">Sesión regenerativa</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE DAY HIGHLIGHTS & EVENT LISTING */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between gap-1 border-b border-slate-850 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 font-mono font-black uppercase tracking-widest block">ACTIVIDADES PREVISTAS</span>
                <span className="text-xs text-white font-bold block">{new Date(selectedDayString).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
              </div>
              <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/30">
                {getEventsForDate(selectedDayString).length} planificados
              </span>
            </div>

            {/* Selected day events stream */}
            <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
              {getEventsForDate(selectedDayString).length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <BookOpen className="h-6 w-6 text-slate-700 mb-1.5" />
                  <p className="text-[11px] text-slate-400 font-bold uppercase font-mono">Día Libre</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mt-0.5 leading-normal">No hay entrenamientos ni partidos registrados para este día.</p>
                </div>
              ) : (
                getEventsForDate(selectedDayString).map((ev) => (
                  <div 
                    key={ev.id}
                    className="p-3 bg-slate-900 border border-slate-850 rounded-xl relative overflow-hidden group hover:border-slate-750 transition-all space-y-2"
                  >
                    {/* Lateral decorative load indicator stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getLoadBulletColor(ev.indice_carga)}`} />
                    
                    <div className="pl-1.5">
                      <div className="flex justify-between items-start gap-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black uppercase ${
                          ev.tipo_evento === 'partido' ? 'bg-rose-950/50 text-rose-300' : 'bg-slate-950 text-slate-350'
                        }`}>
                          {ev.tipo_evento}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase ${getLoadBadgeColors(ev.indice_carga)}`}>
                          {getLoadLabelName(ev.indice_carga)}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-white uppercase tracking-wide mt-2 leading-tight pr-5">
                        {ev.titulo}
                      </h4>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-mono">
                        <Clock className="h-3 w-3 text-emerald-400" />
                        <span>{ev.hora} hs</span>
                      </div>

                      {ev.notas && (
                        <p className="text-[11px] text-slate-400 leading-normal font-sans italic pt-2 mt-2 border-t border-slate-850/60 whitespace-pre-wrap">
                          "{ev.notas}"
                        </p>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEvent(ev.id, e)}
                          className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-rose-450 hover:bg-rose-950 hover:text-rose-300 transition-all cursor-pointer"
                          title="Eliminar evento de la agenda"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Entire agenda stream button */}
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2.5">
              <span className="text-[9px] text-slate-505 font-mono font-bold uppercase tracking-widest block">VISTA COMPLETA FILTRADA ({filteredEventsList.length})</span>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredEventsList.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic py-2">Ningún evento cumple con los filtros activos.</p>
                ) : (
                  filteredEventsList.map((ev) => (
                    <div 
                      key={ev.id}
                      onClick={() => {
                        setSelectedDayString(ev.fecha);
                        const parts = ev.fecha.split('-');
                        setCurrentDate(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
                      }}
                      className="p-2 bg-slate-950 border border-slate-880 rounded-lg hover:border-slate-700 transition-all cursor-pointer flex justify-between items-center text-[11px]"
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="font-bold text-slate-300 block truncate uppercase leading-tight">{ev.titulo}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(ev.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {ev.hora} hs
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase text-center shrink-0 ${getLoadBadgeColors(ev.indice_carga)}`}>
                        {ev.indice_carga}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* CREATE EVENT FULL DIAGRAM OVERLAY FORM POPUP */}
      {showAddForm && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8">
            
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-black text-slate-355 uppercase tracking-wider font-mono">
                  Planificar Nueva Sesión / Partido
                </span>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block">Título / Nombre de la Actividad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sesión regenerativa rondo y crioterapia"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block">Tipo de Evento</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-300"
                  >
                    <option value="entrenamiento">Sesión Entrenar</option>
                    <option value="partido">Partido de Competición</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block">Índice de Carga</label>
                  <select
                    value={newLoad}
                    onChange={(e) => setNewLoad(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-300"
                  >
                    <option value="Alta">Alta (Carga neuromuscular)</option>
                    <option value="Media">Media (Transiciones lógicas)</option>
                    <option value="Baja">Baja (Activación relajada)</option>
                    <option value="Charla">Charla (Vídeo y pizarra táctica)</option>
                    <option value="Preventivo">Preventivo (Evitar lesiones)</option>
                    <option value="Recuperación">Recuperación (Regenerativo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block">Hora Prevista</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-wider block">Notas Adicionales (Objetivos / Convocatoria)</label>
                <textarea
                  placeholder="Objetivos de la sesión, pautas de nutrición o vestimenta técnica preferente..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-200 placeholder-slate-600 font-sans resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 text-xs uppercase font-bold tracking-wider font-mono">
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-555 text-white rounded-xl py-3 border border-emerald-600 hover:shadow-lg transition-colors cursor-pointer select-none text-center"
                >
                  {isSubmitLoading ? 'GUARDANDO...' : 'PLANIFICAR EVENTO'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl py-3 transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
