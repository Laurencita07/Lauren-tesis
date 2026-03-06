/**
 * Header XAVIA SIDEC – Izquierda (logo + título), derecha verde con degradado, Bienvenido, Inicio y Salir.
 */
import { useState } from 'react';
import { ROUTES, type RouteId } from '../../../shared/constants';

interface HeaderProps {
  investigadorNombre?: string;
  onSalirInvestigador?: () => void;
  onNavigate?: (route: RouteId) => void;
}

function InicioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#333333" aria-hidden>
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );
}

function SalirIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#E53935" aria-hidden>
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );
}

function LogoFallback() {
  return (
    <div className="header-sidec__logo-fallback" aria-hidden>
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="22" fill="#6AB04A" />
        <path d="M34 12 Q20 24 12 36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M36 14 Q24 24 14 34" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 16 Q22 24 16 32" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M38 18 Q26 26 10 38" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Header({ investigadorNombre, onSalirInvestigador, onNavigate }: HeaderProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="header-sidec">
      <div className="header-sidec__inner">
        <div className="header-sidec__left">
          <div className="header-sidec__logo-wrap">
            {logoError ? (
              <LogoFallback />
            ) : (
              <img
                src="./logo-xavia-sidec.png"
                alt="XAVIA SIDEC"
                className="header-sidec__logo"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <div className="header-sidec__title-box">
            <span className="header-sidec__subtitle">
              Sistema para el Manejo de
              <br />
              Datos de Ensayos Clínicos Offline
            </span>
          </div>
        </div>
        <div className="header-sidec__right">
          {investigadorNombre != null && investigadorNombre !== '' && (
            <p className="header-sidec__welcome">Bienvenido {investigadorNombre}</p>
          )}
          <div className="header-sidec__folder-wrap">
            <svg
              className="header-sidec__folder"
              viewBox="0 0 400 50"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M60 50 L60 22 Q220 4 340 22 L400 22 L400 50 Z"
                fill="transparent"
              />
            </svg>
            <div className="header-sidec__nav">
              {onNavigate && (
                <button
                  type="button"
                  className="header-sidec__btn"
                  onClick={() => onNavigate(ROUTES.PESQUISAJE)}
                  title="Inicio"
                >
                  <InicioIcon />
                  Inicio
                </button>
              )}
              {onSalirInvestigador && (
                <button
                  type="button"
                  className="header-sidec__btn"
                  onClick={onSalirInvestigador}
                  title="Salir"
                >
                  <SalirIcon />
                  Salir
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
