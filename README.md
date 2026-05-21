# ⚽ Gestor de Plantilla de Fútbol (Supabase + React + Vite)

Una aplicación web moderna, intuitiva, rápida y responsive para gestionar la plantilla, cuerpo técnico y rendimiento de un equipo de fútbol profesional o amateur.

La aplicación viene con **20 jugadores iniciales precargados** organizados por posiciones de campo, estadísticas demográficas automatizadas (edad promedio, balance de líneas de juego, pies dominantes) y un potente sistema dual de almacenamiento y autenticación que funciona tanto de forma local offline (demo interactiva instantánea) como conectada a **Supabase**.

---

## 🚀 Características Principales

- **Ficha Técnica Detallada**: ID, nombre, apellidos, dorsal, fecha de nacimiento, demarcación táctica (Portero, Defensa, Centrocampista, Delantero), lateralidad (pie dominante), club de origen y observaciones.
- **Acceso Autorizado (Supabase Auth)**: Rol de administrador protegido con email y contraseña, lo que habilita los controles de inserción, edición o baja de futbolistas.
- **Almacenamiento de Fotos (Supabase Storage)**: Subida de imágenes mediante drag-and-drop y sincronización con el Bucket público de Supabase `jugadores`.
- **Estadísticas en Tiempo Real**: Tarjetas analíticas dinámicas procesando el promedio de edad y distribución táctica.
- **Doble Vista Multi-Pantalla**: Toggles de diseño para alternar entre vista de **Cuadrícula de Cromos** e **Informe Técnico Tabular** optimizado para tabletas y computadores de escritorio.
- **Adaptable y Responsive**: Confeccionada con Tailwind CSS 4 para garantizar legibilidad óptima y navegación fluida en teléfonos móviles.

---

## ⚙️ Conexión con Supabase (Paso a Paso)

Para conectar tu propia base de datos, sigue los siguientes pasos recomendados:

### 1. Crear la Tabla y las Políticas en Supabase
Ingresa a tu consola de [Supabase](https://supabase.com/), abre la pestaña de **SQL Editor**, crea una nueva consulta (**New Query**) y ejecuta el siguiente script:

```sql
-- 1. CREAR LA TABLA JUGADORES
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

-- 4. CONFIGURAR SUPABASE STORAGE POLICIES
-- Politica: Permitir lectura publica a fotos de jugadores
CREATE POLICY "Fotos publicas" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'jugadores');

-- Politica: Permitir insercion y actualizacion de fotos a usuarios autenticados
CREATE POLICY "Autenticados pueden subir fotos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'jugadores');

CREATE POLICY "Autenticados pueden borrar fotos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'jugadores');
```

### 2. Crear el Bucket de Almacenamiento (Storage)
1. En el menú izquierdo de Supabase, entra en **Storage**.
2. Presiona el botón verde **New Bucket**.
3. Nómbralo exactamente **`jugadores`**.
4. Activa la casilla **Public Bucket** (requerido para que las imágenes sean visibles públicamente en el navegador).
5. Guarda el bucket.

---

## 🛠️ Despliegue en Vercel y GitHub

Este proyecto ha sido estructurado en una arquitectura SPA de React con enrutamiento de precisión y está totalmente preparado para su despliegue en Vercel.

### 👥 Subir el proyecto a tu cuenta de GitHub
1. Inicializa un repositorio Git localmente en el directorio del proyecto:
   ```bash
   git init
   git add .
   git commit -m "feat: init futbol manager app with supabase"
   ```
2. Crea un repositorio vacío en tu cuenta de GitHub.
3. Agrega tu repositorio de GitHub como origen remoto y sube tus cambios:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

### ⛵ Configuración del Despliegue en Vercel
1. Ingresa a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Presiona **Add New... &gt; Project** e importa este repositorio.
3. En el apartado de **Environment Variables (Variables de Entorno)**, define los siguientes campos:
   - `VITE_SUPABASE_URL`: Tu URL del proyecto de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu clave pública anon de la API de Supabase.
4. Presiona **Deploy**. Vercel se encargará de compilar la app usando la configuración adaptiva y el direccionamiento seguro especificados en `vercel.json`.

---

## 💻 Desarrollo Local

Para correr este proyecto en tu entorno local:

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```
2. Crea una copia de las variables de entorno de ejemplo:
   ```bash
   cp .env.example .env
   ```
3. Introduce tus claves en el archivo `.env`:
   ```env
   VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
   VITE_SUPABASE_ANON_KEY="tu-clave-secreta-anon"
   ```
4. Corre el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre [http://localhost:3000](http://localhost:3000) o el puerto indicado en tu terminal.
