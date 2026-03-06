/**
 * Handlers IPC para SubjectService.
 */

import { ipcMain } from 'electron';
import { getDatabase } from '../../database';
import * as SubjectService from '../../services/SubjectService';

export function registerSubjectHandlers(): void {
  const db = getDatabase();

  ipcMain.handle('subject:crearParaPesquisaje', (_, estudioId: string, iniciales: string, usuarioId?: string) => {
    return SubjectService.crearParaPesquisaje(db, estudioId, iniciales, usuarioId);
  });

  ipcMain.handle('subject:crearInclusionDirecta', (_, estudioId: string, datos: {
    iniciales: string;
    fechaInclusion: string;
    numeroInclusion: string;
    grupoSujeto: string;
    horaInclusion?: string;
    inicialesCentro?: string;
  }, usuarioId?: string) => {
    return SubjectService.crearInclusionDirecta(db, estudioId, datos, usuarioId);
  });

  ipcMain.handle('subject:validarIdentificador', (_, estudioId: string, iniciales: string, numeroInclusion: string, excluirSujetoId?: string) => {
    return SubjectService.validarIdentificadorUnico(db, estudioId, iniciales, numeroInclusion, excluirSujetoId);
  });

  ipcMain.handle('subject:listarPendientesPesquisaje', (_, estudioId: string) => {
    return SubjectService.listarPendientesPesquisaje(db, estudioId);
  });

  ipcMain.handle('subject:listarIncluidos', (_, estudioId: string, opts?: { identificador?: string; estadoInclusion?: string }) => {
    return SubjectService.listarIncluidos(db, estudioId, opts);
  });

  ipcMain.handle('subject:listarTodosParaGestionar', (_, estudioId: string, opts?: { identificador?: string }) => {
    return SubjectService.listarTodosParaGestionar(db, estudioId, opts);
  });

  ipcMain.handle('subject:obtenerPorId', (_, sujetoId: string) => {
    return SubjectService.obtenerPorId(db, sujetoId);
  });

  ipcMain.handle('subject:actualizarResultadoPesquisaje', (_, sujetoId: string, resultado: 'Incluido' | 'No Incluido', datosInclusion?: {
    numeroInclusion: string;
    grupoSujeto?: string;
    fechaInclusion?: string;
    horaInclusion?: string;
  }, usuarioId?: string) => {
    SubjectService.actualizarResultadoPesquisaje(db, sujetoId, resultado, datosInclusion, usuarioId);
  });

  ipcMain.handle('subject:contarParaSincronizacion', (_, estudioId: string) => {
    return SubjectService.contarParaSincronizacion(db, estudioId);
  });

  ipcMain.handle('subject:anular', (_, sujetoId: string, motivo?: string) => {
    return SubjectService.anularSujeto(db, sujetoId, motivo);
  });
}
