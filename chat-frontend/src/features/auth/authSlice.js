import { createSlice } from '@reduxjs/toolkit';

/**
 * AUTHENTICATION & IDENTITY SLICE (authStore)
 * 
 * Manages:
 * - Current user credentials and profile cached in local storage.
 * - One-time WebSocket UUID tokens.
 * - Authentication state (isAuthenticated).
 */

const initialState = {
  currentUserId: localStorage.getItem('userId') || null,
  nickname: localStorage.getItem('nickname') || '',
  avatarUrl: localStorage.getItem('avatarUrl') || null,
  status: localStorage.getItem('userId') ? 'online' : 'offline',
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('userId') // Auth is active if we have user identity details stored
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      const { userId, nickname, nickName, avatarUrl, token } = action.payload;
      state.currentUserId = userId;
      state.nickname = nickname || nickName || userId;
      state.avatarUrl = avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userId)}`;
      state.token = token || null;
      state.isAuthenticated = true;
      state.status = 'online';
      
      localStorage.setItem('userId', state.currentUserId);
      localStorage.setItem('nickname', state.nickname);
      localStorage.setItem('avatarUrl', state.avatarUrl);
      if (state.token) {
        localStorage.setItem('token', state.token);
      }
    },
    clearCurrentUser: (state) => {
      state.currentUserId = null;
      state.nickname = '';
      state.avatarUrl = null;
      state.status = 'offline';
      state.token = null;
      state.isAuthenticated = false;
      
      localStorage.removeItem('userId');
      localStorage.removeItem('nickname');
      localStorage.removeItem('avatarUrl');
      localStorage.removeItem('token');
    },
    updateProfile: (state, action) => {
      const { nickname, nickName, status } = action.payload;
      if (nickname !== undefined) state.nickname = nickname;
      if (nickName !== undefined) state.nickname = nickName;
      if (status !== undefined) state.status = status;
    }
  }
});

export const { setCurrentUser, clearCurrentUser, updateProfile } = authSlice.actions;

// Selectors
export const selectCurrentUserId = (state) => state.auth.currentUserId;
export const selectCurrentUser = (state) => state.auth;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
