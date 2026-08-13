import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUserId } from '../features/auth/authSlice';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';
import DropdownMenu, { MenuItem } from './ui/DropdownMenu';
import ConfirmModal from './ui/ConfirmModal';
import ReactionPicker from './ReactionPicker';

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

const MessageContent = ({ text, isMe, isDeleted }) => {
  if (isDeleted) {
    return <p className="break-words leading-relaxed italic">{text}</p>;
  }

  const parts = String(text || '').split(URL_PATTERN);
  return (
    <p className="break-words [overflow-wrap:anywhere] leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
          return (
            <a
              key={`${part}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 break-all ${isMe ? 'text-white/95 decoration-white/40 hover:decoration-white' : 'text-app-primary decoration-app-primary/40 hover:decoration-app-primary'}`}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
};

const StatusIcon = ({ status }) => {
  const normalized = String(status || '').toUpperCase();

  if (!status || normalized === 'PENDING' || normalized === 'SENDING') {
    return (
      <svg className="w-3.5 h-3.5 text-white/55" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label="Sending">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    );
  }

  if (normalized === 'READ') {
    return (
      <svg className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label="Read">
        <path d="M4 12.5l3.5 3.5 8-8 M9 12.5l3.5 3.5 8-8" />
      </svg>
    );
  }

  if (normalized === 'DELIVERED') {
    return (
      <svg className="w-4 h-4 text-white/85" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label="Delivered">
        <path d="M4 12.5l3.5 3.5 8-8 M9 12.5l3.5 3.5 8-8" />
      </svg>
    );
  }

  if (normalized === 'SENT' || normalized === 'BLOCKED') {
    return (
      <svg className="w-4 h-4 text-white/55" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-label="Sent">
        <path d="M5 12.5l3.5 3.5 8-8" />
      </svg>
    );
  }

  return null;
};

export const MessageBubble = memo(({ message, isMe, isConsecutive = false, chatUserId }) => {
  const { content, timestamp } = message;
  const messageId = message.messageId || message.id;
  const currentUserId = useSelector(selectCurrentUserId);
  const { conversationList, editMessage, deleteForEveryone, deleteForMe, addReaction, removeReaction } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content || '');
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const menuBtnRef = useRef(null);
  const reactionBtnRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const touchStartRef = useRef(null);

  useEffect(() => {
    setEditText(content || '');
  }, [content]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const isDeleted = message.isDeletedForEveryone || message.deletedForEveryOne || content === 'This message was deleted.';
  const isEdited = message.isEdited || message.edited || message.editedAt;

  const isWithin30Mins = timestamp
    ? (new Date().getTime() - new Date(timestamp).getTime()) <= 30 * 60 * 1000
    : true;

  const resolveConversationId = () => {
    if (message.conversationId) return message.conversationId;
    const targetUser = chatUserId || (isMe ? message.receiverId : message.senderId);
    if (!targetUser) return null;
    const conv = conversationList.find(
      (c) => c.receiver?.userId?.toLowerCase() === targetUser.toLowerCase()
    );
    return conv?.conversationId || null;
  };

  const reactionGroups = useMemo(() => {
    const reactions = Array.isArray(message.reactions) ? message.reactions : [];
    if (reactions.length === 0) return [];

    const map = new Map();
    reactions.forEach((r) => {
      if (!r || !r.emoji) return;
      const existing = map.get(r.emoji) || { emoji: r.emoji, count: 0, users: [], hasReacted: false };
      existing.count += 1;
      existing.users.push(r.userId);
      if (currentUserId && r.userId?.toLowerCase() === currentUserId.toLowerCase()) {
        existing.hasReacted = true;
      }
      map.set(r.emoji, existing);
    });

    return Array.from(map.values());
  }, [message.reactions, currentUserId]);

  const myReaction = useMemo(() => {
    const reactions = Array.isArray(message.reactions) ? message.reactions : [];
    if (!currentUserId || reactions.length === 0) return null;
    const found = reactions.find(
      (r) => r.userId?.toLowerCase() === currentUserId.toLowerCase()
    );
    return found ? found.emoji : null;
  }, [message.reactions, currentUserId]);

  const handleSelectReaction = async (emoji) => {
    const conversationId = resolveConversationId();
    if (!messageId) return;

    try {
      if (myReaction === emoji) {
        await removeReaction(conversationId, messageId);
      } else {
        await addReaction(conversationId, messageId, emoji);
      }
    } catch (error) {
      toastHelper.error(error.message || 'Failed to update reaction.');
    }
  };

  const handleBadgeClick = async (group) => {
    const conversationId = resolveConversationId();
    if (!messageId) return;

    try {
      if (group.hasReacted) {
        await removeReaction(conversationId, messageId);
      } else {
        await addReaction(conversationId, messageId, group.emoji);
      }
    } catch (error) {
      toastHelper.error(error.message || 'Failed to update reaction.');
    }
  };

  const handleSaveEdit = async () => {
    const cleanText = editText.trim();
    if (!cleanText) {
      toastHelper.error('Message content cannot be empty.');
      return;
    }
    if (cleanText === content) {
      setIsEditing(false);
      return;
    }

    const conversationId = resolveConversationId();
    if (!conversationId || !messageId) {
      toastHelper.error('Unable to resolve conversation for edit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await editMessage(conversationId, messageId, cleanText);
      toastHelper.success('Message updated.');
      setIsEditing(false);
    } catch (error) {
      toastHelper.error(error.message || 'Failed to edit message.');
    } finally {
      setIsSubmitting(false);
      setShowMenu(false);
    }
  };

  const handleDeleteEveryone = async () => {
    const conversationId = resolveConversationId();
    if (!conversationId || !messageId) {
      toastHelper.error('Unable to resolve conversation for delete.');
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteForEveryone(conversationId, messageId);
      toastHelper.success('Message deleted for everyone.');
    } catch (error) {
      toastHelper.error(error.message || 'Failed to delete message.');
    } finally {
      setIsSubmitting(false);
      setShowMenu(false);
    }
  };

  const handleDeleteMe = async () => {
    const conversationId = resolveConversationId();
    const partnerId = chatUserId || (isMe ? message.receiverId : message.senderId);

    setIsSubmitting(true);
    try {
      await deleteForMe(conversationId, messageId, partnerId);
      toastHelper.success('Message deleted for you.');
    } catch (error) {
      toastHelper.error(error.message || 'Failed to delete message for you.');
    } finally {
      setIsSubmitting(false);
      setShowMenu(false);
    }
  };

  const formatTime = (timeInput) => {
    if (!timeInput) return '';
    try {
      const date = new Date(timeInput);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const roundedCorners = isMe
    ? isConsecutive ? 'rounded-2xl' : 'rounded-2xl rounded-tr-sm'
    : isConsecutive ? 'rounded-2xl' : 'rounded-2xl rounded-tl-sm';

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openActions = () => {
    if (isDeleted || isEditing || isSubmitting) return;
    setShowMenu(true);
  };

  const handleTouchStart = (e) => {
    if (isDeleted || isEditing) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      openActions();
    }, 450);
  };

  const handleTouchMove = (e) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.touches[0];
    if (Math.abs(touch.clientX - start.x) > 10 || Math.abs(touch.clientY - start.y) > 10) {
      clearLongPress();
    }
  };

  const handleTouchEnd = () => {
    clearLongPress();
    touchStartRef.current = null;
  };

  const handleContextMenu = (e) => {
    if (isDeleted || isEditing) return;
    e.preventDefault();
    openActions();
  };

  const actionButtons = !isDeleted && !isEditing && (
    <div
      className={`
        msg-action-btn
        absolute top-1 z-10
        ${isMe ? 'right-full mr-1' : 'left-full ml-1'}
        flex items-center gap-0.5
        transition-opacity duration-150
      `}
    >
      <button
        ref={reactionBtnRef}
        type="button"
        onClick={() => setShowReactionPicker((open) => !open)}
        disabled={isSubmitting}
        aria-label="React with emoji"
        data-open={showReactionPicker ? 'true' : 'false'}
        className="
          h-6 w-6 rounded-md
          flex items-center justify-center
          text-app-muted hover:text-app-text hover:bg-app-surface
          cursor-pointer transition-colors duration-150
        "
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>

      <button
        ref={menuBtnRef}
        type="button"
        onClick={() => setShowMenu((open) => !open)}
        disabled={isSubmitting}
        aria-label="Message options"
        data-open={showMenu ? 'true' : 'false'}
        className="
          h-6 w-6 rounded-md
          flex items-center justify-center
          text-app-muted hover:text-app-text hover:bg-app-surface
          cursor-pointer transition-colors duration-150
        "
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className={`
      flex w-full animate-fade-in group/row relative px-7
      ${isMe ? 'justify-end' : 'justify-start'}
      ${isConsecutive ? 'mb-0.5 mt-0' : 'mb-3 mt-1.5'}
    `}>
      <div
        className={`
          relative
          max-w-[min(85%,28rem)] sm:max-w-[min(72%,32rem)] lg:max-w-[min(62%,36rem)]
          [-webkit-touch-callout:none]
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {actionButtons}

        <div
          className={`
            px-3.5 py-2 text-[13.5px]
            ${roundedCorners}
            ${isDeleted
              ? 'bg-app-incoming text-app-muted border border-app-border'
              : isMe
                ? 'bg-app-outgoing text-white'
                : 'bg-app-incoming text-app-text border border-app-border/80'
            }
          `}
        >
          <ReactionPicker
            open={showReactionPicker}
            onClose={() => setShowReactionPicker(false)}
            onSelect={handleSelectReaction}
            anchorRef={reactionBtnRef}
            currentReaction={myReaction}
            align={isMe ? 'right' : 'left'}
          />

          <DropdownMenu
            open={showMenu}
            onClose={() => setShowMenu(false)}
            anchorRef={menuBtnRef}
            align={isMe ? 'left' : 'right'}
            width={200}
          >
            <MenuItem onClick={() => { setShowMenu(false); setShowReactionPicker(true); }}>
              <svg className="w-4 h-4 text-app-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              React with emoji
            </MenuItem>
            {isMe && isWithin30Mins && (
              <MenuItem onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                <svg className="w-4 h-4 text-app-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit message
              </MenuItem>
            )}
            {isMe && isWithin30Mins && (
              <MenuItem
                danger
                onClick={() => {
                  setShowMenu(false);
                  setConfirm('everyone');
                }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete for everyone
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setShowMenu(false);
                setConfirm('me');
              }}
            >
              <svg className="w-4 h-4 text-app-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Delete for me
            </MenuItem>
          </DropdownMenu>

          {isEditing ? (
            <div className="space-y-2 py-0.5 min-w-[12rem]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                autoFocus
                className="
                  w-full p-2 text-sm rounded-lg
                  bg-white text-slate-900
                  border border-white/40
                  outline-none resize-none
                "
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditText(content); }}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting || !editText.trim()}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white text-teal-800 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <MessageContent text={content} isMe={isMe} isDeleted={isDeleted} />
          )}

          <div
            className={`
              text-[10px] mt-1 flex items-center justify-end gap-1.5 select-none font-medium
              ${isMe ? 'text-white/65' : 'text-app-muted'}
            `}
          >
            {isEdited && !isDeleted && (
              <span className="italic font-normal opacity-80">edited</span>
            )}
            <span className="tabular-nums">{formatTime(timestamp)}</span>
            {isMe && !isDeleted && (
              <span className="flex items-center shrink-0">
                <StatusIcon status={message.status} />
              </span>
            )}
          </div>
        </div>

        {/* Reaction badges */}
        {reactionGroups.length > 0 && !isDeleted && (
          <div className={`
            flex flex-wrap items-center gap-1 mt-1 select-none
            ${isMe ? 'justify-end' : 'justify-start'}
          `}>
            {reactionGroups.map((group) => {
              const userTooltip = group.users.join(', ');
              return (
                <button
                  key={group.emoji}
                  type="button"
                  onClick={() => handleBadgeClick(group)}
                  title={userTooltip}
                  aria-label={`${group.emoji} reacted by ${userTooltip}`}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                    transition-all duration-150 cursor-pointer border
                    hover:scale-105 active:scale-95 shadow-2xs
                    ${group.hasReacted
                      ? 'bg-app-primary/15 border-app-primary/40 text-app-primary font-medium dark:bg-app-primary/25'
                      : 'bg-app-surface border-app-border text-app-text hover:border-app-border/80'
                    }
                  `}
                >
                  <span className="text-[13px] leading-none">{group.emoji}</span>
                  {group.count > 1 && (
                    <span className="text-[10.5px] font-semibold tabular-nums leading-none">
                      {group.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirm === 'everyone'}
        title="Delete this message for everyone?"
        description="The message will be removed for all participants in this conversation."
        confirmLabel="Delete for everyone"
        onConfirm={() => { setConfirm(null); handleDeleteEveryone(); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'me'}
        title="Delete this message for you?"
        description="It will be removed from your view only. Others will still see it."
        confirmLabel="Delete for me"
        onConfirm={() => { setConfirm(null); handleDeleteMe(); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isMe === nextProps.isMe &&
    prevProps.isConsecutive === nextProps.isConsecutive &&
    prevProps.chatUserId === nextProps.chatUserId &&
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.edited === nextProps.message.edited &&
    prevProps.message.isEdited === nextProps.message.isEdited &&
    prevProps.message.isDeletedForEveryone === nextProps.message.isDeletedForEveryone &&
    prevProps.message.deletedForEveryOne === nextProps.message.deletedForEveryOne &&
    prevProps.message.reactions === nextProps.message.reactions;
});

export default MessageBubble;

