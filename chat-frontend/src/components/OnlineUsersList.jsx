import { useSelector, useDispatch } from 'react-redux';
import { selectOnlineUsers, setSelectedChat } from '../features/chat/chatSlice';
import { selectCurrentUserId } from '../features/auth/authSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import UserAvatar from './UserAvatar';
import useChat from '../hooks/useChat';

/**
 * ONLINE USERS LIST COMPONENT
 * 
 * Why this component exists:
 * - Displays a horizontal quick-scroll tray of other online users at the top of the sidebar.
 * - Allows users to immediately begin private messages with online peers without searching.
 * 
 * Design Details:
 * - Employs a touch-responsive, scrollable horizontal row (`overflow-x-auto scrollbar-none`).
 * - Filters out the current user's ID to prevent self-chatting.
 * - Displays a micro-indicator showing the username.
 */
export const OnlineUsersList = () => {
  const dispatch = useDispatch();
  const currentUserId = useSelector(selectCurrentUserId);
  const onlineUsers = useSelector(selectOnlineUsers);
  const { startConversation } = useChat();

  // Filter out the current user's ID from the list of online users
  const activePeers = onlineUsers.filter((userId) => userId !== currentUserId);

  const handleStartChat = (userId) => {
    // 1. Ensure the conversation object exists in Context/Redux state
    startConversation(userId, currentUserId);
    // 2. Select the conversation in Redux
    dispatch(setSelectedChat(userId));
    console.log("Setting the selected chat to ", userId);
    // 3. Close mobile drawer
    dispatch(setSidebarOpen(false));
  };

  return (
    <div className="py-3 px-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/50 shrink-0">

      {/* Small title header */}
      <div className="flex items-center justify-between mb-2 select-none">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Online Users ({activePeers.length})
        </span>
        {activePeers.length > 0 && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {activePeers.length === 0 ? (
        /* Empty Online Tray State */
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
          No other users online. Try typing a user ID in the search bar to start a conversation.
        </p>
      ) : (
        /* Horizontal scrolling online tray */
        <div className="flex items-center gap-4.5 overflow-x-auto pb-1 scrollbar-none select-none">
          {activePeers.map((userId) => (
            <button
              key={userId}
              onClick={() => handleStartChat(userId)}
              className="flex flex-col items-center gap-1 group text-center cursor-pointer shrink-0"
              title={`Chat with ${userId}`}
            >
              {/* Profile icon with pulsing online indicator dot */}
              <div className="relative transform transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                <UserAvatar userId={userId} size="sm" showStatus={false} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"></span>
              </div>

              {/* Short truncated username */}
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-[50px] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
