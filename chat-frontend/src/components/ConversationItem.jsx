import { useSelector, useDispatch } from 'react-redux';
import { setSelectedChat, selectSelectedChatUserId } from '../features/chat/chatSelectionSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import UserAvatar from './UserAvatar';

/**
 * REUSABLE CONVERSATION ITEM COMPONENT
 * 
 * Why this component exists:
 * - Renders a single conversation slot in the sidebar directory list.
 * - Shows summarized chat telemetry: last message text, last message time, and unread counter badges.
 * 
 * Design Details:
 * - Uses responsive mouse overlays (`hover:bg-slate-100`, dark variants) and smooth transitions.
 * - Highlights the row with a premium background block when selected.
 * - Truncates the last message text to keep the layout clean.
 */
export const ConversationItem = ({ 
  chatUserId, 
  lastMessage, 
  unreadCount = 0, 
  isOnline = false 
}) => {
  const dispatch = useDispatch();
  const selectedChatUserId = useSelector(selectSelectedChatUserId);

  const isSelected = selectedChatUserId === chatUserId;

  const handleSelect = () => {
    // 1. Update active chat user in Redux
    dispatch(setSelectedChat(chatUserId));
    // 2. On mobile, collapse the sidebar drawer to reveal the chat panel
    dispatch(setSidebarOpen(false));
  };

  // Helper to format the message time
  const formatTime = (timeInput) => {
    if (!timeInput) return '';
    try {
      const date = new Date(timeInput);
      const today = new Date();
      
      // If it is today, show only time. If not, show date.
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
      {/* Avatar with status indicator */}
      <UserAvatar 
        userId={chatUserId} 
        size="md" 
        showStatus={true} 
        isOnline={isOnline} 
      />

      {/* Content wrapper */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-10">
        
        {/* Name and Time */}
        <div className="flex items-center justify-between">
          <span className={`text-sm truncate ${isSelected ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'font-medium text-slate-800 dark:text-slate-100'}`}>
            {chatUserId}
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
};

export default ConversationItem;
