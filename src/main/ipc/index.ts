/**
 * Registro de handlers IPC.
 * El renderer invoca estos canales a través del preload (contextBridge).
 */

import { ipcMain } from 'electron';
import { getDatabase } from '../database';
import { registerSubjectHandlers } from './handlers/subject';
import { registerTemplateHandlers } from './handlers/template';
import { registerCrdHandlers } from './handlers/crd';
import { registerEstudioHandlers } from './handlers/estudio';

export function registerIpcHandlers(): void {
  const db = getDatabase();

  ipcMain.handle('app:getVersion', () => ({ version: process.env.npm_package_version || '1.0.0' }));

  ipcMain.handle('db:ping', () => {
    const stmt = db.prepare('SELECT 1');
    stmt.get();
    return { ok: true };
  });

  registerEstudioHandlers();
  registerSubjectHandlers();
  registerTemplateHandlers();
  registerCrdHandlers();
}
