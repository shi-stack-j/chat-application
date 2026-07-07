import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * CHAT SERVICE
 * 
 * Centralized client managing the WebSocket STOMP protocol lifecycle.
 * Features auto-reconnect (reconnectDelay: 5000) and prevents duplicate subscriptions.
 */
class ChatService {
  client = null;
  activeSubscriptions = {};

  connect(token, onConnect, onDisconnect) {
    if (this.client && (this.client.active || this.client.connected)) {
      console.log('STOMP client already active or connected.');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL || 'http://localhost:8080/chat-app/v1/ws'),
      reconnectDelay: 5000,

      connectHeaders: {
        token: token
      },

      onConnect: () => {
        console.log('Connected Successfully');
        if (onConnect) {
          onConnect();
        }
      },

      onDisconnect: () => {
        console.log('Disconnected');
        if (onDisconnect) onDisconnect();
      },

      onStompError: (frame) => {
        console.error('STOMP Error:', frame.body);
      }
    });

    this.client.activate();
  }

  sendMessage(message) {
    console.log('Sending message.......');
    console.log('Message is :- ', message);
    if (!this.client || !this.client.connected) {
      throw new Error('STOMP client is not connected.');
    }

    // Map frontend message model to backend MessageReqDto
    const chatMessage = {
      receiver: message.receiverId, // maps to backend expected receiver (min=3 size validation)
      content: message.content,
      sendAt: message.timestamp // Maps ISO 8601 timestamp string
    };

    console.log('Chat message payload is :- ', chatMessage);
    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(chatMessage)
    });
    console.log('Message published.');
  }

  subscribeToMessages(destination, onMessageReceived) {
    console.log('Subscribing........');
    console.log('Destination is........ ', destination);
    if (!this.client || !this.client.connected) {
      throw new Error('STOMP client is not connected to subscribe.');
    }

    // Unsubscribe from any previous subscription on this destination to prevent duplicate listeners
    if (this.activeSubscriptions[destination]) {
      console.log('Cleaning up duplicate subscription for:', destination);
      try {
        this.activeSubscriptions[destination].unsubscribe();
      } catch (err) {
        console.error('Failed to unsubscribe previous subscription:', err);
      }
    }

    const subscription = this.client.subscribe(destination, onMessageReceived);
    this.activeSubscriptions[destination] = subscription;
    return subscription;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.activeSubscriptions = {};
  }
}

const chatService = new ChatService();
export default chatService;
