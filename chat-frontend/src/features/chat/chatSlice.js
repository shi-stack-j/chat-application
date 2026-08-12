import { createSlice } from '@reduxjs/toolkit';

/**
 * CHAT & MESSAGING SLICE (chatStore)
 * 
 * Manages:
 * - List of conversations summaries (conversations).
 * - Active chat selection (selectedChatUserId).
 * - Cache of messages grouped by conversationId (messages).
 * - Unread counters map (unreadCounts).
 * - Online users directory (onlineUsers).
 * - Filter query for filtering conversations (searchQuery).
 * - Async loading flags.
 */

const initialState = {
  conversations: [], // Array of ConversationSummary
  selectedChatUserId: null, // userId of active partner
  messages: {}, // Keyed by conversationId (number) or chatUserId (string) -> Array of ChatMessage
  unreadCounts: {}, // Keyed by chatUserId -> count
  totalUnreadCount: 0, // Overall unread count across all conversations
  onlineUsers: [], // Array of online userIds
  typingUsers: {}, // Keyed by chatUserId -> boolean
  blockedUsers: [], // Array of blocked userIds
  searchQuery: '',
  loadingConversations: false,
  loadingMessages: false,
  pagination: {} // Keyed by conversationId or chatUserId -> { page: 0, hasMore: true, loadingOlder: false }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setTotalUnreadCount: (state, action) => {
      state.totalUnreadCount = action.payload || 0;
    },
    setSelectedChat: (state, action) => {
      state.selectedChatUserId = action.payload;
      if (action.payload) {
        state.unreadCounts[action.payload] = 0;
        
        // Reset unread count in conversations summary list
        const conv = state.conversations.find(
          (c) => c.receiver.userId.toLowerCase() === action.payload.toLowerCase()
        );
        if (conv) {
          conv.unreadCount = 0;
        }
      }
    },
    clearSelectedChat: (state) => {
      state.selectedChatUserId = null;
    },
    setMessages: (state, action) => {
      const { key, messages } = action.payload; // key: conversationId or chatUserId
      state.messages[key] = messages;
    },
    addMessage: (state, action) => {
      const { key, message, force } = action.payload; // key: conversationId or chatUserId
      const shouldForce = force !== false;

      if (!state.messages[key]) {
        if (shouldForce) {
          state.messages[key] = [];
        } else {
          return;
        }
      }
      
      const msgId = String(message.id || message.messageId || '');
      const tempId = String(message.tempMessageId || '');

      const existingIndex = state.messages[key].findIndex((m) => {
        const mId = String(m.id || m.messageId || '');
        const mTempId = String(m.tempMessageId || '');
        return (msgId && mId === msgId) || (tempId && mTempId === tempId);
      });

      if (existingIndex !== -1) {
        const existingMsg = state.messages[key][existingIndex];
        // Terminal status check: BLOCKED messages must never lose BLOCKED status
        const finalStatus = (existingMsg.status === 'BLOCKED' || message.status === 'BLOCKED') 
          ? 'BLOCKED' 
          : (message.status || existingMsg.status);

        state.messages[key][existingIndex] = {
          ...existingMsg,
          ...message,
          status: finalStatus
        };
      } else {
        state.messages[key].push(message);
      }
    },
    clearConversation: (state, action) => {
      const chatUserId = action.payload;
      delete state.messages[chatUserId];
      
      const conv = state.conversations.find(
        (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
      );
      if (conv) {
        if (conv.conversationId) {
          delete state.messages[conv.conversationId];
        }
        conv.lastMessage = null;
        conv.lastMessageTime = null;
      }
    },
    removeConversation: (state, action) => {
      const chatUserId = action.payload;
      const conv = state.conversations.find(
        (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
      );
      
      state.conversations = state.conversations.filter(
        (c) => c.receiver.userId.toLowerCase() !== chatUserId.toLowerCase()
      );
      
      delete state.messages[chatUserId];
      if (conv && conv.conversationId) {
        delete state.messages[conv.conversationId];
      }
      
      if (state.selectedChatUserId === chatUserId) {
        state.selectedChatUserId = null;
      }
    },
    incrementUnread: (state, action) => {
      const chatUserId = action.payload;
      if (state.selectedChatUserId === chatUserId) {
        return;
      }
      state.unreadCounts[chatUserId] = (state.unreadCounts[chatUserId] || 0) + 1;
      
      const conv = state.conversations.find(
        (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
      );
      if (conv) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    },
    resetUnread: (state, action) => {
      const chatUserId = action.payload;
      state.unreadCounts[chatUserId] = 0;
      
      const conv = state.conversations.find(
        (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
      );
      if (conv) {
        conv.unreadCount = 0;
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      const userId = action.payload;
      if (!userId) return;
      const isBlocked = (state.blockedUsers || []).some(
        (id) => id.toLowerCase() === userId.toLowerCase()
      );
      if (isBlocked) return;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setLoadingConversations: (state, action) => {
      state.loadingConversations = action.payload;
    },
    setLoadingMessages: (state, action) => {
      state.loadingMessages = action.payload;
    },
    setPaginationInfo: (state, action) => {
      const { key, conversationId, chatUserId, page, hasMore, loadingOlder } = action.payload;
      const keys = [];
      if (key) keys.push(key);
      if (conversationId) keys.push(conversationId);
      if (chatUserId) keys.push(chatUserId);
      if (conversationId && !chatUserId) {
        const conv = state.conversations.find((c) => c.conversationId === conversationId);
        if (conv) keys.push(conv.receiver.userId);
      }
      const uniqueKeys = Array.from(new Set(keys));

      uniqueKeys.forEach((k) => {
        const current = state.pagination[k] || { page: 0, hasMore: true, loadingOlder: false };
        state.pagination[k] = {
          page: page !== undefined ? page : current.page,
          hasMore: hasMore !== undefined ? hasMore : current.hasMore,
          loadingOlder: loadingOlder !== undefined ? loadingOlder : current.loadingOlder
        };
      });
    },
    setLoadingOlderMessages: (state, action) => {
      const { conversationId, chatUserId, loading } = action.payload;
      const keys = [];
      if (conversationId) keys.push(conversationId);
      if (chatUserId) keys.push(chatUserId);
      if (conversationId && !chatUserId) {
        const conv = state.conversations.find((c) => c.conversationId === conversationId);
        if (conv) keys.push(conv.receiver.userId);
      }
      const uniqueKeys = Array.from(new Set(keys));
      uniqueKeys.forEach((key) => {
        const current = state.pagination[key] || { page: 0, hasMore: true, loadingOlder: false };
        state.pagination[key] = { ...current, loadingOlder: loading };
      });
    },
    prependMessages: (state, action) => {
      const { conversationId, chatUserId, messages, page, hasMore } = action.payload;
      const keys = [];
      if (conversationId) keys.push(conversationId);
      if (chatUserId) keys.push(chatUserId);

      if (conversationId && !chatUserId) {
        const conv = state.conversations.find((c) => c.conversationId === conversationId);
        if (conv) keys.push(conv.receiver.userId);
      }

      const uniqueKeys = Array.from(new Set(keys));

      uniqueKeys.forEach((key) => {
        const currentList = state.messages[key] || [];
        const existingIds = new Set();
        currentList.forEach((m) => {
          if (m.id) existingIds.add(String(m.id));
          if (m.messageId) existingIds.add(String(m.messageId));
          if (m.tempMessageId) existingIds.add(String(m.tempMessageId));
        });

        const newUnique = messages.filter((m) => {
          const id = String(m.id || '');
          const msgId = String(m.messageId || '');
          const tempId = String(m.tempMessageId || '');
          return !existingIds.has(id) && (!msgId || !existingIds.has(msgId)) && (!tempId || !existingIds.has(tempId));
        });

        state.messages[key] = [...newUnique, ...currentList];

        const currentPag = state.pagination[key] || { page: 0, hasMore: true, loadingOlder: false };
        state.pagination[key] = {
          page: page !== undefined ? page : currentPag.page,
          hasMore: hasMore !== undefined ? hasMore : currentPag.hasMore,
          loadingOlder: false
        };
      });
    },
    updateConversationSummary: (state, action) => {
      const { chatUserId, content, timestamp, incrementUnread, conversationId } = action.payload;
      let found = false;
      
      state.conversations = state.conversations.map((c) => {
        if (c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()) {
          found = true;
          return {
            ...c,
            conversationId: c.conversationId || conversationId || null,
            lastMessage: content,
            lastMessageTime: timestamp,
            unreadCount: (incrementUnread && state.selectedChatUserId !== chatUserId) 
              ? (c.unreadCount || 0) + 1 
              : c.unreadCount
          };
        }
        return c;
      });

      if (!found) {
        const newSummary = {
          conversationId: conversationId || null,
          receiver: {
            userId: chatUserId,
            nickName: chatUserId,
            avatarUrl: null,
            isOnline: true
          },
          lastMessage: content,
          lastMessageTime: timestamp,
          unreadCount: (incrementUnread && state.selectedChatUserId !== chatUserId) ? 1 : 0
        };
        state.conversations.push(newSummary);
      }

      // Sort by lastMessageTime descending (most recent first)
      state.conversations.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    },
    updateUserPresence: (state, action) => {
      const { userId, online } = action.payload;
      const targetId = userId;
      if (!targetId) return;

      const isBlocked = (state.blockedUsers || []).some(
        (id) => id.toLowerCase() === targetId.toLowerCase()
      );
      const conv = state.conversations.find(
        (c) => c.receiver.userId.toLowerCase() === targetId.toLowerCase()
      );
      const isConvBlocked = conv && (conv.isOtherUserBlocked || conv.otherUserBlocked);

      const effectiveOnline = (isBlocked || isConvBlocked) ? false : online;

      const exists = state.onlineUsers.some(
        (id) => id.toLowerCase() === targetId.toLowerCase()
      );

      if (effectiveOnline) {
        if (!exists) {
          state.onlineUsers.push(targetId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter(
          (id) => id.toLowerCase() !== targetId.toLowerCase()
        );
      }

      state.conversations = state.conversations.map((c) => {
        if (c.receiver.userId.toLowerCase() === targetId.toLowerCase()) {
          return {
            ...c,
            receiver: {
              ...c.receiver,
              isOnline: effectiveOnline
            }
          };
        }
        return c;
      });
    },
    setTypingStatus: (state, action) => {
      const { userId, typing } = action.payload;
      state.typingUsers[userId.toLowerCase()] = typing;
    },
    updateMessageStatus: (state, action) => {
      const { conversationId, status, currentUserId } = action.payload;
      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      const keys = [conversationId];
      if (conv) {
        keys.push(conv.receiver.userId);
      }
      keys.forEach((key) => {
        if (state.messages[key]) {
          state.messages[key] = state.messages[key].map((msg) => {
            const isMe = msg.senderId.toLowerCase() === currentUserId.toLowerCase();
            if (isMe) {
              // Terminal status check: BLOCKED message status must never be overwritten
              if (msg.status === 'BLOCKED') {
                return msg;
              }
              if (status === 'READ') {
                return { ...msg, status: 'READ' };
              }
              if (status === 'DELIVERED' && msg.status !== 'READ') {
                return { ...msg, status: 'DELIVERED' };
              }
            }
            return msg;
          });
        }
      });
    },
    updateSingleMessageStatus: (state, action) => {
      const { conversationId, messageId, status, currentUserId } = action.payload;
      if (!conversationId) return;

      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      const keys = [conversationId];
      if (conv) {
        keys.push(conv.receiver.userId);
      }

      keys.forEach((key) => {
        const messageList = state.messages[key];
        if (messageList) {
          let targetIndex = messageList.findIndex((msg) => String(msg.id) === String(messageId));

          if (targetIndex === -1) {
            targetIndex = messageList.findIndex((msg) => {
              const isMe = msg.senderId.toLowerCase() === currentUserId.toLowerCase();
              const isTempId = typeof msg.id === 'string' && isNaN(Number(msg.id));
              return isMe && isTempId && msg.status !== 'READ' && msg.status !== 'DELIVERED' && msg.status !== 'BLOCKED';
            });
          }

          if (targetIndex !== -1) {
            const updatedMessages = [...messageList];
            const msgToUpdate = updatedMessages[targetIndex];

            // Terminal status check: BLOCKED message status must never be overwritten
            if (msgToUpdate.status === 'BLOCKED') {
              return;
            }

            updatedMessages[targetIndex] = {
              ...msgToUpdate,
              id: messageId,
              status: status
            };

            state.messages[key] = updatedMessages;
          }
        }
      });
    },
    handleSentAck: (state, action) => {
      const { messageTempId, messageId, messageStatus, conversationId } = action.payload;
      if (!messageTempId) return;

      Object.keys(state.messages).forEach((key) => {
        const messageList = state.messages[key];
        if (messageList) {
          const targetIndex = messageList.findIndex(
            (msg) => String(msg.tempMessageId || msg.id) === String(messageTempId)
          );

          if (targetIndex !== -1) {
            const msgToUpdate = messageList[targetIndex];

            // Determine status: BLOCKED is terminal; NEVER overwrite DELIVERED or READ with SENT
            let statusToApply = messageStatus;
            if (msgToUpdate.status === 'BLOCKED' || messageStatus === 'BLOCKED') {
              statusToApply = 'BLOCKED';
            } else if (msgToUpdate.status === 'READ') {
              statusToApply = 'READ';
            } else if (msgToUpdate.status === 'DELIVERED' && messageStatus === 'SENT') {
              statusToApply = 'DELIVERED';
            }

            const updatedMsg = {
              ...msgToUpdate,
              id: messageId,
              messageId: messageId,
              tempMessageId: messageTempId,
              conversationId: conversationId || msgToUpdate.conversationId,
              status: statusToApply
            };

            messageList[targetIndex] = updatedMsg;
          }
        }
      });

      if (conversationId) {
        state.conversations = state.conversations.map((c) => {
          if (!c.conversationId && c.receiver) {
            const key = c.receiver.userId;
            const msgs = state.messages[key];
            if (msgs && msgs.some((m) => String(m.id) === String(messageId))) {
              return { ...c, conversationId };
            }
          }
          return c;
        });

        const conv = state.conversations.find((c) => c.conversationId === conversationId);
        if (conv) {
          const userKey = conv.receiver.userId;
          if (state.messages[userKey] && !state.messages[conversationId]) {
            state.messages[conversationId] = state.messages[userKey];
          }
        }
      }
    },
    updateEditedMessage: (state, action) => {
      const { conversationId, messageId, content } = action.payload;
      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      const keys = [conversationId];
      if (conv) {
        keys.push(conv.receiver.userId);
      }
      keys.forEach((key) => {
        if (state.messages[key]) {
          state.messages[key] = state.messages[key].map((msg) => {
            if (String(msg.id) === String(messageId) || String(msg.messageId) === String(messageId)) {
              return {
                ...msg,
                content,
                isEdited: true,
                edited: true
              };
            }
            return msg;
          });
        }
      });
      if (conv) {
        const messageList = state.messages[conversationId] || state.messages[conv.receiver.userId];
        if (messageList && messageList.length > 0) {
          const lastMsg = messageList[messageList.length - 1];
          if (String(lastMsg.id) === String(messageId) || String(lastMsg.messageId) === String(messageId)) {
            conv.lastMessage = content;
          }
        }
      }
    },
    updateDeletedMessage: (state, action) => {
      const { conversationId, messageId, content = "This message was deleted." } = action.payload;
      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      const keys = [conversationId];
      if (conv) {
        keys.push(conv.receiver.userId);
      }
      keys.forEach((key) => {
        if (state.messages[key]) {
          state.messages[key] = state.messages[key].map((msg) => {
            if (String(msg.id) === String(messageId) || String(msg.messageId) === String(messageId)) {
              return {
                ...msg,
                content,
                isDeletedForEveryone: true,
                deletedForEveryOne: true
              };
            }
            return msg;
          });
        }
      });
      if (conv) {
        const messageList = state.messages[conversationId] || state.messages[conv.receiver.userId];
        if (messageList && messageList.length > 0) {
          const lastMsg = messageList[messageList.length - 1];
          if (String(lastMsg.id) === String(messageId) || String(lastMsg.messageId) === String(messageId)) {
            conv.lastMessage = content;
          }
        }
      }
    },
    deleteMessagesForMe: (state, action) => {
      const { conversationId, messageIds, chatUserId } = action.payload;
      const idsSet = new Set((Array.isArray(messageIds) ? messageIds : [messageIds]).map(String));
      
      const keys = [];
      if (conversationId) keys.push(conversationId);
      if (chatUserId) keys.push(chatUserId);

      if (conversationId && !chatUserId) {
        const conv = state.conversations.find((c) => c.conversationId === conversationId);
        if (conv) keys.push(conv.receiver.userId);
      }

      keys.forEach((key) => {
        if (state.messages[key]) {
          state.messages[key] = state.messages[key].filter(
            (msg) => !idsSet.has(String(msg.id))
          );
        }
      });

      const conv = state.conversations.find(
        (c) => c.conversationId === conversationId || (chatUserId && c.receiver.userId.toLowerCase() === chatUserId.toLowerCase())
      );
      if (conv) {
        const key = conv.conversationId || conv.receiver.userId;
        const remaining = state.messages[key];
        if (remaining && remaining.length > 0) {
          const lastMsg = remaining[remaining.length - 1];
          conv.lastMessage = lastMsg.content;
          conv.lastMessageTime = lastMsg.timestamp;
        } else if (remaining && remaining.length === 0) {
          conv.lastMessage = null;
          conv.lastMessageTime = null;
        }
      }
    },
    setBlockedUsers: (state, action) => {
      state.blockedUsers = action.payload || [];
    },
    addBlockedUser: (state, action) => {
      const userId = action.payload;
      if (userId && !state.blockedUsers.some((id) => id.toLowerCase() === userId.toLowerCase())) {
        state.blockedUsers.push(userId);
      }
    },
    removeBlockedUser: (state, action) => {
      const userId = action.payload;
      if (userId) {
        state.blockedUsers = state.blockedUsers.filter(
          (id) => id.toLowerCase() !== userId.toLowerCase()
        );
      }
    },
    resetChatState: (state) => {
      state.conversations = [];
      state.selectedChatUserId = null;
      state.messages = {};
      state.unreadCounts = {};
      state.onlineUsers = [];
      state.typingUsers = {};
      state.blockedUsers = [];
      state.searchQuery = '';
      state.loadingConversations = false;
      state.loadingMessages = false;
    }
  }
});

export const {
  setConversations,
  setTotalUnreadCount,
  setSelectedChat,
  clearSelectedChat,
  setMessages,
  addMessage,
  clearConversation,
  removeConversation,
  incrementUnread,
  resetUnread,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setBlockedUsers,
  addBlockedUser,
  removeBlockedUser,
  setSearchQuery,
  setLoadingConversations,
  setLoadingMessages,
  setPaginationInfo,
  setLoadingOlderMessages,
  prependMessages,
  updateConversationSummary,
  updateUserPresence,
  setTypingStatus,
  updateMessageStatus,
  updateSingleMessageStatus,
  handleSentAck,
  updateEditedMessage,
  updateDeletedMessage,
  deleteMessagesForMe,
  resetChatState
} = chatSlice.actions;

// Selectors
export const selectConversations = (state) => state.chat.conversations;
export const selectSelectedChatUserId = (state) => state.chat.selectedChatUserId;
export const selectAllMessages = (state) => state.chat.messages;
export const selectUnreadCounts = (state) => state.chat.unreadCounts;
export const selectTotalUnreadCount = (state) => state.chat.totalUnreadCount;
export const selectOnlineUsers = (state) => state.chat.onlineUsers;
export const selectTypingUsers = (state) => state.chat.typingUsers;
export const selectBlockedUsers = (state) => state.chat.blockedUsers || [];
export const selectSearchQuery = (state) => state.chat.searchQuery;
export const selectLoadingConversations = (state) => state.chat.loadingConversations;
export const selectLoadingMessages = (state) => state.chat.loadingMessages;

export const selectPaginationInfo = (state, key) => {
  if (!key) return { page: 0, hasMore: true, loadingOlder: false };
  return state.chat.pagination[key] || { page: 0, hasMore: true, loadingOlder: false };
};

export const selectActivePagination = (state) => {
  const activeUser = state.chat.selectedChatUserId;
  if (!activeUser) return { page: 0, hasMore: true, loadingOlder: false };
  const summary = state.chat.conversations.find(
    (c) => c.receiver.userId.toLowerCase() === activeUser.toLowerCase()
  );
  if (summary && summary.conversationId && state.chat.pagination[summary.conversationId]) {
    return state.chat.pagination[summary.conversationId];
  }
  return state.chat.pagination[activeUser] || { page: 0, hasMore: true, loadingOlder: false };
};

export const selectActiveMessages = (state) => {
  const activeUser = state.chat.selectedChatUserId;
  if (!activeUser) return [];
  
  // Find conversationId for active user
  const summary = state.chat.conversations.find(
    (c) => c.receiver.userId.toLowerCase() === activeUser.toLowerCase()
  );
  
  if (summary && summary.conversationId && state.chat.messages[summary.conversationId]) {
    return state.chat.messages[summary.conversationId];
  }
  
  // Fallback to activeUser string key for new/uncreated conversations
  return state.chat.messages[activeUser] || [];
};

export default chatSlice.reducer;
