import { useState, useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { selectBlockedUsers } from '../features/chat/chatSlice';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';

/**
 * REUSABLE MESSAGE INPUT COMPONENT
 * 
 * Provides input messaging capabilities. Wrapped in React.memo.
 */
export const MessageInput = memo(({ onSendMessage, chatUserId, onTypingStatusChange }) => {
  const [messageText, setMessageText] = useState('');
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const blockedUsers = useSelector(selectBlockedUsers) || [];
  const { unblockUser } = useChat();
  const isBlocked = blockedUsers.some(id => id.toLowerCase() === chatUserId?.toLowerCase());

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    inputRef.current?.focus();
  };

  if (isBlocked) {
    return (
      <div className="p-3.5 bg-red-50/70 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900/50 flex items-center justify-between gap-3 text-xs text-red-600 dark:text-red-400 font-medium z-10">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span>You have blocked {chatUserId}. Unblock to resume messaging.</span>
        </div>
        <button
          onClick={async () => {
            try {
              await unblockUser(chatUserId);
              toastHelper.success(`Unblocked ${chatUserId}`);
            } catch (err) {
              toastHelper.error(err.message || `Failed to unblock ${chatUserId}`);
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer shadow-xs shrink-0 transition-all"
        >
          Unblock
        </button>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="
        p-3.5 bg-white dark:bg-slate-900 
        border-t border-slate-200 dark:border-slate-800/80
        flex items-center gap-2.5 z-10
      "
    >
      <input
        ref={inputRef}
        type="text"
        value={messageText}
        onChange={handleInputChange}
        placeholder={`Message ${chatUserId}...`}
        autoFocus
        className="
          flex-1 px-4 py-3 text-sm
          bg-slate-50/80 dark:bg-slate-800/60
          border border-slate-200 dark:border-slate-800
          focus:border-indigo-500 dark:focus:border-indigo-500
          focus:ring-2 focus:ring-indigo-500/20
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          rounded-2xl focus:outline-hidden
          transition-all duration-200
        "
      />

      <button
        type="submit"
        disabled={!messageText.trim()}
        className={`
          p-3 rounded-2xl flex items-center justify-center cursor-pointer
          transition-all duration-200 select-none shrink-0
          ${
            messageText.trim() 
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md hover:shadow-indigo-500/25 active:scale-95' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-slate-800/50'
          }
        `}
        title="Send message"
      >
        <svg 
          className="w-5 h-5 transform rotate-45 -translate-x-0.5 translate-y-0.5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2.5" 
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
          />
        </svg>
      </button>

    </form>
  );
});

export default MessageInput;
