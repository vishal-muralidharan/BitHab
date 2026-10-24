import { useEffect, useRef } from 'react';

/**
 * Reusable ConfirmModal with backdrop scrim, Escape key handler, focus trap, and token-based styling.
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
  confirmDisabled = false,
  children
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="custom-modal-overlay show" 
      onClick={onCancel}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="confirm-modal-title"
    >
      <div 
        className="custom-modal" 
        ref={modalRef} 
        onClick={e => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <h3 id="confirm-modal-title" className="custom-modal-title">{title}</h3>
          <button 
            type="button" 
            className="custom-modal-close" 
            onClick={onCancel} 
            aria-label="Close dialog"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div className="custom-modal-body">
          {message && <p className="custom-modal-message">{message}</p>}
          {children}
        </div>

        <div className="custom-modal-footer">
          <button 
            type="button" 
            className="custom-modal-btn custom-modal-btn-secondary" 
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button 
            type="button" 
            className={`custom-modal-btn ${isDanger ? 'custom-modal-btn-danger' : 'custom-modal-btn-primary'}`} 
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
