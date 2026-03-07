/**
 * Conexión a SQLite y inicialización del esquema.
 * La base de datos se almacena en userData de Electron (persistente por usuario).
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import { SCHEMA_SQL, SUJETOS_ADD_COLUMNS, SUJETOS_ADD_INDEXES, PLANTILLAS_ADD_TIPO } from './schema';

let db: Database.Database | null = null;

function getDbPath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'xavia-sidec.db');
}

/** Ejecuta migraciones: añade columnas a sujetos e índices si la BD era de una versión anterior. */
function runMigrations(database: Database.Database): void {
  for (const sql of SUJETOS_ADD_COLUMNS) {
    try {
      database.exec(sql);
    } catch {
      // Columna ya existe; ignorar
    }
  }
  for (const sql of SUJETOS_ADD_INDEXES) {
    try {
      database.exec(sql);
    } catch {
      // Índice ya existe; ignorar
    }
  }
  for (const sql of PLANTILLAS_ADD_TIPO) {
    try {
      database.exec(sql);
    } catch {
      // Columna ya existe
    }
  }
  // Actualiza identificador_logico de todos los sujetos al formato correcto:
  // CIM_FL_ + código/nombre del estudio + _ + iniciales + _ + número de inclusión.
  // Así los ya registrados quedan como se pide (sin UUID del estudio en el nombre).
  try {
    database.exec(
      `UPDATE sujetos SET identificador_logico = (
        SELECT 'CIM_FL_' || COALESCE(trim(e.codigo), trim(e.nombre), e.id) || '_' || COALESCE(trim(sujetos.iniciales), '') || '_' || COALESCE(trim(sujetos.numero_inclusion), '')
        FROM estudios e WHERE e.id = sujetos.estudio_id
      )`
    );
  } catch {
    // Si la columna no existe o falla la migración, ignorar.
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA_SQL);
    runMigrations(db);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
