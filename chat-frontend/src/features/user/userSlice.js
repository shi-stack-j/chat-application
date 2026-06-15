import { createSlice } from '@reduxjs/toolkit';

/**
 * USER SLICE
 * 
 * Why this slice exists:
 * - This slice manages the current user's profile and active session user ID.
 * - When a user logs in with their unique ID, we store it here.
 * - In a real-world app, this would also store OAuth tokens, profile pictures, and notification preferences.
 * 
 * Why store user info in Redux:
 * - The identity of the active user is needed by almost every page, route guard, layout (sidebar avatar), and message sender tag.
 * - Redux provides a reliable, read-only-from-outside, centralized state that triggers clean components updates.
 */

const initialState = {
  currentUserId: null,
  nickname: '',
  avatarUrl: null,
  status: 'online', // default status
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Sets the active user identity.
     * @param {Object} state 
     * @param {Object} action - Action payload containing currentUserId and optional nickname
     */
    setCurrentUser: (state, action) => {
      const { userId, nickname } = action.payload;
      state.currentUserId = userId;
      state.nickname = nickname || userId; // Default nickname to userId if not specified
      state.avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userId)}`; // Dynamic avatar URL based on seed
    },
    /**
     * Clears current user identity on sign out or disconnect.
     * @param {Object} state 
     */
    clearCurrentUser: (state) => {
      state.currentUserId = null;
      state.nickname = '';
      state.avatarUrl = null;
      state.status = 'offline';
    },
    /**
     * Updates profile settings, such as nickname or status.
     * @param {Object} state 
     * @param {Object} action 
     */
    updateProfile: (state, action) => {
      const { nickname, status } = action.payload;
      if (nickname !== undefined) state.nickname = nickname;
      if (status !== undefined) state.status = status;
    }
  }
});

export const { setCurrentUser, clearCurrentUser, updateProfile } = userSlice.actions;

// Selectors
export const selectCurrentUserId = (state) => state.user.currentUserId;
export const selectCurrentUser = (state) => state.user;

export default userSlice.reducer;
