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
