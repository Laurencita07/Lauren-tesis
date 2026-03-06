/**
 * Preload: expone una API segura al renderer vía contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  dbPing: () => ipcRenderer.invoke('db:ping'),

  estudio: {
    obtenerOCrearDefault: () => ipcRenderer.invoke('estudio:obtenerOCrearDefault'),
    listar: () => ipcRenderer.invoke('estudio:listar'),
  },

  subject: {
    crearParaPesquisaje: (estudioId: string, iniciales: string, usuarioId?: string) =>
      ipcRenderer.invoke('subject:crearParaPesquisaje', estudioId, iniciales, usuarioId),
    crearInclusionDirecta: (estudioId: string, datos: {
      iniciales: string;
      fechaInclusion: string;
      numeroInclusion: string;
      grupoSujeto: string;
      horaInclusion?: string;
      inicialesCentro?: string;
    }, usuarioId?: string) =>
      ipcRenderer.invoke('subject:crearInclusionDirecta', estudioId, datos, usuarioId),
    validarIdentificador: (estudioId: string, iniciales: string, numeroInclusion: string, excluirSujetoId?: string) =>
      ipcRenderer.invoke('subject:validarIdentificador', estudioId, iniciales, numeroInclusion, excluirSujetoId),
    listarPendientesPesquisaje: (estudioId: string) =>
      ipcRenderer.invoke('subject:listarPendientesPesquisaje', estudioId),
    listarIncluidos: (estudioId: string, opts?: { identificador?: string; estadoInclusion?: string }) =>
      ipcRenderer.invoke('subject:listarIncluidos', estudioId, opts),
    listarTodosParaGestionar: (estudioId: string, opts?: { identificador?: string }) =>
      ipcRenderer.invoke('subject:listarTodosParaGestionar', estudioId, opts),
    obtenerPorId: (sujetoId: string) => ipcRenderer.invoke('subject:obtenerPorId', sujetoId),
    actualizarResultadoPesquisaje: (sujetoId: string, resultado: 'Incluido' | 'No Incluido', datosInclusion?: {
      numeroInclusion: string;
      grupoSujeto?: string;
      fechaInclusion?: string;
      horaInclusion?: string;
    }) =>
      ipcRenderer.invoke('subject:actualizarResultadoPesquisaje', sujetoId, resultado, datosInclusion),
    contarParaSincronizacion: (estudioId: string) =>
      ipcRenderer.invoke('subject:contarParaSincronizacion', estudioId),
    anular: (sujetoId: string, motivo?: string) =>
      ipcRenderer.invoke('subject:anular', sujetoId, motivo),
  },

  template: {
    importarDesdeArchivo: (estudioId: string, tipo: 'pesquisaje' | 'evaluacion_inicial', nombre: string) =>
      ipcRenderer.invoke('template:importarDesdeArchivo', estudioId, tipo, nombre),
    importarDesdeRuta: (filePath: string, estudioId: string, tipo: 'pesquisaje' | 'evaluacion_inicial', nombre: string) =>
      ipcRenderer.invoke('template:importarDesdeRuta', filePath, estudioId, tipo, nombre),
    listar: (estudioId: string, tipo?: 'pesquisaje' | 'evaluacion_inicial') =>
      ipcRenderer.invoke('template:listar', estudioId, tipo),
    obtenerDefinicion: (plantillaId: string) => ipcRenderer.invoke('template:obtenerDefinicion', plantillaId),
    eliminar: (plantillaId: string) => ipcRenderer.invoke('template:eliminar', plantillaId),
  },

  crd: {
    obtenerOCrearHoja: (sujetoId: string, plantillaId: string) =>
      ipcRenderer.invoke('crd:obtenerOCrearHoja', sujetoId, plantillaId),
    guardarDatosHoja: (hojaId: string, datos: Record<string, unknown>) =>
      ipcRenderer.invoke('crd:guardarDatosHoja', hojaId, datos),
    cargarDefinicionFormulario: (plantillaId: string) =>
      ipcRenderer.invoke('crd:cargarDefinicionFormulario', plantillaId),
    exportarJson: (hojaId: string) => ipcRenderer.invoke('crd:exportarJson', hojaId),
    exportarExcel: (hojaId: string) => ipcRenderer.invoke('crd:exportarExcel', hojaId),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
