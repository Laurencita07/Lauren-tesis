/**
 * Formulario CRD dinámico: reconstruye visualmente la hoja a partir de la definición (TextBox, TextArea, CheckBox, ComboBox, RadioButton).
 * Incluye cintillo superior (nombre hoja, identificador sujeto, momento, estudio) y campo Resultado de Evaluación para pesquisaje.
 */

import React, { useEffect, useState } from 'react';

export interface VariableDef {
  id: string;
  codigo?: string;
  etiqueta: string;
  tipo: string;
  opciones?: string[];
  seccion?: string;
  orden?: number;
  columnas?: number;
  obligatorio?: boolean;
  esResultadoEvaluacion?: boolean;
}

export interface DefinicionFormulario {
  nombreHoja: string;
  variables: VariableDef[];
  /** Secciones opcionales para agrupar variables y construir pestañas, preservando orden original. */
  secciones?: { id: string; titulo: string; orden: number }[];
}

/** Datos generales del sujeto para mostrar en el cintillo (Gestionar CRD). */
export interface DatosGeneralesSujeto {
  estadoInclusion?: string;
  fechaInclusion?: string;
  numeroInclusion?: string;
  grupoSujeto?: string;
}

interface FormularioCRDProps {
  definicion: DefinicionFormulario | null;
  sujetoIdentificador: string;
  nombreEstudio: string;
  momentoSeguimiento?: string;
  datosIniciales: Record<string, unknown>;
  esPesquisaje: boolean;
  hojaId?: string;
  /** Solo lectura: muestra datos sin permitir editar (Visualizar hoja CRD). */
  soloLectura?: boolean;
  /** Datos generales para el cintillo (estado, fecha inclusión, etc.). */
  datosGenerales?: DatosGeneralesSujeto;
  onGuardar: (datos: Record<string, unknown>) => void;
  onCerrar: () => void;
}

export function FormularioCRD({
  definicion,
  sujetoIdentificador,
  nombreEstudio,
  momentoSeguimiento = 'Único',
  datosIniciales,
  esPesquisaje,
  hojaId,
  soloLectura = false,
  datosGenerales,
  onGuardar,
  onCerrar,
}: FormularioCRDProps) {
  const [datos, setDatos] = useState<Record<string, unknown>>(datosIniciales);
  const [guardando, setGuardando] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    setDatos(datosIniciales);
  }, [datosIniciales]);

  const secciones = React.useMemo(() => {
    if (!definicion) return [] as { id: string; titulo: string; orden: number }[];
    if (Array.isArray(definicion.secciones) && definicion.secciones.length) {
      return [...definicion.secciones].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    }
    const ids: string[] = [];
    for (const v of definicion.variables) {
      const raw = (v.seccion || '').trim();
      const id = raw || 'Datos generales';
      if (!ids.includes(id)) ids.push(id);
    }
    return ids.map((id, idx) => ({ id, titulo: id, orden: idx + 1 }));
  }, [definicion]);

  useEffect(() => {
    if (secciones.length && !seccionActiva) {
      setSeccionActiva(secciones[0].id);
    }
  }, [secciones, seccionActiva]);

  const handleChange = (id: string, value: unknown) => {
    setErrorValidacion(null);
    setDatos(prev => ({ ...prev, [id]: value }));
  };

  const valorVacio = (v: VariableDef, value: unknown): boolean => {
    if (value === undefined || value === null) return true;
    if (v.tipo === 'checkbox') return false;
    const s = String(value).trim();
    return s === '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (esPesquisaje && definicion) {
      for (const v of definicion.variables) {
        const key = v.id;
        const value = datos[key] ?? datos[v.codigo ?? ''];
        if (valorVacio(v, value)) {
          setErrorValidacion(
            'Complete todos los campos de la hoja CRD de pesquisaje antes de guardar el resultado (Incluido/No Incluido).'
          );
          return;
        }
      }
    }

    setGuardando(true);
    onGuardar(datos);
    setGuardando(false);
  };

  if (!definicion) {
    return (
      <div className="crd-form-wrap">
        <p>Cargando definición del formulario...</p>
        <button type="button" className="btn-secondary" onClick={onCerrar}>Cerrar</button>
      </div>
    );
  }

  const fullWidth = (v: VariableDef) =>
    v.columnas === 2 ||
    (v.columnas !== 1 &&
      (v.tipo === 'textarea' || v.tipo === 'checkbox' || v.tipo === 'radiobutton' || (esPesquisaje && !!v.esResultadoEvaluacion)));

  const renderVariable = (v: VariableDef) => {
    const key = v.id;
    const value = datos[key] ?? datos[v.codigo ?? ''] ?? '';
    const full = fullWidth(v);
    const fieldClass = `crd-field${full ? ' crd-field--full' : ''}`;

    const renderLabelAsterisco = () =>
      v.obligatorio ? <span style={{ color: 'var(--required-asterisk)', marginLeft: 2 }}>*</span> : null;

    // Campo clave: Resultado de Evaluación (Incluido / No Incluido) en Pesquisaje
    if (esPesquisaje && v.esResultadoEvaluacion) {
      const current = String(value || '');
      const setValor = (nuevo: 'Incluido' | 'No Incluido') => handleChange(key, nuevo);
      return (
        <div key={key} className="crd-field crd-field--full crd-resultado">
          <span className="crd-label">
            {v.etiqueta || 'Resultado de Evaluación'}
            {renderLabelAsterisco() || <span style={{ color: 'var(--required-asterisk)', marginLeft: 2 }}>*</span>}
          </span>
          <div className="crd-resultado__buttons">
            <button
              type="button"
              className={`crd-resultado__btn ${current === 'Incluido' ? 'crd-resultado__btn--active' : ''}`}
              onClick={() => setValor('Incluido')}
              disabled={soloLectura}
            >
              Incluido
            </button>
            <button
              type="button"
              className={`crd-resultado__btn ${current === 'No Incluido' ? 'crd-resultado__btn--active' : ''}`}
              onClick={() => setValor('No Incluido')}
              disabled={soloLectura}
            >
              No Incluido
            </button>
          </div>
        </div>
      );
    }

    if (v.tipo === 'checkbox') {
      return (
        <label key={key} className={`crd-field crd-field--checkbox ${fieldClass}`.trim()}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => handleChange(key, e.target.checked)}
            disabled={soloLectura}
          />
          <span>
            {v.etiqueta}
            {renderLabelAsterisco()}
          </span>
        </label>
      );
    }
    if (v.tipo === 'combobox' || v.tipo === 'radiobutton') {
      const opts = v.opciones && v.opciones.length ? v.opciones : (esPesquisaje && v.esResultadoEvaluacion ? ['Incluido', 'No Incluido'] : []);
      if (v.tipo === 'radiobutton') {
        return (
          <div key={key} className={`crd-field crd-field--radio ${fieldClass}`.trim()}>
            <span className="crd-label">
              {v.etiqueta}
              {renderLabelAsterisco()}
            </span>
            <div className="crd-radio-group">
              {opts.map(opt => (
                <label key={opt}>
                  <input
                    type="radio"
                    name={key}
                    value={opt}
                    checked={String(value) === opt}
                    onChange={() => handleChange(key, opt)}
                    disabled={soloLectura}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div key={key} className={fieldClass}>
          <label className="crd-label" htmlFor={key}>
            {v.etiqueta}
            {renderLabelAsterisco()}
          </label>
          <select
            id={key}
            value={String(value)}
            onChange={e => handleChange(key, e.target.value)}
            disabled={soloLectura}
          >
            <option value="">Seleccione...</option>
            {opts.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    if (v.tipo === 'textarea') {
      return (
        <div key={key} className={fieldClass}>
          <label className="crd-label" htmlFor={key}>
            {v.etiqueta}
            {renderLabelAsterisco()}
          </label>
          <textarea
            id={key}
            value={String(value)}
            onChange={e => handleChange(key, e.target.value)}
            rows={3}
            readOnly={soloLectura}
            disabled={soloLectura}
          />
        </div>
      );
    }
    return (
      <div key={key} className={fieldClass}>
        <label className="crd-label" htmlFor={key}>
          {v.etiqueta}
          {renderLabelAsterisco()}
        </label>
        <input
          id={key}
          type={v.tipo === 'number' ? 'number' : v.tipo === 'date' ? 'date' : 'text'}
          value={String(value)}
          onChange={e => handleChange(key, v.tipo === 'number' ? e.target.valueAsNumber : e.target.value)}
          readOnly={soloLectura}
          disabled={soloLectura}
        />
      </div>
    );
  };

  const variablesFiltradas =
    seccionActiva && secciones.length
      ? definicion.variables.filter(v => {
          const sec = (v.seccion || '').trim() || 'Datos generales';
          return sec === seccionActiva;
        })
      : definicion.variables;

  const variablesOrdenadas = React.useMemo(() => {
    const list = variablesFiltradas;
    if (!esPesquisaje) return list;
    return [...list].sort((a, b) => {
      if (a.esResultadoEvaluacion && !b.esResultadoEvaluacion) return 1;
      if (!a.esResultadoEvaluacion && b.esResultadoEvaluacion) return -1;
      return (a.orden ?? 0) - (b.orden ?? 0);
    });
  }, [variablesFiltradas, esPesquisaje]);

  const dg = datosGenerales;
  return (
    <div className="crd-form-wrap">
      <div className="crd-view-header">{soloLectura ? 'Visualizar hoja CRD' : 'Gestionar CRD'}</div>
      <div className="crd-view-subheader">
        <span>Nombre de la hoja: {definicion.nombreHoja}</span>
      </div>
      <div className="crd-tabs-container">
        <div className="crd-tabs-bar">
          <span className="crd-tabs-title">Variables por secciones</span>
          <div className="crd-tabs">
            {secciones.map(sec => (
              <button
                key={sec.id}
                type="button"
                className={`crd-tab ${seccionActiva === sec.id ? 'crd-tab--active' : ''}`}
                onClick={() => setSeccionActiva(sec.id)}
              >
                {sec.titulo}
              </button>
            ))}
          </div>
        </div>
        <div className="crd-section-body">
          <div className="crd-cintillo">
            <span className="crd-cintillo__titulo">{definicion.nombreHoja}</span>
            <span className="crd-cintillo__item">Identificador: {sujetoIdentificador}</span>
            <span className="crd-cintillo__item">Momento: {momentoSeguimiento}</span>
            <span className="crd-cintillo__item">Estudio: {nombreEstudio}</span>
            {dg && (dg.estadoInclusion || dg.fechaInclusion || dg.numeroInclusion || dg.grupoSujeto) && (
              <>
                {dg.estadoInclusion && <span className="crd-cintillo__item">Estado: {dg.estadoInclusion}</span>}
                {dg.fechaInclusion && <span className="crd-cintillo__item">Fecha inclusión: {dg.fechaInclusion}</span>}
                {dg.numeroInclusion && <span className="crd-cintillo__item">Nº inclusión: {dg.numeroInclusion}</span>}
                {dg.grupoSujeto && <span className="crd-cintillo__item">Grupo: {dg.grupoSujeto}</span>}
              </>
            )}
          </div>
          <form onSubmit={handleSubmit} className="crd-form">
            <div className="crd-section-grid">
              {variablesOrdenadas.map(v => renderVariable(v))}
            </div>
            {errorValidacion && (
              <p className="crd-form-error" role="alert">
                {errorValidacion}
              </p>
            )}
            <div className="crd-form-actions">
              {!soloLectura && (
                <button type="submit" className="btn-primary" disabled={guardando}>
                  Guardar
                </button>
              )}
              {!soloLectura && !esPesquisaje && hojaId && (
                <>
                  <button type="button" className="btn-secondary" onClick={() => window.electronAPI?.crd?.exportarJson?.(hojaId)}>
                    Exportar JSON
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => window.electronAPI?.crd?.exportarExcel?.(hojaId)}>
                    Exportar Excel
                  </button>
                </>
              )}
              <button type="button" className="btn-secondary" onClick={onCerrar}>
                {soloLectura ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
