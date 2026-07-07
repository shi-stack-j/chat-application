import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatContext } from './ChatContextInstance';
import conversationService from '../services/conversationService';
import messageService from '../services/messageService';
import userService from '../services/userService';
import {
  setConversations,
  setMessages,
  addMessage as addMessageAction,
  clearConversation as clearConversationAction,
  removeConversation as removeConversationAction,
  resetUnread,
  addOnlineUser,
  setLoadingConversations,
  setLoadingMessages,
  updateConversationSummary as updateConversationSummaryAction,
  selectConversations,
  selectAllMessages,
  selectLoadingConversations,
  selectLoadingMessages
} from '../features/chat/chatSlice';

/**
 * CHAT CONTEXT
 * 
 * Adapts React Context calls to the underlying Redux Chat Slice (single source of truth).
 * This ensures compatibility for existing components utilizing the useChat hook.
 */
export const ChatProvider = ({ children }) => {
  const dispatch = useDispatch();

  // Read state directly from Redux
  const conversationList = useSelector(selectConversations);
  const conversations = useSelector(selectAllMessages);
  const loadingConversations = useSelector(selectLoadingConversations);
  const loadingMessages = useSelector(selectLoadingMessages);

  const loadingConversationsRef = useRef(loadingConversations);
  const loadingMessagesRef = useRef(loadingMessages);

  useEffect(() => {
    loadingConversationsRef.current = loadingConversations;
  }, [loadingConversations]);

  useEffect(() => {
    loadingMessagesRef.current = loadingMessages;
  }, [loadingMessages]);

  // Fetch conversation summaries from backend
  const fetchConversations = useCallback(async (currentUserId) => {
    if (!currentUserId || loadingConversationsRef.current) return;
    dispatch(setLoadingConversations(true));
    try {
      const pageData = await conversationService.getConversationSummaries(currentUserId);
      const content = pageData.content || [];

      // Sort conversations chronologically (newest message first)
      const sortedContent = [...content].sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      // Normalize `online` status field to `isOnline` from backend response
      const normalizedContent = sortedContent.map((c) => {
        if (c.receiver) {
          const isOnline = c.receiver.isOnline !== undefined ? c.receiver.isOnline : c.receiver.online;
          return {
            ...c,
            receiver: {
              ...c.receiver,
              isOnline: !!isOnline
            }
          };
        }
        return c;
      });

      dispatch(setConversations(normalizedContent));

      // Dispatch online status of peers to Redux onlineUsers list
      normalizedContent.forEach((c) => {
        if (c.receiver?.isOnline) {
          dispatch(addOnlineUser(c.receiver.userId));
        }
      });
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      dispatch(setLoadingConversations(false));
    }
  }, [dispatch]);

  // Fetch latest messages for a specific conversation
  const fetchMessages = useCallback(async (chatUserId, conversationId, currentUserId) => {
    if (!conversationId || !currentUserId || loadingMessagesRef.current) return;
    dispatch(setLoadingMessages(true));
    try {
      const response = await messageService.getLatestMessages(conversationId);
      const messagesList = response.content || [];

      // Backend returns newest first. Reverse to display oldest first (chronological).
      const reversed = [...messagesList].reverse().map((msg, index) => ({
        id: msg.id || `${msg.senderId || msg.sender?.userId || 'sender'}-${msg.receivedAt || msg.sentAt || msg.createdAt || 'timestamp'}-${index}`,
        senderId: msg.sender?.userId || msg.senderId,
        receiverId: msg.receiver?.userId || msg.receiverId,
        content: msg.content,
        timestamp: msg.receivedAt || msg.sentAt || msg.createdAt || new Date().toISOString()
      }));

      // Cache under both conversationId (per layout instructions) and chatUserId (for hook lookup compatibility)
      dispatch(setMessages({ key: conversationId, messages: reversed }));
      dispatch(setMessages({ key: chatUserId, messages: reversed }));
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      dispatch(setLoadingMessages(false));
    }
  }, [dispatch]);

  // Mark messages as read for a conversation
  const markAsRead = useCallback(async (chatUserId, conversationId, currentUserId) => {
    if (!conversationId || !currentUserId) return;
    try {
      await messageService.markAsDelivered(currentUserId);
      await messageService.markAsRead(conversationId, currentUserId);
      dispatch(resetUnread(chatUserId));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }, [dispatch]);

  // Start or open a conversation
  const startConversation = useCallback(async (receiverId, currentUserId) => {
    if (!receiverId || !currentUserId) return null;

    // First check if conversation already exists in our local list
    const existing = conversationList.find(
      (c) => c.receiver.userId.toLowerCase() === receiverId.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    // Call backend to create/get conversation
    try {
      // Fetch details of the receiver user to verify existence
      const userProfile = await userService.getUser(receiverId);

      // Create conversation
      const created = await conversationService.createConversation(receiverId, currentUserId);

      const newSummary = {
        conversationId: created.conversationId,
        receiver: {
          userId: userProfile.userId,
          nickName: userProfile.nickName || userProfile.userId,
          avatarUrl: userProfile.avatarUrl,
          isOnline: userProfile.isOnline !== undefined ? userProfile.isOnline : userProfile.online
        },
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0
      };

      dispatch(setConversations([newSummary, ...conversationList]));

      // If the newly added user is online, dispatch addOnlineUser to populate onlineUsers list in Redux
      const isPeerOnline = userProfile.isOnline !== undefined ? userProfile.isOnline : userProfile.online;
      if (isPeerOnline) {
        dispatch(addOnlineUser(receiverId));
      }

      // Initialize messages list in cache under both keys
      dispatch(setMessages({ key: created.conversationId, messages: [] }));
      dispatch(setMessages({ key: receiverId, messages: [] }));

      return newSummary;
    } catch (error) {
      console.error('Start conversation error:', error);
      throw error;
    }
  }, [conversationList, dispatch]);

  // Appends a single message locally to the message logs cache
  const addMessage = useCallback((chatUserId, message, force = true) => {
    if (!chatUserId || !message) return;

    // Resolve conversationId from conversations list
    const conv = conversationList.find(
      (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
    );

    if (conv && conv.conversationId) {
      dispatch(addMessageAction({ key: conv.conversationId, message, force }));
    }
    dispatch(addMessageAction({ key: chatUserId, message, force }));
  }, [conversationList, dispatch]);

  // Updates the conversation summary (last message text, timestamp, unread count)
  const updateConversationSummary = useCallback((chatUserId, content, timestamp, incrementUnread = false, conversationId = null) => {
    dispatch(updateConversationSummaryAction({ chatUserId, content, timestamp, incrementUnread, conversationId }));
  }, [dispatch]);

  // Clear conversation locally (resolves ChatHeader.jsx runtime crash)
  const clearConversation = useCallback((chatUserId) => {
    dispatch(clearConversationAction(chatUserId));
  }, [dispatch]);

  // Remove conversation locally (resolves ChatHeader.jsx runtime crash)
  const removeConversation = useCallback((chatUserId) => {
    dispatch(removeConversationAction(chatUserId));
  }, [dispatch]);

  const contextValue = useMemo(() => ({
    conversationList,
    conversations,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    fetchMessages,
    markAsRead,
    startConversation,
    addMessage,
    updateConversationSummary,
    clearConversation,
    removeConversation
  }), [
    conversationList,
    conversations,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    fetchMessages,
    markAsRead,
    startConversation,
    addMessage,
    updateConversationSummary,
    clearConversation,
    removeConversation
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
