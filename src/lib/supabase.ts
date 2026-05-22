import { createClient } from '@supabase/supabase-js';
import { Jugador } from '../types';
import { MOCK_PLAYERS } from '../data/mockPlayers';

// Fetch Supabase configuration
const getSupabaseCredentials = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('supabase_url') || '';
  const localKey = localStorage.getItem('supabase_key') || '';

  const finalUrl = localUrl || envUrl;
  const finalKey = localKey || envKey;

  return {
    url: finalUrl,
    key: finalKey,
    isConfigured: !!(finalUrl && finalKey),
  };
};

export const getSupabaseConfigState = () => {
  const { url, key, isConfigured } = getSupabaseCredentials();
  return {
    supabaseUrl: url,
    supabaseKey: key,
    isConfigured,
    isMock: !isConfigured,
  };
};

const credentials = getSupabaseCredentials();

export const supabase = credentials.isConfigured
  ? createClient(credentials.url, credentials.key)
  : null;

// LocalStorage key for mock data persistence
const LOCAL_STORAGE_PLAYERS_KEY = 'futbol_app_jugadores';
const LOCAL_STORAGE_USER_KEY = 'futbol_app_mock_user';

// Ensure seed data is initialized in mock mode
export const getLocalPlayers = (): Jugador[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_PLAYERS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(MOCK_PLAYERS));
    return MOCK_PLAYERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return MOCK_PLAYERS;
  }
};

export const setLocalPlayers = (players: Jugador[]): void => {
  localStorage.setItem(LOCAL_STORAGE_PLAYERS_KEY, JSON.stringify(players));
};

export const getLocalUser = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setLocalUser = (user: any) => {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }
};

// SQL code helper
export const SUPABASE_SQL_CODE = `-- 1. CREAR LA TABLA JUGADORES
CREATE TABLE jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dorsal INT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  demarcacion VARCHAR(50) NOT NULL CHECK (demarcacion IN ('Portero', 'Defensa', 'Centrocampista', 'Delantero')),
  lateralidad VARCHAR(50) NOT NULL CHECK (lateralidad IN ('Diestro', 'Zurdo', 'Ambidiestro')),
  equipo VARCHAR(150) NOT NULL,
  foto_jugador TEXT,
  observaciones TEXT,
  velocidad INT DEFAULT 3 CHECK (velocidad >= 1 AND velocidad <= 5),
  remate INT DEFAULT 3 CHECK (remate >= 1 AND remate <= 5),
  pase INT DEFAULT 3 CHECK (pase >= 1 AND pase <= 5),
  tecnica INT DEFAULT 3 CHECK (tecnica >= 1 AND tecnica <= 5),
  defensa INT DEFAULT 3 CHECK (defensa >= 1 AND defensa <= 5),
  actitud INT DEFAULT 3 CHECK (actitud >= 1 AND actitud <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. ACTIVAR EL ROW LEVEL SECURITY (RLS) PARA SEGURIDAD
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACCESO PARA LA TABLA JUGADORES
-- Permitir lectura pública a cualquier usuario
CREATE POLICY "Permitir lectura publica" ON jugadores
  FOR SELECT USING (true);

-- Permitir escritura completa (INSERT, UPDATE, DELETE) solo a usuarios autenticados
CREATE POLICY "Permitir escritura completa a autenticados" ON jugadores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. CONFIGURAR SUPABASE STORAGE
-- (Nota: Recuerda crear primero un Bucket llamado "jugadores" con acceso público en el panel de Storage)

-- Politica: Permitir lectura publica a fotos de jugadores
CREATE POLICY "Fotos publicas" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'jugadores');

-- Politica: Permitir insercion y actualizacion de fotos a usuarios autenticados
CREATE POLICY "Autenticados pueden subir fotos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'jugadores');

CREATE POLICY "Autenticados pueden borrar fotos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'jugadores');

-- 5. CREAR LA TABLA VIDEOTECA (ANÁLISIS DE VIDEO)
CREATE TABLE IF NOT EXISTS video_analisis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(150) NOT NULL,
  rival VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('rival', 'pre-partido', 'post-partido')),
  url_video TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ACTIVAR RLS
ALTER TABLE video_analisis ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO
CREATE POLICY "Permitir lectura publica de videos" ON video_analisis
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura completa de videos a autenticados" ON video_analisis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;
