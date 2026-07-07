import React, { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedChat, selectSelectedChatUserId } from '../features/chat/chatSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import UserAvatar from './UserAvatar';

/**
 * REUSABLE CONVERSATION ITEM COMPONENT
 * 
 * Renders a single conversation slot in the sidebar list.
 * Wrapped in React.memo with a custom comparator to prevent duplicate sidebar list rendering.
 */
export const ConversationItem = memo(({ 
  chatUserId, 
  nickName,
  avatarUrl,
  lastMessage, 
  unreadCount = 0, 
  isOnline = false 
}) => {
  const dispatch = useDispatch();
  const selectedChatUserId = useSelector(selectSelectedChatUserId);

  const isSelected = selectedChatUserId === chatUserId;

  const handleSelect = () => {
    dispatch(setSelectedChat(chatUserId));
    dispatch(setSidebarOpen(false)); // Close drawer layout on mobile
  };

  // Helper to format the message timestamp in sidebar
  const formatTime = (timeInput) => {
    if (!timeInput) return '';
    try {
      const date = new Date(timeInput);
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <button
      onClick={handleSelect}
      className={`
        w-full p-3.5 flex items-center gap-3.5 
        text-left select-none border-b border-slate-100/50 dark:border-slate-800/30
        transition-all duration-200 cursor-pointer
        ${
          isSelected 
            ? 'bg-slate-100 dark:bg-slate-800/80' 
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-transparent'
        }
      `}
    >
      {/* Avatar with custom image fallback */}
      <UserAvatar 
        userId={chatUserId} 
        imageUrl={avatarUrl}
        size="md" 
        showStatus={true} 
        isOnline={isOnline} 
      />

      {/* Content wrapper */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-10">
        
        {/* Name and Time */}
        <div className="flex items-center justify-between">
          <span className={`text-sm truncate ${isSelected ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'font-medium text-slate-800 dark:text-slate-100'}`}>
            {nickName || chatUserId}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
            {lastMessage ? formatTime(lastMessage.timestamp) : ''}
          </span>
        </div>

        {/* Message preview and unread badge */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Last message content snippet */}
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1 pr-1 leading-normal font-normal">
            {lastMessage ? lastMessage.content : 'No messages in this chat'}
          </p>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="
              min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full
              bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold
              animate-pulse shrink-0
            ">
              {unreadCount}
            </span>
          )}
        </div>

      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  return prevProps.chatUserId === nextProps.chatUserId &&
         prevProps.nickName === nextProps.nickName &&
         prevProps.avatarUrl === nextProps.avatarUrl &&
         prevProps.unreadCount === nextProps.unreadCount &&
         prevProps.isOnline === nextProps.isOnline &&
         prevProps.lastMessage?.content === nextProps.lastMessage?.content &&
         prevProps.lastMessage?.timestamp === nextProps.lastMessage?.timestamp;
});

export default ConversationItem;
