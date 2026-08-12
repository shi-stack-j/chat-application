import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedChatUserId, incrementUnread, addOnlineUser, updateUserPresence, setTypingStatus, updateMessageStatus, updateSingleMessageStatus, handleSentAck, updateEditedMessage, updateDeletedMessage } from '../features/chat/chatSlice';
import { setConnectionState } from '../features/websocket/websocketSlice';
import { selectCurrentUserId, setCurrentUser } from '../features/auth/authSlice';
import AppLayout from '../layouts/AppLayout';
import Sidebar from '../layouts/Sidebar';
import ChatWindow from '../components/ChatWindow';
import useChat from '../hooks/useChat';
import chatService from '../services/chatService';
import authService from '../services/authService';
import userService from '../services/userService';
import toastHelper from '../utils/toastHelper';

/**
 * CHAT PAGE COMPONENT
 * 
 * Coordinates the application layout.
 * Establishes real-time STOMP connection, registers subscription queue,
 * and loads/saves historical messages.
 */
export const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUserId = useSelector(selectCurrentUserId);
  const selectedChatUserId = useSelector(selectSelectedChatUserId);

  const {
    conversationList,
    conversations,
    fetchConversations,
    fetchMessages,
    markAsRead,
    addMessage,
    updateConversationSummary
  } = useChat();

  // Keep references to active states to prevent stale closure issues in WebSocket listener callbacks
  const selectedChatUserIdRef = useRef(selectedChatUserId);
  const conversationListRef = useRef(conversationList);
  const currentUserIdRef = useRef(currentUserId);
  const addMessageRef = useRef(addMessage);
  const updateConversationSummaryRef = useRef(updateConversationSummary);
  const fetchConversationsRef = useRef(fetchConversations);
  const markAsReadRef = useRef(markAsRead);
  const conversationsRef = useRef(conversations);
  const fetchMessagesRef = useRef(fetchMessages);
  const lastFetchedRef = useRef({ userId: null, conversationId: null });

  useEffect(() => {
    selectedChatUserIdRef.current = selectedChatUserId;
    conversationListRef.current = conversationList;
    currentUserIdRef.current = currentUserId;
    addMessageRef.current = addMessage;
    updateConversationSummaryRef.current = updateConversationSummary;
    fetchConversationsRef.current = fetchConversations;
    markAsReadRef.current = markAsRead;
    conversationsRef.current = conversations;
    fetchMessagesRef.current = fetchMessages;
  }, [selectedChatUserId, conversationList, currentUserId, addMessage, updateConversationSummary, fetchConversations, markAsRead, conversations, fetchMessages]);

  // 1. Initial Load: Fetch previous conversation summaries
  useEffect(() => {
    if (currentUserId) {
      fetchConversations(currentUserId);
    }
  }, [currentUserId, fetchConversations]);

  // 2. WebSocket Connection and Lifecycle
  useEffect(() => {
    const initialToken = localStorage.getItem('token');
    if (!initialToken || !currentUserId) return;

    let isComponentMounted = true;
    let reconnectTimeoutId = null;

    const establishWebSocketConnection = (token) => {
      if (!isComponentMounted) return;
      dispatch(setConnectionState('connecting'));
      toastHelper.connection.connecting();

      chatService.connect(
        token,
        // onConnect success
        () => {
          if (!isComponentMounted) return;
          dispatch(setConnectionState('connected'));
          toastHelper.connection.connected(currentUserId);

          // 1. Subscribe to user-specific messages destination (convertAndSendToUser)
          const messagesQueue = '/user/queue/messages';
          console.log('Subscribing to STOMP messages destination:', messagesQueue);
          chatService.subscribeToMessages(messagesQueue, (msg) => {
            try {
              const body = JSON.parse(msg.body);
              console.log('STOMP Message received:', body);

              const { conversationId, content, senderId, receivedAt } = body;
              const realMessageId = body.messageId || body.id;

              const messagePayload = {
                id: realMessageId || `${senderId}-${currentUserIdRef.current}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                messageId: realMessageId || null,
                conversationId: conversationId || body.conversationId || null,
                senderId: senderId,
                receiverId: currentUserIdRef.current,
                content: content,
                timestamp: receivedAt || new Date().toISOString(),
                isEdited: !!(body.isEdited || body.edited),
                editedAt: body.editedAt || null,
                deletedFromEveryOne: !!(body.deletedFromEveryOne || body.isDeletedForEveryone),
                status: body.status || 'DELIVERED'
              };

              // Add peer user to online list
              dispatch(addOnlineUser(senderId));

              // Determine if message belongs to the active conversation
              const isActive = selectedChatUserIdRef.current &&
                selectedChatUserIdRef.current.toLowerCase() === senderId.toLowerCase();

              if (isActive) {
                // Add directly to active chat view
                addMessageRef.current(senderId, messagePayload);

                // Instantly update the sidebar last message preview without marking unread
                updateConversationSummaryRef.current(senderId, content, receivedAt || new Date().toISOString(), false, conversationId);

                // Mark the message as read on backend (since user is actively viewing this conversation)
                if (conversationId) {
                  markAsReadRef.current(senderId, conversationId, currentUserIdRef.current);
                }
              } else {
                // Background message: append to cache only if history has already been loaded, preventing loading blocker
                addMessageRef.current(senderId, messagePayload, false);

                // Not active: update last message in summary list (do not increment unread here to avoid double-increment)
                updateConversationSummaryRef.current(senderId, content, receivedAt || new Date().toISOString(), false, conversationId);

                // Trigger unread indicator in Redux for the sidebar item
                dispatch(incrementUnread(senderId));

                // Show toast banner
                toastHelper.chat.newMessage(senderId, content);
              }

              // Automatically send Delivery ACK for the newly received incoming message using backend messageId
              if (realMessageId) {
                try {
                  console.log('Sending automatic delivery ack for message ID:', realMessageId);
                  chatService.sendDeliveryAck(realMessageId);
                } catch (ackErr) {
                  console.error('Failed to send automatic delivery ack:', ackErr);
                }
              }
            } catch (err) {
              console.error('Failed to parse incoming WebSocket message:', err);
            }
          });

          // 2. Subscribe to user-specific notifications destinations
          const handleNotification = (msg) => {
            try {
              const body = JSON.parse(msg.body);
              console.log('STOMP Notification Event received:', body);
              if (body && body.eventType) {
                const { eventType, payload } = body;
              
                console.log(`Notification Event Type: ${eventType}, Payload:`, payload);
                if (eventType === 'USER_ONLINE') {
                  console.log(`User ${payload.userId} is now online.`);
                  dispatch(updateUserPresence({ userId: payload.userId, online: true }));
                } else if (eventType === 'USER_OFFLINE') {
                  console.log(`User ${payload.userId} is now offline.`);
                  dispatch(updateUserPresence({ userId: payload.userId, online: false }));
                } else if (eventType === 'USER_TYPING') {
                  dispatch(setTypingStatus({ userId: payload.senderId, typing: payload.typing }));
                } else if (eventType === 'USER_MESSAGE') {
                  const messageTempId = payload.messageTempId || payload.tempMessageId;
                  if (messageTempId && payload.messageId) {
                    dispatch(handleSentAck({
                      messageTempId,
                      messageId: payload.messageId,
                      messageStatus: payload.messageStatus || payload.status,
                      conversationId: payload.conversationId
                    }));
                  } else if (payload.status === 'DELIVERED' && payload.messageId) {
                    dispatch(updateSingleMessageStatus({
                      conversationId: payload.conversationId,
                      messageId: payload.messageId,
                      status: payload.status,
                      currentUserId: currentUserIdRef.current
                    }));
                  } else {
                    dispatch(updateMessageStatus({
                      conversationId: payload.conversationId,
                      status: payload.status,
                      currentUserId: currentUserIdRef.current
                    }));
                  }
                } else if (eventType === 'MESSAGE_EDITED') {
                  dispatch(updateEditedMessage({
                    conversationId: payload.conversationId,
                    messageId: payload.messageId,
                    content: payload.content
                  }));
                } else if (eventType === 'MESSAGE_DELETED') {
                  dispatch(updateDeletedMessage({
                    conversationId: payload.conversationId,
                    messageId: payload.messageId,
                    content: payload.content
                  }));
                } else {
                  console.log('Unhandled WebSocket event type:', eventType);
                }
              }
            } catch (err) {
              console.error('Failed to parse incoming notification event:', err);
            }
          };

          console.log('Subscribing to STOMP notifications destination /user/queue/notifications');
          chatService.subscribeToMessages('/user/queue/notifications', handleNotification);
          chatService.subscribeToMessages('/user/queue/notification', handleNotification);
        },
        // onDisconnect / error
        async () => {
          if (!isComponentMounted) return;
          dispatch(setConnectionState('disconnected'));
          toastHelper.connection.disconnected();

          // Token One-Time Use mitigation: Request a new token using session-cached password
          const cachedPassword = sessionStorage.getItem('cached_password');
          if (cachedPassword && currentUserId) {
            console.log('WebSocket disconnected or token invalid. Requesting new token...');
            try {
              const credentials = { userId: currentUserId, password: cachedPassword };
              const loginResponse = await authService.login(credentials);
              const jwtToken = loginResponse.jwtToken;
              
              if (jwtToken) {
                localStorage.setItem('token', jwtToken);
                
                // Fetch current user profile with new token to refresh auth status
                const profile = await userService.getCurrentUser(jwtToken);
                dispatch(
                  setCurrentUser({
                    userId: profile.userId,
                    nickname: profile.nickName || profile.userId,
                    avatarUrl: profile.avatarUrl,
                    token: jwtToken
                  })
                );

                // Schedule reconnect retry in 5 seconds
                reconnectTimeoutId = setTimeout(() => {
                  establishWebSocketConnection(jwtToken);
                }, 5000);
              }
            } catch (error) {
              console.error('Background token refresh failed:', error);
            }
          }
        }
      );
    };

    establishWebSocketConnection(initialToken);

    return () => {
      isComponentMounted = false;
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
      chatService.disconnect();
      dispatch(setConnectionState('disconnected'));
    };
  }, [currentUserId, dispatch]);

  // 3. Handle Active Chat Selection: Load messages and mark as read
  useEffect(() => {
    if (!selectedChatUserId || !currentUserId) {
      lastFetchedRef.current = { userId: null, conversationId: null };
      return;
    }

    // Search conversation summary in list
    const activeSummary = conversationList.find(
      (c) => c.receiver.userId.toLowerCase() === selectedChatUserId.toLowerCase()
    );

    if (activeSummary && activeSummary.conversationId) {
      const { conversationId, unreadCount } = activeSummary;

      // Check if we already fetched messages for this conversationId
      if (
        lastFetchedRef.current.userId !== selectedChatUserId ||
        lastFetchedRef.current.conversationId !== conversationId
      ) {
        fetchMessages(selectedChatUserId, conversationId, currentUserId);
        markAsRead(selectedChatUserId, conversationId, currentUserId);
        lastFetchedRef.current = { userId: selectedChatUserId, conversationId };
      } else if (unreadCount > 0) {
        markAsRead(selectedChatUserId, conversationId, currentUserId);
      }
    }
  }, [selectedChatUserId, conversationList, currentUserId, fetchMessages, markAsRead]);



  // Outbound message transmission handler
  const handleSendMessage = async (text) => {
    if (!selectedChatUserId || !currentUserId) return;

    const tempId = `temp-${currentUserId}-${selectedChatUserId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const messagePayload = {
      id: tempId,
      tempMessageId: tempId,
      senderId: currentUserId,
      receiverId: selectedChatUserId,
      content: text,
      timestamp: new Date().toISOString(),
      status: null
    };

    // 1. Append message locally in logs cache
    console.log("Sending the message :- ", messagePayload);
    addMessage(selectedChatUserId, messagePayload);

    // 2. Update conversation summary last message preview instantly
    updateConversationSummary(selectedChatUserId, text, messagePayload.timestamp, false);

    // 3. Publish via WebSocket to STOMP Broker (with REST fallback)
    try {
      chatService.sendMessage(messagePayload);
    } catch (error) {
      console.warn('WebSocket message publish failed, attempting REST fallback:', error);
      const activeSummary = conversationList.find(
        (c) => c.receiver.userId.toLowerCase() === selectedChatUserId.toLowerCase()
      );
      if (activeSummary && activeSummary.conversationId) {
        try {
          await messageService.sendMessageFallback(
            { receiver: selectedChatUserId, content: text, tempMessageId: messagePayload.tempMessageId },
            currentUserId,
            activeSummary.conversationId
          );
          toastHelper.info('Message delivered via REST fallback.');
        } catch (fallbackErr) {
          console.error('REST fallback message delivery failed:', fallbackErr);
          toastHelper.error(fallbackErr.message || 'Message delivery failed: WebSocket and REST fallback failed.');
        }
      } else {
        toastHelper.error('Message delivery failed: WebSocket is disconnected.');
      }
    }
  };

  return (
    <AppLayout sidebar={<Sidebar />}>
      <ChatWindow onSendMessage={handleSendMessage} />
    </AppLayout>
  );
};

export default ChatPage;
