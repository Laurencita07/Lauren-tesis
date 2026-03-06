/**
 * Importar plantilla CRD: Pesquisaje y/o Evaluación Inicial.
 * Ahora con un flujo simplificado: botón grande "Importar plantilla" y luego elección del tipo.
 * Tras importar, se redirige automáticamente a la pantalla correspondiente.
 */

import { useState, useEffect } from 'react';
import { useEstudio } from '../context/EstudioContext';
import { ROUTES } from '../../shared/constants';

type TipoPlantilla = 'pesquisaje' | 'evaluacion_inicial';

export function ImportarPlantillaCRD() {
  const { estudioId, loading: estudioLoading } = useEstudio();
  const [, setTipo] = useState<TipoPlantilla>('pesquisaje');
  const [nombre] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [importando, setImportando] = useState(false);
  const [mostrarOpcionesTipo, setMostrarOpcionesTipo] = useState(false);
  const [plantillas, setPlantillas] = useState<{ id: string; nombre: string; tipo: TipoPlantilla; created_at: string }[]>([]);

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
      .catch((e: Error) => setMensaje({ tipo: 'error', texto: e?.message || 'Error al importar. Verifique la estructura del archivo (Excel o JSON).' }))
      .finally(() => setImportando(false));
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
            <p style={{ marginTop: 12, color: mensaje.tipo === 'error' ? '#c00' : 'var(--green-primary)' }}>
              {mensaje.texto}
            </p>
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
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          if (!window.confirm('¿Eliminar esta plantilla? Solo puede eliminarse si no tiene hojas CRD asociadas.')) return;
                          window.electronAPI?.template?.eliminar?.(p.id)
                            .then(() => {
                              setMensaje({ tipo: 'ok', texto: `Plantilla "${p.nombre}" eliminada.` });
                              cargarPlantillas();
                            })
                            .catch((e: Error) => {
                              setMensaje({ tipo: 'error', texto: e?.message || 'No se pudo eliminar la plantilla.' });
                            });
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
