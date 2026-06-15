import { useSelector, useDispatch } from 'react-redux';
import { selectSearchQuery, selectUnreadCounts, selectOnlineUsers, setSelectedChat, setSearchQuery, addOnlineUser } from '../features/chat/chatSelectionSlice';
import useChat from '../hooks/useChat';
import ConversationItem from './ConversationItem';
import toastHelper from '../utils/toastHelper';
import { setSidebarOpen, setGlobalLoading } from '../features/ui/uiSlice';
import { selectCurrentUserId } from '../features/user/userSlice';
import userService from '../services/userService';

/**
 * CONVERSATION LIST COMPONENT
 * 
 * Why this component exists:
 * - Aggregates and filters active conversations in the sidebar directory.
 * - Sorts conversations chronologically, placing the most active threads at the top.
 * 
 * Design details:
 * - Dynamic filtering: List updates live as the user types in the search query.
 * - "Quick-Add" Action: If the typed search string does not match any current conversation,
 *   it shows a helper item allowing the user to instantiate a new chat partner directly.
 */
export const ConversationList = () => {
  const dispatch = useDispatch();
  const { conversations, createConversation } = useChat();
  const searchQuery = useSelector(selectSearchQuery);
  const unreadCounts = useSelector(selectUnreadCounts);
  const onlineUsers = useSelector(selectOnlineUsers);
  const currentUserId = useSelector(selectCurrentUserId);

  // 1. Gather all conversation keys (other users)
  const chatUserIds = Object.keys(conversations);

  // 2. Sort the conversations based on the timestamp of their last message
  const sortedChatUserIds = [...chatUserIds].sort((a, b) => {
    const listA = conversations[a] || [];
    const listB = conversations[b] || [];
    if (listA.length === 0 && listB.length === 0) return 0;
    if (listA.length === 0) return 1; // Put empty chats at bottom
    if (listB.length === 0) return -1;
    
    const timeA = new Date(listA[listA.length - 1].timestamp).getTime();
    const timeB = new Date(listB[listB.length - 1].timestamp).getTime();
    return timeB - timeA; // Descending
  });

  // 3. Filter list based on search query
  const filteredChatUserIds = sortedChatUserIds.filter((userId) =>
    userId.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // 4. Check if the searched User ID exists in active chats
  const exactMatchExists = chatUserIds.some(
    (id) => id.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  // Check if search query is valid to start a new chat
  const canStartNewChat = searchQuery.trim().length > 0 && !exactMatchExists;

  const handleStartNewChat = async () => {
    const targetUserId = searchQuery.trim();
    if (!targetUserId) return;

    dispatch(setGlobalLoading(true));

    try {
      // 1. Call backend-ready service to verify user exist & online status
      const connectResponse = await userService.connectUser(targetUserId, currentUserId);
      const connectedUser = connectResponse.user;

      // 2. Add user to Chat Context conversations list
      createConversation(connectedUser.userId);

      // 3. Mark user online in Redux state
      dispatch(addOnlineUser(connectedUser.userId));

      // 4. Open the chat window with the new user
      dispatch(setSelectedChat(connectedUser.userId));

      // 5. Reset sidebar search input
      dispatch(setSearchQuery(''));

      // 6. Close mobile responsive side drawer
      dispatch(setSidebarOpen(false));

      toastHelper.success(`Connected with ${connectedUser.userId}`);
    } catch (error) {
      // Show failure toast notifications
      toastHelper.error(error.message || 'Failed to establish connection.');
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto select-none">
      
      {/* 
        Quick Add new chat suggestion 
        Shows up if search text matches no active conversations.
      */}
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

      {/* 
        List items rendering
      */}
      {filteredChatUserIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
          {!canStartNewChat && (
            <>
              <svg className="w-10 h-10 mb-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <p className="text-xs">No active conversations yet.</p>
              <p className="text-[10px] mt-1">Type a User ID in the search bar above to start a session.</p>
            </>
          )}
        </div>
      ) : (
        filteredChatUserIds.map((userId) => {
          const messages = conversations[userId] || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          const unreadCount = unreadCounts[userId] || 0;
          const isOnline = onlineUsers.includes(userId);

          return (
            <ConversationItem
              key={userId}
              chatUserId={userId}
              lastMessage={lastMessage}
              unreadCount={unreadCount}
              isOnline={isOnline}
            />
          );
        })
      )}

    </div>
  );
};

export default ConversationList;
