/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Jugador } from './types';
import { 
  getSupabaseConfigState, 
  getLocalPlayers, 
  setLocalPlayers, 
  getLocalUser, 
  supabase 
} from './lib/supabase';
import SupabaseConfig from './components/SupabaseConfig';
import StatsDashboard from './components/StatsDashboard';
import PlayerCard from './components/PlayerCard';
import PlayerForm from './components/PlayerForm';
import AuthModal from './components/AuthModal';
import TacticalBoard from './components/TacticalBoard';
import Videoteca from './components/Videoteca';
import { exportPlayerToPdf } from './lib/pdfExport';
import { 
  Users, 
  Plus, 
  Search, 
  Grid, 
  List, 
  LogIn, 
  LogOut, 
  FilterX, 
  Award, 
  Loader2, 
  UserCheck,
  Calendar,
  Shield,
  Pocket,
  FileSpreadsheet,
  Eye,
  FileDown,
  X,
  Sparkles,
  Map,
  Tv
} from 'lucide-react';

export default function App() {
  const config = getSupabaseConfigState();
  
  // Roster States
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('Todas');
  const [selectedLaterality, setSelectedLaterality] = useState<string>('Todas');
  
  // UI Layout States
  const [viewType, setViewType] = useState<'grid' | 'table' | 'campograma' | 'videoteca'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Jugador | undefined>(undefined);
  const [previewPlayer, setPreviewPlayer] = useState<Jugador | null>(null);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 1. Setup Auth listener
  useEffect(() => {
    if (config.isMock) {
      setCurrentUser(getLocalUser());
    } else if (supabase) {
      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUser(session?.user ?? null);
      });

      // Listen to auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [config.isMock]);

  // 2. Fetch Players Roster
  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);

    if (config.isMock) {
      setPlayers(getLocalPlayers());
      setLoading(false);
      return;
    }

    try {
      if (!supabase) throw new Error('Cliente de Supabase no inicializado');
      const { data, error: fetchError } = await supabase
        .from('jugadores')
        .select('*')
        .order('dorsal', { ascending: true });

      if (fetchError) throw fetchError;
      setPlayers(data || []);
    } catch (err: any) {
      console.error(err);
      setError(`Error al leer datos de Supabase: ${err.message || err}. Se activó el respaldo local.`);
      // Fallback
      setPlayers(getLocalPlayers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [config.isMock]);

  // 3. User Sign Out
  const handleLogout = async () => {
    if (config.isMock) {
      localStorage.removeItem('futbol_app_mock_user');
      setCurrentUser(null);
    } else if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
    }
  };

  // 4. Create or Update Operations
  const handleSavePlayer = async (formData: Partial<Jugador>) => {
    if (config.isMock) {
      const current = getLocalPlayers();
      if (editingPlayer) {
        // Update operation
        const index = current.findIndex(p => p.id === editingPlayer.id);
        if (index > -1) {
          current[index] = { ...editingPlayer, ...formData } as Jugador;
        }
      } else {
        // Create operation
        const newPlayer: Jugador = {
          id: `p-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...formData,
        } as Jugador;
        current.push(newPlayer);
      }
      setLocalPlayers(current);
      setPlayers(current);
      setEditingPlayer(undefined);
      return;
    }

    // Real Supabase Insertion/Modification
    try {
      if (!supabase) throw new Error('Supabase no configurado');

      if (editingPlayer) {
        const { error: editErr } = await supabase
          .from('jugadores')
          .update(formData)
          .eq('id', editingPlayer.id);

        if (editErr) throw editErr;
      } else {
        const { error: addErr } = await supabase
          .from('jugadores')
          .insert([formData]);

        if (addErr) throw addErr;
      }
      await fetchPlayers();
      setEditingPlayer(undefined);
    } catch (err: any) {
      alert(`Error al guardar jugador: ${err.message}`);
    }
  };

  // 5. Delete Operation
  const handleDeletePlayer = async (id: string) => {
    if (config.isMock) {
      const current = getLocalPlayers();
      const updated = current.filter(p => p.id !== id);
      setLocalPlayers(updated);
      setPlayers(updated);
      return;
    }

    try {
      if (!supabase) throw new Error('Supabase no configurado');
      const { error: delErr } = await supabase
        .from('jugadores')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      await fetchPlayers();
    } catch (err: any) {
      alert(`Error al eliminar jugador: ${err.message}`);
    }
  };

  // 6. Filtering Logic
  const filteredPlayers = players.filter((player) => {
    const fullName = `${player.nombre} ${player.apellidos}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          player.equipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.dorsal.toString() === searchQuery;
    
    const matchesPosition = selectedPosition === 'Todas' || player.demarcacion === selectedPosition;
    const matchesLaterality = selectedLaterality === 'Todas' || player.lateralidad === selectedLaterality;

    return matchesSearch && matchesPosition && matchesLaterality;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPosition('Todas');
    setSelectedLaterality('Todas');
  };

  const handleAddClick = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      setEditingPlayer(undefined);
      setIsFormOpen(true);
    }
  };

  const handleEditClick = (player: Jugador) => {
    setEditingPlayer(player);
    setIsFormOpen(true);
  };

  // Age Calculator for Table
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
  // Tag styling helper for Table positions
  const getPositionStyles = (pos: string) => {
    switch (pos) {
      case 'Portero':
        return 'bg-amber-950/40 text-amber-350 border border-amber-900/30';
      case 'Defensa':
        return 'bg-blue-950/40 text-blue-300 border border-blue-900/30';
      case 'Centrocampista':
        return 'bg-teal-950/40 text-teal-300 border border-teal-900/30';
      case 'Delantero':
        return 'bg-rose-950/40 text-rose-300 border border-rose-900/30';
      default:
        return 'bg-slate-900 text-slate-350 border border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans antialiased">
      
      {/* 1. Header Principal */}
      <header className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-900/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-blue-400 block tracking-widest uppercase font-mono">PLANTILLA OFICIAL</span>
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight font-display">
                CUADERNO DE ENTRENADOR
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none font-mono">Cuerpo Técnico</span>
                  <span className="text-xs text-slate-400 truncate max-w-40 font-bold">{currentUser.email}</span>
                </div>
                <div className="bg-slate-900 text-blue-400 p-2 rounded-xl border border-slate-800" title="Sesión activa">
                  <UserCheck className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl p-2 transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl px-4 py-2.5 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="h-4 w-4 text-blue-500" />
                Acceso Admin
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. Cuerpo Central */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Supabase connection guide block */}
        <SupabaseConfig />

        {/* Visual Analytics Widgets */}
        {viewType !== 'videoteca' && <StatsDashboard players={players} />}

        {/* 3. Panel Filtros y Acciones */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 sm:p-5 mb-8 shadow-2xl flex flex-col gap-4">
          {viewType !== 'videoteca' && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar jugador por nombre, dorsal o equipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3.5 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-100"
                />
              </div>

              {/* Selectores filtro */}
              <div className="grid grid-cols-2 sm:flex gap-3">
                
                <div className="flex-1 sm:w-44">
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full text-xs px-3.5 py-3.5 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-205"
                    aria-label="Filter by Position"
                  >
                    <option value="Todas">Posiciones (Todas)</option>
                    <option value="Portero">Porteros</option>
                    <option value="Defensa">Defensas</option>
                    <option value="Centrocampista">Centrocampistas</option>
                    <option value="Delantero">Delanteros</option>
                  </select>
                </div>

                <div className="flex-1 sm:w-44">
                  <select
                    value={selectedLaterality}
                    onChange={(e) => setSelectedLaterality(e.target.value)}
                    className="w-full text-xs px-3.5 py-3.5 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-205"
                    aria-label="Filter by Laterality"
                  >
                    <option value="Todas">Dominancia (Todas)</option>
                    <option value="Diestro">Diestros</option>
                    <option value="Zurdo">Zurdos</option>
                    <option value="Ambidiestro">Ambidiestros</option>
                  </select>
                </div>

              </div>

            </div>
          )}

          <div className="border-t border-slate-900 pt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            
            {/* Toggles Vista e Inscribir */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Diseño de Vista:</span>
              <div className="bg-slate-900 rounded-lg p-0.5 flex items-center border border-slate-850">
                <button
                  type="button"
                  onClick={() => setViewType('grid')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewType === 'grid' 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Vista en cuadricula"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('table')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewType === 'table' 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Vista tabular de lista"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('campograma')}
                  className={`p-1.5 px-2.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                    viewType === 'campograma' 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Pizarra táctica y alineación de campograma"
                >
                  <Map className="h-3.5 w-3.5 text-blue-400" />
                  <span>Campograma</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('videoteca')}
                  className={`p-1.5 px-2.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                    viewType === 'videoteca' 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Videoteca táctica del equipo"
                >
                  <Tv className="h-3.5 w-3.5 text-blue-400" />
                  <span>Videoteca</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2.5">
              {viewType !== 'videoteca' && (
                <>
                  {(searchQuery || selectedPosition !== 'Todas' || selectedLaterality !== 'Todas') && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-950/40 rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer font-bold font-mono uppercase"
                    >
                      <FilterX className="h-4 w-4 text-rose-450" />
                      REESTABLECER
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddClick}
                    className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2.5 font-black uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/10 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    INSCRIBIR FUTBOLISTA
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* 4. Contenido de Plantilla */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-505 animate-spin" />
            <p className="text-xs text-slate-500 font-medium animate-pulse">Cargando futbolistas inscritos...</p>
          </div>
        ) : viewType === 'campograma' ? (
          <TacticalBoard players={players} />
        ) : viewType === 'videoteca' ? (
          <Videoteca />
        ) : filteredPlayers.length === 0 ? (
          <div className="bg-slate-950 border border-slate-850 h-64 flex flex-col items-center justify-center p-6 text-center rounded-2xl shadow-xl">
            <div className="bg-slate-900 p-3.5 rounded-full text-slate-500 mb-3.5 border border-slate-800">
              <Users className="h-6 w-6 text-blue-500" id="empty-state-icon" />
            </div>
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-display">Ningún jugador coincide</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No hemos encontrado perfiles que cumplan con los filtros aplicados. Prueba a buscar otro término o limpia los filtros.
            </p>
            {(searchQuery || selectedPosition !== 'Todas' || selectedLaterality !== 'Todas') && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest cursor-pointer"
              >
                Restablecer búsqueda
              </button>
            )}
          </div>
        ) : viewType === 'grid' ? (
          /* Grid de Tarjetas con efectos de animación */
          <motion.div 
            layout 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredPlayers.map((player) => (
                <motion.div
                  layout
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <PlayerCard
                    player={player}
                    isAdmin={!!currentUser}
                    onEdit={handleEditClick}
                    onDelete={handleDeletePlayer}
                    onPreview={setPreviewPlayer}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Tabla de Fichas Deportivas (Desktop Optimal) */
          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Tabular list of team players">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider select-none border-b border-slate-850">
                    <td className="p-3.5 w-16 text-center font-mono">Nº</td>
                    <td className="p-3.5 font-display">Futbolista</td>
                    <td className="p-3.5 font-display">Posición</td>
                    <td className="p-3.5 font-display">Edad / Nacimiento</td>
                    <td className="p-3.5 font-display">Lado</td>
                    <td className="p-3.5 font-display">Procedencia</td>
                    <td className="p-3.5 font-display text-slate-400">Breve Scout</td>
                    <td className="p-3.5 font-display text-slate-400">Rendimiento</td>
                    <td className="p-3.5 text-center font-display w-24">Ficha</td>
                    {currentUser && <td className="p-3.5 text-center w-28 font-display">Acciones</td>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs text-slate-300 bg-slate-950">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5 text-center font-mono font-black text-white max-w-16">
                        <span className="inline-flex h-6 w-6 rounded-md bg-slate-900 border border-slate-800 text-white items-center justify-center font-bold">
                          {player.dorsal}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-white">
                        {player.nombre} {player.apellidos}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black ${getPositionStyles(player.demarcacion)}`}>
                          {player.demarcacion.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-205">{getAge(player.fecha_nacimiento)} años</span>
                        <span className="text-slate-450 block text-[10px] font-mono">{player.fecha_nacimiento}</span>
                      </td>
                      <td className="p-3.5 font-medium font-mono text-[11px] text-slate-400">{player.lateralidad.toUpperCase()}</td>
                      <td className="p-3.5 truncate max-w-44 text-slate-200" title={player.equipo}>
                        {player.equipo}
                      </td>
                      <td className="p-3.5 italic text-slate-400 max-w-xs truncate" title={player.observaciones}>
                        "{player.observaciones || 'Sin observaciones registrado.'}"
                      </td>
                      {/* Atributos en tabla */}
                      <td className="p-3.5 text-[10px] whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 font-mono">
                          <span>Vel: <strong className="text-blue-400">{player.velocidad ?? 3}</strong> | Téc: <strong className="text-blue-400">{player.tecnica ?? 3}</strong></span>
                          <span>Def: <strong className="text-blue-400">{player.defensa ?? 3}</strong> | Act: <strong className="text-blue-400">{player.actitud ?? 3}</strong></span>
                        </div>
                      </td>
                      {/* Botones de Vista previa y PDF */}
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPlayer(player)}
                            className="text-blue-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg p-1.5 transition-colors cursor-pointer border border-slate-800"
                            title="Ver Ficha"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => exportPlayerToPdf(player)}
                            className="text-green-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg p-1.5 transition-colors cursor-pointer border border-slate-800"
                            title="Exportar PDF"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      {currentUser && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditClick(player)}
                              className="text-blue-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded p-1.5 transition-colors cursor-pointer border border-slate-850"
                              title="Editar Ficha"
                            >
                              <List className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Estás seguro de que quieres dar de baja a ${player.nombre}?`)) {
                                  handleDeletePlayer(player.id);
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 rounded p-1.5 transition-colors cursor-pointer border border-slate-855"
                              title="Eliminar Jugador"
                            >
                              <FilterX className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-900 px-4 py-3 border-t border-slate-850 text-[10px] font-mono font-bold text-slate-500 tracking-wider text-right uppercase shrink-0">
              MOSTRANDO {filteredPlayers.length} DE {players.length} FUTBOLISTAS INSCRITOS
            </div>
          </div>
        )}

      </main>

      {/* 5. Modales (Autenticación & Formulario de Jugador) */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            onClose={() => setIsAuthOpen(false)}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
            }}
          />
        )}

        {isFormOpen && (
          <PlayerForm
            player={editingPlayer}
            onClose={() => {
              setIsFormOpen(false);
              setEditingPlayer(undefined);
            }}
            onSave={handleSavePlayer}
          />
        )}

        {/* 6. Vista Previa de Ficha Modal */}
        {previewPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-400" />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest font-mono">
                    Vista Previa de la Ficha
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPlayer(null)}
                  className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Card Main Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                {/* Visual Top block */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start pb-5 border-b border-slate-850">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                    {previewPlayer.foto_jugador ? (
                      <img
                        src={previewPlayer.foto_jugador}
                        alt={`${previewPlayer.nombre} ${previewPlayer.apellidos}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-black text-blue-400">
                        #{previewPlayer.dorsal}
                      </span>
                    )}
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <span className="inline-flex px-2 py-0.5 rounded bg-blue-950/50 border border-blue-900/40 text-blue-400 text-[10px] uppercase font-black tracking-widest font-mono">
                      #{previewPlayer.dorsal} - {previewPlayer.demarcacion}
                    </span>
                    <h2 className="text-xl font-black text-white leading-tight font-display">
                      {previewPlayer.nombre} <span className="text-slate-400 font-normal">{previewPlayer.apellidos}</span>
                    </h2>
                    <p className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wide">
                      {previewPlayer.equipo}
                    </p>
                  </div>
                </div>

                {/* Facts Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 border border-slate-855 p-4 rounded-xl text-xs font-medium">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-mono">Nacimiento / Edad</span>
                    <span className="text-slate-200">{previewPlayer.fecha_nacimiento}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-mono">Pie dominante</span>
                    <span className="text-blue-400 font-bold uppercase">{previewPlayer.lateralidad}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-850/60 pt-2.5 mt-1.5">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-mono">Identificador de Ficha</span>
                    <span className="font-mono text-[10px] text-slate-400">{previewPlayer.id}</span>
                  </div>
                </div>

                {/* Technical / Physical stats attributes (Quantitative Bars) */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-405 font-mono block">
                    Atributos y Habilidades
                  </span>
                  
                  {[
                    { label: 'Velocidad / Ritmo', val: previewPlayer.velocidad ?? 3 },
                    { label: 'Remate / Finalización', val: previewPlayer.remate ?? 3 },
                    { label: 'Pase / Asociación', val: previewPlayer.pase ?? 3 },
                    { label: 'Técnica / Control', val: previewPlayer.tecnica ?? 3 },
                    { label: 'Defensa / Entrada', val: previewPlayer.defensa ?? 3 },
                    { label: 'Actitud / Compromiso', val: previewPlayer.actitud ?? 3 },
                  ].map((attr, key) => (
                    <div key={key} className="space-y-1 bg-slate-950/20 p-2 border border-slate-850/30 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300 font-bold text-[11px]">{attr.label}</span>
                        <span className="text-blue-400 font-black">{attr.val} / 5</span>
                      </div>
                      
                      {/* Visual segment progress bar (representing 5 notches) */}
                      <div className="grid grid-cols-5 gap-1.5 h-2">
                        {[1, 2, 3, 4, 5].map((notch) => (
                          <div
                            key={notch}
                            className={`h-full rounded transition-all duration-300 ${
                              notch <= attr.val
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-sm shadow-blue-500/10'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Observations text */}
                {previewPlayer.observaciones && (
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block font-mono mb-1.5">
                      Observaciones de Seguimiento
                    </span>
                    <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                      "{previewPlayer.observaciones}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => exportPlayerToPdf(previewPlayer)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider text-white bg-blue-600 hover:bg-blue-500 rounded-xl py-3 border border-blue-500 hover:shadow-lg transition-colors cursor-pointer select-none uppercase"
                >
                  <FileDown className="h-4 w-4" />
                  Descargar Ficha PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPlayer(null)}
                  className="px-5 inline-flex items-center justify-center text-xs font-bold tracking-wider text-slate-300 hover:text-white bg-slate-905 hover:bg-slate-850 border border-slate-800 rounded-xl py-3 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
