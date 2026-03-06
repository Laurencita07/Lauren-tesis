/**
 * Esquema de la base de datos SQLite.
 * Alineado con el modelo conceptual: Estudio, Sujeto, Pesquisaje, Inclusión, Usuario, Auditoría, PlantillaCRD, HojaCRD.
 * Soporta RF-2 a RF-22 (campos para inclusión directa, pesquisaje, auditoría, etc.).
 */

export const SCHEMA_SQL = `
-- Versión del esquema (para migraciones)
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO schema_version (version) VALUES (1);

-- Estudios (ensayos clínicos) - Clase Estudio
CREATE TABLE IF NOT EXISTS estudios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Usuarios locales (investigador) - Clase Usuario / RF-1
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  iniciales TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sujetos del estudio - Clase Sujeto (RF-2, RF-3, RF-7, RF-8, RF-9, RF-10)
CREATE TABLE IF NOT EXISTS sujetos (
  id TEXT PRIMARY KEY,
  identificador_logico TEXT NOT NULL,
  estudio_id TEXT NOT NULL,
  -- Datos mínimos / inclusión directa (RF-3, RF-5, RF-7)
  iniciales TEXT,
  nombre TEXT,
  apellidos TEXT,
  sexo TEXT,
  fecha_nacimiento TEXT,
  direccion TEXT,
  telefono TEXT,
  observaciones TEXT,
  -- Inclusión
  fecha_inclusion TEXT,
  numero_inclusion TEXT,
  grupo_sujeto TEXT,
  iniciales_centro TEXT,
  hora_inclusion TEXT,
  tipo_inclusion TEXT,
  -- Estados (RF-10, RF-11, RF-12)
  estado_inclusion TEXT,
  estado_tratamiento TEXT,
  estado_monitoreo TEXT,
  -- Anulación lógica (RF-8)
  anulado INTEGER NOT NULL DEFAULT 0,
  motivo_anulacion TEXT,
  fecha_anulacion TEXT,
  -- Sincronización
  sincronizado INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(estudio_id, identificador_logico),
  FOREIGN KEY (estudio_id) REFERENCES estudios(id)
);

CREATE INDEX IF NOT EXISTS idx_sujetos_estudio ON sujetos(estudio_id);
CREATE INDEX IF NOT EXISTS idx_sujetos_identificador ON sujetos(identificador_logico);
CREATE INDEX IF NOT EXISTS idx_sujetos_estado_inclusion ON sujetos(estado_inclusion);
-- idx_sujetos_anulado e idx_sujetos_sincronizado se crean en runMigrations (tras añadir columnas en BDs antiguas)

-- Pesquisaje - Clase Pesquisaje (RF-2, RF-14, RF-15, RF-16)
CREATE TABLE IF NOT EXISTS pesquisaje (
  id TEXT PRIMARY KEY,
  sujeto_id TEXT NOT NULL UNIQUE,
  resultado TEXT,
  observaciones TEXT,
  usuario_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sujeto_id) REFERENCES sujetos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pesquisaje_sujeto ON pesquisaje(sujeto_id);

-- Inclusión formal - Clase Inclusión (RF-3, RF-17)
CREATE TABLE IF NOT EXISTS inclusiones (
  id TEXT PRIMARY KEY,
  sujeto_id TEXT NOT NULL,
  fecha_inclusion TEXT NOT NULL,
  numero_inclusion TEXT,
  grupo_sujeto TEXT,
  iniciales_centro TEXT,
  hora_inclusion TEXT,
  usuario_id TEXT,
  tipo TEXT NOT NULL,
  revertido INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sujeto_id) REFERENCES sujetos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_inclusiones_sujeto ON inclusiones(sujeto_id);

-- Auditoría - Clase Auditoría (RF-19)
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  tabla TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  accion TEXT NOT NULL,
  campos_anteriores TEXT,
  campos_nuevos TEXT,
  usuario_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_registro ON auditoria(tabla, registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created ON auditoria(created_at);

-- Plantillas CRD - Clase PlantillaCRD (RF-21). tipo: 'pesquisaje' | 'evaluacion_inicial'
CREATE TABLE IF NOT EXISTS plantillas_crd (
  id TEXT PRIMARY KEY,
  estudio_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  codigo TEXT,
  tipo TEXT NOT NULL DEFAULT 'evaluacion_inicial',
  version TEXT,
  definicion_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (estudio_id) REFERENCES estudios(id)
);

-- Hojas CRD - Clase HojaCRD (instancia de formulario por sujeto)
CREATE TABLE IF NOT EXISTS hojas_crd (
  id TEXT PRIMARY KEY,
  sujeto_id TEXT NOT NULL,
  plantilla_id TEXT NOT NULL,
  datos_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sujeto_id) REFERENCES sujetos(id),
  FOREIGN KEY (plantilla_id) REFERENCES plantillas_crd(id)
);

CREATE INDEX IF NOT EXISTS idx_hojas_crd_sujeto ON hojas_crd(sujeto_id);
`;

/**
 * Columnas a añadir a la tabla sujetos en instalaciones que ya tenían la versión antigua del esquema.
 * Se ejecutan con try/catch para ignorar "column already exists".
 */
export const SUJETOS_ADD_COLUMNS: string[] = [
  'ALTER TABLE sujetos ADD COLUMN iniciales TEXT',
  'ALTER TABLE sujetos ADD COLUMN nombre TEXT',
  'ALTER TABLE sujetos ADD COLUMN apellidos TEXT',
  'ALTER TABLE sujetos ADD COLUMN sexo TEXT',
  'ALTER TABLE sujetos ADD COLUMN fecha_nacimiento TEXT',
  'ALTER TABLE sujetos ADD COLUMN direccion TEXT',
  'ALTER TABLE sujetos ADD COLUMN telefono TEXT',
  'ALTER TABLE sujetos ADD COLUMN observaciones TEXT',
  'ALTER TABLE sujetos ADD COLUMN fecha_inclusion TEXT',
  'ALTER TABLE sujetos ADD COLUMN numero_inclusion TEXT',
  'ALTER TABLE sujetos ADD COLUMN grupo_sujeto TEXT',
  'ALTER TABLE sujetos ADD COLUMN iniciales_centro TEXT',
  'ALTER TABLE sujetos ADD COLUMN hora_inclusion TEXT',
  'ALTER TABLE sujetos ADD COLUMN tipo_inclusion TEXT',
  'ALTER TABLE sujetos ADD COLUMN anulado INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE sujetos ADD COLUMN motivo_anulacion TEXT',
  'ALTER TABLE sujetos ADD COLUMN fecha_anulacion TEXT',
  'ALTER TABLE sujetos ADD COLUMN sincronizado INTEGER NOT NULL DEFAULT 0',
];

/**
 * Índices que dependen de columnas añadidas por migración.
 * Se ejecutan después de SUJETOS_ADD_COLUMNS para que en BDs antiguas existan ya las columnas.
 */
export const SUJETOS_ADD_INDEXES: string[] = [
  'CREATE INDEX IF NOT EXISTS idx_sujetos_anulado ON sujetos(anulado)',
  'CREATE INDEX IF NOT EXISTS idx_sujetos_sincronizado ON sujetos(sincronizado)',
];

/** Migración: columna tipo en plantillas_crd */
export const PLANTILLAS_ADD_TIPO: string[] = [
  'ALTER TABLE plantillas_crd ADD COLUMN tipo TEXT NOT NULL DEFAULT \'evaluacion_inicial\'',
];
