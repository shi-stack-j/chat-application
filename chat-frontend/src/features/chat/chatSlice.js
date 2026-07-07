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
  onlineUsers: [], // Array of online userIds
  searchQuery: '',
  loadingConversations: false,
  loadingMessages: false
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
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
      
      // Deduplicate by message ID or fallback custom uniqueness check
      const exists = state.messages[key].some((m) => m.id === message.id);
      if (!exists) {
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
      
      const exists = state.onlineUsers.some(
        (id) => id.toLowerCase() === targetId.toLowerCase()
      );

      if (online) {
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
              isOnline: online
            }
          };
        }
        return c;
      });
    },
    resetChatState: (state) => {
      state.conversations = [];
      state.selectedChatUserId = null;
      state.messages = {};
      state.unreadCounts = {};
      state.onlineUsers = [];
      state.searchQuery = '';
      state.loadingConversations = false;
      state.loadingMessages = false;
    }
  }
});

export const {
  setConversations,
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
  setSearchQuery,
  setLoadingConversations,
  setLoadingMessages,
  updateConversationSummary,
  updateUserPresence,
  resetChatState
} = chatSlice.actions;

// Selectors
export const selectConversations = (state) => state.chat.conversations;
export const selectSelectedChatUserId = (state) => state.chat.selectedChatUserId;
export const selectAllMessages = (state) => state.chat.messages;
export const selectUnreadCounts = (state) => state.chat.unreadCounts;
export const selectOnlineUsers = (state) => state.chat.onlineUsers;
export const selectSearchQuery = (state) => state.chat.searchQuery;
export const selectLoadingConversations = (state) => state.chat.loadingConversations;
export const selectLoadingMessages = (state) => state.chat.loadingMessages;

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
