import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseConfigState } from '../lib/supabase';
import { VideoAnalisis } from '../types';
import { 
  Play, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  Tv, 
  Film, 
  Calendar, 
  Info, 
  X, 
  Eye, 
  AlertCircle,
  Video
} from 'lucide-react';

const LOCAL_STORAGE_VIDEOS_KEY = 'futbol_app_video_analisis';

const MOCK_VIDEOS_SEED: VideoAnalisis[] = [
  {
    id: 'mock-vid-1',
    titulo: 'Comportamiento en Repliegue Medio-Bajo',
    rival: 'S.D. Ponferradina',
    tipo: 'rival',
    url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    descripcion: 'Informe de scouts analizando el bloque defensivo del rival. Se observa basculación lenta en intervalo lateral y dificultades para neutralizar centros pasados al segundo palo. Clave presionar su salida por lateral izquierdo.',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mock-vid-2',
    titulo: 'ABP Ofensivo y Salida de Balón - Pre-Partido',
    rival: 'Real Valladolid B',
    tipo: 'pre-partido',
    url_video: 'https://www.youtube.com/watch?v=9Lp1V78gN0g',
    descripcion: 'Pautas estratégicas para el emparejamiento defensivo individual y saltos en presión media. Se ensayan 3 variantes de balón parado ofensivo (córner al primer poste, falta lateral frontal rasa).',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'mock-vid-3',
    titulo: 'Eficacia de Transiciones Positivas - Análisis Post-Partido',
    rival: 'C.D. Badajoz',
    tipo: 'post-partido',
    url_video: 'https://www.youtube.com/watch?v=Yp1G5wQbeB0',
    descripcion: 'Comportamiento defensivo tras pérdida y explotación de espacios tras recuperación. Buenos saltos de presión pero falta mayor verticalidad y agresividad en el último tercio del campo.',
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  }
];

// Helper to extract embed URLs for YouTube and Vimeo
export function getEmbedUrl(url: string): { embed: string | null; type: 'youtube' | 'vimeo' | 'raw' | 'link' } {
  if (!url) return { embed: null, type: 'link' };

  // YouTube match
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return { 
      embed: `https://www.youtube.com/embed/${ytMatch[1]}`, 
      type: 'youtube' 
    };
  }

  // Vimeo match
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return { 
      embed: `https://player.vimeo.com/video/${vimeoMatch[1]}`, 
      type: 'vimeo' 
    };
  }

  // Raw video match
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return { embed: url, type: 'raw' };
  }

  return { embed: null, type: 'link' };
}

export default function Videoteca() {
  const config = getSupabaseConfigState();
  const [videos, setVideos] = useState<VideoAnalisis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for search and filter
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Todos' | 'rival' | 'pre-partido' | 'post-partido'>('Todos');

  // Form states to create/add
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRival, setNewRival] = useState('');
  const [newType, setNewType] = useState<'rival' | 'pre-partido' | 'post-partido'>('rival');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Active playing video state
  const [playingVideo, setPlayingVideo] = useState<VideoAnalisis | null>(null);

  // Fetch videos
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);

    if (config.isMock || !supabase) {
      // Offline LocalStorage Mode
      const stored = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (stored) {
        try {
          setVideos(JSON.parse(stored));
        } catch {
          setVideos(MOCK_VIDEOS_SEED);
          localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(MOCK_VIDEOS_SEED));
        }
      } else {
        setVideos(MOCK_VIDEOS_SEED);
        localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(MOCK_VIDEOS_SEED));
      }
      setIsLoading(false);
    } else {
      // Supabase Mode
      try {
        const { data, error: fetchErr } = await supabase
          .from('video_analisis')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;
        setVideos(data || []);
      } catch (err: any) {
        console.error('Error fetching videos from Supabase:', err);
        setError('Ocurrió un error al conectar con Supabase. Asegúrate de haber ejecutado el script SQL en el editor y creado la tabla video_analisis.');
        // Fallback to localstate
        const stored = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
        setVideos(stored ? JSON.parse(stored) : MOCK_VIDEOS_SEED);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRival.trim() || !newUrl.trim()) return;

    setIsSubmitLoading(true);
    const item: Omit<VideoAnalisis, 'id' | 'created_at'> = {
      titulo: newTitle.trim(),
      rival: newRival.trim(),
      tipo: newType,
      url_video: newUrl.trim(),
      descripcion: newDescription.trim()
    };

    if (config.isMock || !supabase) {
      // Local addition
      const mockNewItem: VideoAnalisis = {
        ...item,
        id: `mock-vid-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      const updatedList = [mockNewItem, ...videos];
      setVideos(updatedList);
      localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updatedList));
      resetForm();
    } else {
      // Supabase addition
      try {
        const { data, error: addErr } = await supabase
          .from('video_analisis')
          .insert([item])
          .select();

        if (addErr) throw addErr;
        if (data && data[0]) {
          setVideos([data[0], ...videos]);
        } else {
          fetchVideos();
        }
        resetForm();
      } catch (err: any) {
        console.error('Error adding video to Supabase:', err);
        alert('Error al guardar en Supabase. Se guardará localmente. Error: ' + err.message);
        
        // Local fallback insert
        const mockNewItem: VideoAnalisis = {
          ...item,
          id: `mock-vid-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        const updatedList = [mockNewItem, ...videos];
        setVideos(updatedList);
        localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updatedList));
        resetForm();
      }
    }
    setIsSubmitLoading(false);
  };

  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este reportaje de video de la biblioteca?')) return;

    if (config.isMock || !supabase) {
      // Local delete
      const updatedList = videos.filter(v => v.id !== id);
      setVideos(updatedList);
      localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updatedList));
      if (playingVideo?.id === id) setPlayingVideo(null);
    } else {
      // Supabase delete
      try {
        const { error: delErr } = await supabase
          .from('video_analisis')
          .delete()
          .eq('id', id);

        if (delErr) throw delErr;
        setVideos(videos.filter(v => v.id !== id));
        if (playingVideo?.id === id) setPlayingVideo(null);
      } catch (err: any) {
        console.error('Error deleting video from Supabase:', err);
        // Fallback local delete
        const updatedList = videos.filter(v => v.id !== id);
        setVideos(updatedList);
        localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updatedList));
        if (playingVideo?.id === id) setPlayingVideo(null);
      }
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewRival('');
    setNewUrl('');
    setNewDescription('');
    setNewType('rival');
    setIsFormOpen(false);
  };

  // Filter video items dynamically
  const filteredVideos = videos.filter(v => {
    const matchesTab = activeTab === 'Todos' || v.tipo === activeTab;
    const searchString = `${v.titulo} ${v.rival} ${v.descripcion}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/30 text-emerald-400">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider font-display">Videoteca Táctica</h1>
            <p className="text-xs text-slate-400 mt-0.5">Reportes audiovisuales de rivales, preparaciones pre-partido y análisis post-partido.</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4.5 py-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
        >
          <Plus className="h-4 w-4" />
          AÑADIR ANÁLISIS
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-955/20 border border-rose-900/30 rounded-xl text-rose-300 flex gap-2.5 items-start">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5 text-rose-200">Nota sobre Supabase:</strong>
            {error}
            <div className="mt-2 text-[10px] text-slate-400 font-mono">
              La videoteca sigue disponible funcionando en modo simulación (almacenamiento local del navegador).
            </div>
          </div>
        </div>
      )}

      {/* FILTER BUTTONS & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex whitespace-nowrap overflow-x-auto gap-1.5 w-full md:w-auto p-1 bg-slate-950 border border-slate-850 rounded-xl">
          {(['Todos', 'rival', 'pre-partido', 'post-partido'] as const).map((tab) => {
            const labelMap = {
              Todos: 'Todos los Videos',
              rival: 'Análisis de Rival',
              'pre-partido': 'Pre-Partido (ABP / Plan)',
              'post-partido': 'Post-Partido (Feedback)',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-3.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por rival, título o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* ACTIVE VIDEO PLAYER ELEMENT */}
      {playingVideo && (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
          <div className="p-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                playingVideo.tipo === 'rival' 
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/30' 
                  : playingVideo.tipo === 'pre-partido'
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/30'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/30'
              }`}>
                {playingVideo.tipo === 'rival' ? 'REPORTE RIVAL' : playingVideo.tipo === 'pre-partido' ? 'PRE-PARTIDO' : 'POST-PARTIDO'}
              </span>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">{playingVideo.titulo} - {playingVideo.rival}</h2>
            </div>
            <button
              type="button"
              onClick={() => setPlayingVideo(null)}
              className="text-slate-450 hover:text-white bg-slate-800 hover:bg-slate-755 p-1.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            
            {/* Visual Embed Box */}
            <div className="lg:col-span-2 aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
              {(() => {
                const { embed, type } = getEmbedUrl(playingVideo.url_video);
                if (type === 'youtube' && embed) {
                  return (
                    <iframe
                      src={embed}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={playingVideo.titulo}
                    />
                  );
                } else if (type === 'vimeo' && embed) {
                  return (
                    <iframe
                      src={embed}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={playingVideo.titulo}
                    />
                  );
                } else if (type === 'raw') {
                  return (
                    <video
                      src={playingVideo.url_video}
                      controls
                      className="w-full h-full object-contain"
                    />
                  );
                } else {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 border border-slate-800">
                      <div className="bg-slate-950 p-4 rounded-full text-emerald-400 border border-slate-800 mb-4">
                        <Video className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-semibold text-white mb-2">Este enlace debe visualizarse externamente</p>
                      <p className="text-xs text-slate-400 max-w-md mb-5 leading-normal">
                        La URL introducida no pertenece a un formato integrable estándar de YouTube, Vimeo, u archivo de video .mp4 directo. 
                      </p>
                      <a
                        href={playingVideo.url_video}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer transition-colors"
                      >
                        Abrir video en nueva pestaña
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Information card */}
            <div className="flex flex-col bg-slate-900 border border-slate-850 p-5 rounded-xl justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">EQUIPO ANALIZADO</h3>
                  <p className="text-sm font-black text-emerald-400 uppercase tracking-wide">{playingVideo.rival}</p>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">DESCRIPCIÓN Y NOTAS TÁCTICAS</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{playingVideo.descripcion || 'Sin observaciones tácticas descritas.'}</p>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">NUESTROS TRABAJOS DE PREPARACIÓN</h3>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-850 flex items-start gap-2 text-[11px] text-slate-450 leading-normal">
                    <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Se aconseja alinear el campograma correspondiente al sistema planteado contra este rival específico.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850/60 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(playingVideo.created_at).toLocaleDateString('es-ES')}
                </span>
                <a
                  href={playingVideo.url_video}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 font-bold text-emerald-400"
                >
                  Ver enlace original
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* VIDEOS GRID LAYOUT */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Film className="h-8 w-8 text-emerald-500 animate-pulse" />
          <p className="text-xs text-slate-500 font-medium">Buscando reportes y videos tácticos...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-slate-950 border border-slate-850 h-64 flex flex-col items-center justify-center p-6 text-center rounded-2xl shadow-xl">
          <div className="bg-slate-900 p-3.5 rounded-full text-slate-500 mb-3.5 border border-slate-800">
            <Film className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">No se encontraron videos tácticos</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-normal">
            No hay videos registrados en este filtro o que coincidan con la búsqueda. Puedes añadir uno nuevo haciendo clic en el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((item) => {
            const { type } = getEmbedUrl(item.url_video);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setPlayingVideo(item);
                  // Scroll slightly to playing element
                  setTimeout(() => {
                    const el = document.getElementById('top-page');
                    if(el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className={`group bg-slate-950/90 border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                  playingVideo?.id === item.id ? 'border-emerald-600 ring-1 ring-emerald-600/50' : 'border-slate-850 hover:border-slate-700'
                }`}
              >
                
                {/* Simulated Thumbnail */}
                <div className="aspect-video bg-slate-900 border-b border-slate-850 relative flex items-center justify-center overflow-hidden">
                  
                  {/* Visual Background Pattern representing a pitch or camera lens */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-slate-900/40 opacity-70 z-10" />
                  
                  {/* Dynamic overlay label based on type */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                      item.tipo === 'rival' 
                        ? 'bg-rose-950/50 text-rose-300 border border-rose-800/20' 
                        : item.tipo === 'pre-partido'
                        ? 'bg-amber-950/50 text-amber-300 border border-amber-800/20'
                        : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/20'
                    }`}>
                      {item.tipo === 'rival' ? 'ANALISIS RIVAL' : item.tipo === 'pre-partido' ? 'PRE-PARTIDO' : 'POST-PARTIDO'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-mono bg-slate-900 border border-slate-800 text-slate-400 capitalize">
                      {type === 'youtube' ? 'YouTube' : type === 'vimeo' ? 'Vimeo' : type === 'raw' ? 'Video MP4' : 'Enlace'}
                    </span>
                  </div>

                  {/* Play circle trigger overlay */}
                  <div className="absolute z-20 bg-slate-950/80 group-hover:bg-emerald-600/90 p-3 rounded-full border border-slate-800 group-hover:border-emerald-500 text-emerald-400 group-hover:text-white transition-all scale-95 group-hover:scale-105 duration-300 shadow-md">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>

                  {/* Aesthetic card lines inside mock thumbnail */}
                  <div className="absolute bottom-3 left-3 z-20 text-left">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest block font-mono">EN FRENTAMIENTO</span>
                    <span className="text-xs font-black text-white uppercase tracking-wider block font-display">{item.rival}</span>
                  </div>

                </div>

                {/* Content Card Info */}
                <div className="p-4.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-[13px] font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors line-clamp-1">{item.titulo}</h3>
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">{item.descripcion || 'Sin observaciones detalladas.'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteVideo(item.id, e)}
                      className="p-1 px-1.5 rounded bg-slate-900 border border-slate-850 text-rose-450 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/30 transition-all cursor-pointer"
                      title="Eliminar este reporte permanentemente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}


      {/* CREATION MODAL/FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleAddVideo}
            className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            
            <div className="px-6 py-4.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest block">NUEVO RECURSO DE VIDEOTECA</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">Registrar Análisis Táctico</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 p-1.5 rounded-lg border border-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[450px]">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Título del Video</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Salida de balón presionado"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Equipo Rival</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Real Madrid Castilla"
                    value={newRival}
                    onChange={(e) => setNewRival(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Clasificación / Tipo de Sesión</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100"
                >
                  <option value="rival">Análisis de Rival (Scouting global)</option>
                  <option value="pre-partido">Pre-Partido (Instrucciones específicas y ABP)</option>
                  <option value="post-partido">Post-Partido (Análisis técnico y correcciones)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Enlace / URL de Video</label>
                <input
                  type="url"
                  required
                  placeholder="Ej: https://www.youtube.com/watch?v=scW7c8_OQMk"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Admite enlaces compartibles de YouTube, Vimeo, o enlaces directos a archivos de video (.mp4, .webm).</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1 font-mono">Descripción / Observaciones Tácticas Clave</label>
                <textarea
                  rows={4}
                  placeholder="Detalla las basculaciones, vigilancias, ABP ensayadas o detalles de los que los jugadores deben tomar notas..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-950 text-slate-100 placeholder-slate-600 resize-none"
                />
              </div>

            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-850 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitLoading ? 'Guardando...' : 'Crear Reporte'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
