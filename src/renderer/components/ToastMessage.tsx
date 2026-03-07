/**
 * Toast de notificación: mensaje bonito que se auto-oculta y se puede cerrar.
 */

import { useEffect, useRef } from 'react';

export type ToastTipo = 'ok' | 'error';

interface ToastMessageProps {
  tipo: ToastTipo;
  texto: string;
  onClose: () => void;
  /** Segundos antes de cerrar solo (por defecto 5) */
  duracion?: number;
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function IconError() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

export function ToastMessage({ tipo, texto, onClose, duracion = 5 }: ToastMessageProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, duracion * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose, duracion]);

  const isError = tipo === 'error';

  return (
    <div
      className={`toast-message toast-message--${tipo}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-message__icon">
        {isError ? <IconError /> : <IconCheck />}
      </div>
      <p className="toast-message__texto">{texto}</p>
      <button
        type="button"
        className="toast-message__close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <IconClose />
      </button>
    </div>
  );
}
