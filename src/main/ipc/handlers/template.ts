/**
 * Handlers IPC para TemplateService (importar plantilla desde Excel).
 */

import { ipcMain, dialog } from 'electron';
import { getDatabase } from '../../database';
import * as TemplateService from '../../services/TemplateService';

export function registerTemplateHandlers(): void {
  const db = getDatabase();

  ipcMain.handle('template:importarDesdeArchivo', async (_, estudioId: string, tipo: TemplateService.TipoPlantilla, nombre: string) => {
    const result = await dialog.showOpenDialog({
      title: 'Seleccionar plantilla (Excel o JSON)',
      filters: [
        { name: 'Todos los soportados', extensions: ['xlsx', 'xls', 'json'] },
        { name: 'Excel', extensions: ['xlsx', 'xls'] },
        { name: 'JSON', extensions: ['json'] },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }
    return TemplateService.importarDesdeArchivo(db, result.filePaths[0], estudioId, tipo, nombre);
  });

  ipcMain.handle('template:importarDesdeRuta', async (_, filePath: string, estudioId: string, tipo: TemplateService.TipoPlantilla, nombre: string) => {
    return TemplateService.importarDesdeArchivo(db, filePath, estudioId, tipo, nombre);
  });

  ipcMain.handle('template:listar', (_, estudioId: string, tipo?: TemplateService.TipoPlantilla) => {
    return TemplateService.listarPlantillas(db, estudioId, tipo);
  });

  ipcMain.handle('template:obtenerDefinicion', (_, plantillaId: string) => {
    return TemplateService.obtenerDefinicion(db, plantillaId);
  });

  ipcMain.handle('template:eliminar', (_, plantillaId: string) => {
    return TemplateService.eliminarPlantilla(db, plantillaId);
  });
}
