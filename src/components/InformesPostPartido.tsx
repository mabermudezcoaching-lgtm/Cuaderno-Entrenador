import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseConfigState, getLocalPlayers } from '../lib/supabase';
import { Jugador, InformePostPartido, JugadorRendimiento, ResumenTemporadaJugador } from '../types';
import { exportPostMatchReportToPdf } from '../lib/pdfExport';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  FileDown, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  X, 
  Star, 
  User, 
  Award, 
  Settings,
  Activity,
  PlusCircle,
  Sparkles,
  Trophy,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  Flame,
  UserCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';

const LOCAL_STORAGE_REPORTS_KEY = 'futbol_app_informes_partido';
const LOCAL_STORAGE_RESUMEN_KEY = 'futbol_app_resumen_db';

const MOCK_REPORTS_SEED = (): InformePostPartido[] => [
  {
    id: 'mock-rep-1',
    equipo_local: 'U.D. Somozas',
    equipo_visitante: 'Nuestra Plantilla F.C.',
    campo: 'Estadio Manuel Candocia',
    fecha: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    hora: '17:00',
    resumen: 'Excelente partido de preparación táctica. El equipo mostró transiciones muy verticales. La defensa estuvo sólida replegando en bloque medio y el mediocampo retuvo con paciencia y ritmo.',
    valoracion_global: 4,
    rendimientos: [
      { jugador_id: '1', nombre_completo: 'Carlos Delgado', posicion: 'Portero', minutos: 90, tarjetas: 'Ninguna', goles: 0, asistencias: 0, valoracion: 7.5 },
      { jugador_id: '2', nombre_completo: 'Hugo Sanmartín', posicion: 'Defensa', minutos: 90, tarjetas: 'Amarilla', goles: 0, asistencias: 0, valoracion: 6.8 },
      { jugador_id: '3', nombre_completo: 'Marcos Álvarez', posicion: 'Centrocampista', minutos: 70, tarjetas: 'Ninguna', goles: 1, asistencias: 1, valoracion: 8.5 },
      { jugador_id: '4', nombre_completo: 'Diego Vela', posicion: 'Delantero', minutos: 80, tarjetas: 'Ninguna', goles: 1, asistencias: 0, valoracion: 8.0 }
    ],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mock-rep-2',
    equipo_local: 'Nuestra Plantilla F.C.',
    equipo_visitante: 'Pontevedra C.F. B',
    campo: 'Campo de Fútbol O Couto',
    fecha: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    hora: '11:30',
    resumen: 'Sufrida victoria liguera en el derbi regional. Destacó el acoso tras pérdida en banda izquierda y el rendimiento sublime del portero atajando dos disparos de gol claros.',
    valoracion_global: 5,
    rendimientos: [
      { jugador_id: '1', nombre_completo: 'Carlos Delgado', posicion: 'Portero', minutos: 90, tarjetas: 'Ninguna', goles: 0, asistencias: 0, valoracion: 9.2 },
      { jugador_id: '2', nombre_completo: 'Hugo Sanmartín', posicion: 'Defensa', minutos: 90, tarjetas: 'Ninguna', goles: 0, asistencias: 0, valoracion: 7.0 },
      { jugador_id: '3', nombre_completo: 'Marcos Álvarez', posicion: 'Centrocampista', minutos: 90, tarjetas: 'Amarilla', goles: 1, asistencias: 0, valoracion: 7.8 },
      { jugador_id: '4', nombre_completo: 'Diego Vela', posicion: 'Delantero', minutos: 65, tarjetas: 'Ninguna', goles: 0, asistencias: 2, valoracion: 8.2 }
    ],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

export default function InformesPostPartido() {
  const config = getSupabaseConfigState();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'historico' | 'temporada'>('historico');

  // Main lists states
  const [reports, setReports] = useState<InformePostPartido[]>([]);
  const [squadPlayers, setSquadPlayers] = useState<Jugador[]>([]);
  const [seasonSummaries, setSeasonSummaries] = useState<ResumenTemporadaJugador[]>([]);
  
  // System states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [search, setSearch] = useState('');
  const [searchResumen, setSearchResumen] = useState('');

  // Dump summaries synchronization states
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; type: 'supabase' | 'local'; message: string } | null>(null);

  // Sorting columns state for season resume table
  const [sortBy, setSortBy] = useState<'partidos' | 'minutos' | 'goles' | 'asistencias' | 'valoracion'>('valoracion');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Form states to create match report
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [localTeam, setLocalTeam] = useState('Nuestra Plantilla F.C.');
  const [visitorTeam, setVisitorTeam] = useState('');
  const [pitch, setPitch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [summary, setSummary] = useState('');
  const [globalRating, setGlobalRating] = useState(4);
  const [playerStats, setPlayerStats] = useState<Record<string, Omit<JugadorRendimiento, 'jugador_id' | 'nombre_completo'>>>({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Active viewing report
  const [viewingReport, setViewingReport] = useState<InformePostPartido | null>(null);

  // Fetch reports & players on bootup
  useEffect(() => {
    fetchData();
  }, []);

  // Compute season summary dynamically whenever reports change
  useEffect(() => {
    if (reports.length > 0 && squadPlayers.length > 0) {
      const calculated = computeSeasonTotals(reports, squadPlayers);
      setSeasonSummaries(calculated);
    } else {
      setSeasonSummaries([]);
    }
  }, [reports, squadPlayers]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    // 1. Fetch Squad Players for stats association
    let playersList: Jugador[] = [];
    if (config.isMock || !supabase) {
      playersList = getLocalPlayers();
      setSquadPlayers(playersList);
    } else {
      try {
        const { data: dbPlayers, error: dbPlayersErr } = await supabase
          .from('jugadores')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (!dbPlayersErr && dbPlayers) {
          playersList = dbPlayers;
          setSquadPlayers(dbPlayers);
        } else {
          playersList = getLocalPlayers();
          setSquadPlayers(playersList);
        }
      } catch (e) {
        playersList = getLocalPlayers();
        setSquadPlayers(playersList);
      }
    }

    // Initialize player stats form template based on current squad
    const initialStats: Record<string, Omit<JugadorRendimiento, 'jugador_id' | 'nombre_completo'>> = {};
    playersList.forEach(p => {
      initialStats[p.id] = {
        posicion: p.demarcacion,
        minutos: 90,
        tarjetas: 'Ninguna',
        goles: 0,
        asistencias: 0,
        valoracion: 6.0 // Default player performance rating
      };
    });
    setPlayerStats(initialStats);

    // 2. Fetch Reports
    let reportsList: InformePostPartido[] = [];
    if (config.isMock || !supabase) {
      const stored = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      if (stored) {
        try {
          reportsList = JSON.parse(stored);
        } catch {
          reportsList = MOCK_REPORTS_SEED();
          localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reportsList));
        }
      } else {
        reportsList = MOCK_REPORTS_SEED();
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reportsList));
      }
      setReports(reportsList);
      setIsLoading(false);
    } else {
      try {
        const { data, error: fetchErr } = await supabase
          .from('informes_post_partido')
          .select('*')
          .order('fecha', { ascending: false });

        if (fetchErr) throw fetchErr;
        reportsList = data || [];
        setReports(reportsList);
        
        // Fetch existing dumped summaries from database just in case
        const { data: dbSummaries } = await supabase
          .from('resumen_temporada_jugadores')
          .select('*');
        
        if (dbSummaries && dbSummaries.length > 0) {
          // If summaries exist in DB, we can load them or let them recalulate.
          // In soccer systems, dynamic recalculation from matches is safer, 
          // and we trigger the user write step on "dump" button.
        }

      } catch (err: any) {
        console.error('Error fetching reports from Supabase:', err);
        setError('No se pudo conectar del todo con la tabla de informes de partido o tabla resumen en Supabase. Se utilizará el sistema local persistente.');
        // Fallback local storage
        const stored = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
        reportsList = stored ? JSON.parse(stored) : MOCK_REPORTS_SEED();
        setReports(reportsList);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Aggregator logic: compiles all players' stats dynamically
  const computeSeasonTotals = (reportsList: InformePostPartido[], players: Jugador[]): ResumenTemporadaJugador[] => {
    return players.map(player => {
      // Find all performances inside reports for this player
      const matchesWithPlayer = reportsList.filter(r => 
        (r.rendimientos || []).some(rend => rend.jugador_id === player.id)
      );

      const playingStats = matchesWithPlayer.map(r => 
        r.rendimientos.find(rend => rend.jugador_id === player.id)!
      );

      // Games played counts if the player entered the pitch (minutes > 0)
      const gamesPlayed = playingStats.filter(st => (st.minutos || 0) > 0).length;
      
      const totalMinutes = playingStats.reduce((acc, st) => acc + (Number(st.minutos) || 0), 0);
      const totalGoals = playingStats.reduce((acc, st) => acc + (Number(st.goles) || 0), 0);
      const totalAssists = playingStats.reduce((acc, st) => acc + (Number(st.asistencias) || 0), 0);
      
      const yellowCards = playingStats.filter(st => st.tarjetas === 'Amarilla' || st.tarjetas === 'Doble Amarilla').length;
      const redCards = playingStats.filter(st => st.tarjetas === 'Roja' || st.tarjetas === 'Doble Amarilla').length;
      
      // Compute Average Valuation Grade. Default to 6.0 if no matches are recorded, else calculate means
      const totalRatingNum = playingStats.reduce((acc, st) => acc + (Number(st.valoracion) !== undefined ? Number(st.valoracion) : 6.0), 0);
      const avgValuation = playingStats.length > 0 ? (totalRatingNum / playingStats.length) : 0.0;

      return {
        jugador_id: player.id,
        nombre_completo: `${player.nombre} ${player.apellidos}`,
        partidos_jugados: gamesPlayed,
        minutos_totales: totalMinutes,
        asistencias_totales: totalAssists,
        goles_totales: totalGoals,
        tarjetas_amarillas: yellowCards,
        tarjetas_rojas: redCards,
        valoracion_media: Number(avgValuation.toFixed(2))
      };
    });
  };

  const handleStatChange = (playerId: string, field: string, value: any) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localTeam.trim() || !visitorTeam.trim() || !pitch.trim()) return;

    setIsSubmitLoading(true);

    const rendimientos: JugadorRendimiento[] = squadPlayers.map(p => {
      const stats = playerStats[p.id] || { posicion: p.demarcacion, minutos: 90, tarjetas: 'Ninguna', goles: 0, asistencias: 0, valoracion: 6.0 };
      return {
        jugador_id: p.id,
        nombre_completo: `${p.nombre} ${p.apellidos}`,
        posicion: stats.posicion,
        minutos: Number(stats.minutos) || 0,
        tarjetas: stats.tarjetas,
        goles: Number(stats.goles) || 0,
        asistencias: Number(stats.asistencias) || 0,
        valoracion: Number(stats.valoracion) !== undefined ? Number(stats.valoracion) : 6.0
      };
    });

    const item: Omit<InformePostPartido, 'id' | 'created_at'> = {
      equipo_local: localTeam.trim(),
      equipo_visitante: visitorTeam.trim(),
      campo: pitch.trim(),
      fecha: date,
      hora: time,
      resumen: summary.trim(),
      valoracion_global: globalRating,
      rendimientos
    };

    if (config.isMock || !supabase) {
      const mockNewItem: InformePostPartido = {
        ...item,
        id: `mock-rep-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      const updatedList = [mockNewItem, ...reports];
      setReports(updatedList);
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updatedList));
      resetForm();
    } else {
      try {
        const { data, error: addErr } = await supabase
          .from('informes_post_partido')
          .insert([item])
          .select();

        if (addErr) throw addErr;
        if (data && data[0]) {
          setReports([data[0], ...reports]);
        } else {
          fetchData();
        }
        resetForm();
      } catch (err: any) {
        console.error('Error insert report to Supabase:', err);
        // Fallback local
        const mockNewItem: InformePostPartido = {
          ...item,
          id: `mock-rep-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        const updatedList = [mockNewItem, ...reports];
        setReports(updatedList);
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updatedList));
        resetForm();
      }
    }
    setIsSubmitLoading(false);
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este informe de partido?')) return;

    if (config.isMock || !supabase) {
      const updatedList = reports.filter(r => r.id !== id);
      setReports(updatedList);
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updatedList));
      if (viewingReport?.id === id) setViewingReport(null);
    } else {
      try {
        const { error: delErr } = await supabase
          .from('informes_post_partido')
          .delete()
          .eq('id', id);

        if (delErr) throw delErr;
        setReports(reports.filter(r => r.id !== id));
        if (viewingReport?.id === id) setViewingReport(null);
      } catch (err: any) {
        console.error('Error deleting report from Supabase:', err);
        const updatedList = reports.filter(r => r.id !== id);
        setReports(updatedList);
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updatedList));
        if (viewingReport?.id === id) setViewingReport(null);
      }
    }
  };

  // Perform SQL write operation called "Volcar Datos" (Dump stats to table on demand)
  const handleDumpSeasonStats = async () => {
    if (seasonSummaries.length === 0) {
      alert('No hay rendimientos agregados calculados para volcar aún.');
      return;
    }

    setSyncLoading(true);
    setSyncStatus(null);

    // Prepare rows for the database table
    const dbRows = seasonSummaries.map(s => ({
      jugador_id: s.jugador_id,
      nombre_completo: s.nombre_completo,
      partidos_jugados: s.partidos_jugados,
      minutos_totales: s.minutos_totales,
      asistencias_totales: s.asistencias_totales,
      goles_totales: s.goles_totales,
      tarjetas_amarillas: s.tarjetas_amarillas,
      tarjetas_rojas: s.tarjetas_rojas,
      valoracion_media: s.valoracion_media,
      updated_at: new Date().toISOString()
    }));

    if (config.isMock || !supabase) {
      // Mock / Offline Dump simulation
      setTimeout(() => {
        localStorage.setItem(LOCAL_STORAGE_RESUMEN_KEY, JSON.stringify(dbRows));
        setSyncStatus({
          success: true,
          type: 'local',
          message: '¡Sincronización Exitosa (Local)! Los datos de la temporada se han volcado en la memoria persistente de la App local (localStorage).'
        });
        setSyncLoading(false);
      }, 700);
    } else {
      try {
        // Drop and reinsert or upsert matching rows inside Postgres SQL
        const { error: upsertErr } = await supabase
          .from('resumen_temporada_jugadores')
          .upsert(dbRows, { onConflict: 'jugador_id' });

        if (upsertErr) throw upsertErr;

        setSyncStatus({
          success: true,
          type: 'supabase',
          message: '¡Volcado Completado con Éxito! Se han recalculado las medias y guardado directamente en la tabla "resumen_temporada_jugadores" de Supabase.'
        });
      } catch (err: any) {
        console.error('Error on dynamic db dump sync:', err);
        // Fallback local persistence copy
        localStorage.setItem(LOCAL_STORAGE_RESUMEN_KEY, JSON.stringify(dbRows));
        setSyncStatus({
          success: false,
          type: 'local',
          message: `No se pudo escribir en la tabla 'resumen_temporada_jugadores' de Supabase (¿Elegiste clonar la tabla?). Los datos se guardaron localmente. Detalle: ${err.message}`
        });
      } finally {
        setSyncLoading(false);
      }
    }
  };

  const resetForm = () => {
    setLocalTeam('Nuestra Plantilla F.C.');
    setVisitorTeam('');
    setPitch('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('18:00');
    setSummary('');
    setGlobalRating(4);

    const initialStats: Record<string, Omit<JugadorRendimiento, 'jugador_id' | 'nombre_completo'>> = {};
    squadPlayers.forEach(p => {
      initialStats[p.id] = {
        posicion: p.demarcacion,
        minutos: 90,
        tarjetas: 'Ninguna',
        goles: 0,
        asistencias: 0,
        valoracion: 6.0
      };
    });
    setPlayerStats(initialStats);
    setIsFormOpen(false);
  };

  const handleDownloadPdf = (report: InformePostPartido, e: React.MouseEvent) => {
    e.stopPropagation();
    exportPostMatchReportToPdf(report);
  };

  // Sort and filter utilities for matching views
  const filteredReports = reports.filter(r => {
    const searchString = `${r.equipo_local} ${r.equipo_visitante} ${r.campo} ${r.resumen}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const getSortedSummaries = () => {
    const orig = [...seasonSummaries].filter(p => 
      p.nombre_completo.toLowerCase().includes(searchResumen.toLowerCase())
    );
    
    return orig.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'partidos':
          valA = a.partidos_jugados;
          valB = b.partidos_jugados;
          break;
        case 'minutos':
          valA = a.minutos_totales;
          valB = b.minutos_totales;
          break;
        case 'goles':
          valA = a.goles_totales;
          valB = b.goles_totales;
          break;
        case 'asistencias':
          valA = a.asistencias_totales;
          valB = b.asistencias_totales;
          break;
        case 'valoracion':
          valA = a.valoracion_media;
          valB = b.valoracion_media;
          break;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  };

  // Bento Leaders calculations safely
  const mvpLeader = [...seasonSummaries].sort((a, b) => b.valoracion_media - a.valoracion_media)[0];
  const scorerLeader = [...seasonSummaries].sort((a, b) => b.goles_totales - a.goles_totales)[0];
  const assistantLeader = [...seasonSummaries].sort((a, b) => b.asistencias_totales - a.asistencias_totales)[0];
  const minutesLeader = [...seasonSummaries].sort((a, b) => b.minutos_totales - a.minutos_totales)[0];

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false); // default high to low
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TITLE BOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-900/30 text-blue-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider font-display">Informes & Rendimiento</h1>
            <p className="text-xs text-slate-400 mt-0.5">Actas de partidos, valoraciones individuales y cuadro de honor resumen de la temporada.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchData();
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4.5 py-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-950/50"
        >
          <Plus className="h-4 w-4" />
          NUEVO INFORME
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-300 flex gap-2.5 items-start">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5 text-rose-200">Nota sobre Supabase:</strong>
            {error}
            <div className="mt-2 text-[10px] text-slate-405 font-mono">
              Los datos se persistirán de manera local para el cálculo automático del resumen.
            </div>
          </div>
        </div>
      )}

      {/* SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-850/80 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer ${
            activeTab === 'historico'
              ? 'border-blue-550 text-white bg-slate-900/40'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <FileText className="h-4 w-4 text-blue-400" />
          Historial de Actas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('temporada')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer ${
            activeTab === 'temporada'
              ? 'border-blue-550 text-white bg-slate-900/40'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          Resumen de la Temporada
        </button>
      </div>

      {/* CONTENT REDIRECT BOX */}
      {activeTab === 'historico' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* SEARCH & STATS COUNTER */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-3.5 py-2 border border-slate-850 rounded-lg">
              Histórico de partidos guardados: <strong className="text-blue-400 font-mono font-black">{filteredReports.length}</strong>
            </span>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-505" />
              <input
                type="text"
                placeholder="Buscar por equipo, campo o notas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-200 placeholder-slate-500"
              />
            </div>
          </div>

          {/* DETAIL DISPLAY VIEW IF ACTIVE */}
          {viewingReport && (
            <div id="report-view-target" className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn space-y-0 text-slate-200">
              
              {/* Header */}
              <div className="p-5 bg-slate-900/80 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block font-bold">FICHA DE DATOS POST-PARTIDO</span>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    {viewingReport.equipo_local} <span className="text-slate-550 font-light">vs</span> {viewingReport.equipo_visitante}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadPdf(viewingReport, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-bold cursor-pointer shadow-md"
                  >
                    <FileDown className="h-4 w-4" />
                    EXPORTAR PDF
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setViewingReport(null)}
                    className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Core Info Blocks */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Info and rating */}
                <div className="md:col-span-1 space-y-4">
                  
                  <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3.5 shadow-inner">
                    <div className="flex items-center gap-2.5 text-xs text-slate-400">
                      <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                      <div>
                        <label className="text-[9px] text-slate-500 font-mono font-bold block uppercase">ESTADIO / INSTALACIÓN</label>
                        <span className="font-bold text-white uppercase text-[11px]">{viewingReport.campo}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-400">
                      <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                      <div>
                        <label className="text-[9px] text-slate-500 font-mono font-bold block uppercase">FECHA DEL ENCUENTRO</label>
                        <span className="font-bold text-white uppercase text-[11px]">{new Date(viewingReport.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-400">
                      <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                      <div>
                        <label className="text-[9px] text-slate-500 font-mono font-bold block uppercase">HORA PREVISTA</label>
                        <span className="font-bold text-white uppercase text-[11px] font-mono">{viewingReport.hora} hs</span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Card */}
                  <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex flex-col items-center text-center gap-2">
                    <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-widest">VALORACIÓN GLOBAL DEL CUERPO TÁCTICO</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= viewingReport.valoracion_global 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 font-mono">Puntuación colectiva asignada: {viewingReport.valoracion_global} / 5 estrellas</span>
                  </div>

                </div>

                {/* Tactical Resumen / Notes */}
                <div className="md:col-span-2 p-5 bg-slate-900 border border-slate-850 rounded-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                      <Award className="h-4 w-4 text-blue-400" />
                      <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest">RESUMEN TÁCTICO DE SEGUIMIENTO</span>
                    </div>
                    <p className="text-xs text-slate-250 leading-relaxed whitespace-pre-wrap font-sans">
                      {viewingReport.resumen || 'Sin anotaciones registradas.'}
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-slate-950/60 rounded-lg border border-slate-850 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Las estadísticas de rendimiento individuales se vinculan inmediatamente para el cálculo dinámico de la temporada.</span>
                  </div>
                </div>

              </div>

              {/* Stats list of squad */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Activity className="h-4.5 w-4.5 text-blue-400" />
                  <span className="text-xs text-white uppercase tracking-wider font-bold">Rendimientos Individuales de la Plantilla ({viewingReport.rendimientos?.length || 0})</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-850">
                        <th className="py-2.5 px-4 font-black">Jugador</th>
                        <th className="py-2.5 px-4 font-black">Posición</th>
                        <th className="py-2.5 px-4 font-black text-center">Minutos</th>
                        <th className="py-2.5 px-4 font-black text-center">Tarjetas</th>
                        <th className="py-2.5 px-4 font-black text-center">Goles</th>
                        <th className="py-2.5 px-4 font-black text-center">Asistencias</th>
                        <th className="py-2.5 px-4 font-black text-center">Valoración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs">
                      {viewingReport.rendimientos?.map((rend, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-[9px] text-slate-400">
                              {idx + 1}
                            </div>
                            {rend.nombre_completo}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">{rend.posicion}</td>
                          <td className="py-2.5 px-4 text-center font-bold font-mono text-slate-200">{rend.minutos}'</td>
                          <td className="py-2.5 px-4 text-center">
                            {rend.tarjetas === 'Ninguna' ? (
                              <span className="text-slate-550 text-[10px]">-</span>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                                rend.tarjetas === 'Roja' 
                                  ? 'bg-rose-950/50 text-rose-300 border border-rose-900/40' 
                                  : rend.tarjetas === 'Doble Amarilla'
                                  ? 'bg-amber-950/50 text-amber-300 border border-amber-900/40'
                                  : 'bg-yellow-950/50 text-yellow-300 border border-yellow-900/40'
                              }`}>
                                {rend.tarjetas}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-black">
                            {rend.goles > 0 ? (
                              <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30">⚽ {rend.goles} goles</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-black">
                            {rend.asistencias > 0 ? (
                              <span className="text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/30">👟 {rend.asistencias} asis</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono">
                            <span className={`px-2 py-1 rounded-md font-bold text-xs ${
                              (rend.valoracion || 6.0) >= 8.0 
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                                : (rend.valoracion || 6.0) >= 6.0
                                ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                                : 'bg-rose-950/40 text-rose-455 border border-rose-900/30'
                            }`}>
                              {(rend.valoracion || 6.0).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* HISTORIC REPORTS CARDS LIST */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-blue-500 animate-pulse" />
              <p className="text-xs text-slate-500 font-medium font-mono">Cargando histórico de informes deportivos...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-slate-950 border border-slate-850 h-64 flex flex-col items-center justify-center p-6 text-center rounded-2xl shadow-xl">
              <div className="bg-slate-900 p-3.5 rounded-full text-slate-500 mb-3.5 border border-slate-800">
                <FileText className="h-6 w-6 text-slate-550" />
              </div>
              <p className="text-xs text-slate-350 font-bold uppercase tracking-wider">No se han encontrado actas de partidos</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-normal">
                Aún no has registrado ningún informe post-partido. Crea uno nuevo haciendo clic en "Nuevo Informe" para registrar alineación, minutos y valoraciones tácticas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => {
                    setViewingReport(report);
                    setTimeout(() => {
                      const target = document.getElementById('report-view-target');
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 150);
                  }}
                  className={`group bg-slate-950 border rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:border-slate-700 transition-all duration-300 relative flex flex-col justify-between cursor-pointer ${
                    viewingReport?.id === report.id ? 'border-blue-600 ring-2 ring-blue-600/20 bg-slate-900/30' : 'border-slate-850'
                  }`}
                >
                  
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-1 border-b border-slate-850/70 pb-2.5">
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <Clock className="h-3 w-3 ml-1.5" />
                        {report.hora}
                      </span>

                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= report.valoracion_global 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                        {report.equipo_local} <span className="text-slate-500 text-xs font-normal">vs</span> {report.equipo_visitante}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="h-3 w-3 text-slate-505" />
                        <span className="uppercase line-clamp-1">{report.campo}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {report.resumen || 'Sin resumen registrado.'}
                    </p>

                    {/* Meta-badges calculated from rendering cards */}
                    {(() => {
                      const totalGoles = report.rendimientos?.reduce((acc, current) => acc + (current.goles || 0), 0) || 0;
                      const totalAsistencias = report.rendimientos?.reduce((acc, current) => acc + (current.asistencias || 0), 0) || 0;
                      if (totalGoles > 0 || totalAsistencias > 0) {
                        return (
                          <div className="flex gap-2.5 pt-1">
                            {totalGoles > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/30 text-emerald-300 text-[9px] font-mono border border-emerald-900/30 uppercase">
                                <strong>⚽ {totalGoles}</strong> Goles
                              </span>
                            )}
                            {totalAsistencias > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/30 text-blue-300 text-[9px] font-mono border border-blue-900/30 uppercase">
                                <strong>👟 {totalAsistencias}</strong> Asistencias
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                  </div>

                  {/* Action row footer */}
                  <div className="mt-4.5 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-wider group-hover:underline">
                      Ver Ficha del Informe →
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(report, e)}
                        className="p-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-emerald-955/40 hover:text-emerald-300 hover:border-emerald-900/30 transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider"
                        title="Exportar acta a PDF inmediatamente"
                      >
                        <FileDown className="h-3 w-3" />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-455 hover:bg-rose-955/40 hover:text-rose-300 hover:border-rose-900/30 transition-all cursor-pointer"
                        title="Eliminar este acta del histórico"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESUMEN DE LA TEMPORADA TAB - EXCEUTED STATS BOARD */}
      {activeTab === 'temporada' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* SYNC NOTIFICATIONS DISPLAY TOAST */}
          {syncStatus && (
            <div className={`p-4 rounded-xl border flex gap-3 items-start ${
              syncStatus.success 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                : 'bg-rose-950/20 border-rose-900/45 text-rose-300'
            }`}>
              {syncStatus.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed flex-1">
                <span className="block font-black uppercase tracking-wider mb-0.5">
                  {syncStatus.success ? 'Proceso de Sincronización Completado' : 'Advertencia de Almacenamiento'}
                </span>
                <p>{syncStatus.message}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSyncStatus(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* BRAG/BENTO BOARD HONOR BOX: TOP HONORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* MVP average valuation Card */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
              <div className="absolute right-2.5 top-2.5 bg-amber-950/40 border border-amber-900/30 p-2 rounded-xl text-amber-500">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">MVP DE LA TEMPORADA</span>
                <span className="text-xs text-white font-black uppercase tracking-wider block truncate">
                  {mvpLeader && mvpLeader.partidos_jugados > 0 ? mvpLeader.nombre_completo : 'Sin datos'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Media de juego y votos
                </span>
              </div>
              <div className="text-xl font-mono font-black text-amber-500">
                {mvpLeader && mvpLeader.partidos_jugados > 0 ? `${mvpLeader.valoracion_media.toFixed(2)} pts` : '-'}
              </div>
            </div>

            {/* Máximo Goleador Pichichi */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
              <div className="absolute right-2.5 top-2.5 bg-emerald-950/40 border border-emerald-900/30 p-2 rounded-xl text-emerald-400">
                <Flame className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">MÁXIMO GOLEADOR</span>
                <span className="text-xs text-white font-black uppercase tracking-wider block truncate">
                  {scorerLeader && scorerLeader.goles_totales > 0 ? scorerLeader.nombre_completo : 'Sin datos'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Bota de oro del club
                </span>
              </div>
              <div className="text-xl font-mono font-black text-emerald-400">
                {scorerLeader && scorerLeader.goles_totales > 0 ? `${scorerLeader.goles_totales} goles` : '-'}
              </div>
            </div>

            {/* Máximo Asistente */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
              <div className="absolute right-2.5 top-2.5 bg-blue-950/40 border border-blue-900/30 p-2 rounded-xl text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">LÍDER ASISTENCIAS</span>
                <span className="text-xs text-white font-black uppercase tracking-wider block truncate">
                  {assistantLeader && assistantLeader.asistencias_totales > 0 ? assistantLeader.nombre_completo : 'Sin datos'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Visión y pases magistrales
                </span>
              </div>
              <div className="text-xl font-mono font-black text-blue-400">
                {assistantLeader && assistantLeader.asistencias_totales > 0 ? `${assistantLeader.asistencias_totales} asist.` : '-'}
              </div>
            </div>

            {/* Pulmón de la plantilla (Mas Minutos) */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shadow-lg">
              <div className="absolute right-2.5 top-2.5 bg-purple-950/40 border border-purple-900/30 p-2 rounded-xl text-purple-450">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">PULMÓN DEL EQUIPO</span>
                <span className="text-xs text-white font-black uppercase tracking-wider block truncate">
                  {minutesLeader && minutesLeader.minutos_totales > 0 ? minutesLeader.nombre_completo : 'Sin datos'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Minutos totales sobre el césped
                </span>
              </div>
              <div className="text-xl font-mono font-black text-purple-400">
                {minutesLeader && minutesLeader.minutos_totales > 0 ? `${minutesLeader.minutos_totales}'` : '-'}
              </div>
            </div>

          </div>

          {/* DUMP CONTROL ACTION BOARD */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
            <div className="space-y-1">
              <span className="inline-flex px-2 py-0.5 text-[8px] font-bold font-mono text-blue-400 bg-blue-950/40 border border-blue-900/40 rounded-md uppercase">
                Base de Datos y Volcado
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Volcado y Sincronización del Resumen Táctico
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Al hacer clic, se compilarán todas las fichas individuales y se volcarán (dump) en el resumen de base de datos para auditorías de directiva y consulta histórica.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDumpSeasonStats}
              disabled={syncLoading || seasonSummaries.length === 0}
              className="px-5 py-3 cursor-pointer bg-amber-600 hover:bg-amber-500 disabled:opacity-55 text-white text-xs font-mono font-black uppercase tracking-widest rounded-xl shadow-lg transition-all inline-flex items-center justify-center gap-2 shrink-0 border border-amber-500/20"
            >
              <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'VOLCANDO Y CALCULANDO...' : 'VOLCAR DATOS TEMP.'}
            </button>
          </div>

          {/* MAIN STATS LIST TABLE */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Header / Table Filters */}
            <div className="p-5 border-b border-slate-850/80 bg-slate-900/40 flex flex-col sm:flex-row divide-y sm:divide-y-0 divide-slate-850 justify-between items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Tabla de Rendimiento Resumen ({seasonSummaries.length} Jugadores)</span>
              </div>

              <div className="relative w-full sm:w-72 pt-3.5 sm:pt-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre de futbolista..."
                  value={searchResumen}
                  onChange={(e) => setSearchResumen(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-200 placeholder-slate-550"
                />
              </div>
            </div>

            {/* Core Table Layout */}
            {seasonSummaries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                Registra actas en el historial para autocompilar estadísticas del resumen.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-450 text-[10px] font-mono uppercase tracking-wider border-b border-slate-850">
                      <th className="py-3.5 px-5 font-black text-slate-400">Jugador</th>
                      
                      <th 
                        className="py-3.5 px-4 font-black text-center cursor-pointer hover:bg-slate-900 group"
                        onClick={() => handleSort('partidos')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          PJ
                          <ChevronUpDownArrow field="partidos" activeField={sortBy} isAsc={sortAsc} />
                        </div>
                      </th>

                      <th 
                        className="py-3.5 px-4 font-black text-center cursor-pointer hover:bg-slate-900 group"
                        onClick={() => handleSort('minutos')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Min. Totales
                          <ChevronUpDownArrow field="minutos" activeField={sortBy} isAsc={sortAsc} />
                        </div>
                      </th>

                      <th className="py-3.5 px-4 font-black text-center text-slate-550 text-[9px]">Min. Medio / Part</th>

                      <th 
                        className="py-3.5 px-4 font-black text-center cursor-pointer hover:bg-slate-900 group"
                        onClick={() => handleSort('goles')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Goles (⚽)
                          <ChevronUpDownArrow field="goles" activeField={sortBy} isAsc={sortAsc} />
                        </div>
                      </th>

                      <th 
                        className="py-3.5 px-4 font-black text-center cursor-pointer hover:bg-slate-900 group"
                        onClick={() => handleSort('asistencias')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Asist. (👟)
                          <ChevronUpDownArrow field="asistencias" activeField={sortBy} isAsc={sortAsc} />
                        </div>
                      </th>

                      <th className="py-3.5 px-4 font-black text-center text-slate-550 text-[9px]">🟨 Am.</th>
                      <th className="py-3.5 px-4 font-black text-center text-slate-550 text-[9px]">🟥 Ro.</th>

                      <th 
                        className="py-3.5 px-5 font-black text-center cursor-pointer hover:bg-slate-900 group"
                        onClick={() => handleSort('valoracion')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Val. Media
                          <ChevronUpDownArrow field="valoracion" activeField={sortBy} isAsc={sortAsc} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 font-mono text-xs text-slate-300">
                    {getSortedSummaries().map((summary, idx) => {
                      const avgMinPerMatch = summary.partidos_jugados > 0 
                        ? Number((summary.minutos_totales / summary.partidos_jugados).toFixed(0)) 
                        : 0;
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-5 font-bold font-sans text-white flex items-center gap-2.5">
                            <span className="h-5 w-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                              {idx + 1}
                            </span>
                            {summary.nombre_completo}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-200">{summary.partidos_jugados}</td>
                          <td className="py-3.5 px-4 text-center text-slate-350">{summary.minutos_totales}'</td>
                          <td className="py-3.5 px-4 text-center text-slate-500">{avgMinPerMatch}' / part.</td>
                          
                          <td className="py-3.5 px-4 text-center">
                            {summary.goles_totales > 0 ? (
                              <span className="font-bold text-emerald-400 bg-emerald-955/35 px-2 py-0.5 rounded border border-emerald-900/40">⚽ {summary.goles_totales}</span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {summary.asistencias_totales > 0 ? (
                              <span className="font-bold text-blue-400 bg-blue-955/35 px-2 py-0.5 rounded border border-blue-900/40">👟 {summary.asistencias_totales}</span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {summary.tarjetas_amarillas > 0 ? (
                              <span className="text-yellow-350 bg-yellow-950/20 border border-yellow-900/50 px-1.5 py-0.5 rounded text-[10px]">{summary.tarjetas_amarillas}</span>
                            ) : (
                              <span className="text-slate-650">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {summary.tarjetas_rojas > 0 ? (
                              <span className="text-rose-350 bg-rose-950/20 border border-rose-900/50 px-1.5 py-0.5 rounded text-[10px]">{summary.tarjetas_rojas}</span>
                            ) : (
                              <span className="text-slate-655">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2 py-1 rounded-md font-bold text-xs ${
                              summary.valoracion_media >= 8.0 
                                ? 'bg-emerald-955/40 text-emerald-300 border border-emerald-900/40 animate-pulse'
                                : summary.valoracion_media >= 6.5
                                ? 'bg-blue-955/40 text-blue-300 border border-blue-900/40'
                                : summary.valoracion_media > 0 
                                ? 'bg-rose-955/40 text-rose-300 border border-rose-900/40'
                                : 'bg-slate-900 text-slate-600'
                            }`}>
                              {summary.valoracion_media > 0 ? summary.valoracion_media.toFixed(2) : 'Sin val.'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}


      {/* CREATION FORM DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleAddReport}
            className="w-full max-w-2xl bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-auto max-h-[92vh]"
          >
            
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest block font-bold">FICHA TÉCNICA OFICIAL</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">Redactar Informe Post-Partido</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* General data fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Nombre Equipo Local</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Nuestra Plantilla F.C."
                    value={localTeam}
                    onChange={(e) => setLocalTeam(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Nombre Equipo Visitante</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: C.D. Lugo B"
                    value={visitorTeam}
                    onChange={(e) => setVisitorTeam(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Campo / Estadio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ciudad Deportiva Riazor"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1 font-mono">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1 font-mono">Hora de inicio</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100"
                  />
                </div>
              </div>

              {/* Valoracion Global Stars input */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Valoración Global del Encuentro</span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Asigna rendimiento global colectiva (1 a 5 estrellas)</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setGlobalRating(star)}
                      className="p-1 hover:scale-115 transition-all text-amber-400 cursor-pointer"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= globalRating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sumario Resumen */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Breve Resumen y Anotaciones Tácticas o Técnicas</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escribe un breve resumen del transcurso, problemas, aciertos defensivos, goles destacados o aspectos motivacionales de coaching..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-605 resize-none font-sans"
                />
              </div>

              {/* Individual Players List - Editable Inline Sub-Grid */}
              <div className="space-y-2">
                <div className="border-b border-slate-800 pb-1 flex justify-between items-center">
                  <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest block font-bold">DETERMINAR RENDIMIENTO DE LA PLANTILLA</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Futbolistas listados: {squadPlayers.length}</span>
                </div>

                {squadPlayers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs text-slate-505 font-mono">
                    Registra primero jugadores en la pestaña para que aparezcan en el acta de rendimientos de los informes.
                  </div>
                ) : (
                  <div className="border border-slate-850 rounded-xl bg-slate-950/70 overflow-hidden text-xs max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/90 text-slate-500 text-[9px] font-mono uppercase border-b border-slate-850">
                          <th className="py-2 px-3">Futbolista</th>
                          <th className="py-2 px-3 w-28">Posición</th>
                          <th className="py-2 px-3 w-20 text-center">Minutos</th>
                          <th className="py-2 px-3 w-28 text-center">Tarjetas</th>
                          <th className="py-2 px-3 w-16 text-center">Goles</th>
                          <th className="py-2 px-3 w-16 text-center">Asist.</th>
                          <th className="py-2 px-3 w-24 text-center">Val. (1-10)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-855 font-mono">
                        {squadPlayers.map((player) => {
                          const stats = playerStats[player.id] || {
                            posicion: player.demarcacion,
                            minutos: 90,
                            tarjetas: 'Ninguna',
                            goles: 0,
                            asistencias: 0,
                            valoracion: 6.0
                          };

                          return (
                            <tr key={player.id} className="hover:bg-slate-900/40 text-[11px]">
                              
                              {/* Name */}
                              <td className="py-1 px-3 text-white font-bold font-sans">
                                #{player.dorsal} {player.nombre} {player.apellidos.substring(0, 10)}
                              </td>
                              
                              {/* Position played inside report */}
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  value={stats.posicion}
                                  onChange={(e) => handleStatChange(player.id, 'posicion', e.target.value)}
                                  className="w-full text-[10px] px-1.5 py-1 border border-slate-850 bg-slate-950 text-slate-200 rounded outline-none"
                                />
                              </td>

                              {/* Minutos jugados */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={stats.minutos}
                                  onChange={(e) => handleStatChange(player.id, 'minutos', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-16 text-[10px] px-1 py-1 text-center border border-slate-850 bg-slate-950 rounded outline-none font-bold text-white"
                                />
                              </td>

                              {/* Tarjetas */}
                              <td className="py-1 px-2 text-center">
                                <select
                                  value={stats.tarjetas || 'Ninguna'}
                                  onChange={(e) => handleStatChange(player.id, 'tarjetas', e.target.value)}
                                  className="w-full text-[10px] py-1 px-1.5 border border-slate-850 bg-slate-950 rounded outline-none text-slate-300"
                                >
                                  <option value="Ninguna">Ninguna</option>
                                  <option value="Amarilla">🟨 Amarilla</option>
                                  <option value="Roja">🟥 Roja</option>
                                  <option value="Doble Amarilla">🟨🟨 Doble Am.</option>
                                </select>
                              </td>

                              {/* Goles */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={stats.goles}
                                  onChange={(e) => handleStatChange(player.id, 'goles', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-12 text-[10px] px-1 py-1 text-center border border-slate-850 bg-slate-950 rounded outline-none font-black text-emerald-400"
                                />
                              </td>

                              {/* Asistencias */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={stats.asistencias}
                                  onChange={(e) => handleStatChange(player.id, 'asistencias', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-12 text-[10px] px-1 py-1 text-center border border-slate-850 bg-slate-950 rounded outline-none font-black text-blue-400"
                                />
                              </td>

                              {/* Player Valuation Grade (1 - 10 value) */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="10"
                                  value={stats.valoracion !== undefined ? stats.valoracion : 6.0}
                                  onChange={(e) => handleStatChange(player.id, 'valoracion', Math.min(10, Math.max(1, parseFloat(e.target.value) || 1)))}
                                  className="w-16 text-[10px] px-1 py-1 text-center border border-slate-850 bg-slate-950 rounded outline-none font-black text-amber-400 font-mono"
                                />
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Form actions */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-850 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitLoading ? 'Guardando...' : 'Crear Acta de Partido'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

// Minimalist Arrow Helper for column sorting
function ChevronUpDownArrow({ field, activeField, isAsc }: { field: string; activeField: string; isAsc: boolean }) {
  if (activeField !== field) {
    return <span className="text-[8px] text-slate-600 group-hover:text-slate-400 select-none">⇅</span>;
  }
  return (
    <span className="text-[10px] text-blue-400 font-bold select-none">
      {isAsc ? '▲' : '▼'}
    </span>
  );
}
