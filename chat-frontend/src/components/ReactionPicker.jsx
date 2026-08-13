import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const DEFAULT_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

const PICKER_HEIGHT = 44;
const VIEWPORT_PAD = 8;

/**
 * REACTION PICKER
 * 
 * Viewport-aware floating emoji quick-picker rendered in a portal.
 * Features smooth micro-animations, glassmorphic styling, and outside click dismissal.
 */
export const ReactionPicker = ({
  open,
  onClose,
  onSelect,
  anchorRef,
  currentReaction = null,
  emojis = DEFAULT_REACTION_EMOJIS,
  align = 'center'
}) => {
  const pickerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const pickerEl = pickerRef.current;
      const pickerWidth = pickerEl?.offsetWidth || 260;
      const pickerHeight = pickerEl?.offsetHeight || PICKER_HEIGHT;

      // Calculate horizontal position
      let left;
      if (align === 'left') {
        left = rect.left;
      } else if (align === 'right') {
        left = rect.right - pickerWidth;
      } else {
        left = rect.left + rect.width / 2 - pickerWidth / 2;
      }

      // Clamp to viewport
      left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - pickerWidth - VIEWPORT_PAD));

      // Try placing above the anchor first; if not enough space, place below
      let top = rect.top - pickerHeight - 8;
      if (top < VIEWPORT_PAD) {
        top = rect.bottom + 8;
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
  }, [open, anchorRef, align]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (e) => {
      const inPicker = pickerRef.current?.contains(e.target);
      const inAnchor = anchorRef?.current?.contains(e.target);
      if (!inPicker && !inAnchor) {
        onClose?.();
      }
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={pickerRef}
      role="toolbar"
      aria-label="Reactions"
      style={{ top: coords.top, left: coords.left }}
      className="
        fixed z-[85] px-2 py-1.5
        bg-app-elevated text-app-text
        rounded-full border border-app-border
        shadow-xl shadow-slate-900/15 dark:shadow-black/60
        flex items-center gap-1
        animate-pop-in select-none
      "
    >
      {emojis.map((emoji) => {
        const isSelected = currentReaction === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(emoji);
              onClose?.();
            }}
            aria-label={`React with ${emoji}`}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-lg
              hover:scale-125 active:scale-95 transition-transform duration-150 cursor-pointer
              ${isSelected
                ? 'bg-app-primary/20 ring-2 ring-app-primary/50'
                : 'hover:bg-app-bg dark:hover:bg-white/10'
              }
            `}
          >
            {emoji}
          </button>
        );
      })}
    </div>,
    document.body
  );
};

export default ReactionPicker;
