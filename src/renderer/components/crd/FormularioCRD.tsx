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
  obligatorio?: boolean;
  esResultadoEvaluacion?: boolean;
}

export interface DefinicionFormulario {
  nombreHoja: string;
  variables: VariableDef[];
  /** Secciones opcionales para agrupar variables y construir pestañas, preservando orden original. */
  secciones?: { id: string; titulo: string; orden: number }[];
}

interface FormularioCRDProps {
  definicion: DefinicionFormulario | null;
  sujetoIdentificador: string;
  nombreEstudio: string;
  momentoSeguimiento?: string;
  datosIniciales: Record<string, unknown>;
  esPesquisaje: boolean;
  hojaId?: string;
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
  onGuardar,
  onCerrar,
}: FormularioCRDProps) {
  const [datos, setDatos] = useState<Record<string, unknown>>(datosIniciales);
  const [guardando, setGuardando] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);

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
    setDatos(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const renderVariable = (v: VariableDef) => {
    const key = v.id;
    const value = datos[key] ?? datos[v.codigo ?? ''] ?? '';

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
            >
              Incluido
            </button>
            <button
              type="button"
              className={`crd-resultado__btn ${current === 'No Incluido' ? 'crd-resultado__btn--active' : ''}`}
              onClick={() => setValor('No Incluido')}
            >
              No Incluido
            </button>
          </div>
        </div>
      );
    }

    if (v.tipo === 'checkbox') {
      return (
        <label key={key} className="crd-field crd-field--checkbox crd-field--full">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => handleChange(key, e.target.checked)}
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
          <div key={key} className="crd-field crd-field--radio crd-field--full">
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
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div key={key} className="crd-field">
          <label className="crd-label" htmlFor={key}>
            {v.etiqueta}
            {renderLabelAsterisco()}
          </label>
          <select
            id={key}
            value={String(value)}
            onChange={e => handleChange(key, e.target.value)}
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
        <div key={key} className="crd-field crd-field--full">
          <label className="crd-label" htmlFor={key}>
            {v.etiqueta}
            {renderLabelAsterisco()}
          </label>
          <textarea
            id={key}
            value={String(value)}
            onChange={e => handleChange(key, e.target.value)}
            rows={3}
          />
        </div>
      );
    }
    return (
      <div key={key} className="crd-field">
        <label className="crd-label" htmlFor={key}>
          {v.etiqueta}
          {renderLabelAsterisco()}
        </label>
        <input
          id={key}
          type={v.tipo === 'number' ? 'number' : v.tipo === 'date' ? 'date' : 'text'}
          value={String(value)}
          onChange={e => handleChange(key, v.tipo === 'number' ? e.target.valueAsNumber : e.target.value)}
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

  return (
    <div className="crd-form-wrap">
      <div className="crd-view-header">Visualizar hoja CRD</div>
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
          </div>
          <form onSubmit={handleSubmit} className="crd-form">
            <div className="crd-section-grid">
              {variablesFiltradas.map(v => renderVariable(v))}
            </div>
            <div className="crd-form-actions">
              <button type="submit" className="btn-primary" disabled={guardando}>
                Guardar
              </button>
              {!esPesquisaje && hojaId && (
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
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
