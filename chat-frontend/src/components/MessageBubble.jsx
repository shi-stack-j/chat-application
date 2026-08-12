import { useState, useRef, useEffect, memo } from 'react';
import useChat from '../hooks/useChat';
import toastHelper from '../utils/toastHelper';

/**
 * REUSABLE MESSAGE BUBBLE COMPONENT
 * 
 * Renders individual messages with support for:
 * - Real-time status indicators (Sent, Delivered, Read)
 * - Edited badge and inline message editing (within 30 mins)
 * - Deleted-for-everyone state ("This message was deleted.")
 * - Per-user soft deletion (Delete for me)
 */
export const MessageBubble = memo(({ message, isMe, isConsecutive = false, chatUserId }) => {
  console.log("Message is :- ",message);
  const { content, timestamp } = message;
  const messageId = message.messageId || message.id;
  const { conversationList, editMessage, deleteForEveryone, deleteForMe } = useChat();
  console.log("Message ID is :- ",messageId," mid :- ",message.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content || '');
  const [showMenu, setShowMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef(null);

  // Sync edit text if message content changes externally
  useEffect(() => {
    setEditText(content || '');
  }, [content]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Determine if message is deleted for everyone
  const isDeleted = message.isDeletedForEveryone || message.deletedForEveryOne || content === 'This message was deleted.';
  // Determine if message is edited
  const isEdited = message.isEdited || message.edited || message.editedAt;

  // Check 30-minute window for edit/delete actions
  const isWithin30Mins = timestamp
    ? (new Date().getTime() - new Date(timestamp).getTime()) <= 30 * 60 * 1000
    : true;

  // Resolve numeric conversationId from conversationList
  const resolveConversationId = () => {
    if (message.conversationId) return message.conversationId;
    const targetUser = chatUserId || (isMe ? message.receiverId : message.senderId);
    if (!targetUser) return null;
    const conv = conversationList.find(
      (c) => c.receiver?.userId?.toLowerCase() === targetUser.toLowerCase()
    );
    return conv?.conversationId || null;
  };

  // Handler: Submit Edit
  const handleSaveEdit = async () => {
    console.log("Making call to edite the message with id :- ",messageId);
    console.log("Message content is :- ",content);

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
    console.log("Conversation ID for edit is after resolving :- ",conversationId);
    console.log("MEssage id after resolving is :- ",messageId);
    if (!conversationId || !messageId) {
      toastHelper.error('Unable to resolve conversation for edit.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(`Attempting to edit message ID ${messageId} in conversation ${conversationId} with new content: ${cleanText}`);
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

  // Handler: Delete for Everyone
  const handleDeleteEveryone = async () => {
    if (!window.confirm('Delete this message for everyone?')) return;
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

  // Handler: Delete for Me
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

  // Formats timestamps into readable hh:mm AM/PM format
  const formatTime = (timeInput) => {
    if (!timeInput) return '';
    try {
      const date = new Date(timeInput);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Determine rounded corner classes based on sender and groupings
  const roundedCorners = isMe
    ? isConsecutive ? 'rounded-2xl' : 'rounded-2xl rounded-tr-none'
    : isConsecutive ? 'rounded-2xl' : 'rounded-2xl rounded-tl-none';

  return (
    <div className={`
      flex w-full animate-fade-in group/row relative
      ${isMe ? 'justify-end' : 'justify-start'}
      ${isConsecutive ? 'mb-1 mt-0.5' : 'mb-3.5 mt-2'}
    `}>
      <div
        className={`
          max-w-[85%] sm:max-w-[68%] md:max-w-[62%] px-4 py-2.5 text-sm relative group shadow-xs transition-all duration-200
          ${roundedCorners}
          ${isDeleted
            ? 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/50 italic'
            : isMe
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-indigo-800 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/40 dark:border-slate-700/40 shadow-xs'
          }
        `}
      >
        {/* Action dropdown menu trigger button (visible on bubble hover) */}
        {!isDeleted && !isEditing && (
          <div className={`
            absolute top-1.5 ${isMe ? 'left-1.5' : 'right-1.5'}
            opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 z-10
          `} ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={isSubmitting}
              className={`
                p-1 rounded-lg cursor-pointer transition-colors
                ${isMe ? 'hover:bg-white/20 text-white/80' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'}
              `}
              title="Message options"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Popup options dropdown menu */}
            {showMenu && (
              <div className={`
                absolute top-6 ${isMe ? 'left-0' : 'right-0'}
                w-44 py-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
                border border-slate-200 dark:border-slate-800 text-xs font-medium z-50 select-none
                animate-pop-in
              `}>
                {isMe && isWithin30Mins && (
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Message
                  </button>
                )}

                {isMe && isWithin30Mins && (
                  <button
                    onClick={handleDeleteEveryone}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a3 3 0 003 3h10M9 3h6m2 4H7" />
                    </svg>
                    Delete for Everyone
                  </button>
                )}

                <button
                  onClick={handleDeleteMe}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Delete for Me
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inline Message Edit Interface */}
        {isEditing ? (
          <div className="space-y-2 py-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              autoFocus
              className="
                w-full p-2 text-xs rounded-xl
                bg-white/90 dark:bg-slate-900/90
                text-slate-900 dark:text-slate-100
                border border-indigo-300 dark:border-indigo-700
                focus:outline-hidden resize-none
              "
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setIsEditing(false); setEditText(content); }}
                disabled={isSubmitting}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editText.trim()}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          /* Normal / Deleted Message Content */
          <p className="break-words leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}

        {/* Bubble footer: timestamp, edited badge, and status ticks */}
        <div
          className={`
            text-[10px] mt-1.5 flex items-center justify-end gap-1.5 select-none font-medium
            ${isMe ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          {isEdited && !isDeleted && (
            <span className="italic font-normal opacity-80">(edited)</span>
          )}

          <span>{formatTime(timestamp)}</span>

          {/* Visual checkmark(s) / sending clock indicator for sender feedback */}
          {isMe && !isDeleted && (
            <span className="flex items-center shrink-0">
              {!message.status || String(message.status).toUpperCase() === 'PENDING' ? (
                <svg className="w-3 h-3 text-white/60 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Sending...">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
              ) : String(message.status).toUpperCase() === 'READ' ? (
                <svg className="w-[17px] h-[17px] text-[#53BDEB]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Read">
                  <path d="M4 12.5l3.5 3.5 8-8 M9 12.5l3.5 3.5 8-8" />
                </svg>
              ) : String(message.status).toUpperCase() === 'DELIVERED' ? (
                <svg className="w-[17px] h-[17px] text-white/90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Delivered">
                  <path d="M4 12.5l3.5 3.5 8-8 M9 12.5l3.5 3.5 8-8" />
                </svg>
              ) : String(message.status).toUpperCase() === 'SENT' || String(message.status).toUpperCase() === 'BLOCKED' ? (
                <svg className="w-[17px] h-[17px] text-white/60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" title="Sent">
                  <path d="M5 12.5l3.5 3.5 8-8" />
                </svg>
              ) : null}
            </span>
          )}
        </div>

      </div>
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
    prevProps.message.deletedForEveryOne === nextProps.message.deletedForEveryOne;
});

export default MessageBubble;
