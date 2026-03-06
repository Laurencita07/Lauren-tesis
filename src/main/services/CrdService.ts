/**
 * CrdService: carga/guardado de hojas CRD, reconstrucción de formulario, exportación JSON/Excel. RF-22, punto 4 y 7.
 */

import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import type Database from 'better-sqlite3';
import type { DefinicionPlantilla } from './TemplateService';
import { obtenerDefinicion } from './TemplateService';

/** Obtiene o crea la hoja CRD para un sujeto y plantilla */
export function obtenerOCrearHoja(
  db: Database.Database,
  sujetoId: string,
  plantillaId: string
): { id: string; datos: Record<string, unknown> } {
  const row = db.prepare(
    'SELECT id, datos_json FROM hojas_crd WHERE sujeto_id = ? AND plantilla_id = ?'
  ).get(sujetoId, plantillaId) as { id: string; datos_json: string | null } | undefined;

  if (row) {
    const datos = row.datos_json ? (JSON.parse(row.datos_json) as Record<string, unknown>) : {};
    return { id: row.id, datos };
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO hojas_crd (id, sujeto_id, plantilla_id, datos_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, sujetoId, plantillaId, '{}', now, now);
  return { id, datos: {} };
}

/** Guarda datos de la hoja CRD */
export function guardarDatosHoja(
  db: Database.Database,
  hojaId: string,
  datos: Record<string, unknown>
): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE hojas_crd SET datos_json = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(datos), now, hojaId);
}

/** Carga definición para reconstruir formulario (nombre hoja, variables, secciones) */
export function cargarDefinicionFormulario(
  db: Database.Database,
  plantillaId: string
): DefinicionPlantilla | null {
  return obtenerDefinicion(db, plantillaId);
}

/** Exporta hoja CRD a JSON (estructura + valores). Opción 1 del punto 7 */
export function exportarHojaJson(
  db: Database.Database,
  hojaId: string,
  filePath: string
): void {
  const row = db.prepare(
    'SELECT h.id, h.sujeto_id, h.plantilla_id, h.datos_json, p.nombre as plantilla_nombre, p.definicion_json FROM hojas_crd h JOIN plantillas_crd p ON h.plantilla_id = p.id WHERE h.id = ?'
  ).get(hojaId) as { id: string; sujeto_id: string; plantilla_id: string; datos_json: string; plantilla_nombre: string; definicion_json: string } | undefined;
  if (!row) throw new Error('Hoja CRD no encontrada.');
  const definicion = JSON.parse(row.definicion_json) as DefinicionPlantilla;
  const datos = row.datos_json ? (JSON.parse(row.datos_json) as Record<string, unknown>) : {};
  const exportData = {
    hojaId: row.id,
    sujetoId: row.sujeto_id,
    plantillaId: row.plantilla_id,
    plantillaNombre: row.plantilla_nombre,
    definicion: definicion.variables.map(v => ({ id: v.id, etiqueta: v.etiqueta, tipo: v.tipo })),
    valores: datos,
    exportadoEn: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
}

/** Exporta hoja CRD a Excel con columna Valor, protegido. Opción 2 del punto 7 */
export async function exportarHojaExcel(
  db: Database.Database,
  hojaId: string,
  filePath: string
): Promise<void> {
  const row = db.prepare(
    'SELECT h.id, h.datos_json, p.definicion_json FROM hojas_crd h JOIN plantillas_crd p ON h.plantilla_id = p.id WHERE h.id = ?'
  ).get(hojaId) as { id: string; datos_json: string; definicion_json: string } | undefined;
  if (!row) throw new Error('Hoja CRD no encontrada.');

  const definicion = JSON.parse(row.definicion_json) as DefinicionPlantilla;
  const datos = row.datos_json ? (JSON.parse(row.datos_json) as Record<string, unknown>) : {};

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Variables', { properties: { outlineProperties: { summaryBelow: false, summaryRight: false } } });

  sheet.columns = [
    { header: 'Codigo', key: 'codigo', width: 18 },
    { header: 'Etiqueta', key: 'etiqueta', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Valor', key: 'valor', width: 24 },
  ];

  for (const v of definicion.variables) {
    const valor = datos[v.id] ?? datos[v.codigo ?? ''] ?? '';
    sheet.addRow({
      codigo: v.codigo ?? v.id,
      etiqueta: v.etiqueta,
      tipo: v.tipo,
      valor: typeof valor === 'object' ? JSON.stringify(valor) : String(valor),
    });
  }

  sheet.getRow(1).font = { bold: true };
  sheet.protect('', { selectLockedCells: true, formatCells: false, formatColumns: false, formatRows: false, insertRows: false, insertColumns: false });

  await workbook.xlsx.writeFile(filePath);
}
