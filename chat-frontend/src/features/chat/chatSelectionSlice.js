import { createSlice } from '@reduxjs/toolkit';

/**
 * CHAT SELECTION SLICE
 * 
 * Why this slice exists:
 * - This slice manages UI states related to chat coordination:
 *   1. Which chat is currently open (`selectedChatUserId`).
 *   2. Unread notification counters for offline/inactive chats.
 *   3. A list of active/online user IDs.
 *   4. Sidebar search filtering text.
 * 
 * Why store this in Redux:
 * - Changing the active chat should instantly refresh multiple layouts (close mobile sidebar drawers, update header details, scroll lists).
 * - Receiving a "user online" websocket message should instantly trigger updates in the directory, user listing, and active status bubbles.
 * - This contains high-level routing/visual metadata, while the Context API stores the actual heavy message lists.
 */

const initialState = {
  selectedChatUserId: null, // ID of the user we are currently chatting with
  unreadCounts: {}, // Map of { [userId]: count } to show unread badges
  onlineUsers: [], // Array of online user IDs (populated from REST/WebSockets later)
  searchQuery: '', // Query used in sidebar to filter active chats
};

const chatSelectionSlice = createSlice({
  name: 'chatSelection',
  initialState,
  reducers: {
    /**
     * Sets the current active chat user ID.
     * Automatically clears any unread counts for that user.
     * @param {Object} state 
     * @param {Object} action - Action payload containing the target userId
     */
    setSelectedChat: (state, action) => {
      state.selectedChatUserId = action.payload;
      if (action.payload) {
        state.unreadCounts[action.payload] = 0; // Clear unread counters upon opening
      }
    },
    /**
     * Clears selection (resets to empty state).
     * @param {Object} state 
     */
    clearSelectedChat: (state) => {
      state.selectedChatUserId = null;
    },
    /**
     * Increments the unread message counter for a specific user.
     * Typically dispatched when a WebSocket message is received from someone other than the selectedChatUserId.
     * @param {Object} state 
     * @param {Object} action - Action payload containing the sender's userId
     */
    incrementUnread: (state, action) => {
      const userId = action.payload;
      // Do not increment if we are already reading this conversation
      if (state.selectedChatUserId === userId) {
        return;
      }
      state.unreadCounts[userId] = (state.unreadCounts[userId] || 0) + 1;
    },
    /**
     * Manually resets the unread count for a user conversation.
     * @param {Object} state 
     * @param {Object} action - Action payload containing the userId
     */
    resetUnread: (state, action) => {
      state.unreadCounts[action.payload] = 0;
    },
    /**
     * Updates the full list of online users.
     * Typically dispatched upon initial WebSocket connection or periodically.
     * @param {Object} state 
     * @param {Object} action - Array of online user IDs
     */
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    /**
     * Adds a single user ID to the online list (e.g. user joined event).
     * @param {Object} state 
     * @param {Object} action - User ID
     */
    addOnlineUser: (state, action) => {
      const userId = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    /**
     * Removes a single user ID from the online list (e.g. user left event).
     * @param {Object} state 
     * @param {Object} action - User ID
     */
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    /**
     * Updates the text search query in the sidebar.
     * @param {Object} state 
     * @param {Object} action - Search string
     */
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setSelectedChat,
  clearSelectedChat,
  incrementUnread,
  resetUnread,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setSearchQuery
} = chatSelectionSlice.actions;

// Selectors
export const selectSelectedChatUserId = (state) => state.chatSelection.selectedChatUserId;
export const selectUnreadCounts = (state) => state.chatSelection.unreadCounts;
export const selectOnlineUsers = (state) => state.chatSelection.onlineUsers;
export const selectSearchQuery = (state) => state.chatSelection.searchQuery;

export default chatSelectionSlice.reducer;
