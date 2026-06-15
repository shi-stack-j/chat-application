import { useState, useRef } from 'react';

/**
 * REUSABLE MESSAGE INPUT COMPONENT
 * 
 * Why this component exists:
 * - Provides the text input and send button at the bottom of the active conversation.
 * - Handles input validation (disallowing empty or whitespace-only messages).
 * 
 * PLACEHOLDER FOR TYPING STATUS INTEGRATION:
 * The backend developer can easily throttle typing broadcasts using this local state:
 * 
 *   useEffect(() => {
 *      if (!messageText.trim()) return;
 *      
 *      // Send typing event to destination '/app/chat.typing'
 *      stompClient.send("/app/chat.typing", {}, JSON.stringify({
 *         senderId: currentUserId,
 *         receiverId: chatUserId,
 *         typing: true
 *      }));
 *      
 *      const delayDebounceFn = setTimeout(() => {
 *         stompClient.send("/app/chat.typing", {}, JSON.stringify({
 *            senderId: currentUserId,
 *            receiverId: chatUserId,
 *            typing: false
 *         }));
 *      }, 2000);
 *      
 *      return () => clearTimeout(delayDebounceFn);
 *   }, [messageText]);
 */
export const MessageInput = ({ onSendMessage, chatUserId }) => {
  const [messageText, setMessageText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText) return;

    onSendMessage(cleanText);
    setMessageText('');
    inputRef.current?.focus();
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="
        p-3.5 bg-white dark:bg-slate-900 
        border-t border-slate-200 dark:border-slate-800/80
        flex items-center gap-2.5 z-10
      "
    >
      
      {/* 
        Input Box 
        Uses modern transition effects and handles keystrokes.
      */}
      <input
        ref={inputRef}
        type="text"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder={`Message ${chatUserId}...`}
        autoFocus
        className="
          flex-1 px-4 py-2.5 text-sm
          bg-slate-50 dark:bg-slate-800/50
          border border-slate-200 dark:border-slate-800
          focus:border-indigo-500 dark:focus:border-indigo-500/80
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          rounded-2xl focus:outline-hidden
          transition-all duration-200
        "
      />

      {/* 
        Send Button
        Disables dynamically when input is empty.
      */}
      <button
        type="submit"
        disabled={!messageText.trim()}
        className={`
          p-2.5 rounded-2xl flex items-center justify-center cursor-pointer
          transition-all duration-250 select-none shrink-0
          ${
            messageText.trim() 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95' 
              : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
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
};

export default MessageInput;
