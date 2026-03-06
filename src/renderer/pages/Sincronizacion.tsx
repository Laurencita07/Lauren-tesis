/**
 * Sincronización (RF-22): KPIs (pendientes sync, total sujetos, pendientes pesquisaje).
 */

import { useState, useEffect } from 'react';
import { useEstudio } from '../context/EstudioContext';

export function Sincronizacion() {
  const { estudioId, loading: estudioLoading } = useEstudio();
  const [stats, setStats] = useState({ pendientesSync: 0, totalSujetos: 0, pendientesPesquisaje: 0 });

  useEffect(() => {
    if (!estudioId) return;
    window.electronAPI?.subject?.contarParaSincronizacion?.(estudioId)
      .then((r: { pendientesSync: number; totalSujetos: number; pendientesPesquisaje: number }) =>
        setStats(r || { pendientesSync: 0, totalSujetos: 0, pendientesPesquisaje: 0 })
      )
      .catch(() => setStats({ pendientesSync: 0, totalSujetos: 0, pendientesPesquisaje: 0 }));
  }, [estudioId]);

  if (estudioLoading) return <p>Cargando...</p>;

  return (
    <div className="sync-page">
      <div className="sync-cards">
        <div className="sync-card">
          <span className="sync-card__numero">{stats.pendientesSync}</span>
          <span className="sync-card__label">Pendientes de sync</span>
        </div>
        <div className="sync-card">
          <span className="sync-card__numero">{stats.totalSujetos}</span>
          <span className="sync-card__label">Total sujetos</span>
        </div>
        <div className="sync-card">
          <span className="sync-card__numero">{stats.pendientesPesquisaje}</span>
          <span className="sync-card__label">Pendientes pesquisaje</span>
        </div>
      </div>
    </div>
  );
}
