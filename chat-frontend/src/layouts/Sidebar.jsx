import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, clearCurrentUser } from '../features/auth/authSlice';
import { selectSearchQuery, setSearchQuery, clearSelectedChat, resetChatState } from '../features/chat/chatSlice';
import { toggleTheme, selectTheme } from '../features/ui/uiSlice';
import UserAvatar from '../components/UserAvatar';
import SearchBar from '../components/SearchBar';
import OnlineUsersList from '../components/OnlineUsersList';
import ConversationList from '../components/ConversationList';
import toastHelper from '../utils/toastHelper';
import chatService from '../services/chatService';

/**
 * SIDEBAR CONTAINER LAYOUT
 * 
 * Why this component exists:
 * - Aggregates all navigation and directory tools in a single column:
 *   1. User profile and global options (Logout, Theme switcher)
 *   2. Search bar for finding users or active chats
 *   3. Horizontal online users list
 *   4. Vertical conversation history list
 */
export const Sidebar = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const searchQuery = useSelector(selectSearchQuery);
  const theme = useSelector(selectTheme);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to exit? Your message session history will be cleared.')) {
      toastHelper.info(`Session cleared for ${currentUser.currentUserId}`);
      chatService.disconnect();
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('cached_password');
      dispatch(clearCurrentUser());
      dispatch(clearSelectedChat());
      dispatch(setSearchQuery(''));
      dispatch(resetChatState());
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      
      {/* 
        Header Section
        Renders current user profile, theme toggle, and exit/logout button.
      */}
      <div className="
        p-4 flex items-center justify-between shrink-0
        bg-slate-50/50 dark:bg-slate-900
        border-b border-slate-200 dark:border-slate-800/80
      ">
        
        {/* User Profile */}
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar userId={currentUser.currentUserId} imageUrl={currentUser.avatarUrl} size="sm" showStatus={true} isOnline={true} />
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Logged in as</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={currentUser.currentUserId}>
              {currentUser.currentUserId}
            </span>
          </div>
        </div>

        {/* Action Controls (Theme, Logout) */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Theme Switcher Button */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="
              p-2 rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer
              hover:bg-slate-200/50 dark:hover:bg-slate-800/60
              transition-all duration-200
            "
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              // Sun Icon (Light Mode trigger)
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              // Moon Icon (Dark Mode trigger)
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Logout/Exit Button */}
          <button
            onClick={handleLogout}
            className="
              p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer
              hover:bg-slate-200/50 dark:hover:bg-slate-800/60
              transition-all duration-200
            "
            title="Log out session"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

        </div>
      </div>

      {/* Search Bar Wrapper */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={(val) => dispatch(setSearchQuery(val))}
          onClear={() => dispatch(setSearchQuery(''))}
          placeholder="Search or enter user ID..."
        />
      </div>

      {/* Online Users tray */}
      <OnlineUsersList />

      {/* Dynamic scrolling List of existing chats */}
      <ConversationList />

    </div>
  );
};

export default Sidebar;
