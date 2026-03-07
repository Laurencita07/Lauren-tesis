/**
 * Importar plantilla CRD: Pesquisaje y/o Evaluación Inicial.
 * Acciones por iconos: Visualizar (hoja CRD) y Eliminar.
 */

import { useState, useEffect } from 'react';
import { useEstudio } from '../context/EstudioContext';
import { ROUTES } from '../../shared/constants';
import { FormularioCRD } from '../components/crd/FormularioCRD';
import { ToastMessage } from '../components/ToastMessage';
import type { DefinicionFormulario } from '../components/crd/FormularioCRD';

function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
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

type TipoPlantilla = 'pesquisaje' | 'evaluacion_inicial';

export function ImportarPlantillaCRD() {
  const { estudioId, loading: estudioLoading } = useEstudio();
  const [, setTipo] = useState<TipoPlantilla>('pesquisaje');
  const [nombre] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [importando, setImportando] = useState(false);
  const [mostrarOpcionesTipo, setMostrarOpcionesTipo] = useState(false);
  const [plantillas, setPlantillas] = useState<{ id: string; nombre: string; tipo: TipoPlantilla; created_at: string }[]>([]);
  const [plantillaVisualizar, setPlantillaVisualizar] = useState<{
    id: string;
    nombre: string;
    tipo: TipoPlantilla;
    definicion: DefinicionFormulario | null;
  } | null>(null);
  const [plantillaAEliminar, setPlantillaAEliminar] = useState<{ id: string; nombre: string } | null>(null);

  const cargarPlantillas = () => {
    if (!estudioId) return;
    window.electronAPI?.template?.listar?.(estudioId)
      .then((r: { id: string; nombre: string; tipo: TipoPlantilla; created_at: string }[]) => {
        setPlantillas(Array.isArray(r) ? r : []);
      })
      .catch(() => setPlantillas([]));
  };

  useEffect(() => {
    if (estudioId) cargarPlantillas();
  }, [estudioId]);

  const importarParaTipo = (tipoSeleccionado: TipoPlantilla) => {
    if (!estudioId) {
      setMensaje({ tipo: 'error', texto: 'No hay estudio cargado.' });
      return;
    }
    setTipo(tipoSeleccionado);
    const nom = (nombre || '').trim() || (tipoSeleccionado === 'pesquisaje' ? 'Pesquisaje' : 'Evaluación Inicial');
    setImportando(true);
    setMensaje(null);
    window.electronAPI?.template?.importarDesdeArchivo?.(estudioId, tipoSeleccionado, nom)
      .then((r: { canceled?: boolean; id?: string; nombre?: string; errores?: string[] }) => {
        if (r?.canceled) {
          setMensaje(null);
          return;
        }
        if (r?.errores?.length) {
          setMensaje({ tipo: 'ok', texto: `Importada: ${r.nombre}. Advertencias: ${r.errores.join(' ')}` });
        } else if (r?.id) {
          setMensaje({ tipo: 'ok', texto: `Plantilla "${r.nombre}" importada correctamente.` });
          // Tras importar, navegar a la pantalla adecuada para que el usuario pueda usar la plantilla.
          const targetRoute =
            tipoSeleccionado === 'pesquisaje' ? ROUTES.PESQUISAJE : ROUTES.SUJETOS;
          (window as any)?.xaviaNavigate?.(targetRoute);
        } else {
          setMensaje({ tipo: 'error', texto: 'No se pudo importar.' });
        }
      })
      .then(() => cargarPlantillas())
      .catch((e: Error) => {
        const raw = e?.message || '';
        const texto = raw.replace(/^Error invoking remote method[^.]*\.\s*Error:\s*/i, '').trim() || 'Error al importar. Verifique la estructura del archivo (Excel o JSON).';
        setMensaje({ tipo: 'error', texto });
      })
      .finally(() => setImportando(false));
  };

  const abrirVisualizar = (p: { id: string; nombre: string; tipo: TipoPlantilla }) => {
    window.electronAPI?.template?.obtenerDefinicion?.(p.id).then((def: unknown) => {
      setPlantillaVisualizar({
        id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        definicion: def as DefinicionFormulario | null,
      });
    });
  };

  const confirmarEliminar = () => {
    if (!plantillaAEliminar) return;
    window.electronAPI?.template?.eliminar?.(plantillaAEliminar.id)
      .then(() => {
        setMensaje({ tipo: 'ok', texto: `Plantilla "${plantillaAEliminar.nombre}" eliminada.` });
        setPlantillaAEliminar(null);
        cargarPlantillas();
      })
      .catch((e: Error) => {
        const raw = e?.message || '';
        const texto = raw.replace(/^Error invoking remote method[^.]*\.\s*Error:\s*/i, '').trim() || 'No se pudo eliminar la plantilla.';
        setMensaje({ tipo: 'error', texto });
        setPlantillaAEliminar(null);
      });
  };

  if (estudioLoading) return <p>Cargando...</p>;

  return (
    <div className="sync-page" style={{ alignItems: 'flex-start', padding: 24 }}>
      <div className="gs-panel" style={{ width: '100%' }}>
        <div className="gs-panel-header">Importar plantilla CRD</div>
        <div className="gs-panel-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="btn-primary"
              style={{ alignSelf: 'flex-start', padding: '10px 28px', fontSize: '1rem' }}
              onClick={() => setMostrarOpcionesTipo(true)}
              disabled={importando}
            >
              {importando ? 'Importando...' : 'Importar plantilla'}
            </button>
            {mostrarOpcionesTipo && (
              <div style={{ marginTop: 4 }}>
                <span className="gs-label">Seleccione el tipo de plantilla que va a importar:</span>
                <div className="gs-botones" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => importarParaTipo('pesquisaje')}
                    disabled={importando}
                  >
                    Pesquisaje
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => importarParaTipo('evaluacion_inicial')}
                    disabled={importando}
                  >
                    Evaluación Inicial
                  </button>
                </div>
              </div>
            )}
          </div>
          {mensaje && (
            <ToastMessage
              tipo={mensaje.tipo}
              texto={mensaje.texto}
              onClose={() => setMensaje(null)}
              duracion={5}
            />
          )}
        </div>
      </div>

      <div className="gs-panel" style={{ width: '100%', marginTop: 24 }}>
        <div className="gs-panel-header">Plantillas importadas</div>
        <div className="gs-panel-body">
          {plantillas.length === 0 ? (
            <p>No hay plantillas importadas para este estudio.</p>
          ) : (
            <table className="gs-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th className="gs-col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plantillas.map(p => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.tipo === 'pesquisaje' ? 'Pesquisaje' : 'Evaluación Inicial'}</td>
                    <td>{p.created_at?.slice(0, 10) || '—'}</td>
                    <td className="gs-col-acciones">
                      <div className="gs-acciones-icons">
                        <button
                          type="button"
                          className="gs-accion"
                          title="Visualizar hoja CRD"
                          onClick={() => abrirVisualizar(p)}
                        >
                          <IconDocument />
                        </button>
                        <button
                          type="button"
                          className="gs-accion"
                          title="Eliminar"
                          onClick={() => setPlantillaAEliminar({ id: p.id, nombre: p.nombre })}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {plantillaVisualizar && (
        <div className="modal-overlay" onClick={() => setPlantillaVisualizar(null)}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            {plantillaVisualizar.definicion ? (
              <FormularioCRD
                definicion={plantillaVisualizar.definicion}
                sujetoIdentificador="—"
                nombreEstudio=""
                momentoSeguimiento={plantillaVisualizar.tipo === 'pesquisaje' ? 'Pesquisaje' : 'Evaluación Inicial'}
                datosIniciales={{}}
                esPesquisaje={plantillaVisualizar.tipo === 'pesquisaje'}
                soloLectura
                onGuardar={() => {}}
                onCerrar={() => setPlantillaVisualizar(null)}
              />
            ) : (
              <div style={{ padding: 24 }}>
                <p>Cargando definición de la plantilla...</p>
                <button type="button" className="btn-secondary" onClick={() => setPlantillaVisualizar(null)}>Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {plantillaAEliminar && (
        <div className="modal-overlay" onClick={() => setPlantillaAEliminar(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 16 }}>Eliminar plantilla</h3>
            <p>¿Eliminar la plantilla &quot;{plantillaAEliminar.nombre}&quot;? Solo puede eliminarse si no tiene hojas CRD asociadas a sujetos.</p>
            <div className="gs-botones" style={{ marginTop: 20 }}>
              <button type="button" className="btn-primary" onClick={confirmarEliminar}>Eliminar</button>
              <button type="button" className="btn-secondary" onClick={() => setPlantillaAEliminar(null)}>Cancelar</button>
            </div>
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
