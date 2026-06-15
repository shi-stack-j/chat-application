import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUserId } from '../features/user/userSlice';
import MessageBubble from './MessageBubble';
import UserAvatar from './UserAvatar';

/**
 * MESSAGE LIST COMPONENT
 * 
 * Why this component exists:
 * - Aggregates and displays the message bubbles for the active chat thread.
 * - Handles the auto-scrolling mechanism to keep the latest message visible.
 * 
 * Design Details:
 * - Employs a `useRef` pointing to a blank node at the bottom of the message container.
 * - Automatically scrolls to the bottom smoothly when a new message is added or when switching between different chats.
 * - Shows an aesthetic "Start of chat" header if the conversation logs are empty.
 */
export const MessageList = ({ messages = [], chatUserId }) => {
  const currentUserId = useSelector(selectCurrentUserId);
  const bottomRef = useRef(null);

  // Auto-scroll to the bottom whenever messages array content changes or when chatUserId changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatUserId]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50/30 dark:bg-slate-950/5 select-text">
      
      {messages.length === 0 ? (
        /* Empty Conversation Welcome State */
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <UserAvatar userId={chatUserId} size="xl" className="mb-4 shadow-md" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
            Say hello to {chatUserId}!
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
            This is the very beginning of your direct conversation history. Messages are stored only during your current browser session.
          </p>
          <div className="mt-4 border-b border-dashed border-slate-200 dark:border-slate-800 w-24"></div>
        </div>
      ) : (
        /* Render messages */
        messages.map((message) => {
          // Identify if message sender matches current session user
          const isMe = message.senderId === currentUserId;
          return (
            <MessageBubble 
              key={message.id || `${message.senderId}-${message.timestamp}`} 
              message={message} 
              isMe={isMe} 
            />
          );
        })
      )}

      {/* Anchor div used to lock scroll to the bottom */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
