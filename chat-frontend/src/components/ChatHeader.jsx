import { useRef, useState } from 'react';
import { selectOnlineUsers, clearSelectedChat, selectConversations, selectTypingUsers, selectBlockedUsers } from '../features/chat/chatSlice';
import { selectConnectionState } from '../features/websocket/websocketSlice';
import { setSidebarOpen } from '../features/ui/uiSlice';
import { useDispatch, useSelector } from 'react-redux';
import UserAvatar from './UserAvatar';
import IconButton from './ui/IconButton';
import DropdownMenu, { MenuItem, MenuDivider } from './ui/DropdownMenu';
import ConfirmModal from './ui/ConfirmModal';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';

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

  const [showMenu, setShowMenu] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const menuBtnRef = useRef(null);

  const goBackToList = () => {
    dispatch(clearSelectedChat());
    dispatch(setSidebarOpen(true));
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
      setConfirm({
        type: 'block',
        title: `Block ${chatUserId}?`,
        description: 'You will no longer receive messages from this user until you unblock them.',
        confirmLabel: 'Block',
      });
    }
  };

  const runConfirm = async () => {
    const type = confirm?.type;
    setConfirm(null);
    if (type === 'clear') {
      clearConversation(chatUserId);
      toastHelper.success(`Cleared conversation with ${chatUserId}`);
    } else if (type === 'remove') {
      removeConversation(chatUserId);
      dispatch(clearSelectedChat());
      toastHelper.success(`Removed chat with ${chatUserId}`);
    } else if (type === 'block') {
      try {
        await blockUser(chatUserId);
        toastHelper.success(`Blocked ${chatUserId}`);
      } catch (err) {
        toastHelper.error(err.message || `Failed to block ${chatUserId}`);
      }
    }
  };

  return (
    <header className="h-14 sm:h-16 shrink-0 flex items-center justify-between gap-2 px-2 sm:px-4 bg-app-surface border-b border-app-border z-10">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <IconButton
          onClick={goBackToList}
          title="Back to conversations"
          className="lg:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </IconButton>

        <UserAvatar userId={chatUserId} size="md" showStatus={true} isOnline={isOnline} />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm text-app-text truncate" title={chatUserId}>
              {chatUserId}
            </h3>
            {isBlocked && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-app-error/10 text-app-error">
                Blocked
              </span>
            )}
            {connectionState !== 'connected' && (
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                connectionState === 'connecting'
                  ? 'bg-amber-500/10 text-app-warning'
                  : 'bg-app-error/10 text-app-error'
              }`}>
                {connectionState === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-app-muted flex items-center gap-1.5 font-medium truncate">
            {isTyping ? (
              <span className="text-app-primary font-semibold">typing…</span>
            ) : (
              <span>{isOnline ? 'Active now' : 'Offline'}</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center shrink-0">
        <IconButton
          ref={menuBtnRef}
          onClick={() => setShowMenu((v) => !v)}
          title="Chat options"
          active={isBlocked}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </IconButton>
      </div>

      <DropdownMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        anchorRef={menuBtnRef}
        align="right"
      >
        <MenuItem
          onClick={() => {
            setShowMenu(false);
            handleToggleBlock();
          }}
          danger={!isBlocked}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span>{isBlocked ? `Unblock ${chatUserId}` : `Block ${chatUserId}`}</span>
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onClick={() => {
            setShowMenu(false);
            setConfirm({
              type: 'clear',
              title: `Clear messages with ${chatUserId}?`,
              description: 'This removes the conversation history from this view.',
              confirmLabel: 'Clear messages',
            });
          }}
          danger
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear messages</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowMenu(false);
            setConfirm({
              type: 'remove',
              title: `Delete conversation with ${chatUserId}?`,
              description: 'The conversation will be removed from your list.',
              confirmLabel: 'Delete conversation',
            });
          }}
          danger
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Delete conversation</span>
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onClick={() => {
            setShowMenu(false);
            dispatch(clearSelectedChat());
          }}
        >
          <svg className="w-4 h-4 shrink-0 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span>Close chat</span>
        </MenuItem>
      </DropdownMenu>

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </header>
  );
};

export default ChatHeader;
