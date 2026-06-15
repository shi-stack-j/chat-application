import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedChatUserId, incrementUnread } from '../features/chat/chatSelectionSlice';
import { selectCurrentUserId } from '../features/user/userSlice';
import AppLayout from '../layouts/AppLayout';
import Sidebar from '../layouts/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import EmptyState from '../components/EmptyState';
import useChat from '../hooks/useChat';
import chatService from '../services/chatService';
import toastHelper from '../utils/toastHelper';
import { addOnlineUser } from '../features/chat/chatSelectionSlice';
/**
 * CHAT PAGE COMPONENT
 * 
 * Why this page exists:
 * - Directs the core user experience after entering their User ID.
 * - Coordinates the AppLayout shell by injecting the Sidebar on the left and the active Chat Panel on the right.
 * - Pulls messaging records from ChatContext and active selected chat metadata from Redux.
 */
export const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUserId = useSelector(selectCurrentUserId);
  const selectedChatUserId = useSelector(selectSelectedChatUserId);
  const { conversations, addMessage } = useChat();

  // Refs to store the latest values of selected variables for the async WebSocket callback
  const selectedChatUserIdRef = useRef(selectedChatUserId);
  const addMessageRef = useRef(addMessage);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    selectedChatUserIdRef.current = selectedChatUserId;
    addMessageRef.current = addMessage;
    currentUserIdRef.current = currentUserId;
  }, [selectedChatUserId, addMessage, currentUserId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) return;

    toastHelper.connection.connecting();

    chatService.connect(
      token,
      // onConnect callback
      () => {
        toastHelper.connection.connected(currentUserId);

        const dynamicDestination = `/queue/messages/${currentUserId}`;
        console.log("Subscribing to :- ", dynamicDestination);
        chatService.subscribeToMessages(dynamicDestination, (msg) => {
          try {
            const body = JSON.parse(msg.body);
            const senderId = body.senderId;
            const content = body.content;
            console.log("Message is :- ", msg);
            const messagePayload = {
              id: `${senderId}-${currentUserIdRef.current}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              senderId: senderId,
              receiverId: currentUserIdRef.current,
              content: content,
              timestamp: new Date().toISOString(),
            };

            // Add the received message to local ChatContext state
            addMessageRef.current(senderId, messagePayload);

            // Adding the new user to the online users list 
            dispatch(addOnlineUser(senderId));

            // Increment unread count in Redux if not currently focused
            if (senderId !== selectedChatUserIdRef.current) {
              dispatch(incrementUnread(senderId));
              toastHelper.chat.newMessage(senderId, content);
            }
          } catch (err) {
            console.error('Failed to parse incoming STOMP message:', err);
          }
        });
      },
      // onDisconnect callback
      () => {
        toastHelper.connection.disconnected();
      }
    );

    // Clean up connection when leaving the ChatPage
    return () => {
      chatService.disconnect();
    };
  }, [currentUserId, dispatch]);

  // Retrieve messages array for the selected partner, defaulting to empty list
  const activeConversationMessages = selectedChatUserId ? (conversations[selectedChatUserId] || []) : [];

  /**
   * Action triggered when the user types a message and clicks Send.
   * 
   * PLACEHOLDER FOR BACKEND DEVELOPER:
   * Right now, since there is no backend, we write directly to the local ChatContext.
   * When integrating Spring Boot and WebSockets (using STOMP/SockJS):
   * 
   *   1. You will format the message payload identically.
   *   2. You will send the message payload to your Spring Boot controller endpoint (e.g., '/app/chat.send'):
   *         stompClient.send("/app/chat.send", {}, JSON.stringify(messagePayload));
   *   3. To provide instant response in UI, you can call `addMessage` locally immediately,
   *      OR wait to receive the reflected message back from the subscription queue:
   *         stompClient.subscribe('/user/queue/messages', (msg) => { ... addMessage(...) });
   */
  const handleSendMessage = async (text) => {
    if (!selectedChatUserId || !currentUserId) return;

    const messagePayload = {
      id: `${currentUserId}-${selectedChatUserId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUserId,
      receiverId: selectedChatUserId,
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Store message locally in ChatContext
    addMessage(selectedChatUserId, messagePayload);

    // Call chatService to simulate sending the message to the backend
    try {
      await chatService.sendMessage(messagePayload);
    } catch (error) {
      console.error('Failed to send message via WebSocket service:', error);
    }
  };

  return (
    <AppLayout sidebar={<Sidebar />}>
      {selectedChatUserId ? (
        /* If a chat is active, display the message thread and input panel */
        <div className="flex flex-col h-full w-full min-w-0 bg-white dark:bg-slate-900">

          {/* Active Partner header bar */}
          <ChatHeader chatUserId={selectedChatUserId} />

          {/* Scrollable message bubble stream */}
          <MessageList messages={activeConversationMessages} chatUserId={selectedChatUserId} />

          {/* 
            TYPING INDICATOR PLACEHOLDER 
            The backend developer can display typing alerts received via WebSockets here:
            
            {isPartnerTyping && (
              <div className="px-4 py-1.5 bg-slate-50/20 dark:bg-slate-900 text-xs text-slate-400 italic flex items-center gap-1">
                <span>{selectedChatUserId} is typing</span>
                <span className="flex gap-0.5"><span className="animate-bounce">.</span><span className="animate-bounce [animation-delay:0.2s]">.</span><span className="animate-bounce [animation-delay:0.4s]">.</span></span>
              </div>
            )}
          */}

          {/* Message creation and submission bar */}
          <MessageInput key={selectedChatUserId} onSendMessage={handleSendMessage} chatUserId={selectedChatUserId} />

        </div>
      ) : (
        /* Render Empty state guidelines when no active conversation is selected */
        <EmptyState />
      )}
    </AppLayout>
  );
};

export default ChatPage;
