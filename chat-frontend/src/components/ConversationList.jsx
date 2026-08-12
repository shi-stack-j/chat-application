import { useSelector, useDispatch } from 'react-redux';
import { selectSearchQuery, selectOnlineUsers, selectBlockedUsers, setSelectedChat, setSearchQuery } from '../features/chat/chatSlice';
import useChat from '../hooks/useChat';
import ConversationItem from './ConversationItem';
import { SidebarSkeleton } from './SkeletonLoader';
import toastHelper from '../utils/toastHelper';
import { setSidebarOpen, setGlobalLoading } from '../features/ui/uiSlice';
import { selectCurrentUserId } from '../features/auth/authSlice';

export const ConversationList = () => {
  const dispatch = useDispatch();
  const { conversationList, startConversation, loadingConversations } = useChat();
  const searchQuery = useSelector(selectSearchQuery);
  const onlineUsers = useSelector(selectOnlineUsers);
  const blockedUsers = useSelector(selectBlockedUsers) || [];
  const currentUserId = useSelector(selectCurrentUserId);

  const filteredConversations = conversationList.filter((c) => {
    const userIdMatch = c.receiver.userId.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const nickNameMatch = c.receiver.nickName && c.receiver.nickName.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return userIdMatch || nickNameMatch;
  });

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
      const summary = await startConversation(targetUserId, currentUserId);

      if (summary) {
        dispatch(setSelectedChat(summary.receiver.userId));
        dispatch(setSearchQuery(''));
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
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        <SidebarSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 select-none scrollbar-thin">
      {canStartNewChat && (
        <div className="p-3 border-b border-app-border">
          <button
            onClick={handleStartNewChat}
            className="
              w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2
              text-xs font-semibold cursor-pointer
              bg-app-primary hover:bg-app-primary-hover
              text-white dark:text-slate-950
              transition-colors duration-150
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary
            "
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span className="truncate">Start chat with “{searchQuery.trim()}”</span>
          </button>
        </div>
      )}

      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-app-muted">
          {!canStartNewChat && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-app-bg flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-app-text">
                {searchQuery.trim() ? 'No matching conversations' : 'No conversations yet'}
              </p>
              <p className="text-xs mt-1.5 max-w-[220px] leading-relaxed">
                {searchQuery.trim()
                  ? 'Try a different name or start a new chat with this ID.'
                  : 'Search for a user ID above to start a private conversation.'}
              </p>
            </>
          )}
        </div>
      ) : (
        filteredConversations.map((c) => {
          const lastMessagePayload = c.lastMessage
            ? { content: c.lastMessage, timestamp: c.lastMessageTime }
            : null;
          const isBlocked = blockedUsers.some(id => id.toLowerCase() === c.receiver.userId.toLowerCase()) || !!(c.isOtherUserBlocked || c.otherUserBlocked);
          const isOnline = !isBlocked && (onlineUsers.some(id => id.toLowerCase() === c.receiver.userId.toLowerCase()) || c.receiver.isOnline || c.receiver.online);

          return (
            <ConversationItem
              key={c.receiver.userId}
              chatUserId={c.receiver.userId}
              nickName={c.receiver.nickName}
              avatarUrl={c.receiver.avatarUrl}
              lastMessage={lastMessagePayload}
              unreadCount={c.unreadCount}
              isOnline={isOnline}
              isBlocked={isBlocked}
            />
          );
        })
      )}
    </div>
  );
};

export default ConversationList;
