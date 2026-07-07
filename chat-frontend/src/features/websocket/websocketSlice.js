import { createSlice } from '@reduxjs/toolkit';

/**
 * WEBSOCKET CONNECTION & SUBSCRIPTION SLICE (websocketStore)
 * 
 * Manages:
 * - Real-time STOMP server connection state.
 * - Active topic subscription states.
 */

const initialState = {
  connectionState: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
  subscriptions: {} // Maps { [destination]: true }
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnectionState: (state, action) => {
      state.connectionState = action.payload;
    },
    addSubscription: (state, action) => {
      state.subscriptions[action.payload] = true;
    },
    removeSubscription: (state, action) => {
      delete state.subscriptions[action.payload];
    },
    clearSubscriptions: (state) => {
      state.subscriptions = {};
    }
  }
});

export const {
  setConnectionState,
  addSubscription,
  removeSubscription,
  clearSubscriptions
} = websocketSlice.actions;

// Selectors
export const selectConnectionState = (state) => state.websocket.connectionState;
export const selectSubscriptions = (state) => state.websocket.subscriptions;

export default websocketSlice.reducer;
