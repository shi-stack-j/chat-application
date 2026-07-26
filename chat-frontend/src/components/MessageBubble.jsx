import { memo } from 'react';

/**
 * REUSABLE MESSAGE BUBBLE COMPONENT
 * 
 * Renders individual messages within the message feed.
 * Wrapped in React.memo to prevent re-rendering of existing messages in the stream.
 */
export const MessageBubble = memo(({ message, isMe, isConsecutive = false }) => {
  const { content, timestamp } = message;

  // Formats timestamps into readable hh:mm AM/PM format
  const formatTime = (timeInput) => {
    if (!timeInput) return '';
    try {
      const date = new Date(timeInput);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Determine rounded corner classes based on sender and sender groupings
  const roundedCorners = isMe
    ? isConsecutive ? 'rounded-2xl' : 'rounded-2xl rounded-tr-none'
    : isConsecutive ? 'rounded-2xl' : 'rounded-2xl rounded-tl-none';

  return (
    <div className={`
      flex w-full animate-fade-in
      ${isMe ? 'justify-end' : 'justify-start'}
      ${isConsecutive ? 'mb-1 mt-0.5' : 'mb-3.5 mt-2'}
    `}>
      <div
        className={`
          max-w-[75%] sm:max-w-[65%] px-4 py-2.5 text-sm relative group shadow-xs
          ${roundedCorners}
          ${isMe
            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 dark:border-slate-700/30'
          }
        `}
      >

        {/* Message text content */}
        <p className="break-words leading-relaxed whitespace-pre-wrap">
          {content}
        </p>

        {/* Bubble footer containing timestamp and status ticks */}
        <div
          className={`
            text-[10px] mt-1.5 flex items-center justify-end gap-1.5 select-none font-medium
            ${isMe ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          <span>{formatTime(timestamp)}</span>

          {/* Visual checkmark(s) for sender feedback */}
          {isMe && (
            <span className="flex items-center shrink-0">
              {message.status === 'READ' ? (
                <svg className="w-[17px] h-[17px] text-[#53BDEB]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Read">
                  <path d="M4 12.5l3.5 3.5 8-8 M9 12.5l3.5 3.5 8-8" />
                </svg>
              ) : message.status === 'DELIVERED' ? (
                <svg className="w-[17px] h-[17px] text-white/90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Delivered">
                  <path d="M4 12.5l3.5 3.5 8-8 M9 12.5l3.5 3.5 8-8" />
                </svg>
              ) : (
                <svg className="w-[17px] h-[17px] text-white/60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Sent">
                  <path d="M5 12.5l3.5 3.5 8-8" />
                </svg>
              )}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isMe === nextProps.isMe &&
    prevProps.isConsecutive === nextProps.isConsecutive &&
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.status === nextProps.message.status;
});

export default MessageBubble;
