import { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedChat, selectSelectedChatUserId } from '../features/chat/chatSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import UserAvatar from './UserAvatar';

export const ConversationItem = memo(({
  chatUserId,
  nickName,
  avatarUrl,
  lastMessage,
  unreadCount = 0,
  isOnline = false,
  isBlocked = false
}) => {
  const dispatch = useDispatch();
  const selectedChatUserId = useSelector(selectSelectedChatUserId);

  const isSelected = selectedChatUserId === chatUserId;

  const handleSelect = () => {
    dispatch(setSelectedChat(chatUserId));
    dispatch(setSidebarOpen(false));
  };

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

  const displayName = nickName || chatUserId;

  return (
    <button
      onClick={handleSelect}
      className={`
        w-full px-3 sm:px-3.5 py-2.5 flex items-center gap-3
        text-left select-none cursor-pointer relative
        transition-colors duration-150
        ${isSelected
          ? 'bg-app-primary-soft'
          : 'hover:bg-app-bg dark:hover:bg-white/4'
        }
      `}
    >
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-app-primary" />
      )}

      <UserAvatar
        userId={chatUserId}
        imageUrl={avatarUrl}
        size="md"
        showStatus={!isBlocked}
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className={`text-sm truncate ${isSelected ? 'font-semibold text-app-text' : 'font-medium text-app-text'}`}
            title={displayName}
          >
            {displayName}
          </span>
          <span className={`text-[11px] shrink-0 tabular-nums ${unreadCount > 0 ? 'text-app-primary font-semibold' : 'text-app-muted'}`}>
            {lastMessage ? formatTime(lastMessage.timestamp) : ''}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className={`text-xs truncate flex-1 leading-snug ${unreadCount > 0 ? 'text-app-text font-medium' : 'text-app-muted'}`}>
            {isBlocked
              ? 'You blocked this user'
              : lastMessage
                ? lastMessage.content
                : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-app-primary text-white dark:text-slate-950 text-[10px] font-bold shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
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
    prevProps.isBlocked === nextProps.isBlocked &&
    prevProps.lastMessage?.content === nextProps.lastMessage?.content &&
    prevProps.lastMessage?.timestamp === nextProps.lastMessage?.timestamp;
});

export default ConversationItem;
