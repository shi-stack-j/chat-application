import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, clearCurrentUser } from '../features/auth/authSlice';
import { selectSearchQuery, setSearchQuery, clearSelectedChat, resetChatState } from '../features/chat/chatSlice';
import { toggleTheme, selectTheme } from '../features/ui/uiSlice';
import UserAvatar from '../components/UserAvatar';
import SearchBar from '../components/SearchBar';
import OnlineUsersList from '../components/OnlineUsersList';
import ConversationList from '../components/ConversationList';
import IconButton from '../components/ui/IconButton';
import DropdownMenu, { MenuItem, MenuDivider } from '../components/ui/DropdownMenu';
import ConfirmModal from '../components/ui/ConfirmModal';
import toastHelper from '../utils/toastHelper';
import chatService from '../services/chatService';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const searchQuery = useSelector(selectSearchQuery);
  const theme = useSelector(selectTheme);

  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuBtnRef = useRef(null);

  const handleLogout = () => {
    toastHelper.info(`Session cleared for ${currentUser.currentUserId}`);
    chatService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('cached_password');
    dispatch(clearCurrentUser());
    dispatch(clearSelectedChat());
    dispatch(setSearchQuery(''));
    dispatch(resetChatState());
    setShowLogoutConfirm(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-app-surface overflow-hidden min-h-0">
      <div className="px-3 sm:px-4 py-3 flex items-center justify-between gap-2 shrink-0 border-b border-app-border">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            userId={currentUser.currentUserId}
            imageUrl={currentUser.avatarUrl}
            size="sm"
            showStatus={true}
            isOnline={true}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] leading-none text-app-muted font-medium">ChatApp</span>
            <span
              className="text-sm font-semibold text-app-text truncate mt-0.5"
              title={currentUser.currentUserId}
            >
              {currentUser.currentUserId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            onClick={() => dispatch(toggleTheme())}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </IconButton>

          <IconButton
            ref={menuBtnRef}
            onClick={() => setShowMenu((v) => !v)}
            title="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </IconButton>
        </div>
      </div>

      <DropdownMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        anchorRef={menuBtnRef}
        align="right"
      >
        <MenuItem
          onClick={() => {
            dispatch(toggleTheme());
            setShowMenu(false);
          }}
        >
          {theme === 'dark' ? (
            <>
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <span>Switch to light mode</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Switch to dark mode</span>
            </>
          )}
        </MenuItem>
        <MenuDivider />
        <MenuItem
          danger
          onClick={() => {
            setShowMenu(false);
            setShowLogoutConfirm(true);
          }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Log out</span>
        </MenuItem>
      </DropdownMenu>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out of this session?"
        description="Your in-memory message session history will be cleared on this device."
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <div className="px-3 sm:px-4 py-3 shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={(val) => dispatch(setSearchQuery(val))}
          onClear={() => dispatch(setSearchQuery(''))}
          placeholder="Search or enter user ID..."
        />
      </div>

      <OnlineUsersList />
      <ConversationList />
    </div>
  );
};

export default Sidebar;
