import { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUserId } from '../features/auth/authSlice';
import { selectActivePagination } from '../features/chat/chatSlice';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import UserAvatar from './UserAvatar';

const NEAR_BOTTOM_PX = 80;

const formatDateLabel = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch {
    return '';
  }
};

const isNearBottom = (el) =>
  el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;

export const MessageList = ({ messages = [], chatUserId, isPeerTyping = false }) => {
  const currentUserId = useSelector(selectCurrentUserId);
  const activePagination = useSelector(selectActivePagination);

  const { fetchOlderMessages } = useChat();

  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    isInitialLoadRef.current = true;
    isPrependingRef.current = false;
    stickToBottomRef.current = true;
  }, [chatUserId]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    if (!isPrependingRef.current) {
      stickToBottomRef.current = isNearBottom(el);
    }

    if (
      el.scrollTop <= 100 &&
      activePagination?.hasMore &&
      !activePagination?.loadingOlder &&
      !isPrependingRef.current
    ) {
      prevScrollHeightRef.current = el.scrollHeight;
      isPrependingRef.current = true;
      fetchOlderMessages(chatUserId)
        .then((res) => {
          if (!res || res.count === 0) {
            isPrependingRef.current = false;
          }
        })
        .catch(() => {
          isPrependingRef.current = false;
        });
    }
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isPrependingRef.current) {
      const newScrollHeight = el.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      if (heightDiff > 0) {
        el.scrollTop += heightDiff;
      }
      isPrependingRef.current = false;
      return;
    }

    if (isInitialLoadRef.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
      isInitialLoadRef.current = false;
      return;
    }

    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, chatUserId, isPeerTyping]);

  const chatElements = useMemo(() => {
    const elements = [];
    let lastDateString = null;

    messages.forEach((msg, idx) => {
      if (!msg.timestamp) return;

      const dateObj = new Date(msg.timestamp);
      const dateString = dateObj.toDateString();

      if (dateString !== lastDateString) {
        elements.push({
          type: 'separator',
          id: `sep-${msg.id || msg.timestamp}`,
          label: formatDateLabel(msg.timestamp)
        });
        lastDateString = dateString;
      }

      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const isConsecutive = prevMsg &&
        prevMsg.senderId === msg.senderId &&
        (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) < 120000;

      elements.push({
        type: 'message',
        id: msg.id || `${msg.senderId}-${msg.timestamp}-${idx}`,
        data: msg,
        isConsecutive
      });
    });

    return elements;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-5 py-4 chat-canvas select-text scrollbar-none overscroll-contain"
    >
      {activePagination?.loadingOlder && (
        <div className="flex items-center justify-center py-2 select-none animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-app-muted bg-app-surface px-3 py-1.5 rounded-full border border-app-border">
            <svg className="animate-spin h-3.5 w-3.5 text-app-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading earlier messages…</span>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
          <UserAvatar userId={chatUserId} size="xl" className="mb-4" />
          <h4 className="font-semibold text-app-text mb-1">
            Start a conversation with {chatUserId}
          </h4>
          <p className="text-sm text-app-muted max-w-xs leading-relaxed">
            Messages you send will appear here. Say hello to get things started.
          </p>
        </div>
      ) : (
        chatElements.map((el) => {
          if (el.type === 'separator') {
            return (
              <div
                key={el.id}
                className="flex items-center justify-center my-5 select-none animate-fade-in"
              >
                <span className="text-[11px] font-semibold tracking-wide text-app-muted bg-app-surface/90 px-3 py-1 rounded-full border border-app-border">
                  {el.label}
                </span>
              </div>
            );
          }

          const isMe = el.data.senderId === currentUserId;
          return (
            <MessageBubble
              key={el.id}
              message={el.data}
              isMe={isMe}
              isConsecutive={el.isConsecutive}
              chatUserId={chatUserId}
            />
          );
        })
      )}
    </div>
  );
};

export default MessageList;
