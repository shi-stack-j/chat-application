import { useSelector, useDispatch } from 'react-redux';
import { selectOnlineUsers, setSelectedChat } from '../features/chat/chatSlice';
import { selectCurrentUserId } from '../features/auth/authSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import UserAvatar from './UserAvatar';
import useChat from '../hooks/useChat';

export const OnlineUsersList = () => {
  const dispatch = useDispatch();
  const currentUserId = useSelector(selectCurrentUserId);
  const onlineUsers = useSelector(selectOnlineUsers);
  const { startConversation } = useChat();

  const activePeers = onlineUsers.filter((userId) => userId !== currentUserId);

  const handleStartChat = (userId) => {
    startConversation(userId, currentUserId);
    dispatch(setSelectedChat(userId));
    dispatch(setSidebarOpen(false));
  };

  return (
    <div className="py-2.5 px-3 sm:px-4 border-b border-app-border shrink-0">
      <div className="flex items-center justify-between mb-2 select-none">
        <span className="text-[11px] font-semibold tracking-wide text-app-muted uppercase">
          Online · {activePeers.length}
        </span>
        {activePeers.length > 0 && (
          <span className="flex h-2 w-2 relative" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-success opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-app-success" />
          </span>
        )}
      </div>

      {activePeers.length === 0 ? (
        <p className="text-[11px] text-app-muted py-0.5 leading-relaxed">
          Nobody else is online. Search a user ID to start a chat.
        </p>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto pb-0.5 scrollbar-none">
          {activePeers.map((userId) => (
            <button
              key={userId}
              onClick={() => handleStartChat(userId)}
              className="flex flex-col items-center gap-1 group text-center cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary rounded-lg"
              title={`Chat with ${userId}`}
              aria-label={`Chat with ${userId}`}
            >
              <div className="relative transition-transform duration-150 group-hover:-translate-y-0.5">
                <UserAvatar userId={userId} size="sm" showStatus={false} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-app-success rounded-full border-2 border-app-surface" />
              </div>
              <span className="text-[10px] font-medium text-app-muted max-w-[52px] truncate group-hover:text-app-primary transition-colors">
                {userId}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;
