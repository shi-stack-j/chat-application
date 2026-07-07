import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedChatUserId, incrementUnread, addOnlineUser, updateUserPresence } from '../features/chat/chatSlice';
import { setConnectionState } from '../features/websocket/websocketSlice';
import { selectCurrentUserId, setCurrentUser } from '../features/auth/authSlice';
import AppLayout from '../layouts/AppLayout';
import Sidebar from '../layouts/Sidebar';
import ChatWindow from '../components/ChatWindow';
import useChat from '../hooks/useChat';
import chatService from '../services/chatService';
import authService from '../services/authService';
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

          const messagesQueue = `/queue/messages/${currentUserId}`;
          console.log('Subscribed to STOMP destination:', messagesQueue);

          chatService.subscribeToMessages(messagesQueue, (msg) => {
            try {
              const body = JSON.parse(msg.body);
              console.log('STOMP Message/Event received:', body);

              // Route by eventType if it is a structured presence event
              if (body && body.eventType) {
                const { eventType, payload } = body;
                if (eventType === 'USER_ONLINE') {
                  dispatch(updateUserPresence({ userId: payload.userId, online: true }));
                } else if (eventType === 'USER_OFFLINE') {
                  dispatch(updateUserPresence({ userId: payload.userId, online: false }));
                } else {
                  console.log('Unhandled WebSocket event type:', eventType);
                }
                return;
              }

              const { conversationId, content, senderId, receivedAt } = body;

              const messagePayload = {
                id: `${senderId}-${currentUserIdRef.current}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                senderId: senderId,
                receiverId: currentUserIdRef.current,
                content: content,
                timestamp: receivedAt || new Date().toISOString()
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
            } catch (err) {
              console.error('Failed to parse incoming WebSocket message:', err);
            }
          });
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
              
              localStorage.setItem('token', loginResponse.token);
              dispatch(
                setCurrentUser({
                  userId: loginResponse.userId,
                  nickname: loginResponse.nickName || loginResponse.userId,
                  avatarUrl: loginResponse.avatarUrl,
                  token: loginResponse.token
                })
              );

              // Schedule reconnect retry in 5 seconds
              reconnectTimeoutId = setTimeout(() => {
                establishWebSocketConnection(loginResponse.token);
              }, 5000);
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

    const messagePayload = {
      id: `${currentUserId}-${selectedChatUserId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUserId,
      receiverId: selectedChatUserId,
      content: text,
      timestamp: new Date().toISOString()
    };

    // 1. Append message locally in logs cache
    console.log("Sending the message :- ", messagePayload);
    addMessage(selectedChatUserId, messagePayload);

    // 2. Update conversation summary last message preview instantly
    updateConversationSummary(selectedChatUserId, text, messagePayload.timestamp, false);

    // 3. Publish via WebSocket to STOMP Broker
    try {
      chatService.sendMessage(messagePayload);
    } catch (error) {
      console.error('Failed to send message via WebSocket service:', error);
      toastHelper.error('Message delivery failed: WebSocket is disconnected.');
    }
  };

  return (
    <AppLayout sidebar={<Sidebar />}>
      <ChatWindow onSendMessage={handleSendMessage} />
    </AppLayout>
  );
};

export default ChatPage;
