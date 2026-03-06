/**
 * Tipos compartidos entre main y renderer.
 * Alineados con el modelo conceptual y requisitos funcionales (RF).
 */

/** Usuario local / investigador (RF-1) */
export interface UsuarioLocal {
  id: string;
  email: string;
  nombre?: string;
  iniciales?: string;
  createdAt: string;
}

/** Estudio - ensayo clínico */
export interface Estudio {
  id: string;
  nombre: string;
  codigo?: string;
  createdAt: string;
}

/** Estados posibles del sujeto en el proceso (RF-10) */
export type EstadoInclusion = 'pendiente' | 'incluido' | 'no_incluido' | 'anulado';

/** Sujeto - participante en el estudio (RF-2 a RF-10, RF-13) */
export interface Sujeto {
  id: string;
  identificadorLogico: string;
  estudioId: string;
  iniciales?: string;
  nombre?: string;
  apellidos?: string;
  sexo?: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  observaciones?: string;
  fechaInclusion?: string;
  numeroInclusion?: string;
  grupoSujeto?: string;
  inicialesCentro?: string;
  horaInclusion?: string;
  tipoInclusion?: string;
  estadoInclusion?: EstadoInclusion | string;
  estadoTratamiento?: string;
  estadoMonitoreo?: string;
  anulado: boolean;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  sincronizado: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Resultado del pesquisaje (RF-15) */
export type ResultadoPesquisaje = 'cumple' | 'no_cumple';

/** Pesquisaje - evaluación inicial (RF-2, RF-14, RF-15, RF-16) */
export interface Pesquisaje {
  id: string;
  sujetoId: string;
  resultado?: ResultadoPesquisaje | string;
  observaciones?: string;
  usuarioId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Inclusión formal (RF-3, RF-17) */
export interface Inclusion {
  id: string;
  sujetoId: string;
  fechaInclusion: string;
  numeroInclusion?: string;
  grupoSujeto?: string;
  inicialesCentro?: string;
  horaInclusion?: string;
  usuarioId?: string;
  tipo: 'directa' | 'con_pesquisaje';
  revertido: boolean;
  createdAt: string;
}

/** Registro de auditoría (RF-19) */
export interface Auditoria {
  id: string;
  tabla: string;
  registroId: string;
  accion: string;
  camposAnteriores?: string;
  camposNuevos?: string;
  usuarioId?: string;
  createdAt: string;
}

/** Tipo de plantilla CRD: pesquisaje o evaluación inicial */
export type TipoPlantillaCRD = 'pesquisaje' | 'evaluacion_inicial';

/** Plantilla CRD (RF-21) */
export interface PlantillaCRD {
  id: string;
  estudioId: string;
  nombre: string;
  codigo?: string;
  tipo?: TipoPlantillaCRD;
  version?: string;
  definicionJson?: string;
  createdAt: string;
}

/** Hoja CRD - instancia de formulario por sujeto */
export interface HojaCRD {
  id: string;
  sujetoId: string;
  plantillaId: string;
  datosJson?: string;
  createdAt: string;
  updatedAt: string;
}
