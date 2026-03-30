/**
 * Gestionar Pesquisaje: registro inicial (solo Iniciales); lista solo no incluidos; al incluir pasan a Gestionar sujetos.
 * 3.1, 3.2, 6.1
 */

// --- Imports: hooks de React, contexto del estudio, formulario CRD, modal de confirmación y toast ---
import { useState, useEffect, useRef } from 'react';
import { useEstudio } from '../context/EstudioContext';
import { FormularioCRD } from '../components/crd/FormularioCRD';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastMessage } from '../components/ToastMessage';
import type { DefinicionFormulario } from '../components/crd/FormularioCRD';

// Icono de "más" (adicionar): se usa en el botón "Adicionar sujeto"
function IconMas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}
// Icono de documento: se usa en "Visualizar hoja CRD"
function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
}
// Icono de lápiz: se usa en "Editar sujeto"
function IconLapiz() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
    </svg>
  );
}
// Icono de formulario: se usa en "Gestionar CRD"
function IconForm() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  );
}
// Icono de papelera: se usa en "Eliminar"
function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M9 3v1H4v2h16V4h-5V3H9zm1 5v9h2V8h-2zm-4 0v9h2V8H6zm8 0v9h2V8h-2z" />
    </svg>
  );
}
// Icono de calendario: se usa en el campo fecha de inclusión al editar
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
    </svg>
  );
}
// Icono de flecha hacia abajo: se usa en los desplegables del formulario de edición
function IconArrowDown() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

// Tipo de un sujeto pendiente de pesquisaje (no incluido aún)
interface Pendiente {
  id: string;
  identificador_logico: string;
  iniciales: string;
  estado_inclusion: string;
  created_at: string;
}

// Cantidad de filas por página en la tabla
const PAGE_SIZE = 10;
// Opciones del desplegable "Grupo de sujetos" al editar
const OPCIONES_GRUPO = ['Seleccione', 'Grupo 1', 'Grupo 2', 'Control', 'Experimental'];
// Valores para hora (00–23) y minutos/segundos (00–59) en el selector de hora de inclusión
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MIN_SEG = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Convierte el estado interno (pendiente/incluido/no_incluido) en texto para mostrar en la tabla
function etiquetaEstado(estado: string): string {
  if (!estado) return '—';
  const e = estado.toLowerCase();
  if (e === 'pendiente' || e === 'no_incluido') return 'No incluido';
  if (e === 'incluido') return 'Incluido';
  return estado;
}

export function GestionarPesquisaje() {
  // Datos del estudio activo (id, nombre y si está cargando)
  const { estudioId, nombreEstudio, loading: estudioLoading } = useEstudio();
  // Lista de sujetos pendientes de pesquisaje que se muestra en la tabla
  const [lista, setLista] = useState<Pendiente[]>([]);
  // true mientras se está cargando la lista desde el backend
  const [loading, setLoading] = useState(true);
  // Página actual de la paginación (1-based)
  const [pagina, setPagina] = useState(1);
  // true cuando está abierto el modal de "Adicionar sujeto" (solo iniciales)
  const [modalIncluir, setModalIncluir] = useState(false);
  // Iniciales que el usuario escribe en el modal de adicionar
  const [iniciales, setIniciales] = useState('');
  // Texto del mensaje toast (éxito o error)
  const [mensaje, setMensaje] = useState('');
  // Tipo del mensaje: 'ok' (verde) o 'error' (rojo)
  const [mensajeTipo, setMensajeTipo] = useState<'ok' | 'error' | null>(null);
  // Cuando no es null, se muestra el modal con la hoja CRD (visualizar o gestionar) de un sujeto
  const [hojaAbierta, setHojaAbierta] = useState<{
    sujetoId: string;
    sujetoIdentificador: string;
    plantillaId: string;
    hojaId: string;
    definicion: DefinicionFormulario | null;
    datos: Record<string, unknown>;
    soloLectura?: boolean;
  } | null>(null);
  // Plantillas de tipo Pesquisaje importadas; se usa la primera para abrir hojas CRD
  const [plantillasPesquisaje, setPlantillasPesquisaje] = useState<{ id: string; nombre: string }[]>([]);
  // Sujeto seleccionado para anular; si no es null se muestra el modal de confirmación
  const [pendienteToAnular, setPendienteToAnular] = useState<Pendiente | null>(null);
  // Texto del filtro "Identificador" en criterios de búsqueda
  const [identificador, setIdentificador] = useState('');
  // id del sujeto que se está editando en el modal "Editar sujeto"
  const [sujetoEditandoId, setSujetoEditandoId] = useState<string | null>(null);
  // true cuando está abierto el modal de editar sujeto (inclusión, grupo, etc.)
  const [modalEditar, setModalEditar] = useState(false);
  // Valores del formulario de edición de sujeto (iniciales, fecha, número inclusión, grupo, hora, etc.)
  const [formEdit, setFormEdit] = useState({
    iniciales: '',
    fechaInclusion: new Date().toISOString().slice(0, 10),
    numeroInclusion: '',
    grupoSujeto: '',
    estadoInclusion: 'No incluido',
    horaH: '12',
    horaM: '00',
    horaS: '00',
    inicialesCentro: 'CIM',
  });
  // Referencia al input de fecha para poder abrir el selector nativo desde el botón del calendario
  const refFechaEdit = useRef<HTMLInputElement>(null);

  // Obtiene del backend la lista de sujetos pendientes de pesquisaje (opcionalmente filtrada por identificador) y actualiza estado
  const cargarLista = () => {
    if (!estudioId) return;
    setLoading(true);
    const opts = identificador.trim() ? { identificador: identificador.trim() } : undefined;
    window.electronAPI?.subject?.listarPendientesPesquisaje?.(estudioId, opts)
      .then((r: Pendiente[]) => {
        setLista(Array.isArray(r) ? r : []);
        setPagina(1);
      })
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  };

  // Carga las plantillas de tipo Pesquisaje del estudio para poder abrir hojas CRD
  const cargarPlantillas = () => {
    if (!estudioId) return;
    window.electronAPI?.template?.listar?.(estudioId, 'pesquisaje')
      .then((r) => setPlantillasPesquisaje(Array.isArray(r) ? r : []))
      .catch(() => setPlantillasPesquisaje([]));
  };

  // Al montar o cambiar estudioId: cargar lista de pendientes y plantillas de pesquisaje
  useEffect(() => {
    if (estudioId) {
      cargarLista();
      cargarPlantillas();
    }
  }, [estudioId]);

  // Ejecuta la búsqueda con el identificador escrito y actualiza la lista
  const handleBuscarPesquisaje = () => {
    if (!estudioId) return;
    setLoading(true);
    const opts = identificador.trim() ? { identificador: identificador.trim() } : undefined;
    window.electronAPI?.subject?.listarPendientesPesquisaje?.(estudioId, opts)
      .then((r: Pendiente[]) => {
        setLista(Array.isArray(r) ? r : []);
        setPagina(1);
      })
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  };

  // Limpia el filtro de identificador y recarga la lista completa de pendientes
  const handleCancelarBuscar = () => {
    setIdentificador('');
    if (estudioId) {
      setLoading(true);
      window.electronAPI?.subject?.listarPendientesPesquisaje?.(estudioId)
        .then((r: Pendiente[]) => {
          setLista(Array.isArray(r) ? r : []);
          setPagina(1);
        })
        .catch(() => setLista([]))
        .finally(() => setLoading(false));
    }
  };

  // Crea un nuevo sujeto para pesquisaje con las iniciales del modal y recarga la lista; muestra mensaje de éxito o error
  const handleIncluirSiguiente = () => {
    const ini = (iniciales || '').trim();
    if (!ini) {
      setMensaje('Ingrese las iniciales del sujeto.');
      return;
    }
    if (!estudioId) return;
    setMensaje('');
    setMensajeTipo(null);
    window.electronAPI?.subject?.crearParaPesquisaje?.(estudioId, ini)
      .then(() => {
        setIniciales('');
        cargarLista();
        setMensaje('Sujeto registrado correctamente. Puede incluir otro o cerrar.');
        setMensajeTipo('ok');
      })
      .catch((e: Error) => {
        setMensaje(e?.message || 'Error al registrar.');
        setMensajeTipo('error');
      });
  };

  // Abre el modal para visualizar (solo lectura) la hoja CRD de pesquisaje del sujeto
  const abrirVisualizarHojaCRD = (sujeto: Pendiente) => {
    const plantilla = plantillasPesquisaje[0];
    if (!plantilla) {
      setMensaje('Importe primero una plantilla de Pesquisaje (Importar plantilla CRD).');
      setMensajeTipo('error');
      return;
    }
    window.electronAPI?.crd?.obtenerOCrearHoja?.(sujeto.id, plantilla.id).then((hoja) => {
      window.electronAPI?.crd?.cargarDefinicionFormulario?.(plantilla.id).then((def) => {
        setHojaAbierta({
          sujetoId: sujeto.id,
          sujetoIdentificador: sujeto.identificador_logico,
          plantillaId: plantilla.id,
          hojaId: (hoja as { id: string; datos: Record<string, unknown> }).id,
          definicion: def as DefinicionFormulario | null,
          datos: (hoja as { id: string; datos: Record<string, unknown> }).datos || {},
          soloLectura: true,
        });
      });
    });
  };

  // Abre el modal para gestionar (editar) la hoja CRD de pesquisaje del sujeto y guardar resultado Incluido/No Incluido
  const abrirGestionarCRD = (sujeto: Pendiente) => {
    const plantilla = plantillasPesquisaje[0];
    if (!plantilla) {
      setMensaje('Importe primero una plantilla de Pesquisaje (Importar plantilla CRD).');
      setMensajeTipo('error');
      return;
    }
    window.electronAPI?.crd?.obtenerOCrearHoja?.(sujeto.id, plantilla.id).then((hoja) => {
      window.electronAPI?.crd?.cargarDefinicionFormulario?.(plantilla.id).then((def) => {
        setHojaAbierta({
          sujetoId: sujeto.id,
          sujetoIdentificador: sujeto.identificador_logico,
          plantillaId: plantilla.id,
          hojaId: (hoja as { id: string; datos: Record<string, unknown> }).id,
          definicion: def as DefinicionFormulario | null,
          datos: (hoja as { id: string; datos: Record<string, unknown> }).datos || {},
        });
      });
    });
  };

  // Carga los datos del sujeto desde el backend y abre el modal de edición (inclusión, grupo, hora, etc.)
  const abrirEditarSujeto = (sujeto: Pendiente) => {
    window.electronAPI?.subject?.obtenerPorId?.(sujeto.id).then((row: Record<string, unknown> | undefined) => {
      if (!row) return;
      const h = (row.hora_inclusion as string) || '';
      const [horaH = '12', horaM = '00', horaS = '00'] = h.toString().split(':');
      setFormEdit({
        iniciales: (row.iniciales as string) || '',
        fechaInclusion: (row.fecha_inclusion as string) || new Date().toISOString().slice(0, 10),
        numeroInclusion: (row.numero_inclusion as string) || '',
        grupoSujeto: (row.grupo_sujeto as string) || '',
        estadoInclusion: row.estado_inclusion === 'incluido' ? 'Incluido' : 'No incluido',
        horaH: horaH.slice(0, 2).padStart(2, '0'),
        horaM: horaM.slice(0, 2).padStart(2, '0'),
        horaS: horaS.slice(0, 2).padStart(2, '0'),
        inicialesCentro: (row.iniciales_centro as string) || 'CIM',
      });
      setSujetoEditandoId(sujeto.id);
      setModalEditar(true);
    });
  };

  // Valida el formulario de edición, comprueba identificador único y actualiza el sujeto en el backend; cierra modal y recarga lista
  const handleGuardarEdicion = () => {
    const { iniciales, fechaInclusion, numeroInclusion, grupoSujeto } = formEdit;
    if (!(iniciales || '').trim()) { setMensaje('Iniciales obligatorias.'); setMensajeTipo('error'); return; }
    if (!(fechaInclusion || '').trim()) { setMensaje('Fecha de inclusión obligatoria.'); setMensajeTipo('error'); return; }
    if (!(numeroInclusion || '').trim()) { setMensaje('Número de inclusión obligatorio.'); setMensajeTipo('error'); return; }
    if (!(grupoSujeto || '').trim() || grupoSujeto === 'Seleccione') { setMensaje('Seleccione un grupo de sujetos.'); setMensajeTipo('error'); return; }
    if (!estudioId || !sujetoEditandoId) return;
    window.electronAPI?.subject?.validarIdentificador?.(estudioId, iniciales, numeroInclusion, sujetoEditandoId)
      .then((v: { valido: boolean; mensaje?: string }) => {
        if (!v.valido) { setMensaje(v.mensaje || 'Identificador duplicado.'); setMensajeTipo('error'); return; }
        window.electronAPI?.subject?.actualizar?.(sujetoEditandoId, {
          iniciales: iniciales.trim(),
          fechaInclusion: fechaInclusion || undefined,
          numeroInclusion: numeroInclusion.trim(),
          grupoSujeto: (grupoSujeto || '').trim() || undefined,
          horaInclusion: `${formEdit.horaH}:${formEdit.horaM}:${formEdit.horaS}`,
          inicialesCentro: (formEdit.inicialesCentro || '').trim() || undefined,
          estadoInclusion: formEdit.estadoInclusion === 'Incluido' ? 'incluido' : 'no_incluido',
        });
        setModalEditar(false);
        setSujetoEditandoId(null);
        setMensaje('Sujeto actualizado. El identificador se actualiza si cambian las iniciales o el número de inclusión.');
        setMensajeTipo('ok');
        cargarLista();
      });
  };

  // Guarda los datos de la hoja CRD en el backend; si hay campo "Resultado de Evaluación" (Incluido/No Incluido) actualiza el sujeto; cierra modal y recarga lista
  const guardarHojaPesquisaje = (datos: Record<string, unknown>) => {
    if (!hojaAbierta) return;
    window.electronAPI?.crd?.guardarDatosHoja?.(hojaAbierta.hojaId, datos);

    const resultadoVar = hojaAbierta.definicion?.variables?.find(v => v.esResultadoEvaluacion);
    const resultado = resultadoVar ? (datos[resultadoVar.id] ?? datos[resultadoVar.codigo ?? '']) : null;
    const resultadoStr = String(resultado ?? '').trim();
    if (resultadoStr === 'Incluido' || resultadoStr === 'No Incluido') {
      window.electronAPI?.subject?.actualizarResultadoPesquisaje?.(
        hojaAbierta.sujetoId,
        resultadoStr as 'Incluido' | 'No Incluido'
      );
    }

    setHojaAbierta(null);
    cargarLista();
  };

  // Marca el sujeto como "a anular" para mostrar el modal de confirmación
  const handleEliminarSujeto = (sujeto: Pendiente) => {
    setPendienteToAnular(sujeto);
  };

  // Tras confirmar en el modal: anula el sujeto en el backend, muestra mensaje y recarga la lista
  const confirmarAnularPendiente = () => {
    if (!pendienteToAnular) return;
    window.electronAPI?.subject?.anular?.(pendienteToAnular.id, 'Anulado desde Gestionar Pesquisaje');
    setMensaje('Sujeto anulado correctamente.');
    setMensajeTipo('ok');
    setPendienteToAnular(null);
    cargarLista();
  };

  // Cálculos de paginación: total de páginas, filas de la página actual, rango "desde-hasta" para mostrar
  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE));
  const listaPagina = lista.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const desde = lista.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, lista.length);

  // Valor del input de "ir a página"; se sincroniza con la página actual
  const [paginaInput, setPaginaInput] = useState(String(pagina));
  useEffect(() => { setPaginaInput(String(pagina)); }, [pagina]);
  // Aplica el número escrito en el input de página (al salir del campo o Enter)
  const aplicarPaginaInput = () => {
    const n = parseInt(paginaInput, 10);
    if (!Number.isNaN(n)) setPagina(Math.max(1, Math.min(totalPaginas, n)));
    else setPaginaInput(String(pagina));
  };

  // Mientras se carga el estudio no se muestra el contenido
  if (estudioLoading) return <p>Cargando estudio...</p>;

  return (
    <div className="gestionar-sujetos">
      {/* Toast de mensaje (éxito o error) que se cierra solo o al hacer clic */}
      {mensaje && (
        <ToastMessage
          tipo={mensajeTipo === 'error' ? 'error' : 'ok'}
          texto={mensaje}
          onClose={() => { setMensaje(''); setMensajeTipo(null); }}
          duracion={5}
        />
      )}
      {/* Modal de confirmación para anular (eliminar) un sujeto de pesquisaje */}
      {pendienteToAnular && (
        <ConfirmModal
          title="XAVIA SIDEC"
          message="¿Desea eliminar este sujeto de pesquisaje?"
          confirmLabel="Aceptar"
          cancelLabel="Cancelar"
          onConfirm={confirmarAnularPendiente}
          onCancel={() => setPendienteToAnular(null)}
        />
      )}
      {/* Sección de búsqueda: filtro por identificador */}
      <section className="gs-seccion gs-buscar">
        <h2 className="gs-titulo-seccion">Buscar sujeto</h2>
        <div className="gs-panel gs-criterios">
          <div className="gs-panel-header">Criterios de búsqueda</div>
          <div className="gs-panel-body gs-criterios-body">
            <label className="gs-label" htmlFor="gs-identificador-pesquisaje">Identificador:</label>
            <input
              id="gs-identificador-pesquisaje"
              type="text"
              className="gs-input gs-input-identificador"
              value={identificador}
              onChange={e => setIdentificador(e.target.value)}
            />
            <div className="gs-botones">
              <button type="button" className="btn-primary" onClick={handleBuscarPesquisaje}>Buscar</button>
              <button type="button" className="btn-secondary" onClick={handleCancelarBuscar}>Cancelar</button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección del listado: tabla de sujetos pendientes y paginación */}
      <section className="gs-seccion gs-listado">
        <div className="gs-panel gs-tabla-panel">
          <div className="gs-panel-header gs-listado-header">
            <span>Listado de sujetos</span>
            <button type="button" className="gs-btn-adicionar" onClick={() => { setModalIncluir(true); setMensaje(''); }}>
              <IconMas /> Adicionar sujeto
            </button>
          </div>
          <div className="gs-tabla-wrap">
            <table className="gs-tabla">
              <thead>
                <tr>
                  <th>Identificador</th>
                  <th>Estado de inclusión</th>
                  <th className="gs-col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3}>Cargando...</td></tr>
                ) : listaPagina.length === 0 ? (
                  <tr><td colSpan={3}>No hay sujetos no incluidos. Use &quot;Adicionar sujeto&quot; para registrar por iniciales. Una vez incluidos, pasan a Gestionar sujetos.</td></tr>
                ) : (
                  listaPagina.map(s => (
                    <tr key={s.id}>
                      <td>{s.identificador_logico}</td>
                      <td>{etiquetaEstado(s.estado_inclusion)}</td>
                      <td className="gs-col-acciones">
                        <div className="gs-acciones-icons">
                          <button type="button" className="gs-accion" title="Visualizar hoja CRD" onClick={() => abrirVisualizarHojaCRD(s)}>
                            <IconDocument />
                          </button>
                          <button type="button" className="gs-accion" title="Editar sujeto" onClick={() => abrirEditarSujeto(s)}>
                            <IconLapiz />
                          </button>
                          <button type="button" className="gs-accion" title="Gestionar CRD" onClick={() => abrirGestionarCRD(s)}>
                            <IconForm />
                          </button>
                          <button type="button" className="gs-accion" title="Eliminar" onClick={() => handleEliminarSujeto(s)}>
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Controles de paginación: primera, anterior, input de página, siguiente, última */}
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

      {/* Modal para adicionar un nuevo sujeto: solo pide iniciales y llama a crearParaPesquisaje */}
      {modalIncluir && (
        <div className="modal-overlay" onClick={() => setModalIncluir(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Registro de sujetos para pesquisaje</h3>
            <p className="modal-incluir-instruction">Agrega las iniciales del sujeto.</p>
            <div className="modal-incluir-field">
              <label className="gs-label" htmlFor="modal-iniciales">Iniciales:</label>
              <input
                id="modal-iniciales"
                type="text"
                className="gs-input modal-incluir-iniciales"
                value={iniciales}
                onChange={e => setIniciales(e.target.value)}
                placeholder="Ej. ABC"
              />
            </div>
            
            <div className="gs-botones" style={{ marginTop: 12 }}>
              <button type="button" className="btn-primary" onClick={handleIncluirSiguiente}>
                Adicionar sujeto → siguiente
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setModalIncluir(false); setIniciales(''); setMensaje(''); cargarLista(); }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de hoja CRD (visualizar o gestionar): muestra el formulario dinámico según la plantilla de Pesquisaje */}
      {hojaAbierta && (
        <div className="modal-overlay" onClick={() => setHojaAbierta(null)}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            <FormularioCRD
              definicion={hojaAbierta.definicion}
              sujetoIdentificador={hojaAbierta.sujetoIdentificador}
              nombreEstudio={nombreEstudio}
              momentoSeguimiento="Pesquisaje"
              datosIniciales={hojaAbierta.datos}
              esPesquisaje
              soloLectura={hojaAbierta.soloLectura}
              onGuardar={guardarHojaPesquisaje}
              onCerrar={() => setHojaAbierta(null)}
            />
          </div>
        </div>
      )}

      {/* Modal de editar sujeto: iniciales, fecha/número de inclusión, grupo, estado, hora, iniciales centro */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => { setModalEditar(false); setSujetoEditandoId(null); }}>
          <div className="modal-content modal-content--crear-sujeto" onClick={e => e.stopPropagation()}>
            <div className="crear-sujeto" style={{ padding: 24 }}>
              <h2 className="crear-sujeto__titulo">Editar sujeto</h2>
              <div className="crear-sujeto__barra">Datos del sujeto</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                Si modifica las iniciales o el número de inclusión, el identificador del sujeto se actualizará automáticamente.
              </p>
              {/* Grid de campos del formulario de edición */}
              <div className="crear-sujeto__grid">
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Iniciales del sujeto:<span className="req">*</span></label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={formEdit.iniciales}
                    onChange={e => setFormEdit(f => ({ ...f, iniciales: e.target.value }))}
                  />
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Fecha de inclusión:<span className="req">*</span></label>
                  <div className="crear-sujeto__input-wrap">
                    <input
                      ref={refFechaEdit}
                      type="date"
                      className="crear-sujeto__input"
                      value={formEdit.fechaInclusion}
                      onChange={e => setFormEdit(f => ({ ...f, fechaInclusion: e.target.value }))}
                    />
                    <button type="button" className="crear-sujeto__btn-calendar" aria-label="Calendario" onClick={() => refFechaEdit.current?.showPicker?.() ?? refFechaEdit.current?.click()}>
                      <IconCalendar />
                    </button>
                  </div>
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Número de inclusión:<span className="req">*</span></label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={formEdit.numeroInclusion}
                    onChange={e => setFormEdit(f => ({ ...f, numeroInclusion: e.target.value }))}
                  />
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Grupo de sujetos:<span className="req">*</span></label>
                  <div className="crear-sujeto__select-wrap">
                    <select
                      className="crear-sujeto__select"
                      value={formEdit.grupoSujeto || 'Seleccione'}
                      onChange={e => setFormEdit(f => ({ ...f, grupoSujeto: e.target.value === 'Seleccione' ? '' : e.target.value }))}
                    >
                      {OPCIONES_GRUPO.map(op => (<option key={op} value={op}>{op}</option>))}
                    </select>
                    <span className="arrow"><IconArrowDown /></span>
                  </div>
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Estado de inclusión:</label>
                  <div className="crear-sujeto__select-wrap gray">
                    <select
                      className="crear-sujeto__select"
                      value={formEdit.estadoInclusion}
                      onChange={e => setFormEdit(f => ({ ...f, estadoInclusion: e.target.value }))}
                    >
                      <option value="No incluido">No incluido</option>
                      <option value="Incluido">Incluido</option>
                    </select>
                    <span className="arrow"><IconArrowDown /></span>
                  </div>
                </div>
                <div className="crear-sujeto__field">
                  <label className="crear-sujeto__label">Iniciales del centro:</label>
                  <input
                    type="text"
                    className="crear-sujeto__input"
                    value={formEdit.inicialesCentro}
                    onChange={e => setFormEdit(f => ({ ...f, inicialesCentro: e.target.value }))}
                  />
                </div>
                <div className="crear-sujeto__field" style={{ gridColumn: '1 / -1' }}>
                  <label className="crear-sujeto__label">Hora de inclusión:</label>
                  <div className="crear-sujeto__time">
                    <select value={formEdit.horaH} onChange={e => setFormEdit(f => ({ ...f, horaH: e.target.value }))}>
                      {HORAS.map(h => (<option key={h} value={h}>{h}</option>))}
                    </select>
                    <span>:</span>
                    <select value={formEdit.horaM} onChange={e => setFormEdit(f => ({ ...f, horaM: e.target.value }))}>
                      {MIN_SEG.map(m => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <span>:</span>
                    <select value={formEdit.horaS} onChange={e => setFormEdit(f => ({ ...f, horaS: e.target.value }))}>
                      {MIN_SEG.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Botones del modal de edición */}
              <div className="crear-sujeto__actions">
                <button type="button" className="btn-primary" onClick={handleGuardarEdicion}>Guardar cambios</button>
                <button type="button" className="btn-secondary" onClick={() => { setModalEditar(false); setSujetoEditandoId(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos locales del modal (overlay, contenido, variante ancha y variante crear-sujeto) */}
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 8px; max-width: 480px; width: 90%; }
        .modal-content--wide { max-width: 800px; max-height: 90vh; overflow: auto; }
        .modal-content--crear-sujeto { max-width: 680px; width: 90%; padding: 0; }
      `}</style>
    </div>
  );
}
