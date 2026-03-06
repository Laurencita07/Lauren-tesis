/**
 * Gestión de la ventana principal de la aplicación.
 */

import { BrowserWindow } from 'electron';
import * as path from 'path';

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    title: 'XAVIA SIDEC - Cliente Offline',
  });

  const htmlPath = path.join(__dirname, '../renderer/index.html');
  win.loadFile(htmlPath);

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}
