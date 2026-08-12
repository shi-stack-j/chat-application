import { forwardRef } from 'react';

export const IconButton = forwardRef(function IconButton(
  {
    onClick,
    title,
    'aria-label': ariaLabel,
    disabled = false,
    active = false,
    danger = false,
    className = '',
    children,
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`
        inline-flex items-center justify-center shrink-0
        h-9 w-9 rounded-xl cursor-pointer
        text-app-muted
        transition-colors duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary
        disabled:opacity-40 disabled:cursor-not-allowed
        ${active
          ? 'bg-app-error/10 text-app-error'
          : danger
            ? 'hover:bg-app-error/10 hover:text-app-error'
            : 'hover:bg-app-bg hover:text-app-text dark:hover:bg-white/5'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
});

export default IconButton;
