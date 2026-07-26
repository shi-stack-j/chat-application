import { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUserId } from '../features/auth/authSlice';
import { selectTypingUsers } from '../features/chat/chatSlice';
import MessageBubble from './MessageBubble';
import UserAvatar from './UserAvatar';

/**
 * Helper to format absolute date dividers in the chat stream.
 */
const formatDateLabel = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch {
    return '';
  }
};

/**
 * MESSAGE LIST COMPONENT
 * 
 * Aggregates, processes, and displays the thread's message history.
 * Groups consecutive messages from the same sender and inserts calendar date separators.
 */
export const MessageList = ({ messages = [], chatUserId }) => {
  const currentUserId = useSelector(selectCurrentUserId);
  const typingUsers = useSelector(selectTypingUsers) || {};
  const isTyping = typingUsers[chatUserId.toLowerCase()];
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive, active conversation changes, or typing status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatUserId, isTyping]);

  // Chronologically processes the raw message feed, weaving in date separators and sender groupings
  const chatElements = useMemo(() => {
    const elements = [];
    let lastDateString = null;

    messages.forEach((msg, idx) => {
      if (!msg.timestamp) return;

      const dateObj = new Date(msg.timestamp);
      const dateString = dateObj.toDateString();

      // 1. Insert date divider if calendar day changes
      if (dateString !== lastDateString) {
        elements.push({
          type: 'separator',
          id: `sep-${msg.id || msg.timestamp}`,
          label: formatDateLabel(msg.timestamp)
        });
        lastDateString = dateString;
      }

      // 2. Identify if this message was sent by the same user as the previous one
      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const isConsecutive = prevMsg &&
        prevMsg.senderId === msg.senderId &&
        (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) < 120000; // Sent within 2 minutes of each other

      elements.push({
        type: 'message',
        id: msg.id || `${msg.senderId}-${msg.timestamp}-${idx}`,
        data: msg,
        isConsecutive
      });
    });

    return elements;
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50/30 dark:bg-slate-950/5 select-text scrollbar-thin">
      {messages.length === 0 ? (
        /* Welcome empty message screen */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
          <UserAvatar userId={chatUserId} size="xl" className="mb-4 shadow-md" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
            Say hello to {chatUserId}!
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
            This is the very beginning of your direct conversation history.
          </p>
          <div className="mt-5 border-b border-dashed border-slate-200 dark:border-slate-800 w-24"></div>
        </div>
      ) : (
        /* Render processed chat elements */
        chatElements.map((el) => {
          if (el.type === 'separator') {
            return (
              <div
                key={el.id}
                className="flex items-center justify-center my-6 select-none animate-fade-in"
              >
                <div className="w-1/6 border-b border-slate-200 dark:border-slate-800/80" />
                <span className="mx-4 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800/30">
                  {el.label}
                </span>
                <div className="w-1/6 border-b border-slate-200 dark:border-slate-800/80" />
              </div>
            );
          }

          // Message bubble item
          const isMe = el.data.senderId === currentUserId;
          return (
            <MessageBubble
              key={el.id}
              message={el.data}
              isMe={isMe}
              isConsecutive={el.isConsecutive}
            />
          );
        })
      )}

      {isTyping && (
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 pl-4 py-2 select-none animate-fade-in">
          <div className="flex gap-1.25 items-center bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-slate-200/20 dark:border-slate-700/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{chatUserId} is typing</span>
          </div>
        </div>
      )}

      {/* Scroll lock anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
