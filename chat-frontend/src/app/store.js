import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../features/user/userSlice';
import uiReducer from '../features/ui/uiSlice';
import chatSelectionReducer from '../features/chat/chatSelectionSlice';

/**
 * REDUX STORE CONFIGURATION
 * 
 * Why Redux is used in this project:
 * 1. Global UI & Application State: States like the active dark/light theme, sidebar toggle, and active loading indicators
 *    are accessed globally by different layout wrappers and need to be modified from deep nesting levels.
 * 2. Selected Active Conversation: Knowing which chat partner is currently selected is critical to updating message reads,
 *    updating lists, and rendering the ChatPanel.
 * 3. Identity and Directory: The logged-in user's user ID, their profile details, and the list of currently online users
 *    received via WS/REST APIs belong in a global, central UI store.
 * 
 * Why Redux is NOT used for actual messages:
 * - High-frequency updates: Message streams can be extremely frequent in active chat applications. Running frequent, 
 *   heavy payload reducer dispatches in Redux can cause UI lag and overhead.
 * - Session-only scope: The messages in this app are designed to be temporary, session-based memory. Context API is
 *   highly suited for simple, transient React-only state lifecycles and keeps the global Redux store clean.
 */
export const store = configureStore({
  reducer: {
    user: userReducer,
    ui: uiReducer,
    chatSelection: chatSelectionReducer,
  },
});

export default store;
