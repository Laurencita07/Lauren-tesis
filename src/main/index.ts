/**
 * Punto de entrada del proceso principal (Main Process).
 * Inicializa la ventana, IPC y base de datos.
 */

import { app, BrowserWindow } from 'electron';
import { closeDatabase } from './database';
import { registerIpcHandlers } from './ipc';
import { createMainWindow } from './window';

function init(): void {
  registerIpcHandlers();
  createMainWindow();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  closeDatabase();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
