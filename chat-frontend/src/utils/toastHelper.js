import toast from 'react-hot-toast';

/**
 * TOAST HELPER
 * 
 * Why this helper exists:
 * - Standardizes the toast notification styling (colors, layout, icons) across the application.
 * - Isolates the react-hot-toast dependency. If we change library in the future, we only edit this file.
 * 
 * PLACEHOLDER FOR WEBSOCKETS & STOMP INTEGRATION:
 * The backend developer can trigger these functions directly inside the STOMP Client callbacks:
 * 
 *   // 1. Connection success callback
 *   stompClient.connect({}, () => {
 *      toastHelper.connection.connected(currentUserId);
 *   }, (err) => {
 *      toastHelper.connection.error(err.message);
 *   });
 * 
 *   // 2. On user presence subscription callback (e.g. '/topic/active')
 *   onPresenceEvent((userEvent) => {
 *      if (userEvent.type === 'JOIN') {
 *         toastHelper.user.connected(userEvent.userId);
 *      } else if (userEvent.type === 'LEAVE') {
 *         toastHelper.user.disconnected(userEvent.userId);
 *      }
 *   });
 * 
 *   // 3. On new message from inactive chat
 *   onMessageReceived((msg) => {
 *      if (msg.senderId !== selectedChatUserId) {
 *         toastHelper.chat.newMessage(msg.senderId, msg.content);
 *      }
 *   });
 */

const toastStyles = {
  style: {
    background: '#172033',
    color: '#f1f5f9',
    borderRadius: '12px',
    border: '1px solid #243044',
    boxShadow: '0 10px 24px -8px rgba(0, 0, 0, 0.35)',
    fontSize: '0.875rem',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
};

export const toastHelper = {
  success: (message) => {
    toast.success(message, {
      ...toastStyles,
      iconTheme: {
        primary: '#10b981', // Emerald-500
        secondary: '#1f2937',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      ...toastStyles,
      iconTheme: {
        primary: '#ef4444', // Red-500
        secondary: '#1f2937',
      },
    });
  },

  info: (message) => {
    toast(message, {
      ...toastStyles,
      icon: 'ℹ️',
    });
  },

  // WebSocket / Connection status helpers
  connection: {
    connecting: () => {
      return toast.loading('Connecting to WebSocket server...', {
        ...toastStyles,
      });
    },
    connected: (userId) => {
      toast.success(`Connected as ${userId}`, {
        ...toastStyles,
        id: 'ws-conn-status', // Hardcoded ID to replace existing connection loading state
        iconTheme: {
          primary: '#10b981',
          secondary: '#1f2937',
        },
      });
    },
    disconnected: () => {
      toast.error('Disconnected from server. Reconnecting...', {
        ...toastStyles,
        id: 'ws-conn-status',
        iconTheme: {
          primary: '#f59e0b', // Amber-500
          secondary: '#1f2937',
        },
      });
    },
    error: (errDetail) => {
      toast.error(`Connection lost: ${errDetail || 'Server unreachable'}`, {
        ...toastStyles,
        id: 'ws-conn-status',
      });
    },
  },

  // User presence notifications
  user: {
    connected: (userId) => {
      toast(`${userId} came online`, {
        ...toastStyles,
        icon: '🟢',
        duration: 3000,
      });
    },
    disconnected: (userId) => {
      toast(`${userId} went offline`, {
        ...toastStyles,
        icon: '🔴',
        duration: 3000,
      });
    },
  },

  // Incoming messages notifications
  chat: {
    newMessage: (senderId, content) => {
      const truncated = content.length > 30 ? `${content.substring(0, 30)}...` : content;
      toast(`New message from ${senderId}: "${truncated}"`, {
        ...toastStyles,
        icon: '💬',
        duration: 4000,
      });
    },
  },
};

export default toastHelper;
