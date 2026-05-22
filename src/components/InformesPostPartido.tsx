import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseConfigState, getLocalPlayers } from '../lib/supabase';
import { Jugador, InformePostPartido, JugadorRendimiento } from '../types';
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
  ChevronDown,
  Activity,
  PlusCircle,
  Sparkles
} from 'lucide-react';

const LOCAL_STORAGE_REPORTS_KEY = 'futbol_app_informes_partido';

const MOCK_REPORTS_SEED = (): InformePostPartido[] => [
  {
    id: 'mock-rep-1',
    equipo_local: 'U.D. Somozas',
    equipo_visitante: 'Nuestra Plantilla F.C.',
    campo: 'Estadio Manuel Candocia',
    fecha: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    hora: '17:00',
    resumen: 'Gran victoria a domicilio gracias a la solidez táctica mostrada en el repliegue medio y la velocidad de transiciones ofensivas. Los saques de esquina rivales causaron peligro en la primera mitad pero se corrigió la marca al descanso.',
    valoracion_global: 4,
    rendimientos: [
      { jugador_id: '1', nombre_completo: 'Carlos Delgado', posicion: 'Portero', minutos: 90, tarjetas: 'Ninguna', goles: 0, asistencias: 0 },
      { jugador_id: '2', nombre_completo: 'Hugo Sanmartín', posicion: 'Defensa Central', minutos: 90, tarjetas: 'Amarilla', goles: 0, asistencias: 0 },
      { jugador_id: '3', nombre_completo: 'Marcos Álvarez', posicion: 'Mediocentro', minutos: 75, tarjetas: 'Ninguna', goles: 1, asistencias: 0 },
      { jugador_id: '4', nombre_completo: 'Diego Vela', posicion: 'Delantero Centro', minutos: 80, tarjetas: 'Ninguna', goles: 1, asistencias: 1 }
    ],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  }
];

export default function InformesPostPartido() {
  const config = getSupabaseConfigState();
  const [reports, setReports] = useState<InformePostPartido[]>([]);
  const [squadPlayers, setSquadPlayers] = useState<Jugador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search / Filters
  const [search, setSearch] = useState('');

  // Form states to create report
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

  // Fetch reports & players
  useEffect(() => {
    fetchData();
  }, []);

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
        asistencias: 0
      };
    });
    setPlayerStats(initialStats);

    // 2. Fetch Reports
    if (config.isMock || !supabase) {
      const stored = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      if (stored) {
        try {
          setReports(JSON.parse(stored));
        } catch {
          const seeds = MOCK_REPORTS_SEED();
          setReports(seeds);
          localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(seeds));
        }
      } else {
        const seeds = MOCK_REPORTS_SEED();
        setReports(seeds);
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(seeds));
      }
      setIsLoading(false);
    } else {
      try {
        const { data, error: fetchErr } = await supabase
          .from('informes_post_partido')
          .select('*')
          .order('fecha', { ascending: false });

        if (fetchErr) throw fetchErr;
        setReports(data || []);
      } catch (err: any) {
        console.error('Error fetching reports from Supabase:', err);
        setError('No se pudo conectar del todo con la tabla informes_post_partido en Supabase. Asegúrate de ejecutar el bloque SQL en el Query Editor.');
        // Fallback local storage
        const stored = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
        setReports(stored ? JSON.parse(stored) : MOCK_REPORTS_SEED());
      } finally {
        setIsLoading(false);
      }
    }
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

    // Prepare array of active participating players (exclude players who had 0 minutes if desired, but let's include all updated ones or those with >0 minutes)
    const rendimientos: JugadorRendimiento[] = squadPlayers.map(p => {
      const stats = playerStats[p.id] || { posicion: p.demarcacion, minutos: 90, tarjetas: 'Ninguna', goles: 0, asistencias: 0 };
      return {
        jugador_id: p.id,
        nombre_completo: `${p.nombre} ${p.apellidos}`,
        posicion: stats.posicion,
        minutos: Number(stats.minutos) || 0,
        tarjetas: stats.tarjetas,
        goles: Number(stats.goles) || 0,
        asistencias: Number(stats.asistencias) || 0
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
      // Local addition
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
      // Supabase insertion
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
        alert('Error al guardar en Supabase. Se guardará localmente. Detalle: ' + err.message);

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

  const resetForm = () => {
    setLocalTeam('Nuestra Plantilla F.C.');
    setVisitorTeam('');
    setPitch('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('18:00');
    setSummary('');
    setGlobalRating(4);

    // reset stats records
    const initialStats: Record<string, Omit<JugadorRendimiento, 'jugador_id' | 'nombre_completo'>> = {};
    squadPlayers.forEach(p => {
      initialStats[p.id] = {
        posicion: p.demarcacion,
        minutos: 90,
        tarjetas: 'Ninguna',
        goles: 0,
        asistencias: 0
      };
    });
    setPlayerStats(initialStats);
    setIsFormOpen(false);
  };

  const handleDownloadPdf = (report: InformePostPartido, e: React.MouseEvent) => {
    e.stopPropagation();
    exportPostMatchReportToPdf(report);
  };

  const filteredReports = reports.filter(r => {
    const searchString = `${r.equipo_local} ${r.equipo_visitante} ${r.campo} ${r.resumen}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* TITLE BOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-900/30 text-blue-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider font-display">Informes Post-Partido</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gestión de actas de partidos, estadísticas individuales de futbolistas y actas PDF esportables.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            // refresh squad list anyway to ensure form has newest players
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
        <div className="p-4 bg-rose-955/20 border border-rose-900/30 rounded-xl text-rose-300 flex gap-2.5 items-start">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5 text-rose-200">Nota sobre Supabase:</strong>
            {error}
            <div className="mt-2 text-[10px] text-slate-400 font-mono">
              Los informes siguen estando totalmente operativos y guardándose en localStorage.
            </div>
          </div>
        </div>
      )}

      {/* SEARCH / FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-3.5 py-2 border border-slate-850 rounded-lg">
          Histórico de partidos guardados: <strong className="text-blue-400 font-mono font-black">{filteredReports.length}</strong>
        </span>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
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
              <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest block">FICHA DE DATOS POST-PARTIDO</span>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                {viewingReport.equipo_local} <span className="text-slate-500 font-light">vs</span> {viewingReport.equipo_visitante}
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
                <span className="text-xs text-slate-450 mt-1 font-mono">Puntuación colectiva asignada: {viewingReport.valoracion_global} / 5 estrellas</span>
              </div>

            </div>

            {/* Tactical Resumen / Notes */}
            <div className="md:col-span-2 p-5 bg-slate-900 border border-slate-850 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                  <Award className="h-4 w-4 text-blue-400" />
                  <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest">RESUMEN TÁCTICO DE SEGUIMIENTO</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {viewingReport.resumen || 'Sin anotaciones registradas.'}
                </p>
              </div>

              <div className="mt-6 p-4 bg-slate-950/60 rounded-lg border border-slate-850 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Las estadísticas de rendimiento individuales se asocian en el histórico global digital para auditorías.</span>
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
                          <span className="text-slate-500 text-[10px]">-</span>
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
                          <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30">{rend.goles} goles</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-black">
                        {rend.asistencias > 0 ? (
                          <span className="text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/30">{rend.asistencias} asis</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!viewingReport.rendimientos || viewingReport.rendimientos.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        No hay rendimientos individuales detallados guardados en la ficha técnica de este informe.
                      </td>
                    </tr>
                  )}
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
          <div className="bg-slate-900 p-3.5 rounded-full text-slate-505 mb-3.5 border border-slate-800">
            <FileText className="h-6 w-6 text-slate-500" />
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
                // Scroll beautifully
                setTimeout(() => {
                  const target = document.getElementById('report-view-target');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 150);
              }}
              className={`group bg-slate-950 border rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:border-slate-705 transition-all duration-300 relative flex flex-col justify-between cursor-pointer ${
                viewingReport?.id === report.id ? 'border-blue-600 ring-2 ring-blue-600/20 bg-slate-900/30' : 'border-slate-850'
              }`}
            >
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-1 border-b border-slate-850 pb-2.5">
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
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span className="uppercase line-clamp-1">{report.campo}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">
                  {report.resumen || 'Sin resumen registrado.'}
                </p>

                {/* Sub-badg List of goals inside squad */}
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

              {/* Action feet */}
              <div className="mt-4.5 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="text-xs text-blue-500 hover:underline inline-flex items-center gap-0.5 font-bold uppercase tracking-wider">
                  Ver Detalles Completo →
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadPdf(report, e)}
                    className="p-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-900/30 transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider"
                    title="Exportar acta a PDF inmediatamente"
                  >
                    <FileDown className="h-3 w-3" />
                    PDF
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteReport(report.id, e)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-450 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/30 transition-all cursor-pointer"
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


      {/* CREATION FORM DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleAddReport}
            className="w-full max-w-2xl bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-auto max-h-[92vh]"
          >
            
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest block">FICHA TÉCNICA OFICIAL</span>
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
                  <p className="text-[9px] text-slate-500 mt-0.5">Asigna rendimiento global (1 a 5 estrellas)</p>
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
                  className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600 resize-none font-sans"
                />
              </div>

              {/* Individual Players List - Editable Inline Sub-Grid */}
              <div className="space-y-2">
                <div className="border-b border-slate-800 pb-1 flex justify-between items-center">
                  <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest block">DETERMINAR RENDIMIENTO DE LA PLANTILLA</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Jugadores registrados: {squadPlayers.length}</span>
                </div>

                {squadPlayers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs text-slate-500 font-mono">
                    Registra primero jugadores en la pestaña "Fútbol Base / Listado" para que aparezcan en el acta de rendimientos de los informes.
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
                          <th className="py-2 px-3 w-20 text-center">Goles</th>
                          <th className="py-2 px-3 w-20 text-center">Asist.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono">
                        {squadPlayers.map((player) => {
                          const stats = playerStats[player.id] || {
                            posicion: player.demarcacion,
                            minutos: 90,
                            tarjetas: 'Ninguna',
                            goles: 0,
                            asistencias: 0
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
                                  className="w-full text-[10px] px-1.5 py-1 border border-slate-850 bg-slate-950 text-slate-205 rounded outline-none text-slate-300"
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
                                  value={stats.tarjetas}
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
                                  className="w-14 text-[10px] px-1 py-1 text-center border border-slate-850 bg-slate-950 rounded outline-none font-black text-emerald-400"
                                />
                              </td>

                              {/* Asistencias */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={stats.asistencias}
                                  onChange={(e) => handleStatChange(player.id, 'asistencias', Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-14 text-[10px] px-1 py-1 text-center border border-slate-850 bg-slate-950 rounded outline-none font-black text-blue-400"
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
