/**
 * Interfaz de identificación: solo la foto (tal cual, grande), sin recuadro.
 * Superpuesto en la zona blanca: Módulo de Carga Masiva..., Nombre del usuario, cuadro de texto, botón Entrar.
 * La imagen está en el proyecto: public/login-panel.png
 */

import React, { useState } from 'react';

interface IdentificarInvestigadorProps {
  onIdentificar: (nombre: string) => void;
}

const SOLO_LETRAS_Y_PUNTO = /^[\p{L}\s.]*$/u;

function soloLetrasYPunto(val: string): string {
  return (val || '').replace(/[^\p{L}\s.]/gu, '');
}

export function IdentificarInvestigador({ onIdentificar }: IdentificarInvestigadorProps) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const filtered = soloLetrasYPunto(raw);
    setNombre(filtered);
    if (raw !== filtered) {
      setError('Solo se permiten letras y punto. No use números ni otros caracteres.');
    } else {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = (nombre || '').trim();
    if (!nom) {
      setError('El nombre del usuario es obligatorio.');
      return;
    }
    if (!SOLO_LETRAS_Y_PUNTO.test(nom)) {
      setError('Solo se permiten letras y punto. No use números ni otros caracteres.');
      return;
    }
    setError('');
    onIdentificar(nom);
  };

  return (
    <div className="id-inv-screen">
      <div className="id-inv-bg">
        <div className="id-inv-gradient" />
        <svg className="id-inv-waves" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden>
          <path className="id-inv-wave-line" d="M0,60 C300,10 600,110 1200,60" />
          <path className="id-inv-wave-line" d="M0,45 C300,95 600,-5 1200,45" />
          <path className="id-inv-wave-line" d="M0,75 C300,25 600,125 1200,75" />
          <path className="id-inv-wave-line" d="M0,30 C300,80 600,-20 1200,30" />
          <path className="id-inv-wave-line" d="M0,90 C300,40 600,140 1200,90" />
          <path className="id-inv-wave-line" d="M0,55 C300,5 600,105 1200,55" />
          <path className="id-inv-wave-line" d="M0,70 C300,120 600,20 1200,70" />
        </svg>
      </div>
      <div className="id-inv-content">
        <div className="id-inv-photo-wrap">
          <img
            src="./login-panel.png"
            alt="XAVIA SIDEC"
            className="id-inv-photo-img"
          />
          <div className="id-inv-photo-overlay">
            <p className="id-inv-photo-line1">Módulo de Carga Masiva de Sujetos Offline</p>
            <p className="id-inv-photo-line2">Nombre del usuario</p>
            <form onSubmit={handleSubmit} className="id-inv-photo-form">
              <input
                id="inv-nombre"
                type="text"
                className="id-inv-photo-input"
                value={nombre}
                onChange={handleChange}
                placeholder=""
              />
              {error && <p className="id-inv-photo-error">{error}</p>}
              <button type="submit" className="id-inv-photo-btn">
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
