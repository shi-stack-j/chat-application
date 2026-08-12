import { useSelector } from 'react-redux';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { MessageListSkeleton } from './SkeletonLoader';
import {
  selectSelectedChatUserId,
  selectActiveMessages,
  selectLoadingMessages,
  selectTypingUsers
} from '../features/chat/chatSlice';
import { selectConnectionState } from '../features/websocket/websocketSlice';
import useChat from '../hooks/useChat';

export const ChatWindow = ({ onSendMessage }) => {
  const selectedChatUserId = useSelector(selectSelectedChatUserId);
  const activeMessages = useSelector(selectActiveMessages);
  const loadingMessages = useSelector(selectLoadingMessages);
  const connectionState = useSelector(selectConnectionState);
  const typingUsers = useSelector(selectTypingUsers) || {};
  const isPeerTyping = Boolean(typingUsers[selectedChatUserId?.toLowerCase()]);
  const { sendTypingStatus } = useChat();

  if (!selectedChatUserId) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 h-full flex flex-col relative min-w-0 min-h-0 bg-app-surface">
      <ChatHeader chatUserId={selectedChatUserId} />

      {connectionState !== 'connected' && (
        <div className={`
          px-4 py-2 text-xs font-medium select-none flex items-center gap-2 border-b
          ${connectionState === 'connecting'
            ? 'bg-amber-500/10 text-app-warning border-amber-500/15'
            : 'bg-app-error/10 text-app-error border-app-error/15'
          }
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${connectionState === 'connecting' ? 'bg-app-warning animate-pulse' : 'bg-app-error'}`} />
          <span>
            {connectionState === 'connecting'
              ? 'Reconnecting to the live server…'
              : 'Connection offline. REST fallback is enabled.'}
          </span>
        </div>
      )}

      {loadingMessages ? (
        <MessageListSkeleton />
      ) : (
        <MessageList
          messages={activeMessages}
          chatUserId={selectedChatUserId}
          isPeerTyping={isPeerTyping}
        />
      )}

      <div
        className="shrink-0 chat-canvas"
        aria-live="polite"
        aria-atomic="true"
      >
        {isPeerTyping && (
          <div className="flex items-center gap-2 px-3 sm:px-5 h-10 select-none">
            <div className="flex items-center gap-1.5 bg-app-incoming px-3 py-1.5 rounded-2xl rounded-bl-sm border border-app-border">
              <span className="w-1.5 h-1.5 rounded-full bg-app-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-app-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-app-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-[11px] font-medium text-app-muted truncate">
                {selectedChatUserId} is typing
              </span>
            </div>
          </div>
        )}
      </div>

      <MessageInput
        key={selectedChatUserId}
        onSendMessage={onSendMessage}
        chatUserId={selectedChatUserId}
        onTypingStatusChange={sendTypingStatus}
      />
    </div>
  );
};

export default ChatWindow;
