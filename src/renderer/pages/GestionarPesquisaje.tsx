/**
 * Gestionar Pesquisaje: registro inicial (solo Iniciales) e inclusión masiva secuencial; lista pendientes; abrir hoja CRD Pesquisaje.
 * 3.1, 3.2, 6.1
 */

import { useState, useEffect } from 'react';
import { useEstudio } from '../context/EstudioContext';
import { FormularioCRD } from '../components/crd/FormularioCRD';
import { ConfirmModal } from '../components/ConfirmModal';
import type { DefinicionFormulario } from '../components/crd/FormularioCRD';

interface Pendiente {
  id: string;
  identificador_logico: string;
  iniciales: string;
  estado_inclusion: string;
  created_at: string;
}

const PAGE_SIZE = 4;

export function GestionarPesquisaje() {
  const { estudioId, nombreEstudio, loading: estudioLoading } = useEstudio();
  const [lista, setLista] = useState<Pendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [modalIncluir, setModalIncluir] = useState(false);
  const [iniciales, setIniciales] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState<'ok' | 'error' | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState<{
    sujetoId: string;
    sujetoIdentificador: string;
    plantillaId: string;
    hojaId: string;
    definicion: DefinicionFormulario | null;
    datos: Record<string, unknown>;
  } | null>(null);
  const [plantillasPesquisaje, setPlantillasPesquisaje] = useState<{ id: string; nombre: string }[]>([]);
  const [pendienteToAnular, setPendienteToAnular] = useState<Pendiente | null>(null);

  const cargarLista = () => {
    if (!estudioId) return;
    setLoading(true);
    window.electronAPI?.subject?.listarPendientesPesquisaje?.(estudioId)
      .then((r: Pendiente[]) => {
        setLista(Array.isArray(r) ? r : []);
        setPagina(1);
      })
      .catch(() => setLista([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(''), 4000);
    return () => clearTimeout(t);
  }, [mensaje]);

  const cargarPlantillas = () => {
    if (!estudioId) return;
    window.electronAPI?.template?.listar?.(estudioId, 'pesquisaje')
      .then((r) => setPlantillasPesquisaje(Array.isArray(r) ? r : []))
      .catch(() => setPlantillasPesquisaje([]));
  };

  useEffect(() => {
    if (estudioId) {
      cargarLista();
      cargarPlantillas();
    }
  }, [estudioId]);

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

  const abrirHojaPesquisaje = (sujeto: Pendiente) => {
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

  const handleEliminarSujeto = (sujeto: Pendiente) => {
    setPendienteToAnular(sujeto);
  };

  const confirmarAnularPendiente = () => {
    if (!pendienteToAnular) return;
    window.electronAPI?.subject?.anular?.(pendienteToAnular.id, 'Anulado desde Gestionar Pesquisaje');
    setMensaje('Sujeto anulado correctamente.');
    setMensajeTipo('ok');
    setPendienteToAnular(null);
    cargarLista();
  };

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE));
  const listaPagina = lista.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const desde = lista.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, lista.length);

  if (estudioLoading) return <p>Cargando estudio...</p>;

  return (
    <div className="gestionar-sujetos">
      {mensaje && (
        <div className={`app-toast ${mensajeTipo === 'error' ? 'app-toast--error' : ''}`}>
          <div className="app-toast__bar" />
          <div className="app-toast__body">{mensaje}</div>
        </div>
      )}
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
      <section className="gs-seccion gs-buscar">
        <h2 className="gs-titulo-seccion">Pendientes de pesquisaje</h2>
        <div className="gs-panel gs-criterios">
          <div className="gs-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Listado</span>
            <button type="button" className="gs-btn-adicionar" onClick={() => { setModalIncluir(true); setMensaje(''); }}>
              + Incluir sujeto
            </button>
          </div>
          <div className={`gs-panel-body ${lista.length > 0 ? 'gs-panel-body--listado' : ''}`}>
            {loading ? (
              <p>Cargando...</p>
            ) : lista.length === 0 ? (
              <p>No hay sujetos pendientes de pesquisaje. Use &quot;Incluir sujeto&quot; para registrar por iniciales.</p>
            ) : (
              <>
                <div className="gs-listado-tabla-wrap">
                  <table className="gs-tabla">
                  <thead>
                    <tr>
                      <th>Identificador</th>
                      <th>Iniciales</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPagina.map(s => (
                      <tr key={s.id}>
                        <td>{s.identificador_logico}</td>
                        <td>{s.iniciales}</td>
                        <td>{s.estado_inclusion}</td>
                        <td className="gs-col-acciones">
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="btn-primary" onClick={() => abrirHojaPesquisaje(s)}>
                              Visualizar hoja CRD
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => handleEliminarSujeto(s)}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {totalPaginas > 1 && (
                  <div className="gs-paginacion">
                    <span className="gs-paginacion-info">
                      Mostrando {desde}-{hasta} de {lista.length}
                    </span>
                    <div className="gs-paginacion-botones">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={pagina <= 1}
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                      >
                        Anterior
                      </button>
                      <span className="gs-paginacion-pagina">
                        Página {pagina} de {totalPaginas}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={pagina >= totalPaginas}
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {modalIncluir && (
        <div className="modal-overlay" onClick={() => setModalIncluir(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Inclusión masiva (registro para pesquisaje)</h3>
            <p className="modal-incluir-instruction">Agrega las iniciales del sujeto.</p>
            <div className="modal-incluir-field">
              <label className="gs-label" htmlFor="modal-iniciales">Iniciales:</label>
              <input
                id="modal-iniciales"
                type="text"
                className="gs-input"
                value={iniciales}
                onChange={e => setIniciales(e.target.value)}
                placeholder="Ej. ABC"
              />
            </div>
            
            <div className="gs-botones" style={{ marginTop: 12 }}>
              <button type="button" className="btn-primary" onClick={handleIncluirSiguiente}>
                Incluir sujeto → siguiente
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setModalIncluir(false); setIniciales(''); setMensaje(''); cargarLista(); }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
              onGuardar={guardarHojaPesquisaje}
              onCerrar={() => setHojaAbierta(null)}
            />
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 24px; border-radius: 8px; max-width: 480px; width: 90%; }
        .modal-content--wide { max-width: 800px; max-height: 90vh; overflow: auto; }
      `}</style>
    </div>
  );
}
