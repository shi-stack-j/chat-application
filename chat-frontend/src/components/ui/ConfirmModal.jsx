import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Accessible confirmation dialog. Presentation only — callers keep the same confirm/cancel flow.
 */
export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClasses = variant === 'danger'
    ? 'bg-app-error hover:brightness-110 text-white'
    : 'bg-app-primary hover:bg-app-primary-hover text-white dark:text-slate-950';

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 animate-overlay-in"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] cursor-pointer"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="
          relative z-10 w-full max-w-md
          bg-app-elevated text-app-text
          rounded-2xl border border-app-border
          shadow-xl shadow-slate-900/15
          p-5 sm:p-6
          animate-pop-in
        "
      >
        <h2 id="confirm-title" className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p id="confirm-desc" className="mt-2 text-sm text-app-muted leading-relaxed">
            {description}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              h-10 px-4 rounded-xl text-sm font-medium cursor-pointer
              border border-app-border text-app-text
              hover:bg-app-bg dark:hover:bg-white/6
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary
            "
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`
              h-10 px-4 rounded-xl text-sm font-semibold cursor-pointer
              ${confirmClasses}
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
