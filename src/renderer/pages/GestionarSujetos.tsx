/**
 * Gestionar Sujetos: búsqueda por identificador, listado incluidos, inclusión directa, Evaluación Inicial CRD, exportación. RF-3, RF-5, RF-6, RF-9, RF-10, 5, 7.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useEstudio } from '../context/EstudioContext';
import { FormularioCRD } from '../components/crd/FormularioCRD';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastMessage } from '../components/ToastMessage';
import type { DefinicionFormulario } from '../components/crd/FormularioCRD';
import type { DatosGeneralesSujeto } from '../components/crd/FormularioCRD';

interface SujetoRow {
  id: string;
  identificador_logico: string;
  iniciales: string;
  fecha_inclusion: string;
  numero_inclusion: string;
  grupo_sujeto: string;
  estado_inclusion: string;
  estado_tratamiento: string;
  estado_monitoreo: string;
  created_at: string;
}

function IconOrdenar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}
function IconMas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

function IconLupa() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.5 4.5L20 19.5l-4.5-4.5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" />
    </svg>
  );
}

function IconLapiz() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M9 3v1H4v2h16V4h-5V3H9zm1 5v9h2V8h-2zm-4 0v9h2V8H6zm8 0v9h2V8h-2z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
}

function IconForm() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  );
}

const OPCIONES_GRUPO = ['Seleccione', 'Grupo 1', 'Grupo 2', 'Control', 'Experimental'];
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MIN_SEG = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const PAGE_SIZE = 10;

export function GestionarSujetos() {
  const { estudioId, nombreEstudio, loading: estudioLoading } = useEstudio();
  const [identificador, setIdentificador] = useState('');
  const [lista, setLista] = useState<SujetoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [modalOpcion, setModalOpcion] = useState(false);
  const [modalDirecta, setModalDirecta] = useState(false);
  const [modalPesquisaje, setModalPesquisaje] = useState(false);
  const [inicialesPesquisaje, setInicialesPesquisaje] = useState('');
  const [mensajePesquisaje, setMensajePesquisaje] = useState('');
  const [formDirecta, setFormDirecta] = useState({
    iniciales: '',
    fechaInclusion: new Date().toISOString().slice(0, 10),
    numeroInclusion: '',
    grupoSujeto: '',
    estadoInclusion: 'Incluido',
    horaH: '12',
    horaM: '00',
    horaS: '00',
    inicialesCentro: 'CIM',
  });
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState<'ok' | 'error' | null>(null);
  const [hojaEvalAbierta, setHojaEvalAbierta] = useState<{
    sujetoId: string;
    sujetoIdentificador: string;
    plantillaId: string;
    hojaId: string;
    definicion: DefinicionFormulario | null;
    datos: Record<string, unknown>;
    soloLectura?: boolean;
    datosGenerales?: DatosGeneralesSujeto;
  } | null>(null);
  const [sujetoEditandoId, setSujetoEditandoId] = useState<string | null>(null);
  const [hojaPesquisajeAbierta, setHojaPesquisajeAbierta] = useState<{
    sujetoId: string;
    sujetoIdentificador: string;
    plantillaId: string;
    hojaId: string;
    definicion: DefinicionFormulario | null;
    datos: Record<string, unknown>;
  } | null>(null);
  const [sujetoToAnular, setSujetoToAnular] = useState<SujetoRow | null>(null);
  const [plantillasEval, setPlantillasEval] = useState<{ id: string; nombre: string }[]>([]);
  const [plantillasPesquisaje, setPlantillasPesquisaje] = useState<{ id: string; nombre: string }[]>([]);

  const cargarLista = () => {
    if (!estudioId) return;
    setLoading(true);
    window.electronAPI?.subject?.listarTodosParaGestionar?.(estudioId, identificador ? { identificador } : undefined)
      .then((r: SujetoRow[]) => setLista(Array.isArray(r) ? r : []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (estudioId) {
      cargarLista();
      window.electronAPI?.template?.listar?.(estudioId, 'evaluacion_inicial')
        .then((r: { id: string; nombre: string }[]) => setPlantillasEval(Array.isArray(r) ? r : []))
        .catch(() => setPlantillasEval([]));
      window.electronAPI?.template?.listar?.(estudioId, 'pesquisaje')
        .then((r: { id: string; nombre: string }[]) => setPlantillasPesquisaje(Array.isArray(r) ? r : []))
        .catch(() => setPlantillasPesquisaje([]));
    }
  }, [estudioId]);

  useEffect(() => {
    if (estudioId) cargarLista();
  }, [identificador]);

  const handleBuscar = () => cargarLista();
  const handleCancelar = () => setIdentificador('');

  const refFechaInclusion = useRef<HTMLInputElement>(null);

  const abrirOpcionAdicionar = () => {
    setModalOpcion(true);
    setMensaje('');
    setMensajeTipo(null);
    setMensajePesquisaje('');
  };

  const handleCrearPesquisaje = () => {
    const ini = (inicialesPesquisaje || '').trim();
    if (!ini) { setMensajePesquisaje('Iniciales del sujeto son obligatorias.'); return; }
    if (!estudioId) return;
    window.electronAPI?.subject?.crearParaPesquisaje?.(estudioId, ini)
      .then((r: { id: string; identificadorLogico: string; numeroInclusion?: string }) => {
        setModalPesquisaje(false);
        setInicialesPesquisaje('');
        setMensajePesquisaje('');
        setMensaje(
          r.numeroInclusion
            ? `Sujeto creado para pesquisaje. Número de inclusión asignado: ${r.numeroInclusion}. Revise Gestionar pesquisaje.`
            : 'Sujeto creado para pesquisaje. Revise Gestionar pesquisaje.'
        );
        setMensajeTipo('ok');
        // Navega directamente a Gestión de Pesquisaje
        (window as any)?.xaviaNavigate?.('gestionar-pesquisaje');
      })
      .catch((err: Error) => {
        setMensajePesquisaje(err?.message || 'Error al crear sujeto.');
        setMensajeTipo('error');
      });
  };

  const handleAdicionarDirecta = () => {
    const { iniciales, fechaInclusion, numeroInclusion, grupoSujeto } = formDirecta;
    if (!(iniciales || '').trim()) { setMensaje('Iniciales obligatorias.'); setMensajeTipo('error'); return; }
    if (!(fechaInclusion || '').trim()) { setMensaje('Fecha de inclusión obligatoria.'); setMensajeTipo('error'); return; }
    if (!(numeroInclusion || '').trim()) { setMensaje('Número de inclusión obligatorio.'); setMensajeTipo('error'); return; }
    if (!(grupoSujeto || '').trim() || grupoSujeto === 'Seleccione') { setMensaje('Seleccione un grupo de sujetos.'); setMensajeTipo('error'); return; }
    if (!estudioId) return;

    if (sujetoEditandoId) {
      window.electronAPI?.subject?.validarIdentificador?.(estudioId, iniciales, numeroInclusion, sujetoEditandoId)
        .then((v: { valido: boolean; mensaje?: string }) => {
          if (!v.valido) { setMensaje(v.mensaje || 'Identificador duplicado.'); setMensajeTipo('error'); return; }
          window.electronAPI?.subject?.actualizar?.(sujetoEditandoId, {
            iniciales: iniciales.trim(),
            fechaInclusion: fechaInclusion || undefined,
            numeroInclusion: numeroInclusion.trim(),
            grupoSujeto: (grupoSujeto || '').trim() || undefined,
            horaInclusion: `${formDirecta.horaH}:${formDirecta.horaM}:${formDirecta.horaS}`,
            inicialesCentro: (formDirecta.inicialesCentro || '').trim() || undefined,
            estadoInclusion: formDirecta.estadoInclusion === 'Incluido' ? 'incluido' : formDirecta.estadoInclusion === 'Pendiente' ? 'pendiente' : 'no_incluido',
          });
          setModalDirecta(false);
          setSujetoEditandoId(null);
          setMensaje('Sujeto actualizado correctamente.');
          setMensajeTipo('ok');
          cargarLista();
        });
      return;
    }

    window.electronAPI?.subject?.validarIdentificador?.(estudioId, iniciales, numeroInclusion)
      .then((v: { valido: boolean; mensaje?: string }) => {
        if (!v.valido) { setMensaje(v.mensaje || 'Identificador duplicado.'); setMensajeTipo('error'); return; }
        const t = new Date();
        return window.electronAPI?.subject?.crearInclusionDirecta?.(estudioId, {
          iniciales: iniciales.trim(),
          fechaInclusion: fechaInclusion || t.toISOString().slice(0, 10),
          numeroInclusion: numeroInclusion.trim(),
          grupoSujeto: (grupoSujeto || '').trim(),
          horaInclusion: `${formDirecta.horaH}:${formDirecta.horaM}:${formDirecta.horaS}`,
          inicialesCentro: (formDirecta.inicialesCentro || '').trim() || undefined,
        });
      })
      .then(() => {
        setModalDirecta(false);
        const n = new Date();
        setFormDirecta({
          iniciales: '',
          fechaInclusion: n.toISOString().slice(0, 10),
          numeroInclusion: '',
          grupoSujeto: '',
          estadoInclusion: 'Incluido',
          horaH: String(n.getHours()).padStart(2, '0'),
          horaM: String(n.getMinutes()).padStart(2, '0'),
          horaS: String(n.getSeconds()).padStart(2, '0'),
          inicialesCentro: 'CIM',
        });
        setMensaje('Sujeto incluido correctamente.');
        setMensajeTipo('ok');
        cargarLista();
      })
      .catch((e: Error) => {
        setMensaje(e?.message || 'Error al registrar.');
        setMensajeTipo('error');
      });
  };

  const etiquetaEstado = (estado: string) => {
    if (!estado) return '—';
    const e = estado.toLowerCase();
    if (e === 'pendiente') return 'Pendiente';
    if (e === 'incluido') return 'Incluido';
    if (e === 'no_incluido') return 'No incluido';
    return estado;
  };

  const abrirPesquisaje = (sujeto: SujetoRow) => {
    const plantilla = plantillasPesquisaje[0];
    if (!plantilla) {
      setMensaje('Importe primero una plantilla de Pesquisaje (Importar plantilla CRD).');
      setMensajeTipo('error');
      return;
    }
    window.electronAPI?.crd?.obtenerOCrearHoja?.(sujeto.id, plantilla.id).then((hoja: { id: string; datos: Record<string, unknown> }) => {
      window.electronAPI?.crd?.cargarDefinicionFormulario?.(plantilla.id).then((def: DefinicionFormulario | null) => {
        setHojaPesquisajeAbierta({
          sujetoId: sujeto.id,
          sujetoIdentificador: sujeto.identificador_logico,
          plantillaId: plantilla.id,
          hojaId: hoja.id,
          definicion: def,
          datos: hoja.datos || {},
        });
      });
    });
  };

  const guardarHojaPesquisaje = (datos: Record<string, unknown>) => {
    if (!hojaPesquisajeAbierta) return;
    window.electronAPI?.crd?.guardarDatosHoja?.(hojaPesquisajeAbierta.hojaId, datos);
    const resultadoVar = hojaPesquisajeAbierta.definicion?.variables?.find(v => v.esResultadoEvaluacion);
    const resultado = resultadoVar ? (datos[resultadoVar.id] ?? datos[resultadoVar.codigo ?? '']) : null;
    const resultadoStr = String(resultado ?? '').trim();
    if (resultadoStr === 'Incluido' || resultadoStr === 'No Incluido') {
      window.electronAPI?.subject?.actualizarResultadoPesquisaje?.(
        hojaPesquisajeAbierta.sujetoId,
        resultadoStr as 'Incluido' | 'No Incluido',
        resultadoStr === 'Incluido' ? { numeroInclusion: 'INC-' + Date.now().toString().slice(-6), fechaInclusion: new Date().toISOString().slice(0, 10) } : undefined
      );
    }
    setHojaPesquisajeAbierta(null);
    cargarLista();
  };

  const abrirVisualizarHojaCRD = (sujeto: SujetoRow) => {
    const plantilla = plantillasEval[0];
    if (!plantilla) {
      setMensaje('Importe primero una plantilla de Evaluación Inicial (Importar plantilla CRD).');
      setMensajeTipo('error');
      return;
    }
    window.electronAPI?.crd?.obtenerOCrearHoja?.(sujeto.id, plantilla.id).then((hoja: { id: string; datos: Record<string, unknown> }) => {
      window.electronAPI?.crd?.cargarDefinicionFormulario?.(plantilla.id).then((def: DefinicionFormulario | null) => {
        setHojaEvalAbierta({
          sujetoId: sujeto.id,
          sujetoIdentificador: sujeto.identificador_logico,
          plantillaId: plantilla.id,
          hojaId: hoja.id,
          definicion: def,
          datos: hoja.datos || {},
          soloLectura: true,
        });
      });
    });
  };

  const abrirGestionarCRD = (sujeto: SujetoRow) => {
    const plantilla = plantillasEval[0];
    if (!plantilla) {
      setMensaje('Importe primero una plantilla de Evaluación Inicial (Importar plantilla CRD).');
      setMensajeTipo('error');
      return;
    }
    window.electronAPI?.crd?.obtenerOCrearHoja?.(sujeto.id, plantilla.id).then((hoja: { id: string; datos: Record<string, unknown> }) => {
      window.electronAPI?.crd?.cargarDefinicionFormulario?.(plantilla.id).then((def: DefinicionFormulario | null) => {
        setHojaEvalAbierta({
          sujetoId: sujeto.id,
          sujetoIdentificador: sujeto.identificador_logico,
          plantillaId: plantilla.id,
          hojaId: hoja.id,
          definicion: def,
          datos: hoja.datos || {},
          datosGenerales: {
            estadoInclusion: etiquetaEstado(sujeto.estado_inclusion),
            fechaInclusion: sujeto.fecha_inclusion || undefined,
            numeroInclusion: sujeto.numero_inclusion || undefined,
            grupoSujeto: sujeto.grupo_sujeto || undefined,
          },
        });
      });
    });
  };

  const abrirEvaluacionInicial = abrirGestionarCRD;

  const abrirEditarSujeto = (sujeto: SujetoRow) => {
    window.electronAPI?.subject?.obtenerPorId?.(sujeto.id).then((row: Record<string, unknown> | undefined) => {
      if (!row) return;
      const h = (row.hora_inclusion as string) || '';
      const [horaH = '12', horaM = '00', horaS = '00'] = h.toString().split(':');
      setFormDirecta({
        iniciales: (row.iniciales as string) || '',
        fechaInclusion: (row.fecha_inclusion as string) || new Date().toISOString().slice(0, 10),
        numeroInclusion: (row.numero_inclusion as string) || '',
        grupoSujeto: (row.grupo_sujeto as string) || '',
        estadoInclusion: row.estado_inclusion === 'incluido' ? 'Incluido' : row.estado_inclusion === 'pendiente' ? 'Pendiente' : 'No incluido',
        horaH: horaH.slice(0, 2).padStart(2, '0'),
        horaM: horaM.slice(0, 2).padStart(2, '0'),
        horaS: horaS.slice(0, 2).padStart(2, '0'),
        inicialesCentro: (row.iniciales_centro as string) || 'CIM',
      });
      setSujetoEditandoId(sujeto.id);
      setModalDirecta(true);
    });
  };

  const guardarHojaEval = (datos: Record<string, unknown>) => {
    if (!hojaEvalAbierta) return;
    window.electronAPI?.crd?.guardarDatosHoja?.(hojaEvalAbierta.hojaId, datos);
    setHojaEvalAbierta(null);
  };

  const handleEliminarSujeto = (sujeto: SujetoRow) => {
    setSujetoToAnular(sujeto);
  };

  const confirmarAnularSujeto = () => {
    if (!sujetoToAnular) return;
    window.electronAPI?.subject?.anular?.(sujetoToAnular.id, 'Anulado desde Gestión de Sujetos');
    setMensaje('Sujeto anulado correctamente.');
    setMensajeTipo('ok');
    setSujetoToAnular(null);
    cargarLista();
  };

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE));
  const listaPagina = lista.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const desde = lista.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, lista.length);

  const [paginaInput, setPaginaInput] = useState(String(pagina));
  useEffect(() => { setPaginaInput(String(pagina)); }, [pagina]);
  const aplicarPaginaInput = () => {
    const n = parseInt(paginaInput, 10);
    if (!Number.isNaN(n)) setPagina(Math.max(1, Math.min(totalPaginas, n)));
    else setPaginaInput(String(pagina));
  };

  if (estudioLoading) return <p>Cargando estudio...</p>;

  return (
    <div className="gestionar-sujetos">
      {mensaje && (
        <ToastMessage
          tipo={mensajeTipo === 'error' ? 'error' : 'ok'}
          texto={mensaje}
          onClose={() => { setMensaje(''); setMensajeTipo(null); }}
          duracion={5}
        />
      )}
      {sujetoToAnular && (
        <ConfirmModal
          title="XAVIA SIDEC"
          message="¿Desea eliminar (anular) este sujeto?"
          confirmLabel="Aceptar"
          cancelLabel="Cancelar"
          onConfirm={confirmarAnularSujeto}
          onCancel={() => setSujetoToAnular(null)}
        />
      )}
      <section className="gs-seccion gs-buscar">
        <h2 className="gs-titulo-seccion">Buscar sujeto</h2>
        <div className="gs-panel gs-criterios">
          <div className="gs-panel-header">Criterios de búsqueda</div>
          <div className="gs-panel-body gs-criterios-body">
            <label className="gs-label" htmlFor="gs-identificador">Identificador:</label>
            <input
              id="gs-identificador"
              type="text"
              className="gs-input gs-input-identificador"
              value={identificador}
              onChange={e => setIdentificador(e.target.value)}
            />
            <div className="gs-botones">
              <button type="button" className="btn-primary" onClick={handleBuscar}>Buscar</button>
              <button type="button" className="btn-secondary" onClick={handleCancelar}>Cancelar</button>
            </div>
          </div>
        </div>
      </section>

      <section className="gs-seccion gs-listado">
        <div className="gs-panel gs-tabla-panel">
          <div className="gs-panel-header gs-listado-header">
            <span>Listado de sujetos</span>
            <button type="button" className="gs-btn-adicionar" onClick={abrirOpcionAdicionar}>
              <IconMas /> Adicionar sujeto
            </button>
          </div>
          <div className="gs-tabla-wrap">
            <table className="gs-tabla">
              <thead>
                <tr>
                  <th>Identificador <span className="gs-th-icon"><IconOrdenar /></span></th>
                  <th>Estado de inclusión <span className="gs-th-icon"><IconOrdenar /></span></th>
                  <th className="gs-col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3}>Cargando...</td></tr>
                ) : listaPagina.length === 0 ? (
                  <tr><td colSpan={3}>No hay sujetos. Use Adicionar sujeto (inclusión directa o con pesquisaje).</td></tr>
                ) : (
                  listaPagina.map(s => {
                    const puedeEditar = s.estado_inclusion === 'pendiente' || s.estado_inclusion === 'incluido';
                    return (
                      <tr key={s.id}>
                        <td>{s.identificador_logico}</td>
                        <td>{etiquetaEstado(s.estado_inclusion)}</td>
                        <td className="gs-col-acciones">
                          <div className="gs-acciones-icons">
                            <button
                              type="button"
                              className="gs-accion"
                              title="Visualizar hoja CRD"
                              onClick={() => abrirVisualizarHojaCRD(s)}
                            >
                              <IconDocument />
                            </button>
                            <button
                              type="button"
                              className="gs-accion"
                              disabled={!puedeEditar}
                              title="Editar sujeto"
                              onClick={() => abrirEditarSujeto(s)}
                            >
                              <IconLapiz />
                            </button>
                            <button
                              type="button"
                              className="gs-accion"
                              disabled={!puedeEditar}
                              title="Gestionar CRD"
                              onClick={() => abrirGestionarCRD(s)}
                            >
                              <IconForm />
                            </button>
                            <button
                              type="button"
                              className="gs-accion"
                              title="Eliminar"
                              onClick={() => handleEliminarSujeto(s)}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="gs-paginacion">
            <div className="gs-paginacion-controles">
              <button type="button" className="gs-pag-btn" disabled={pagina <= 1} onClick={() => setPagina(1)} aria-label="Primera">&laquo;</button>
              <button type="button" className="gs-pag-btn" disabled={pagina <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))} aria-label="Anterior">&lsaquo;</button>
              <input
                type="text"
                className="gs-pag-input"
                value={paginaInput}
                onChange={e => setPaginaInput(e.target.value.replace(/\D/g, ''))}
                onBlur={aplicarPaginaInput}
                onKeyDown={e => { if (e.key === 'Enter') aplicarPaginaInput(); }}
                aria-label="Número de página"
              />
              <button type="button" className="gs-pag-btn gs-pag-btn--next" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} aria-label="Siguiente">&rsaquo;</button>
              <button type="button" className="gs-pag-btn gs-pag-btn--last" disabled={pagina >= totalPaginas} onClick={() => setPagina(totalPaginas)} aria-label="Última">&raquo;</button>
            </div>
            <div className="gs-paginacion-info">{lista.length ? `${desde} - ${hasta}/${lista.length}` : '0/0'}</div>
          </div>
        </div>
      </section>

      {modalOpcion && (
        <div className="modal-overlay" onClick={() => setModalOpcion(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 className="crear-sujeto__titulo" style={{ marginBottom: 16 }}>Adicionar sujeto</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Elija cómo desea agregar al sujeto:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => { setModalOpcion(false); setModalDirecta(true); }}
              >
                Inclusión directa
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setModalOpcion(false); setModalPesquisaje(true); }}
              >
                Con pesquisaje
              </button>
            </div>
            <button type="button" className="btn-secondary" style={{ marginTop: 16 }} onClick={() => setModalOpcion(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modalPesquisaje && (
        <div className="modal-overlay" onClick={() => { setModalPesquisaje(false); setInicialesPesquisaje(''); setMensajePesquisaje(''); }}>
          <div className="modal-content modal-content--crear-sujeto" onClick={e => e.stopPropagation()}>
            <div className="crear-sujeto" style={{ padding: 24 }}>
              <h2 className="crear-sujeto__titulo">Crear sujeto (con pesquisaje)</h2>
              <div className="crear-sujeto__barra">Datos del sujeto</div>
              <div className="crear-sujeto__grid">
                <div className="crear-sujeto__field" style={{ gridColumn: '1 / -1' }}>
                  <label className="crear-sujeto__label">Iniciales del sujeto:<span className="req">*</span></label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={inicialesPesquisaje}
                    onChange={e => setInicialesPesquisaje(e.target.value)}
                    placeholder="Ej. ABC"
                  />
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8 }}>
                El número de inclusión (ID) se asignará automáticamente con formato CSIMFL.
              </p>
              {mensajePesquisaje && <p style={{ color: 'var(--required-asterisk)', marginTop: 12 }}>{mensajePesquisaje}</p>}
              <div className="crear-sujeto__actions">
                <button type="button" className="btn-primary" onClick={handleCrearPesquisaje}>Guardar</button>
                <button type="button" className="btn-secondary" onClick={() => { setModalPesquisaje(false); setInicialesPesquisaje(''); setMensajePesquisaje(''); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalDirecta && (
        <div className="modal-overlay" onClick={() => { setModalDirecta(false); setSujetoEditandoId(null); }}>
          <div className="modal-content modal-content--crear-sujeto" onClick={e => e.stopPropagation()}>
            <div className="crear-sujeto" style={{ padding: 24 }}>
              <h2 className="crear-sujeto__titulo">{sujetoEditandoId ? 'Editar sujeto' : 'Crear sujeto'}</h2>
              <div className="crear-sujeto__barra">Datos del sujeto</div>
              <div className="crear-sujeto__grid">
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Iniciales del sujeto:<span className="req">*</span></label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={formDirecta.iniciales}
                    onChange={e => setFormDirecta(f => ({ ...f, iniciales: e.target.value }))}
                  />
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Fecha de inclusión:<span className="req">*</span></label>
                  <div className="crear-sujeto__input-wrap">
                    <input
                      ref={refFechaInclusion}
                      type="date"
                      className="crear-sujeto__input"
                      value={formDirecta.fechaInclusion}
                      onChange={e => setFormDirecta(f => ({ ...f, fechaInclusion: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="crear-sujeto__btn-calendar"
                      title="Seleccionar fecha"
                      aria-label="Calendario"
                      onClick={() => refFechaInclusion.current?.showPicker?.() ?? refFechaInclusion.current?.click()}
                    >
                      <IconCalendar />
                    </button>
                  </div>
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Número de inclusión:<span className="req">*</span></label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={formDirecta.numeroInclusion}
                    onChange={e => setFormDirecta(f => ({ ...f, numeroInclusion: e.target.value }))}
                  />
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Grupo de sujetos:<span className="req">*</span></label>
                  <div className="crear-sujeto__select-wrap">
                    <select
                      className="crear-sujeto__select"
                      value={formDirecta.grupoSujeto || 'Seleccione'}
                      onChange={e => setFormDirecta(f => ({ ...f, grupoSujeto: e.target.value === 'Seleccione' ? '' : e.target.value }))}
                    >
                      {OPCIONES_GRUPO.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <span className="arrow"><IconArrowDown /></span>
                  </div>
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Estado de inclusión:</label>
                  <div className="crear-sujeto__select-wrap gray">
                    <select
                      className="crear-sujeto__select"
                      value={formDirecta.estadoInclusion}
                      onChange={e => setFormDirecta(f => ({ ...f, estadoInclusion: e.target.value }))}
                    >
                      <option value="Incluido">Incluido</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="No incluido">No incluido</option>
                    </select>
                    <span className="arrow"><IconArrowDown /></span>
                  </div>
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Iniciales del centro:</label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={formDirecta.inicialesCentro}
                    onChange={e => setFormDirecta(f => ({ ...f, inicialesCentro: e.target.value }))}
                  />
                </div>
                <div className="crear-sujeto__field" style={{ gridColumn: '1 / -1' }}>
                  <label className="crear-sujeto__label">Hora de inclusión:</label>
                  <div className="crear-sujeto__time">
                    <select value={formDirecta.horaH} onChange={e => setFormDirecta(f => ({ ...f, horaH: e.target.value }))}>
                      {HORAS.map(h => (<option key={h} value={h}>{h}</option>))}
                    </select>
                    <span>:</span>
                    <select value={formDirecta.horaM} onChange={e => setFormDirecta(f => ({ ...f, horaM: e.target.value }))}>
                      {MIN_SEG.map(m => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <span>:</span>
                    <select value={formDirecta.horaS} onChange={e => setFormDirecta(f => ({ ...f, horaS: e.target.value }))}>
                      {MIN_SEG.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="crear-sujeto__actions">
                <button type="button" className="btn-primary" onClick={handleAdicionarDirecta}>{sujetoEditandoId ? 'Guardar cambios' : 'Guardar'}</button>
                <button type="button" className="btn-secondary" onClick={() => { setModalDirecta(false); setSujetoEditandoId(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hojaPesquisajeAbierta && (
        <div className="modal-overlay" onClick={() => setHojaPesquisajeAbierta(null)}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            <FormularioCRD
              definicion={hojaPesquisajeAbierta.definicion}
              sujetoIdentificador={hojaPesquisajeAbierta.sujetoIdentificador}
              nombreEstudio={nombreEstudio}
              momentoSeguimiento="Pesquisaje"
              datosIniciales={hojaPesquisajeAbierta.datos}
              esPesquisaje
              onGuardar={guardarHojaPesquisaje}
              onCerrar={() => setHojaPesquisajeAbierta(null)}
            />
          </div>
        </div>
      )}

      {hojaEvalAbierta && (
        <div className="modal-overlay" onClick={() => setHojaEvalAbierta(null)}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            <FormularioCRD
              definicion={hojaEvalAbierta.definicion}
              sujetoIdentificador={hojaEvalAbierta.sujetoIdentificador}
              nombreEstudio={nombreEstudio}
              momentoSeguimiento="Evaluación Inicial"
              datosIniciales={hojaEvalAbierta.datos}
              esPesquisaje={false}
              hojaId={hojaEvalAbierta.hojaId}
              soloLectura={hojaEvalAbierta.soloLectura}
              datosGenerales={hojaEvalAbierta.datosGenerales}
              onGuardar={guardarHojaEval}
              onCerrar={() => setHojaEvalAbierta(null)}
            />
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 8px; max-width: 480px; width: 90%; }
        .modal-content--wide { max-width: 800px; max-height: 90vh; overflow: auto; }
        .modal-content--crear-sujeto { max-width: 680px; width: 90%; padding: 0; }
      `}</style>
    </div>
  );
}
