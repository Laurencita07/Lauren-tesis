/**
 * TemplateService: importación y validación de plantillas CRD desde Excel o JSON (Pesquisaje / Evaluación Inicial).
 * Valida estructura, pestañas, identificadores y propiedades de variables. RF-21.
 *
 * Al importar, se generan automáticamente los controles según la columna "tipo" / "type":
 * - TextBox  → campo de texto (valor por defecto)
 * - TextArea → área de texto
 * - CheckBox → casilla de verificación
 * - ComboBox → lista desplegable (usa columna "opciones" si existe)
 * - RadioButton → botones de opción (usa columna "opciones" si existe)
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import type Database from 'better-sqlite3';

export type TipoPlantilla = 'pesquisaje' | 'evaluacion_inicial';

export interface VariableDef {
  id: string;
  codigo?: string;
  etiqueta: string;
  tipo: 'text' | 'textarea' | 'checkbox' | 'combobox' | 'radiobutton' | 'number' | 'date';
  opciones?: string[];
  seccion?: string;
  orden?: number;
  columnas?: number;
  obligatorio?: boolean;
  /** Clave para resultado de evaluación (Incluido/No Incluido) en pesquisaje */
  esResultadoEvaluacion?: boolean;
}

export interface DefinicionPlantilla {
  nombreHoja: string;
  variables: VariableDef[];
  secciones?: { id: string; titulo: string; orden: number }[];
}

/**
 * Normaliza el tipo de control de la plantilla al tipo interno.
 * Acepta: TextBox, TextArea, CheckBox, ComboBox, RadioButton (y variantes en español/inglés).
 * Al importar se generan automáticamente: TextBox → text, TextArea → textarea,
 * CheckBox → checkbox, ComboBox → combobox, RadioButton → radiobutton.
 */
function normalizarTipo(t: string): VariableDef['tipo'] {
  const s = (t || '').toString().trim();
  const lower = s.toLowerCase();

  /* TextArea: TextArea, texto área, text area, etc. */
  if (lower === 'textarea' || lower === 'text area' || (lower.includes('text') && (lower.includes('area') || lower.includes('área')))) return 'textarea';
  /* CheckBox: CheckBox, checkbox, casilla, etc. */
  if (lower === 'checkbox' || lower === 'check box' || lower.includes('check') || lower.includes('casilla')) return 'checkbox';
  /* ComboBox: ComboBox, combobox, select, lista, desplegable, etc. */
  if (lower === 'combobox' || lower === 'combo box' || lower.includes('combo') || lower.includes('select') || lower.includes('lista') || lower.includes('despleg')) return 'combobox';
  /* RadioButton: RadioButton, radiobutton, radio, opción, etc. */
  if (lower === 'radiobutton' || lower === 'radio button' || lower.includes('radio') || lower.includes('opcion') || lower.includes('opción')) return 'radiobutton';
  /* Number y Date */
  if (lower.includes('number') || lower.includes('numero') || lower.includes('número')) return 'number';
  if (lower.includes('date') || lower.includes('fecha')) return 'date';

  /* TextBox por defecto: TextBox, text, texto, o cualquier otro valor no reconocido */
  return 'text';
}

/**
 * Importa plantilla desde archivo Excel (.xls o .xlsx). Valida estructura y pestañas.
 * En caso de inconsistencia lanza Error con mensaje claro.
 */
export async function importarDesdeExcel(
  db: Database.Database,
  filePath: string,
  estudioId: string,
  tipo: TipoPlantilla,
  nombre: string
): Promise<{ id: string; nombre: string; errores?: string[] }> {
  if (!fs.existsSync(filePath)) throw new Error('El archivo no existe.');
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.xlsx' && ext !== '.xls') {
    throw new Error('Solo se permiten archivos Excel (.xlsx, .xls).');
  }

  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) throw new Error('El Excel no contiene pestañas.');

  const norm = (s: string) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/\u0300/g, '');
  const sheetCumple = (name: string) => {
    const n = norm(name);
    const tienePesquisaje = n.includes('pesquisaje');
    const tieneEvalInicial = (n.includes('evaluacion') || n.includes('evaluación')) && n.includes('inicial');
    return tipo === 'pesquisaje' ? tienePesquisaje : tieneEvalInicial;
  };

  const sheetName =
    sheetNames.find(n => sheetCumple(n)) ||
    sheetNames.find(n => norm(n).includes('variable')) ||
    sheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error('La pestaña de variables no existe en el Excel.');

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  if (!data || data.length < 2) {
    throw new Error('La pestaña de variables debe tener al menos encabezado y una fila.');
  }

  const headers = (data[0] || []).map(h => (h ?? '').toString());
  const colIndex = (name: string) => {
    const i = headers.findIndex(h => h.toLowerCase().includes(name));
    return i >= 0 ? i : -1;
  };
  const idxCodigo = colIndex('codigo') >= 0 ? colIndex('codigo') : colIndex('id') >= 0 ? colIndex('id') : 0;
  const idxEtiqueta = colIndex('etiqueta') >= 0 ? colIndex('etiqueta') : colIndex('label') >= 0 ? colIndex('label') : 1;
  const idxTipo = colIndex('tipo') >= 0 ? colIndex('tipo') : colIndex('type') >= 0 ? colIndex('type') : 2;
  const idxOpciones = colIndex('opcion');
  const idxSeccion = colIndex('seccion');
  const idxOrden = colIndex('orden');
  const idxResultado = colIndex('resultado');
  const idxColumnas = colIndex('columna') >= 0 ? colIndex('columna') : colIndex('columnas');
  const idxObligatorio = colIndex('obligatorio') >= 0 ? colIndex('obligatorio') : colIndex('required');

  const variables: VariableDef[] = [];
  const errores: string[] = [];

  for (let i = 1; i < data.length; i++) {
    const vals = data[i] || [];
    const codigo = (vals[idxCodigo] ?? '').toString().trim();
    const etiqueta = (vals[idxEtiqueta] ?? '').toString().trim();
    if (!etiqueta && !codigo) continue;

    let tipoStr = (vals[idxTipo] ?? 'text').toString().trim();
    const opcionesStr = idxOpciones >= 0 ? (vals[idxOpciones] ?? '').toString().trim() : '';
    const opciones = opcionesStr ? opcionesStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : undefined;
    if (!tipoStr && opciones && opciones.length > 0) tipoStr = 'ComboBox';
    let tipoVar = normalizarTipo(tipoStr);
    if (tipoVar === 'text' && opciones && opciones.length > 0) tipoVar = 'combobox';
    const esResultado = idxResultado >= 0 && (vals[idxResultado] ?? '').toString().toLowerCase().includes('si');

    const colVal = idxColumnas >= 0 ? parseInt(String(vals[idxColumnas]), 10) : undefined;
    const columnas = colVal === 1 || colVal === 2 ? colVal : undefined;
    const obligRaw = idxObligatorio >= 0 ? (vals[idxObligatorio] ?? '').toString().toLowerCase().trim() : '';
    const obligatorio = /^(si|sí|yes|true|1|x)$/.test(obligRaw);

    variables.push({
      id: codigo || `var_${i}`,
      codigo: codigo || undefined,
      etiqueta: etiqueta || codigo,
      tipo: tipoVar,
      opciones,
      seccion: idxSeccion >= 0 ? (vals[idxSeccion] ?? '').toString().trim() || undefined : undefined,
      orden: idxOrden >= 0 ? parseInt(String(vals[idxOrden]), 10) || i : i,
      columnas,
      obligatorio: idxObligatorio >= 0 ? obligatorio : undefined,
      esResultadoEvaluacion: tipo === 'pesquisaje' && (esResultado || etiqueta.toLowerCase().includes('resultado')),
    });
  }

  if (variables.length === 0) throw new Error('No se encontraron variables válidas en la plantilla.');

  if (tipo === 'pesquisaje') {
    const tieneResultado = variables.some(v => v.esResultadoEvaluacion);
    if (!tieneResultado) errores.push('La plantilla de Pesquisaje debería incluir un campo "Resultado de Evaluación" (Incluido/No Incluido).');
  }

  const definicion: DefinicionPlantilla = {
    nombreHoja: nombre,
    variables: variables.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
  };

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO plantillas_crd (id, estudio_id, nombre, tipo, definicion_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, estudioId, nombre, tipo, JSON.stringify(definicion), now);

  return { id, nombre, errores: errores.length ? errores : undefined };
}

/**
 * Importa plantilla desde archivo JSON. Acepta estructura DefinicionPlantilla (nombreHoja, variables)
 * o wrapper { definicion: DefinicionPlantilla }. Compatible con formatos antiguos y nuevos.
 */
export function importarDesdeJSON(
  db: Database.Database,
  filePath: string,
  estudioId: string,
  tipo: TipoPlantilla,
  nombre: string
): { id: string; nombre: string; errores?: string[] } {
  if (!fs.existsSync(filePath)) throw new Error('El archivo no existe.');
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.json') throw new Error('El archivo debe ser JSON (.json).');

  const raw = fs.readFileSync(filePath, 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('El archivo JSON no es válido.');
  }

  const obj = data as Record<string, unknown>;
  let definicion: DefinicionPlantilla;
  if (obj && Array.isArray(obj.variables) && typeof obj.nombreHoja === 'string') {
    definicion = obj as unknown as DefinicionPlantilla;
  } else if (obj && typeof obj.definicion === 'object' && obj.definicion && Array.isArray((obj.definicion as Record<string, unknown>).variables)) {
    definicion = (obj.definicion as Record<string, unknown>) as unknown as DefinicionPlantilla;
  } else {
    throw new Error('El JSON debe contener "nombreHoja" y "variables" (array).');
  }

  const rawVars = (definicion.variables || []) as unknown as Record<string, unknown>[];
  const variables: VariableDef[] = rawVars.map((v, i) => {
    const id = (v.id ?? v.codigo ?? `var_${i}`).toString().trim();
    const etiqueta = (v.etiqueta ?? v.label ?? v.id ?? id).toString().trim();
    let tipoStr = (v.tipo ?? v.type ?? 'text').toString().trim();
    const opciones = Array.isArray(v.opciones) ? v.opciones.map(String) : undefined;
    if (!tipoStr && opciones && opciones.length > 0) tipoStr = 'combobox';
    let tipoVar = normalizarTipo(tipoStr);
    if (tipoVar === 'text' && opciones && opciones.length > 0) tipoVar = 'combobox';
    const colNum = typeof v.columnas === 'number' ? v.columnas : (v.columnas != null ? parseInt(String(v.columnas), 10) : undefined);
    const columnas = colNum === 1 || colNum === 2 ? colNum : undefined;
    const obligatorio = v.obligatorio === true || (typeof v.obligatorio === 'string' && /^(si|sí|yes|true|1)$/i.test(String(v.obligatorio)));
    return {
      id: id || `var_${i}`,
      codigo: id || undefined,
      etiqueta: etiqueta || id,
      tipo: tipoVar,
      opciones,
      seccion: v.seccion ? String(v.seccion).trim() : undefined,
      orden: typeof v.orden === 'number' ? v.orden : i,
      columnas,
      obligatorio: v.obligatorio != null ? obligatorio : undefined,
      esResultadoEvaluacion: tipo === 'pesquisaje' && (
        (v.esResultadoEvaluacion === true) ||
        String(v.etiqueta ?? v.label ?? '').toLowerCase().includes('resultado')
      ),
    };
  });

  if (variables.length === 0) throw new Error('No se encontraron variables en el JSON.');

  const errores: string[] = [];
  if (tipo === 'pesquisaje') {
    const tieneResultado = variables.some(v => v.esResultadoEvaluacion);
    if (!tieneResultado) errores.push('La plantilla de Pesquisaje debería incluir un campo "Resultado de Evaluación".');
  }

  const defFinal: DefinicionPlantilla = {
    nombreHoja: definicion.nombreHoja || nombre,
    variables: variables.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    secciones: definicion.secciones,
  };

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO plantillas_crd (id, estudio_id, nombre, tipo, definicion_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, estudioId, nombre, tipo, JSON.stringify(defFinal), now);

  return { id, nombre, errores: errores.length ? errores : undefined };
}

/**
 * Importa plantilla desde un archivo (Excel o JSON). El tipo de archivo se detecta por la extensión.
 * Solo se permite una plantilla de cada tipo (Pesquisaje / Evaluación inicial) por estudio.
 */
export async function importarDesdeArchivo(
  db: Database.Database,
  filePath: string,
  estudioId: string,
  tipo: TipoPlantilla,
  nombre: string
): Promise<{ id: string; nombre: string; errores?: string[] }> {
  if (!fs.existsSync(filePath)) throw new Error('El archivo no existe.');

  const existentes = listarPlantillas(db, estudioId, tipo) as { id: string }[];
  if (existentes.length > 0) {
    const tipoEtiqueta = tipo === 'pesquisaje' ? 'Pesquisaje' : 'Evaluación inicial';
    throw new Error(`Ya hay una plantilla de ${tipoEtiqueta} cargada. Solo se puede tener una plantilla de cada tipo. Elimine la actual si desea reemplazarla.`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') {
    return importarDesdeJSON(db, filePath, estudioId, tipo, nombre);
  }
  if (ext === '.xlsx' || ext === '.xls') {
    return importarDesdeExcel(db, filePath, estudioId, tipo, nombre);
  }
  throw new Error('Formato no soportado. Use Excel (.xlsx, .xls) o JSON (.json).');
}

/** Lista plantillas por estudio y opcionalmente por tipo */
export function listarPlantillas(
  db: Database.Database,
  estudioId: string,
  tipo?: TipoPlantilla
): unknown[] {
  let sql = 'SELECT id, nombre, codigo, tipo, created_at FROM plantillas_crd WHERE estudio_id = ?';
  const params: unknown[] = [estudioId];
  if (tipo) {
    sql += ' AND tipo = ?';
    params.push(tipo);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

/** Elimina una plantilla si no tiene hojas CRD asociadas. */
export function eliminarPlantilla(
  db: Database.Database,
  plantillaId: string
): void {
  // Solo impedimos eliminar si hay hojas CRD asociadas a sujetos NO anulados.
  const row = db.prepare(
    `SELECT COUNT(*) as c
       FROM hojas_crd h
       JOIN sujetos s ON h.sujeto_id = s.id
      WHERE h.plantilla_id = ?
        AND s.anulado = 0`
  ).get(plantillaId) as { c: number } | undefined;
  if (row && row.c > 0) {
    throw new Error('No se puede eliminar la plantilla porque existen hojas CRD asociadas a sujetos no anulados.');
  }
  // Limpieza opcional: eliminar hojas_crd huérfanas de esta plantilla
  db.prepare('DELETE FROM hojas_crd WHERE plantilla_id = ?').run(plantillaId);
  db.prepare('DELETE FROM plantillas_crd WHERE id = ?').run(plantillaId);
}

/** Obtiene definición de plantilla para reconstruir formulario */
export function obtenerDefinicion(db: Database.Database, plantillaId: string): DefinicionPlantilla | null {
  const row = db.prepare('SELECT definicion_json FROM plantillas_crd WHERE id = ?').get(plantillaId) as { definicion_json: string } | undefined;
  if (!row || !row.definicion_json) return null;
  try {
    return JSON.parse(row.definicion_json) as DefinicionPlantilla;
  } catch {
    return null;
  }
}
