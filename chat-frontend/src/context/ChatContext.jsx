import { useState, useCallback, useMemo } from 'react';
import { ChatContext } from './ChatContextInstance';

/**
 * CHAT CONTEXT
 * 
 * Why Context API is used for messages instead of Redux:
 * 1. Performance and High-Frequency Dispatches:
 *    - In a real-time messaging app, messages arrive frequently (via WebSockets). Redux handles action dispatches globally.
 *      Dispatched actions run through all reducers and trigger updates down the complete Redux tree, which can cause frame drops and UI lags.
 *    - Context API allows us to isolate this high-frequency, rapid state change inside a specialized sub-tree, limiting unnecessary re-renders.
 * 2. Session-Only (Volatile) Lifecycle:
 *    - Per requirements, messages must exist *only* during the active browser session (no localStorage/IndexedDB/persistence).
 *      Context API is the idiomatic React solution for managing volatile, component-lifecycle-scoped states.
 * 3. Separation of Concerns:
 *    - Redux is kept clean and lightweight, managing only metadata (who is logged in, who is selected, who is online).
 *    - ChatContext manages the raw payload data (the logs of messages).
 */

export const ChatProvider = ({ children }) => {
  // conversations is structured as:
  // {
  //   "rahul": [ { id, senderId, receiverId, content, timestamp }, ... ],
  //   "aman": [ ... ]
  // }
  const [conversations, setConversations] = useState({});

  /**
   * Helper to ensure a conversation array exists for a specific user ID.
   * If it doesn't, we initialize it as an empty list.
   */
  const createConversation = useCallback((chatUserId) => {
    if (!chatUserId) return;
    setConversations((prev) => {
      if (prev[chatUserId]) return prev; // Already exists
      return {
        ...prev,
        [chatUserId]: [],
      };
    });
  }, []);

  /**
   * Adds a single message to a conversation.
   * Automatically creates the conversation container if it doesn't already exist.
   * 
   * PLACEHOLDER NOTE FOR BACKEND DEVELOPER:
   * When you implement your WebSocket / STOMP subscription on '/user/queue/messages',
   * you should dispatch new messages received from the server into this function:
   * 
   *    const onMessageReceived = (msg) => {
   *       const chatPartnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
   *       addMessage(chatPartnerId, msg);
   *       if (chatPartnerId !== selectedChatUserId) {
   *          dispatch(incrementUnread(chatPartnerId));
   *       }
   *    }
   */
  const addMessage = useCallback((chatUserId, message) => {
    if (!chatUserId || !message) return;
    setConversations((prev) => {
      const currentList = prev[chatUserId] || [];
      // Prevent duplicates by checking message ID
      if (currentList.some((m) => m.id === message.id)) {
        return prev;
      }
      return {
        ...prev,
        [chatUserId]: [...currentList, message],
      };
    });
  }, []);

  /**
   * Removes a conversation completely from the sidebar list and memory.
   */
  const removeConversation = useCallback((chatUserId) => {
    if (!chatUserId) return;
    setConversations((prev) => {
      const copy = { ...prev };
      delete copy[chatUserId];
      return copy;
    });
  }, []);

  /**
   * Clears the messages in a conversation without deleting the conversation key itself.
   */
  const clearConversation = useCallback((chatUserId) => {
    if (!chatUserId) return;
    setConversations((prev) => {
      if (!prev[chatUserId]) return prev;
      return {
        ...prev,
        [chatUserId]: [],
      };
    });
  }, []);

  /**
   * Helper to retrieve messages for a specific conversation.
   */
  const getConversation = useCallback((chatUserId) => {
    return conversations[chatUserId] || [];
  }, [conversations]);

  // Memoize value to avoid unnecessary downstream renders
  const contextValue = useMemo(() => ({
    conversations,
    addMessage,
    createConversation,
    removeConversation,
    clearConversation,
    getConversation,
  }), [conversations, addMessage, createConversation, removeConversation, clearConversation, getConversation]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
