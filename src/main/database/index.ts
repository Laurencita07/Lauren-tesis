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
  // Normaliza identificadores lógicos existentes al formato CIM_FL_ESTUDIO_INICIALES_NUMERO.
  // - Si empiezan por 'CIM-FL-' o 'CIMFL_', se elimina ese prefijo temporal.
  // - Después se sustituyen '-' por '_' y se antepone 'CIM_FL_'.
  try {
    database.exec(
      "UPDATE sujetos SET identificador_logico = 'CIM_FL_' || REPLACE(CASE " +
        "WHEN identificador_logico LIKE 'CIM-FL-%' THEN substr(identificador_logico, length('CIM-FL-') + 1) " +
        "WHEN identificador_logico LIKE 'CIMFL_%' THEN substr(identificador_logico, length('CIMFL_') + 1) " +
        "ELSE identificador_logico END, '-', '_') " +
      "WHERE identificador_logico NOT LIKE 'CIM_FL_%'"
    );
  } catch {
    // Si la columna no existe o ya están migrados, ignorar.
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
