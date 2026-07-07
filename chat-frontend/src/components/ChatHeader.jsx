import { useSelector, useDispatch } from 'react-redux';
import { selectOnlineUsers, clearSelectedChat, selectConversations } from '../features/chat/chatSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import UserAvatar from './UserAvatar';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';

/**
 * CHAT HEADER COMPONENT
 * 
 * Why this component exists:
 * - Represents the action bar at the top of the active chat thread.
 * - Displays the identity of the current chat partner and their online presence.
 * - Houses controls to toggle the sidebar on mobile devices and clear/delete history.
 */
export const ChatHeader = ({ chatUserId }) => {
  const dispatch = useDispatch();
  const onlineUsers = useSelector(selectOnlineUsers);
  const conversations = useSelector(selectConversations);
  const { clearConversation, removeConversation } = useChat();

  const activeSummary = conversations.find(
    (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
  );

  const isOnline = onlineUsers.some(id => id.toLowerCase() === chatUserId.toLowerCase()) || 
                   (activeSummary && (activeSummary.receiver.isOnline || activeSummary.receiver.online));

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

  return (
    <header className="
      h-16 shrink-0 flex items-center justify-between px-4
      bg-white dark:bg-slate-900 
      border-b border-slate-200 dark:border-slate-800/80
      z-10 shadow-xs
    ">
      
      {/* User info left side */}
      <div className="flex items-center gap-3 min-w-0">
        
        {/* Mobile menu toggle button */}
        <button
          onClick={() => dispatch(setSidebarOpen(true))}
          className="p-2 -ml-2 rounded-lg md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* User avatar and active status indicator */}
        <UserAvatar userId={chatUserId} size="md" showStatus={true} isOnline={isOnline} />

        {/* Name and Status Description */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
            {chatUserId}
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            {isOnline ? 'Active Now' : 'Offline'}
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
