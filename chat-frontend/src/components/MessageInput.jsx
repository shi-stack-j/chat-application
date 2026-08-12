import { useState, useRef, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectBlockedUsers } from '../features/chat/chatSlice';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';

export const MessageInput = memo(({ onSendMessage, chatUserId, onTypingStatusChange }) => {
  const [messageText, setMessageText] = useState('');
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const blockedUsers = useSelector(selectBlockedUsers) || [];
  const { unblockUser } = useChat();
  const isBlocked = blockedUsers.some(id => id.toLowerCase() === chatUserId?.toLowerCase());

  const resizeField = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  useEffect(() => {
    resizeField();
  }, [messageText]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessageText(val);

    if (val.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      if (onTypingStatusChange) {
        onTypingStatusChange(true);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!val.trim()) {
      isTypingRef.current = false;
      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
    } else {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        if (onTypingStatusChange) {
          onTypingStatusChange(false);
        }
      }, 3000);
    }
  };

  const submitText = () => {
    const cleanText = messageText.trim();
    if (!cleanText) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
    if (onTypingStatusChange) {
      onTypingStatusChange(false);
    }

    onSendMessage(cleanText);
    setMessageText('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitText();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitText();
    }
  };

  if (isBlocked) {
    return (
      <div className="px-3 sm:px-4 py-3 bg-app-error/10 border-t border-app-error/20 flex items-center justify-between gap-3 text-sm text-app-error z-10">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="truncate">You blocked {chatUserId}. Unblock to resume messaging.</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await unblockUser(chatUserId);
              toastHelper.success(`Unblocked ${chatUserId}`);
            } catch (err) {
              toastHelper.error(err.message || `Failed to unblock ${chatUserId}`);
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-app-error hover:brightness-110 text-white text-xs font-semibold cursor-pointer shrink-0"
        >
          Unblock
        </button>
      </div>
    );
  }

  const canSend = Boolean(messageText.trim());

  return (
    <form
      onSubmit={handleSubmit}
      className="px-3 sm:px-4 py-3 bg-app-surface border-t border-app-border flex items-end gap-2 z-10"
    >
      <label className="sr-only" htmlFor="message-composer">Message</label>
      <textarea
        id="message-composer"
        ref={inputRef}
        rows={1}
        value={messageText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={`Message ${chatUserId}…`}
        autoFocus
        className="
          flex-1 min-h-11 max-h-32 px-3.5 py-2.5 text-sm leading-5
          bg-app-bg border border-app-border
          focus:border-app-primary focus:ring-2 focus:ring-app-primary/20
          text-app-text placeholder:text-app-muted
          rounded-xl outline-none resize-none
          transition-colors duration-150
        "
      />

      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        title="Send message"
        className={`
          h-11 w-11 rounded-xl flex items-center justify-center shrink-0
          transition-colors duration-150
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary
          ${canSend
            ? 'bg-app-primary hover:bg-app-primary-hover text-white dark:text-slate-950 cursor-pointer'
            : 'bg-app-bg text-app-muted cursor-not-allowed'
          }
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
});

export default MessageInput;
