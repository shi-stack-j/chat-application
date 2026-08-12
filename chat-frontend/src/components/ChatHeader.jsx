import { selectOnlineUsers, clearSelectedChat, selectConversations, selectTypingUsers, selectBlockedUsers } from '../features/chat/chatSlice';
import { selectConnectionState } from '../features/websocket/websocketSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import { useDispatch, useSelector } from 'react-redux';
import UserAvatar from './UserAvatar';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';

/**
 * CHAT HEADER COMPONENT
 * 
 * Why this component exists:
 * - Represents the action bar at the top of the active chat thread.
 * - Displays the identity of the current chat partner and their online presence.
 * - Houses controls to toggle the sidebar on mobile devices, clear/delete history, and block/unblock users.
 */
export const ChatHeader = ({ chatUserId }) => {
  const dispatch = useDispatch();
  const onlineUsers = useSelector(selectOnlineUsers);
  const conversations = useSelector(selectConversations);
  const connectionState = useSelector(selectConnectionState);
  const typingUsers = useSelector(selectTypingUsers) || {};
  const blockedUsers = useSelector(selectBlockedUsers) || [];
  const activeSummary = conversations.find(
    (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
  );
  const isBlocked = blockedUsers.some(id => id.toLowerCase() === chatUserId.toLowerCase()) ||
    !!(activeSummary?.isOtherUserBlocked || activeSummary?.otherUserBlocked);

  const { clearConversation, removeConversation, blockUser, unblockUser } = useChat();

  const isOnline = !isBlocked && (
    onlineUsers.some(id => id.toLowerCase() === chatUserId.toLowerCase()) ||
    (activeSummary && (activeSummary.receiver.isOnline || activeSummary.receiver.online))
  );

  const isTyping = typingUsers[chatUserId.toLowerCase()];

  const handleClearChat = () => {
    if (window.confirm(`Are you sure you want to clear all messages with ${chatUserId}?`)) {
      clearConversation(chatUserId);
      toastHelper.success(`Cleared conversation with ${chatUserId}`);
    }
  };

  const handleRemoveChat = () => {
    if (window.confirm(`Delete conversation with ${chatUserId} and remove from list?`)) {
      removeConversation(chatUserId);
      dispatch(clearSelectedChat());
      toastHelper.success(`Removed chat with ${chatUserId}`);
    }
  };

  const handleToggleBlock = async () => {
    if (isBlocked) {
      try {
        await unblockUser(chatUserId);
        toastHelper.success(`Unblocked ${chatUserId}`);
      } catch (err) {
        toastHelper.error(err.message || `Failed to unblock ${chatUserId}`);
      }
    } else {
      if (window.confirm(`Are you sure you want to block ${chatUserId}? You will no longer receive messages from this user.`)) {
        try {
          await blockUser(chatUserId);
          toastHelper.success(`Blocked ${chatUserId}`);
        } catch (err) {
          toastHelper.error(err.message || `Failed to block ${chatUserId}`);
        }
      }
    }
  };

  return (
    <header className="
      h-16 shrink-0 flex items-center justify-between px-4
      bg-white dark:bg-slate-900 
      border-b border-slate-200 dark:border-slate-800/80
      z-10 shadow-xs
    ">

      {/* User info left side */}
      <div className="flex items-center gap-3 min-w-0">

        {/* Mobile Back button to return to conversation list */}
        <button
          onClick={() => {
            dispatch(clearSelectedChat());
            dispatch(setSidebarOpen(true));
          }}
          className="p-2 -ml-2 rounded-xl md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          aria-label="Back to conversations"
          title="Back to conversations"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* User avatar and active status indicator */}
        <UserAvatar userId={chatUserId} size="md" showStatus={true} isOnline={isOnline} />

        {/* Name and Status Description */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
              {chatUserId}
            </h3>
            {connectionState !== 'connected' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                connectionState === 'connecting'
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 animate-pulse'
                  : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
              }`}>
                {connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
            {isTyping ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">typing...</span>
              </>
            ) : (
              <>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{isOnline ? 'Active Now' : 'Offline'}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Action actions right side */}
      <div className="flex items-center gap-1">

        {/* Clear chat logs */}
        <button
          onClick={handleClearChat}
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          title="Clear all messages"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a3 3 0 003 3h10M9 3h6m2 4H7" />
          </svg>
        </button>

        {/* Remove Chat Conversation completely */}
        <button
          onClick={handleRemoveChat}
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          title="Delete chat session"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Block / Unblock User */}
        <button
          onClick={handleToggleBlock}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isBlocked
              ? 'text-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40'
              : 'text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
          title={isBlocked ? `Unblock ${chatUserId}` : `Block ${chatUserId}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>

        {/* Divider */}
        <span className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1"></span>

        {/* Close Active Chat Session */}
        <button
          onClick={() => dispatch(clearSelectedChat())}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          title="Close chat panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </header>
  );
};

export default ChatHeader;
