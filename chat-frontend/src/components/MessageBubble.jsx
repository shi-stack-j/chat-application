// Reusable Message Bubble Component

/**
 * REUSABLE MESSAGE BUBBLE COMPONENT
 * 
 * Why this component exists:
 * - Formats individual text messages in the chat stream.
 * - Handles the visual styling differences between outbound (sent by me) and inbound (received) messages.
 * 
 * Design Details:
 * - Outbound: Right-aligned, indigo gradient bubble, white text.
 * - Inbound: Left-aligned, light grey/dark slate bubble, dark text.
 * - Auto-wraps long URLs or single-word strings using `break-words`.
 * - Displays message timestamp (e.g. '04:15 PM') formatted from the raw timestamp.
 */
export const MessageBubble = ({ message, isMe }) => {
  const { content, timestamp } = message;

  // Formats epoch/ISO timestamps into hh:mm AM/PM format
  const formatTime = (timeInput) => {
    if (!timeInput) return '';
    try {
      const date = new Date(timeInput);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex w-full mb-3.5 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div 
        className={`
          max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl shadow-xs text-sm relative group
          ${
            isMe 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/20 dark:border-slate-700/30'
          }
        `}
      >
        
        {/* Message text body */}
        <p className="break-words leading-relaxed whitespace-pre-wrap">
          {content}
        </p>

        {/* Timestamp footer alignment */}
        <div 
          className={`
            text-[10px] mt-1.5 flex items-center justify-end gap-1 font-medium select-none
            ${isMe ? 'text-indigo-200/90' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          <span>{formatTime(timestamp)}</span>
          
          {/* Double tick placeholder for sent messages */}
          {isMe && (
            <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;
