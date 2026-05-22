export interface Jugador {
  id: string;
  nombre: string;
  apellidos: string;
  dorsal: number;
  fecha_nacimiento: string;
  demarcacion: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';
  lateralidad: 'Diestro' | 'Zurdo' | 'Ambidiestro';
  equipo: string;
  foto_jugador: string;
  observaciones: string;
  created_at: string;
  // Atributos cuantitativos (1 al 5)
  velocidad: number;
  remate: number;
  pase: number;
  tecnica: number;
  defensa: number;
  actitud: number;
}

export interface SupabaseConfigState {
  supabaseUrl: string;
  supabaseKey: string;
  isConfigured: boolean;
  isMock: boolean;
}

export interface TeamStats {
  totalPlayers: number;
  avgAge: number;
  byDemarcacion: Record<string, number>;
  byLateralidad: Record<string, number>;
}

export interface VideoAnalisis {
  id: string;
  titulo: string;
  rival: string;
  tipo: 'rival' | 'pre-partido' | 'post-partido';
  url_video: string;
  descripcion: string;
  created_at: string;
}

export interface JugadorRendimiento {
  jugador_id: string;
  nombre_completo: string;
  posicion: string;
  minutos: number;
  tarjetas: 'Ninguna' | 'Amarilla' | 'Roja' | 'Doble Amarilla';
  goles: number;
  asistencias: number;
  valoracion: number; // Player's individual rating (0 - 10)
}

export interface ResumenTemporadaJugador {
  jugador_id: string;
  nombre_completo: string;
  partidos_jugados: number;
  minutos_totales: number;
  asistencias_totales: number;
  goles_totales: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  valoracion_media: number;
  updated_at?: string;
}

export interface InformePostPartido {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  campo: string;
  fecha: string;
  hora: string;
  resumen: string;
  valoracion_global: number; // 1 to 5 stars
  rendimientos: JugadorRendimiento[];
  created_at: string;
}

export type IndiceCarga = 'Alta' | 'Media' | 'Baja' | 'Charla' | 'Preventivo' | 'Recuperación';

export interface CalendarioEvento {
  id: string;
  titulo: string;
  tipo_evento: 'entrenamiento' | 'partido';
  fecha: string;
  hora: string;
  indice_carga: IndiceCarga;
  notas?: string;
  created_at?: string;
}


