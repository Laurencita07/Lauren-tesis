import React, { useState } from 'react';

interface IdentificarInvestigadorProps {
  onIdentificar: (nombre: string) => void;
}

export function IdentificarInvestigador({ onIdentificar }: IdentificarInvestigadorProps) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = (nombre || '').trim();
    if (!nom) {
      setError('El nombre del investigador es obligatorio.');
      return;
    }
    setError('');
    onIdentificar(nom);
  };

  return (
    <div className="id-inv-screen">
      <div className="gs-panel id-inv-panel">
        <div className="gs-panel-header">Identificar investigador</div>
        <div className="gs-panel-body">
          <div className="id-inv-logo-wrap">
            <img src="./logo-identificacion.png" alt="XAVIA SIDEC" className="id-inv-logo" />
            <p className="id-inv-subtitle">Módulo de Carga Masiva de Sujetos Offline</p>
          </div>
          <form onSubmit={handleSubmit} className="id-inv-form">
            <label className="gs-label" htmlFor="inv-nombre">
              Nombre del investigador
            </label>
            <input
              id="inv-nombre"
              type="text"
              className="gs-input"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Dr. Juan Pérez"
            />
            {error && <p className="id-inv-error">{error}</p>}
            <div className="gs-botones id-inv-botones">
              <button type="submit" className="btn-primary id-inv-btn">
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

