import { useSelector, useDispatch } from 'react-redux';
import { selectSearchQuery, selectOnlineUsers, setSelectedChat, setSearchQuery } from '../features/chat/chatSlice';
import useChat from '../hooks/useChat';
import ConversationItem from './ConversationItem';
import { SidebarSkeleton } from './SkeletonLoader';
import toastHelper from '../utils/toastHelper';
import { setSidebarOpen, setGlobalLoading } from '../features/ui/uiSlice';
import { selectCurrentUserId } from '../features/auth/authSlice';

/**
 * CONVERSATION LIST COMPONENT
 * 
 * Renders list of conversation summaries from ChatContext.
 * Offers quick search-add functionality to start new chats.
 */
export const ConversationList = () => {
  const dispatch = useDispatch();
  const { conversationList, startConversation, loadingConversations } = useChat();
  const searchQuery = useSelector(selectSearchQuery);
  const onlineUsers = useSelector(selectOnlineUsers);
  const currentUserId = useSelector(selectCurrentUserId);

  // 1. Filter list based on search query matching receiver's userId or nickname
  const filteredConversations = conversationList.filter((c) => {
    const userIdMatch = c.receiver.userId.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const nickNameMatch = c.receiver.nickName && c.receiver.nickName.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return userIdMatch || nickNameMatch;
  });

  // 2. Check if search query matches an existing conversation exactly
  const exactMatchExists = conversationList.some(
    (c) => c.receiver.userId.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const canStartNewChat = searchQuery.trim().length > 0 && !exactMatchExists;

  const handleStartNewChat = async () => {
    const targetUserId = searchQuery.trim();
    if (!targetUserId) return;

    if (targetUserId.toLowerCase() === currentUserId.toLowerCase()) {
      toastHelper.error("You cannot start a conversation with yourself.");
      return;
    }

    dispatch(setGlobalLoading(true));

    try {
      // Create/Fetch conversation summary from backend
      const summary = await startConversation(targetUserId, currentUserId);
      
      if (summary) {
        // Open chat window
        dispatch(setSelectedChat(summary.receiver.userId));
        // Reset search bar
        dispatch(setSearchQuery(''));
        // Close sidebar drawer on mobile
        dispatch(setSidebarOpen(false));

        toastHelper.success(`Connected with ${summary.receiver.nickName || summary.receiver.userId}`);
      }
    } catch (error) {
      toastHelper.error(error.message || 'Failed to establish connection. User may not exist.');
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  if (loadingConversations && conversationList.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto select-none">
        <SidebarSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto select-none">
      
      {/* Quick Add block if no exact match exists in current list */}
      {canStartNewChat && (
        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30">
          <button
            onClick={handleStartNewChat}
            className="
              w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold
              bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm active:scale-98
              transition-all duration-200
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Connect with "{searchQuery.trim()}"
          </button>
        </div>
      )}

      {/* Render list items */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
          {!canStartNewChat && (
            <>
              <svg className="w-10 h-10 mb-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <p className="text-xs">No active conversations yet.</p>
              <p className="text-[10px] mt-1">Type a User ID in the search bar above to start.</p>
            </>
          )}
        </div>
      ) : (
        filteredConversations.map((c) => {
          const lastMessagePayload = c.lastMessage 
            ? { content: c.lastMessage, timestamp: c.lastMessageTime } 
            : null;
          const isOnline = onlineUsers.some(id => id.toLowerCase() === c.receiver.userId.toLowerCase()) || c.receiver.isOnline || c.receiver.online;

          return (
            <ConversationItem
              key={c.receiver.userId}
              chatUserId={c.receiver.userId}
              nickName={c.receiver.nickName}
              avatarUrl={c.receiver.avatarUrl}
              lastMessage={lastMessagePayload}
              unreadCount={c.unreadCount}
              isOnline={isOnline}
            />
          );
        })
      )}

    </div>
  );
};

export default ConversationList;
