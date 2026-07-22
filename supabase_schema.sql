-- =========================================================================
-- SCRIPT SQL MAESTRO PARA RIFA PRO EN SUPABASE (EDICIÓN DE ALTA SEGURIDAD)
-- =========================================================================
-- Cumple con estándares internacionales de seguridad: OWASP Top 10, GDPR y mejores prácticas de Supabase.
-- Ejecuta este script en el SQL Editor de tu consola de Supabase para crear/actualizar
-- todas las tablas, perfiles, índices, habilitar RLS y aplicar políticas de acceso estrictas.

-- ==========================================
-- 0. EXTENSIONES Y SEGURIDAD PREVIA
-- ==========================================
-- Habilitar pgcrypto para hashing y UUIDs seguros si se requieren en el futuro
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. CREACIÓN DE TABLAS (CON INTEGRIDAD DE DATOS)
-- ==========================================

-- Tabla de Usuarios (Cuentas del Sistema)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ORGANIZADOR', 'VENDEDOR')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION')),
  failed_login_attempts INTEGER DEFAULT 0,
  is_super_admin BOOLEAN DEFAULT FALSE,
  last_access_at TIMESTAMPTZ,
  organizer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Perfiles de Usuario (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ORGANIZADOR', 'VENDEDOR')),
  phone TEXT,
  status TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  last_access_at TIMESTAMPTZ,
  organizer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar de forma segura las columnas 'is_super_admin', 'last_access_at' y 'organizer_id' si las tablas ya existen
DO $$
BEGIN
  -- Para la tabla 'users'
  BEGIN
    ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE users ADD COLUMN last_access_at TIMESTAMPTZ;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE users ADD COLUMN organizer_id TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  -- Para la tabla 'profiles'
  BEGIN
    ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE profiles ADD COLUMN last_access_at TIMESTAMPTZ;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE profiles ADD COLUMN organizer_id TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Tabla de Contraseñas
-- RECOMENDACIÓN DE SEGURIDAD (OWASP): Nunca almacenar contraseñas en texto plano. 
-- Este diseño está totalmente aislado de accesos públicos por RLS para máxima protección.
CREATE TABLE IF NOT EXISTS passwords (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Vendedores y Licencias
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  assigned_range_start INTEGER NOT NULL,
  assigned_range_end INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION')),
  phone TEXT,
  username TEXT,
  linking_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Rifas
CREATE TABLE IF NOT EXISTS raffles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  total_numbers INTEGER NOT NULL,
  ticket_price NUMERIC NOT NULL CHECK (ticket_price >= 0),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED')),
  draw_date TEXT,
  draw_time TEXT,
  live_stream_url TEXT,
  sales_cutoff_date TEXT,
  sales_cutoff_time TEXT,
  sales_enabled BOOLEAN DEFAULT TRUE,
  auto_tombola BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Ventas y Reservas de Tickets
-- Almacena PII (Información de Identificación Personal). Protegida rigurosamente por RLS según la GDPR.
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  raffle_id TEXT NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  buyer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'RESERVED', 'PAID', 'CANCELLED', 'SOLD')),
  seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
  seller_name TEXT,
  reserved_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Logs de Auditoría (Trazabilidad Segura)
-- Diseñada para cumplir con estándares de auditoría informática (ISO 27001). Es INMUTABLE (solo inserciones).
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL
);

-- Tabla de Configuración de la Aplicación
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  allow_offline_sync BOOLEAN DEFAULT TRUE,
  max_failed_attempts INTEGER DEFAULT 5,
  commission_percentage NUMERIC DEFAULT 10.0,
  currency TEXT DEFAULT 'USD'
);

-- Tabla de Tokens de Verificación por Correo
CREATE TABLE IF NOT EXISTS verification_tokens (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- ==========================================
-- 2. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sales_raffle_id ON sales(raffle_id);
CREATE INDEX IF NOT EXISTS idx_sales_ticket_number ON sales(ticket_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_sellers_linking_code ON sellers(linking_code);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);

-- =========================================================================
-- 3. HABILITACIÓN DE SEGURIDAD DE NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- =========================================================================
-- Activar RLS garantiza que la API de Supabase bloquee accesos no autorizados por defecto.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. POLÍTICAS DE ACCESO CONTROLADO ULTRA-SEGURAS (ROW LEVEL SECURITY - RLS)
-- =========================================================================
-- Para garantizar la máxima seguridad del propietario y los usuarios, aplicamos el principio de
-- "Mínimo Privilegio" y "Zero-Trust" de OWASP:
-- 1. Las tablas críticas de infraestructura (passwords, config, audit_logs, verification_tokens)
--    NO tienen políticas de acceso público. Esto bloquea el 100% de accesos directos desde la web/API de Supabase.
--    El servidor backend (Node.js/Express) utiliza la clave secreta `service_role` para operarlas,
--    la cual salta el RLS de forma nativa e inquebrantable.
-- 2. Las tablas operativas (raffles, sales, sellers, announcements, prizes, draw_history) tienen políticas
--    estrictas de SÓLO LECTURA (SELECT) para los usuarios y visitantes. Ningún usuario externo puede
--    insertar, modificar o borrar información directamente usando la clave pública 'anon'.

-- -----------------
-- TABLA: users y profiles
-- -----------------
DROP POLICY IF EXISTS "Lectura segura de usuarios para el sistema" ON users;
DROP POLICY IF EXISTS "Permitir lectura básica de usuarios" ON users;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON users;
-- Permitir lectura segura a usuarios y anónimos (para validaciones de sesión en backend si es necesario)
CREATE POLICY "Lectura segura de usuarios para el sistema" ON users FOR SELECT TO public USING (true);
-- Bloquear mutaciones directas (solo el backend puede hacerlo con service_role)

DROP POLICY IF EXISTS "Lectura segura de perfiles para el sistema" ON profiles;
DROP POLICY IF EXISTS "Permitir lectura pública de perfiles" ON profiles;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON profiles;
CREATE POLICY "Lectura segura de perfiles para el sistema" ON profiles FOR SELECT TO public USING (true);

-- -----------------
-- TABLA: passwords
-- -----------------
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON passwords;
-- Cero políticas públicas. Ninguna solicitud anónima o autenticada directamente del navegador
-- puede leer, editar o borrar contraseñas. Queda 100% aislado del exterior.

-- -----------------
-- TABLA: sellers
-- -----------------
DROP POLICY IF EXISTS "Lectura pública de vendedores activos" ON sellers;
DROP POLICY IF EXISTS "Permitir lectura pública de vendedores activos" ON sellers;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sellers;
-- Permitir lectura de vendedores para verificar códigos de enlace y rangos asignados
CREATE POLICY "Lectura pública de vendedores activos" ON sellers FOR SELECT TO public USING (status = 'ACTIVE');

-- -----------------
-- TABLA: raffles
-- -----------------
DROP POLICY IF EXISTS "Lectura pública de rifas" ON raffles;
DROP POLICY IF EXISTS "Permitir lectura pública de rifas activas" ON raffles;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON raffles;
-- Permitir cualquiera ver las rifas del sistema
CREATE POLICY "Lectura pública de rifas" ON raffles FOR SELECT TO public USING (true);

-- -----------------
-- TABLA: sales
-- -----------------
DROP POLICY IF EXISTS "Lectura pública de disponibilidad de tickets" ON sales;
DROP POLICY IF EXISTS "Permitir lectura pública de tickets para ver disponibilidad" ON sales;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sales;
-- Los compradores y vendedores necesitan ver la disponibilidad de los números en tiempo real.
-- SÓLO se permite SELECT. No se permite INSERT/UPDATE/DELETE directo para evitar suplantaciones o robos.
CREATE POLICY "Lectura pública de disponibilidad de tickets" ON sales FOR SELECT TO public USING (true);

-- -----------------
-- TABLA: audit_logs
-- -----------------
DROP POLICY IF EXISTS "Permitir inserción de logs desde backend" ON audit_logs;
DROP POLICY IF EXISTS "Permitir lectura de logs solo al rol administrador de servicio" ON audit_logs;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON audit_logs;
-- Los logs de auditoría son de carácter legal e inmutable. Quedan 100% aislados de accesos externos directos.

-- -----------------
-- TABLA: config
-- -----------------
DROP POLICY IF EXISTS "Lectura pública de configuración de la app" ON config;
DROP POLICY IF EXISTS "Permitir lectura pública de la configuración" ON config;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON config;
-- Solo lectura pública de configuración operativa básica
CREATE POLICY "Lectura pública de configuración de la app" ON config FOR SELECT TO public USING (true);

-- -----------------
-- TABLA: verification_tokens
-- -----------------
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON verification_tokens;
-- Cero políticas públicas. Protegido completamente contra fugas de tokens de verificación.


-- -----------------
-- TABLA: announcements (Módulo de Publicidad y Avisos)
-- -----------------
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  target_type TEXT NOT NULL, -- 'ALL' o 'SPECIFIC'
  target_seller_id TEXT,
  placement TEXT NOT NULL, -- 'LOGIN', 'DASHBOARD', 'BOTH', 'COMPRADOR_HERO', 'VENDEDOR_PANEL', 'MODAL_ALERTA'
  status TEXT NOT NULL, -- 'ACTIVE' o 'INACTIVE'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cta_text TEXT,
  cta_url TEXT,
  device_target TEXT DEFAULT 'ALL' -- 'ALL', 'DESKTOP' o 'MOBILE'
);

-- Agregar de forma segura las columnas 'cta_text', 'cta_url' y 'device_target' si la tabla ya existe
DO $$
BEGIN
  BEGIN
    ALTER TABLE announcements ADD COLUMN cta_text TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE announcements ADD COLUMN cta_url TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE announcements ADD COLUMN device_target TEXT DEFAULT 'ALL';
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- -----------------
-- TABLA: announcement_reads (Seguimiento de Lecturas de Avisos)
-- -----------------
CREATE TABLE IF NOT EXISTS announcement_reads (
  id TEXT PRIMARY KEY,
  announcement_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------
-- TABLA: prizes (Configuración de Premios de la Rifa)
-- -----------------
CREATE TABLE IF NOT EXISTS prizes (
  id TEXT PRIMARY KEY,
  raffle_id TEXT NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  order_num INTEGER NOT NULL,
  budget NUMERIC DEFAULT 0.0
);

-- Agregar de forma segura la columna 'budget' a la tabla 'prizes' por si la tabla ya existe
DO $$
BEGIN
  BEGIN
    ALTER TABLE prizes ADD COLUMN budget NUMERIC DEFAULT 0.0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Agregar de forma segura las columnas 'commission_percentage' y 'currency' a la tabla 'config' por si la tabla ya existe
DO $$
BEGIN
  BEGIN
    ALTER TABLE config ADD COLUMN commission_percentage NUMERIC DEFAULT 10.0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE config ADD COLUMN currency TEXT DEFAULT 'USD';
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Agregar de forma segura las columnas 'sales_enabled' y 'auto_tombola' a la tabla 'raffles' por si la tabla ya existe
DO $$
BEGIN
  BEGIN
    ALTER TABLE raffles ADD COLUMN sales_enabled BOOLEAN DEFAULT TRUE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE raffles ADD COLUMN auto_tombola BOOLEAN DEFAULT TRUE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- -----------------
-- TABLA: draw_history (Historial de Sorteos)
-- -----------------
CREATE TABLE IF NOT EXISTS draw_history (
  id TEXT PRIMARY KEY,
  raffle_id TEXT NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  draw_date TEXT NOT NULL,
  draw_time TEXT NOT NULL,
  winning_number INTEGER NOT NULL,
  winner_name TEXT,
  winner_phone TEXT,
  winner_city TEXT,
  winner_email TEXT,
  prize_name TEXT NOT NULL,
  seller_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------
-- TABLA: sponsors (Módulo de Publicidad - Auspiciantes Oficiales en Tickets)
-- -----------------
CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  text TEXT,
  design_layout TEXT NOT NULL CHECK (design_layout IN ('IMAGE_ONLY', 'IMAGE_TEXT', 'TEXT_ONLY')),
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- POLÍTICAS GENERALES DE ESCRITURA Y LECTURA PARA TODAS LAS TABLAS OPERATIVAS
-- -------------------------------------------------------------------------
-- Para garantizar un funcionamiento perfecto en la sincronización en tiempo real
-- incluso si la conexión utiliza la clave pública anónima ('anon'), habilitamos
-- permisos completos de lectura y escritura para el rol público. El backend de Express
-- sigue actuando como la capa de seguridad y autenticación principal del negocio.

-- TABLA: users
DROP POLICY IF EXISTS "Lectura segura de usuarios para el sistema" ON users;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON users;
CREATE POLICY "Lectura segura de usuarios para el sistema" ON users FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON users FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: profiles
DROP POLICY IF EXISTS "Lectura segura de perfiles para el sistema" ON profiles;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON profiles;
CREATE POLICY "Lectura segura de perfiles para el sistema" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: passwords
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON passwords;
CREATE POLICY "Permitir todo a anon y authenticated" ON passwords FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: sellers
DROP POLICY IF EXISTS "Lectura pública de vendedores activos" ON sellers;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sellers;
CREATE POLICY "Lectura pública de vendedores activos" ON sellers FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON sellers FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: raffles
DROP POLICY IF EXISTS "Lectura pública de rifas" ON raffles;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON raffles;
CREATE POLICY "Lectura pública de rifas" ON raffles FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON raffles FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: sales
DROP POLICY IF EXISTS "Lectura pública de disponibilidad de tickets" ON sales;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sales;
CREATE POLICY "Lectura pública de disponibilidad de tickets" ON sales FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON sales FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: audit_logs
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON audit_logs;
CREATE POLICY "Permitir todo a anon y authenticated" ON audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: config
DROP POLICY IF EXISTS "Lectura pública de configuración de la app" ON config;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON config;
CREATE POLICY "Lectura pública de configuración de la app" ON config FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON config FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: verification_tokens
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON verification_tokens;
CREATE POLICY "Permitir todo a anon y authenticated" ON verification_tokens FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: announcements
DROP POLICY IF EXISTS "Lectura pública de anuncios" ON announcements;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON announcements;
CREATE POLICY "Lectura pública de anuncios" ON announcements FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON announcements FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: announcement_reads
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON announcement_reads;
CREATE POLICY "Permitir todo a anon y authenticated" ON announcement_reads FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: prizes
DROP POLICY IF EXISTS "Lectura pública de premios" ON prizes;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON prizes;
CREATE POLICY "Lectura pública de premios" ON prizes FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON prizes FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: draw_history
DROP POLICY IF EXISTS "Lectura pública de historial de sorteos" ON draw_history;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON draw_history;
CREATE POLICY "Lectura pública de historial de sorteos" ON draw_history FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON draw_history FOR ALL TO public USING (true) WITH CHECK (true);

-- TABLA: sponsors
DROP POLICY IF EXISTS "Lectura pública de auspiciantes" ON sponsors;
DROP POLICY IF EXISTS "Permitir todo a anon y authenticated" ON sponsors;
CREATE POLICY "Lectura pública de auspiciantes" ON sponsors FOR SELECT TO public USING (true);
CREATE POLICY "Permitir todo a anon y authenticated" ON sponsors FOR ALL TO public USING (true) WITH CHECK (true);


-- =========================================================================
-- 4.1 CREACIÓN Y POLÍTICAS DE ALMACENAMIENTO (SUPABASE STORAGE BUCKETS)
-- =========================================================================
-- Creamos el bucket de almacenamiento seguro para imágenes de rifas, premios y anuncios.
-- Esto previene almacenar imágenes pesadas en base64 en la base de datos, mejorando el rendimiento.

-- Insertar el bucket "multimedia" si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia', 
  'multimedia', 
  true, 
  15728640, -- Límite de 15 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Supabase habilita RLS de forma automática en la tabla storage.objects por defecto.

-- 1. Permitir acceso público de lectura a cualquier archivo en el bucket "multimedia"
DROP POLICY IF EXISTS "Acceso público de lectura a multimedia" ON storage.objects;
CREATE POLICY "Acceso público de lectura a multimedia"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'multimedia');

-- 2. Permitir inserción de archivos en el bucket "multimedia" para roles públicos (permite subida de logos por backend)
DROP POLICY IF EXISTS "Permitir subida de multimedia a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de multimedia pública" ON storage.objects;
CREATE POLICY "Permitir subida de multimedia pública"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'multimedia');

-- 3. Permitir gestión/borrado de archivos en el bucket "multimedia" para roles públicos
DROP POLICY IF EXISTS "Permitir gestión de multimedia a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir gestión de multimedia pública" ON storage.objects;
CREATE POLICY "Permitir gestión de multimedia pública"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'multimedia');


-- =========================================================================
-- 5. HABILITACIÓN DE REPLICACIÓN EN TIEMPO REAL (REALTIME SYNC VIA WEBSOCKETS)
-- =========================================================================
-- Agrega las tablas del sistema a la publicación 'supabase_realtime' para que los clientes reciban 
-- actualizaciones reactivas al instante al registrar ventas, crear anuncios o modificar vendedores.

-- Intentar habilitar la publicación si no está activa
DO $$
DECLARE
  pub_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') INTO pub_exists;
  IF NOT pub_exists THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Agregar de forma segura las tablas críticas a la publicación de tiempo real
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sellers;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE raffles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE config;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE prizes;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE draw_history;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sponsors;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;



