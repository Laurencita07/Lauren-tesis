/**
 * Handlers IPC para CrdService (hojas CRD, exportación).
 */

import { ipcMain, dialog } from 'electron';
import { getDatabase } from '../../database';
import * as CrdService from '../../services/CrdService';

export function registerCrdHandlers(): void {
  const db = getDatabase();

  ipcMain.handle('crd:obtenerOCrearHoja', (_, sujetoId: string, plantillaId: string) => {
    return CrdService.obtenerOCrearHoja(db, sujetoId, plantillaId);
  });

  ipcMain.handle('crd:guardarDatosHoja', (_, hojaId: string, datos: Record<string, unknown>) => {
    CrdService.guardarDatosHoja(db, hojaId, datos);
  });

  ipcMain.handle('crd:cargarDefinicionFormulario', (_, plantillaId: string) => {
    return CrdService.cargarDefinicionFormulario(db, plantillaId);
  });

  ipcMain.handle('crd:exportarJson', async (_, hojaId: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Exportar hoja CRD (JSON)',
      defaultPath: `hoja-crd-${hojaId.slice(0, 8)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    CrdService.exportarHojaJson(db, hojaId, result.filePath);
    return { path: result.filePath };
  });

  ipcMain.handle('crd:exportarExcel', async (_, hojaId: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Exportar hoja CRD (Excel)',
      defaultPath: `hoja-crd-${hojaId.slice(0, 8)}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await CrdService.exportarHojaExcel(db, hojaId, result.filePath);
    return { path: result.filePath };
  });
}
