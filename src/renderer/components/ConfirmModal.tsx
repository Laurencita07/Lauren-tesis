/**
 * Modal de confirmación XAVIA SIDEC: barra verde con título, mensaje claro, Aceptar (verde) y Cancelar (rojo).
 */

interface ConfirmModalProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmModal({
  title = 'XAVIA SIDEC',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
}: ConfirmModalProps) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal__header">{title}</div>
        <div className="confirm-modal__body">
          <p className="confirm-modal__message">{message}</p>
        </div>
        <div className="confirm-modal__footer">
          <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-modal__btn confirm-modal__btn--accept" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
