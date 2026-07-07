import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import chatReducer from '../features/chat/chatSlice';
import websocketReducer from '../features/websocket/websocketSlice';
import uiReducer from '../features/ui/uiSlice';

/**
 * REDUX STORE CONFIGURATION
 * 
 * Configured with optimized slices:
 * 1. auth: Manages user session state and authentication flags.
 * 2. chat: Manages conversations summaries, messages cache, unread status, and online list.
 * 3. websocket: Manages WebSocket connection status and active subscriptions.
 * 4. ui: Manages user theme preferences and sidebar layouts.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    websocket: websocketReducer,
    ui: uiReducer,
  },
});

export default store;

