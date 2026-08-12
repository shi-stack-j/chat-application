import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MENU_WIDTH = 220;
const VIEWPORT_PAD = 8;

/**
 * Viewport-aware dropdown rendered in a portal so overflow:hidden parents cannot clip it.
 */
export const DropdownMenu = ({
  open,
  onClose,
  anchorRef,
  align = 'right',
  width = MENU_WIDTH,
  children,
}) => {
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuEl = menuRef.current;
      const menuHeight = menuEl?.offsetHeight || 200;
      const menuWidth = width;

      let left = align === 'right' ? rect.right - menuWidth : rect.left;
      left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD));

      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight - VIEWPORT_PAD) {
        top = Math.max(VIEWPORT_PAD, rect.top - menuHeight - 6);
      }

      setCoords({ top, left });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, align, width]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (e) => {
      const inMenu = menuRef.current?.contains(e.target);
      const inAnchor = anchorRef?.current?.contains(e.target);
      if (!inMenu && !inAnchor) onClose?.();
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ top: coords.top, left: coords.left, width }}
      className="
        fixed z-[80] py-1.5
        bg-app-elevated text-app-text
        rounded-xl border border-app-border
        shadow-lg shadow-slate-900/10 dark:shadow-black/40
        text-sm font-medium select-none
        animate-pop-in
        max-h-[min(320px,calc(100vh-16px))] overflow-y-auto scrollbar-thin
      "
    >
      {children}
    </div>,
    document.body
  );
};

export const MenuItem = ({ onClick, danger = false, disabled = false, children }) => {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full px-3 py-2.5 text-left flex items-center gap-2.5
        cursor-pointer transition-colors duration-100
        disabled:opacity-40 disabled:cursor-not-allowed
        ${danger
          ? 'text-app-error hover:bg-app-error/10'
          : 'text-app-text hover:bg-app-bg dark:hover:bg-white/6'
        }
      `}
    >
      {children}
    </button>
  );
};

export const MenuDivider = () => (
  <div className="my-1 border-t border-app-border" role="separator" />
);

export default DropdownMenu;
