/**
 * Handlers IPC para estudios (obtener o crear por defecto).
 */

import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../database';

export function registerEstudioHandlers(): void {
  const db = getDatabase();

  ipcMain.handle('estudio:obtenerOCrearDefault', () => {
    const row = db.prepare('SELECT id, nombre, codigo FROM estudios LIMIT 1').get() as { id: string; nombre: string; codigo: string | null } | undefined;
    if (row) return { id: row.id, nombre: row.nombre, codigo: row.codigo };
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO estudios (id, nombre, codigo, created_at) VALUES (?, ?, ?, ?)')
      .run(id, 'Estudio Demo', 'DEMO', now);
    return { id, nombre: 'Estudio Demo', codigo: 'DEMO' };
  });

  ipcMain.handle('estudio:listar', () => {
    return db.prepare('SELECT id, nombre, codigo, created_at FROM estudios ORDER BY created_at').all();
  });
}
