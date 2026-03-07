/**
 * SubjectService: gestión de sujetos, validación de identificador lógico (Estudio + Iniciales + Código inclusión),
 * inclusión masiva para pesquisaje e inclusión directa. RF-2, RF-3, RF-4, RF-6, RF-13, 6.2, 6.3.
 *
 * --- Identificación del sujeto (6.2, 6.3) ---
 * • id (UUID): solo para la BD. Es el ID temporal local; NO forma parte del "nombre" del sujeto ni se muestra.
 * • identificador_logico: es el "nombre" visible. Formato: CIM_FL_ + Estudio + _ + Iniciales + _ + Código de inclusión.
 *   Reglas de unicidad: no puede repetirse (estudio, iniciales, número inclusión). Sí pueden repetirse
 *   iniciales con distinto número, o el mismo número con distintas iniciales.
 * • CIMFL0001, CIMFL0002...: número de inclusión auto-generado cuando el sujeto se registra por pesquisaje.
 *   Después de las iniciales va ese número cuando el sujeto queda incluido. El prefijo CIMFL identifica
 *   el código de inclusión en este flujo.
 */

import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

const ESTADOS = {
  PENDIENTE: 'pendiente',
  INCLUIDO: 'incluido',
  NO_INCLUIDO: 'no_incluido',
  ANULADO: 'anulado',
} as const;

/** Prefijo que caracteriza el centro (CIM_FL) para todos los identificadores lógicos. */
const IDENTIFICADOR_PREFIX = 'CIM_FL_';

/** Obtiene el código/nombre del estudio para el identificador lógico (no el UUID). */
function getEstudioCodigo(db: Database.Database, estudioId: string): string {
  const row = db.prepare('SELECT codigo, nombre, id FROM estudios WHERE id = ?').get(estudioId) as
    | { codigo: string | null; nombre: string; id: string }
    | undefined;
  if (!row) return (estudioId || '').trim();
  const codigo = (row.codigo || row.nombre || row.id || '').trim();
  return codigo || estudioId;
}

/** Construye el identificador lógico: CIM_FL + Código estudio + Iniciales + Código de inclusión (número de inclusión). */
export function buildIdentificadorLogico(
  estudioCodigo: string,
  iniciales: string,
  numeroInclusion: string
): string {
  const base = `${(estudioCodigo || '').trim()}_${(iniciales || '').trim()}_${(numeroInclusion || '').trim()}`;
  return IDENTIFICADOR_PREFIX + base;
}

/** Valida unicidad: no puede repetirse (estudio_id, iniciales, numero_inclusion). 6.2 */
export function validarIdentificadorUnico(
  db: Database.Database,
  estudioId: string,
  iniciales: string,
  numeroInclusion: string,
  excluirSujetoId?: string
): { valido: boolean; mensaje?: string } {
  const ini = (iniciales || '').trim();
  const num = (numeroInclusion || '').trim();
  if (!ini) return { valido: false, mensaje: 'Iniciales son obligatorias.' };
  if (!num) return { valido: false, mensaje: 'Número de inclusión es obligatorio.' };

  const estudioCodigo = getEstudioCodigo(db, estudioId);
  const identificador = buildIdentificadorLogico(estudioCodigo, ini, num);
  const stmt = excluirSujetoId
    ? db.prepare(
        'SELECT 1 FROM sujetos WHERE estudio_id = ? AND identificador_logico = ? AND id != ? AND anulado = 0'
      )
    : db.prepare(
        'SELECT 1 FROM sujetos WHERE estudio_id = ? AND identificador_logico = ? AND anulado = 0'
      );
  const row = excluirSujetoId
    ? stmt.get(estudioId, identificador, excluirSujetoId)
    : stmt.get(estudioId, identificador);
  if (row) return { valido: false, mensaje: 'Ya existe un sujeto con ese estudio, iniciales y número de inclusión.' };
  return { valido: true };
}

/** Prefijo del número de inclusión auto-generado en pesquisaje. Ej.: CIMFL0001, CIMFL0002… (va después de las iniciales en el identificador cuando el sujeto está incluido). */
const PREFIJO_NUMERO_INCLUSION_PESQUISAJE = 'CIMFL';

/** Obtiene el siguiente número de inclusión con prefijo CIMFL para el estudio. */
function siguienteNumeroInclusionPesquisaje(db: Database.Database, estudioId: string): string {
  const rows = db.prepare(
    `SELECT numero_inclusion FROM sujetos
     WHERE estudio_id = ? AND numero_inclusion IS NOT NULL AND numero_inclusion LIKE ? AND anulado = 0`
  ).all(estudioId, PREFIJO_NUMERO_INCLUSION_PESQUISAJE + '%') as { numero_inclusion: string }[];
  let maxNum = 0;
  const prefixLen = PREFIJO_NUMERO_INCLUSION_PESQUISAJE.length;
  for (const r of rows) {
    const numPart = r.numero_inclusion.slice(prefixLen).replace(/^0+/, '') || '0';
    const n = parseInt(numPart, 10);
    if (!Number.isNaN(n) && n > maxNum) maxNum = n;
  }
  const next = maxNum + 1;
  return PREFIJO_NUMERO_INCLUSION_PESQUISAJE + String(next).padStart(4, '0');
}

/** Crea sujeto para flujo con pesquisaje (solo Iniciales). Número de inclusión auto CIMFL0001, CIMFL0002… Estado pendiente. 3.1 */
export function crearParaPesquisaje(
  db: Database.Database,
  estudioId: string,
  iniciales: string,
  _usuarioId?: string
): { id: string; identificadorLogico: string; numeroInclusion: string } {
  const ini = (iniciales || '').trim();
  if (!ini) throw new Error('Iniciales son obligatorias.');
  const id = uuidv4();
  const numeroInclusion = siguienteNumeroInclusionPesquisaje(db, estudioId);
  const estudioCodigo = getEstudioCodigo(db, estudioId);
  const identificadorLogico = buildIdentificadorLogico(estudioCodigo, ini, numeroInclusion);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sujetos (
      id, identificador_logico, estudio_id, iniciales, numero_inclusion, estado_inclusion, tipo_inclusion,
      anulado, sincronizado, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
  ).run(id, identificadorLogico, estudioId, ini, numeroInclusion, ESTADOS.PENDIENTE, 'con_pesquisaje', now, now);

  return { id, identificadorLogico, numeroInclusion };
}

/** Inclusión directa: registra sujeto con todos los datos y estado Incluido. 4 */
export function crearInclusionDirecta(
  db: Database.Database,
  estudioId: string,
  datos: {
    iniciales: string;
    fechaInclusion: string;
    numeroInclusion: string;
    grupoSujeto: string;
    horaInclusion?: string;
    inicialesCentro?: string;
  },
  _usuarioId?: string
): { id: string; identificadorLogico: string } {
  const v = validarIdentificadorUnico(db, estudioId, datos.iniciales, datos.numeroInclusion);
  if (!v.valido) throw new Error(v.mensaje);

  const id = uuidv4();
  const estudioCodigo = getEstudioCodigo(db, estudioId);
  const identificadorLogico = buildIdentificadorLogico(estudioCodigo, datos.iniciales.trim(), datos.numeroInclusion.trim());
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sujetos (
      id, identificador_logico, estudio_id, iniciales, fecha_inclusion, numero_inclusion,
      grupo_sujeto, hora_inclusion, iniciales_centro, estado_inclusion, tipo_inclusion,
      anulado, sincronizado, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'directa', 0, 0, ?, ?)`
  ).run(
    id,
    identificadorLogico,
    estudioId,
    datos.iniciales.trim(),
    datos.fechaInclusion,
    datos.numeroInclusion.trim(),
    datos.grupoSujeto || null,
    datos.horaInclusion || null,
    datos.inicialesCentro || null,
    ESTADOS.INCLUIDO,
    now,
    now
  );

  return { id, identificadorLogico };
}

/** Lista sujetos para Gestionar Pesquisaje: pendientes y no incluidos. 3.1, 3.2, requisito tutor */
export function listarPendientesPesquisaje(
  db: Database.Database,
  estudioId: string,
  opts?: { identificador?: string }
): unknown[] {
  let sql = `SELECT id, identificador_logico, iniciales, estado_inclusion, created_at
     FROM sujetos
     WHERE estudio_id = ?
       AND estado_inclusion IN (?, ?)
       AND anulado = 0`;
  const params: unknown[] = [estudioId, ESTADOS.PENDIENTE, ESTADOS.NO_INCLUIDO];
  if (opts?.identificador && opts.identificador.trim()) {
    sql += ' AND (identificador_logico LIKE ? OR iniciales LIKE ?)';
    const q = '%' + opts.identificador.trim() + '%';
    params.push(q, q);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

/** Lista sujetos para Gestionar Sujetos (solo incluidos). 3.3, 5 */
export function listarIncluidos(
  db: Database.Database,
  estudioId: string,
  opts?: { identificador?: string; estadoInclusion?: string }
): unknown[] {
  let sql = `SELECT id, identificador_logico, iniciales, fecha_inclusion, numero_inclusion, grupo_sujeto,
             estado_inclusion, estado_tratamiento, estado_monitoreo, created_at
             FROM sujetos WHERE estudio_id = ? AND anulado = 0 AND estado_inclusion = ?`;
  const params: unknown[] = [estudioId, ESTADOS.INCLUIDO];
  if (opts?.identificador) {
    sql += ' AND (identificador_logico LIKE ? OR iniciales LIKE ?)';
    const q = '%' + opts.identificador + '%';
    params.push(q, q);
  }
  if (opts?.estadoInclusion) {
    sql += ' AND estado_inclusion = ?';
    params.push(opts.estadoInclusion);
  }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

/** Lista todos los sujetos para Gestionar Sujetos: solo incluidos (aprobados o directos). */
export function listarTodosParaGestionar(
  db: Database.Database,
  estudioId: string,
  opts?: { identificador?: string }
): unknown[] {
  let sql = `SELECT id, identificador_logico, iniciales, fecha_inclusion, numero_inclusion, grupo_sujeto,
             estado_inclusion, estado_tratamiento, estado_monitoreo, created_at
             FROM sujetos WHERE estudio_id = ? AND anulado = 0 AND estado_inclusion = ?`;
  const params: unknown[] = [estudioId, ESTADOS.INCLUIDO];
  if (opts?.identificador) {
    sql += ' AND (identificador_logico LIKE ? OR iniciales LIKE ?)';
    const q = '%' + opts.identificador + '%';
    params.push(q, q);
  }
  sql += ` ORDER BY CASE estado_inclusion WHEN 'pendiente' THEN 0 WHEN 'incluido' THEN 1 WHEN 'no_incluido' THEN 2 ELSE 3 END, created_at DESC`;
  return db.prepare(sql).all(...params);
}

/** Obtiene un sujeto por ID */
export function obtenerPorId(db: Database.Database, sujetoId: string): unknown {
  return db.prepare('SELECT * FROM sujetos WHERE id = ?').get(sujetoId);
}

/** Actualiza datos editables de un sujeto (RF-7). Si cambian iniciales o número de inclusión, revalida unicidad y actualiza identificador_logico. */
export function actualizarSujeto(
  db: Database.Database,
  sujetoId: string,
  datos: {
    iniciales?: string;
    fechaInclusion?: string;
    numeroInclusion?: string;
    grupoSujeto?: string;
    horaInclusion?: string;
    inicialesCentro?: string;
    estadoInclusion?: string;
  }
): void {
  const row = db.prepare('SELECT estudio_id, iniciales, numero_inclusion FROM sujetos WHERE id = ?').get(sujetoId) as
    | { estudio_id: string; iniciales: string; numero_inclusion: string }
    | undefined;
  if (!row) throw new Error('Sujeto no encontrado.');

  const now = new Date().toISOString();
  const ini = (datos.iniciales ?? row.iniciales ?? '').trim();
  const num = (datos.numeroInclusion ?? row.numero_inclusion ?? '').trim();

  if (ini && num) {
    const v = validarIdentificadorUnico(db, row.estudio_id, ini, num, sujetoId);
    if (!v.valido) throw new Error(v.mensaje);
    const estudioCodigo = getEstudioCodigo(db, row.estudio_id);
    const identificadorLogico = buildIdentificadorLogico(estudioCodigo, ini, num);
    db.prepare(
      `UPDATE sujetos SET
        identificador_logico = ?, iniciales = ?, fecha_inclusion = ?, numero_inclusion = ?,
        grupo_sujeto = ?, hora_inclusion = ?, iniciales_centro = ?, estado_inclusion = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      identificadorLogico,
      ini,
      datos.fechaInclusion ?? null,
      num,
      datos.grupoSujeto ?? null,
      datos.horaInclusion ?? null,
      datos.inicialesCentro ?? null,
      datos.estadoInclusion ?? null,
      now,
      sujetoId
    );
  } else {
    db.prepare(
      `UPDATE sujetos SET
        fecha_inclusion = ?, grupo_sujeto = ?, hora_inclusion = ?, iniciales_centro = ?, estado_inclusion = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      datos.fechaInclusion ?? null,
      datos.grupoSujeto ?? null,
      datos.horaInclusion ?? null,
      datos.inicialesCentro ?? null,
      datos.estadoInclusion ?? null,
      now,
      sujetoId
    );
  }
}

/** Anula (elimina lógicamente) un sujeto antes de sincronizar. Marca anulado = 1 y guarda motivo. RF-8 */
export function anularSujeto(
  db: Database.Database,
  sujetoId: string,
  motivo?: string
): void {
  const now = new Date().toISOString();
  const motivoFinal = (motivo || 'Anulado desde cliente offline').trim();
  db.prepare(
    `UPDATE sujetos
       SET anulado = 1,
           motivo_anulacion = ?,
           fecha_anulacion = ?,
           updated_at = ?
     WHERE id = ?`
  ).run(motivoFinal, now.slice(0, 10), now, sujetoId);
}

/** Actualiza resultado del pesquisaje: Incluido → pasa a Gestionar Sujetos; No Incluido → estado no_incluido. 3.3 */
export function actualizarResultadoPesquisaje(
  db: Database.Database,
  sujetoId: string,
  resultado: 'Incluido' | 'No Incluido',
  datosInclusion?: { numeroInclusion?: string; grupoSujeto?: string; fechaInclusion?: string; horaInclusion?: string },
  usuarioId?: string
): void {
  const now = new Date().toISOString();
  const resultadoVal = resultado === 'Incluido' ? 'Incluido' : 'No Incluido';

  try {
    db.prepare(
      'INSERT INTO pesquisaje (id, sujeto_id, resultado, usuario_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), sujetoId, resultadoVal, usuarioId || null, now, now);
  } catch {
    db.prepare('UPDATE pesquisaje SET resultado = ?, updated_at = ? WHERE sujeto_id = ?').run(resultadoVal, now, sujetoId);
  }

  if (resultado === 'No Incluido') {
    db.prepare(
      'UPDATE sujetos SET estado_inclusion = ?, updated_at = ? WHERE id = ?'
    ).run(ESTADOS.NO_INCLUIDO, now, sujetoId);
    return;
  }
  if (resultado === 'Incluido') {
    const row = db.prepare('SELECT estudio_id, iniciales, numero_inclusion FROM sujetos WHERE id = ?').get(sujetoId) as { estudio_id: string; iniciales: string; numero_inclusion?: string } | undefined;
    if (!row) throw new Error('Sujeto no encontrado.');
    const numeroInclusionFinal = (datosInclusion?.numeroInclusion || row.numero_inclusion || '').trim();
    if (!numeroInclusionFinal) throw new Error('Número de inclusión no definido para el sujeto.');
    const estudioCodigo = getEstudioCodigo(db, row.estudio_id);
    const identificador = buildIdentificadorLogico(estudioCodigo, row.iniciales, numeroInclusionFinal);
    const v = validarIdentificadorUnico(db, row.estudio_id, row.iniciales, numeroInclusionFinal, sujetoId);
    if (!v.valido) throw new Error(v.mensaje);
    db.prepare(
      `UPDATE sujetos SET identificador_logico = ?, numero_inclusion = ?, grupo_sujeto = ?,
       fecha_inclusion = ?, hora_inclusion = ?, estado_inclusion = ?, updated_at = ? WHERE id = ?`
    ).run(
      identificador,
      numeroInclusionFinal,
      datosInclusion?.grupoSujeto || null,
      datosInclusion?.fechaInclusion || now.slice(0, 10),
      datosInclusion?.horaInclusion || null,
      ESTADOS.INCLUIDO,
      now,
      sujetoId
    );
  }
}

