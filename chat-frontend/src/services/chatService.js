

import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client";
class ChatService {
  client = null;

  connect(token, onConnect, onDisconnect) {
    if (this.client && (this.client.active || this.client.connected)) {
      console.log("STOMP client already active or connected.");
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,

      connectHeaders: {
        token: token
      },

      onConnect: () => {
        console.log("Connected Successfully");
        if (onConnect) {
          onConnect();
          localStorage.removeItem("token");
        }
      },

      onDisconnect: () => {
        console.log("Disconnected");
        if (onDisconnect) onDisconnect();
      },

      onStompError: (frame) => {
        console.error("STOMP Error:", frame.body);
      },
    });

    this.client.activate();
  }

  sendMessage(message) {
    console.log("Sending message.......");
    console.log("Message is :- ", message);
    if (!this.client || !this.client.connected) {
      throw new Error("STOMP client is not connected.");
    }

    // Map frontend message model to backend ChatMessage DTO
    const chatMessage = {
      messageId: message.id,
      content: message.content,
      receiverId: message.receiverId,
      sendAt: message.timestamp // Maps ISO 8601 timestamp string
    };
    console.log("Chat message is :- ", chatMessage);
    console.log("Destination is :- ", "/app/chat");
    this.client.publish({
      destination: "/app/chat",
      body: JSON.stringify(chatMessage)
    });
    console.log("Message sended........");
  }

  subscribeToMessages(destination, onMessageReceived) {
    console.log("Subscribining........");
    console.log("Destination is........ ", destination);
    if (!this.client || !this.client.connected) {
      throw new Error("STOMP client is not connected to subscribe.");
    }
    return this.client.subscribe(destination, onMessageReceived);
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}
const chatService = new ChatService();
export default chatService;

// This is the structure of the message that is being sended by the backend 
// public class ChatMsgResDto {
//     private String senderId;
//     private String content;
// }

// This is the structure if the message that is being recieved by the bakcend when someone sends the message
// public class ChatMessage {
//     private String messageId;
//     private String content;
//     private String receiverId;
//     private LocalDateTime sendAt;
// }

