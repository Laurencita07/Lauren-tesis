/**
 * Constantes compartidas entre main y renderer.
 * Rutas, nombres de canales IPC y configuración de la aplicación.
 */

export const APP_NAME = 'Ensayos Clínicos';

/** Módulos de navegación (coinciden con la barra lateral) */
export const ROUTES = {
  PESQUISAJE: 'gestionar-pesquisaje',
  SUJETOS: 'gestionar-sujetos',
  IMPORTAR_CRD: 'importar-plantilla-crd',
  SINCRONIZACION: 'sincronizacion',
} as const;

export type RouteId = (typeof ROUTES)[keyof typeof ROUTES];

export const ROUTE_LABELS: Record<RouteId, string> = {
  [ROUTES.PESQUISAJE]: 'Gestionar pesquisaje',
  [ROUTES.SUJETOS]: 'Gestionar sujetos',
  [ROUTES.IMPORTAR_CRD]: 'Importar plantilla CRD',
  [ROUTES.SINCRONIZACION]: 'Sincronización',
};
