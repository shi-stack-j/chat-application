import React, { memo } from 'react';

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
          ${
            isMe 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 dark:border-slate-700/30'
          }
        `}
      >
        
        {/* Message text content */}
        <p className="break-words leading-relaxed whitespace-pre-wrap">
          {content}
        </p>

        {/* Bubble footer containing timestamp */}
        <div 
          className={`
            text-[9px] mt-1.5 flex items-center justify-end gap-1 font-medium select-none
            ${isMe ? 'text-indigo-200/95' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          <span>{formatTime(timestamp)}</span>
          
          {/* Visual single checkmark for sender feedback */}
          {isMe && (
            <svg className="w-3 h-3 text-indigo-200/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
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
         prevProps.message.timestamp === nextProps.message.timestamp;
});

export default MessageBubble;
