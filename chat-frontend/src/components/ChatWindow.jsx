import React from 'react';
import { useSelector } from 'react-redux';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { MessageListSkeleton } from './SkeletonLoader';
import {
  selectSelectedChatUserId,
  selectActiveMessages,
  selectLoadingMessages
} from '../features/chat/chatSlice';
import { selectConnectionState } from '../features/websocket/websocketSlice';

/**
 * CHAT WINDOW PANEL COMPONENT
 * 
 * Manages the layout and rendering lifecycle of the active chat viewport.
 * Coordinates loading skeletons, connection status warnings, and layout streams.
 */
export const ChatWindow = ({ onSendMessage }) => {
  const selectedChatUserId = useSelector(selectSelectedChatUserId);
  const activeMessages = useSelector(selectActiveMessages);
  const loadingMessages = useSelector(selectLoadingMessages);
  const connectionState = useSelector(selectConnectionState);

  // If no chat partner is selected, render a modern greeting empty state
  if (!selectedChatUserId) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 h-full flex flex-col relative min-w-0 bg-white dark:bg-slate-900">
      {/* Header bar showing recipient details */}
      <ChatHeader chatUserId={selectedChatUserId} />

      {/* 
        WebSocket Connection Warning Banner
        Triggers automatically when the connection is interrupted or establishing.
      */}
      {connectionState !== 'connected' && (
        <div className={`
          px-4 py-2 text-xs font-semibold select-none flex items-center gap-2 border-b
          transition-all duration-300
          ${
            connectionState === 'connecting'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${connectionState === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
          <span>
            {connectionState === 'connecting'
              ? 'Reconnecting to live server...'
              : 'Connection offline. REST API fallback enabled.'}
          </span>
        </div>
      )}

      {/* 
        Dynamic Message Feed:
        Displays a pulsing skeleton loader when fetching message archives,
        otherwise maps out the message bubble stream.
      */}
      {loadingMessages ? (
        <MessageListSkeleton />
      ) : (
        <MessageList messages={activeMessages} chatUserId={selectedChatUserId} />
      )}

      {/* Typing input bar */}
      <MessageInput 
        key={selectedChatUserId} 
        onSendMessage={onSendMessage} 
        chatUserId={selectedChatUserId} 
      />
    </div>
  );
};

export default ChatWindow;
