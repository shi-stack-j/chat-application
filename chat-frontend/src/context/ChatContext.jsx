import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatContext } from './ChatContextInstance';
import conversationService from '../services/conversationService';
import messageService from '../services/messageService';
import reactionService from '../services/reactionService';
import userService from '../services/userService';
import chatService from '../services/chatService';
import { selectCurrentUserId } from '../features/auth/authSlice';
import {
  setConversations,
  setTotalUnreadCount,
  setMessages,
  addMessage as addMessageAction,
  clearConversation as clearConversationAction,
  removeConversation as removeConversationAction,
  resetUnread,
  addOnlineUser,
  setLoadingConversations,
  setLoadingMessages,
  setPaginationInfo,
  setLoadingOlderMessages,
  prependMessages,
  updateConversationSummary as updateConversationSummaryAction,
  updateEditedMessage,
  updateDeletedMessage,
  deleteMessagesForMe,
  updateMessageReaction,
  addBlockedUser,
  removeBlockedUser,
  selectConversations,
  selectAllMessages,
  selectLoadingConversations,
  selectLoadingMessages,
  selectSelectedChatUserId
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
  const selectedChatUserId = useSelector(selectSelectedChatUserId);
  const currentUserId = useSelector(selectCurrentUserId);
  const pagination = useSelector((state) => state.chat.pagination || {});

  const loadingConversationsRef = useRef(loadingConversations);
  const loadingMessagesRef = useRef(loadingMessages);
  const selectedChatUserIdRef = useRef(selectedChatUserId);
  const conversationListRef = useRef(conversationList);
  const paginationRef = useRef(pagination);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    loadingConversationsRef.current = loadingConversations;
  }, [loadingConversations]);

  useEffect(() => {
    loadingMessagesRef.current = loadingMessages;
  }, [loadingMessages]);

  useEffect(() => {
    selectedChatUserIdRef.current = selectedChatUserId;
    conversationListRef.current = conversationList;
    paginationRef.current = pagination;
    currentUserIdRef.current = currentUserId;
  }, [selectedChatUserId, conversationList, pagination, currentUserId]);

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

      // Normalize fields & extract block status from backend ConversationSummaryResDto response
      const normalizedContent = sortedContent.map((c) => {
        const isBlocked = !!(c.isOtherUserBlocked || c.otherUserBlocked);
        if (isBlocked && c.receiver?.userId) {
          dispatch(addBlockedUser(c.receiver.userId));
        }
        if (c.receiver) {
          const isOnline = (c.receiver.isOnline !== undefined ? c.receiver.isOnline : c.receiver.online) && !isBlocked;
          return {
            ...c,
            isOtherUserBlocked: isBlocked,
            otherUserBlocked: isBlocked,
            receiver: {
              ...c.receiver,
              isOnline: !!isOnline
            }
          };
        }
        return {
          ...c,
          isOtherUserBlocked: isBlocked,
          otherUserBlocked: isBlocked
        };
      });

      dispatch(setConversations(normalizedContent));

      // Dispatch online status of non-blocked peers to Redux onlineUsers list
      normalizedContent.forEach((c) => {
        if (c.receiver?.isOnline && !(c.isOtherUserBlocked || c.otherUserBlocked)) {
          dispatch(addOnlineUser(c.receiver.userId));
        }
      });

      // Synchronize total unread message counts from backend into Redux store
      try {
        const unreadCount = await messageService.getUnreadCounts();
        dispatch(setTotalUnreadCount(unreadCount));
      } catch (unreadErr) {
        console.error('Failed to sync unread counts:', unreadErr);
      }
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
      const reversed = [...messagesList].reverse().map((msg, index) => {
        const realId = msg.messageId || msg.id;
        const msgSenderId = msg.sender?.userId || msg.senderId;
        const msgReceiverId = msg.receiver?.userId || msg.receiverId;
        return {
          id: realId || `${msgSenderId || 'sender'}-${msg.receivedAt || msg.sentAt || msg.createdAt || 'timestamp'}-${index}`,
          messageId: realId || null,
          conversationId: msg.conversationId || conversationId,
          senderId: msgSenderId,
          receiverId: msgReceiverId,
          content: msg.content,
          timestamp: msg.receivedAt || msg.sentAt || msg.createdAt || new Date().toISOString(),
          isEdited: !!(msg.isEdited || msg.edited),
          editedAt: msg.editedAt || null,
          deletedFromEveryOne: !!(msg.deletedFromEveryOne || msg.isDeletedForEveryone),
          status: msg.status || null,
          reactions: Array.isArray(msg.reactions) ? msg.reactions : []
        };
      });

      // Cache under both conversationId (per layout instructions) and chatUserId (for hook lookup compatibility)
      dispatch(setMessages({ key: conversationId, messages: reversed }));
      dispatch(setMessages({ key: chatUserId, messages: reversed }));

      const isLastPage = response.last !== undefined ? response.last : (messagesList.length < 20);
      const paginationData = { page: 0, hasMore: !isLastPage, loadingOlder: false };
      dispatch(setPaginationInfo({ key: conversationId, ...paginationData }));
      dispatch(setPaginationInfo({ key: chatUserId, ...paginationData }));
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      dispatch(setLoadingMessages(false));
    }
  }, [dispatch]);

  // Fetch older historical messages for infinite upward scroll pagination
  const fetchOlderMessages = useCallback(async (chatUserId, conversationId) => {
    const targetChatUserId = chatUserId || selectedChatUserIdRef.current;
    if (!targetChatUserId) return { count: 0 };

    let targetConvId = conversationId;
    if (!targetConvId) {
      const conv = conversationListRef.current.find(
        (c) => c.receiver.userId.toLowerCase() === targetChatUserId.toLowerCase()
      );
      targetConvId = conv?.conversationId || targetChatUserId;
    }

    if (!targetConvId) return { count: 0 };

    // Retrieve latest pagination state from store / ref
    const currentPagination = paginationRef.current[targetConvId] || paginationRef.current[targetChatUserId] || { page: 0, hasMore: true, loadingOlder: false };

    if (!currentPagination.hasMore || currentPagination.loadingOlder) {
      return { count: 0 };
    }

    const nextPage = (currentPagination.page || 0) + 1;

    dispatch(setLoadingOlderMessages({ conversationId: targetConvId, chatUserId: targetChatUserId, loading: true }));

    try {
      const response = await messageService.getLatestMessages(targetConvId, nextPage, 20);
      const messagesList = response.content || [];
      const isLastPage = response.last !== undefined ? response.last : (messagesList.length < 20);

      // Verify active chat selection hasn't changed during network request
      if (selectedChatUserIdRef.current && selectedChatUserIdRef.current.toLowerCase() !== targetChatUserId.toLowerCase()) {
        console.log('Discarding older messages response for inactive chat:', targetChatUserId);
        dispatch(setLoadingOlderMessages({ conversationId: targetConvId, chatUserId: targetChatUserId, loading: false }));
        return { count: 0 };
      }

      // Reverse to chronological order (oldest first)
      const reversed = [...messagesList].reverse().map((msg, index) => {
        const realId = msg.messageId || msg.id;
        const msgSenderId = msg.sender?.userId || msg.senderId;
        const msgReceiverId = msg.receiver?.userId || msg.receiverId;
        return {
          id: realId || `${msgSenderId || 'sender'}-${msg.receivedAt || msg.sentAt || msg.createdAt || 'timestamp'}-${index}`,
          messageId: realId || null,
          conversationId: msg.conversationId || targetConvId,
          senderId: msgSenderId,
          receiverId: msgReceiverId,
          content: msg.content,
          timestamp: msg.receivedAt || msg.sentAt || msg.createdAt || new Date().toISOString(),
          isEdited: !!(msg.isEdited || msg.edited),
          editedAt: msg.editedAt || null,
          deletedFromEveryOne: !!(msg.deletedFromEveryOne || msg.isDeletedForEveryone),
          status: msg.status || null,
          reactions: Array.isArray(msg.reactions) ? msg.reactions : []
        };
      });

      dispatch(prependMessages({
        conversationId: targetConvId,
        chatUserId: targetChatUserId,
        messages: reversed,
        page: nextPage,
        hasMore: !isLastPage
      }));

      return { count: reversed.length, hasMore: !isLastPage };
    } catch (error) {
      console.error('Fetch older messages error:', error);
      dispatch(setLoadingOlderMessages({ conversationId: targetConvId, chatUserId: targetChatUserId, loading: false }));
      return { count: 0, error };
    }
  }, [dispatch]);

  // Mark messages as read for a conversation
  const markAsRead = useCallback(async (chatUserId, conversationId, currentUserId) => {
    if (!conversationId || !currentUserId) return;
    try {
      await messageService.markAsDelivered(currentUserId);
      await messageService.markAsRead(conversationId, currentUserId);
      dispatch(resetUnread(chatUserId));
      chatService.sendReadAck(conversationId);
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

  // Clear conversation history via backend REST call and local state reset
  const clearConversation = useCallback(async (chatUserId) => {
    if (!chatUserId) return;
    const conv = conversationListRef.current.find(
      (c) => c.receiver.userId.toLowerCase() === chatUserId.toLowerCase()
    );
    if (conv && conv.conversationId) {
      try {
        await conversationService.clearConversation(conv.conversationId);
      } catch (error) {
        console.error('Failed to clear conversation on backend:', error);
      }
    }
    dispatch(clearConversationAction(chatUserId));
  }, [dispatch]);

  // Remove conversation locally (resolves ChatHeader.jsx runtime crash)
  const removeConversation = useCallback((chatUserId) => {
    dispatch(removeConversationAction(chatUserId));
  }, [dispatch]);

  // Edits message via backend REST API and dispatches Redux update
  const editMessage = useCallback(async (conversationId, messageId, newContent) => {
    try {
      await messageService.editMessage(messageId, newContent);
      dispatch(updateEditedMessage({ conversationId, messageId, content: newContent }));
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }, [dispatch]);

  // Deletes message for everyone via backend REST API and dispatches Redux update
  const deleteForEveryone = useCallback(async (conversationId, messageId) => {
    try {
      await messageService.deleteForEveryone(messageId);
      dispatch(updateDeletedMessage({ conversationId, messageId }));
    } catch (error) {
      console.error('Delete for everyone error:', error);
      throw error;
    }
  }, [dispatch]);

  // Deletes message for me via backend REST API and dispatches Redux update
  const deleteForMe = useCallback(async (conversationId, messageId, chatUserId) => {
    try {
      await messageService.deleteForMe([messageId]);
      dispatch(deleteMessagesForMe({ conversationId, messageIds: [messageId], chatUserId }));
    } catch (error) {
      console.error('Delete for me error:', error);
      throw error;
    }
  }, [dispatch]);

  // Blocks user via backend REST API and dispatches Redux update
  const blockUser = useCallback(async (blockedUserId) => {
    if (!blockedUserId) return;
    try {
      await userService.blockUser(blockedUserId);
      dispatch(addBlockedUser(blockedUserId));
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  }, [dispatch]);

  // Unblocks user via backend REST API and dispatches Redux update
  const unblockUser = useCallback(async (blockedUserId) => {
    if (!blockedUserId) return;
    try {
      await userService.unblockUser(blockedUserId);
      dispatch(removeBlockedUser(blockedUserId));
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  }, [dispatch]);

  // Adds or updates message reaction via backend REST API and dispatches Redux update
  const addReaction = useCallback(async (conversationId, messageId, emoji) => {
    if (!messageId || !emoji) return;
    try {
      const response = await reactionService.addOrUpdateReaction(messageId, emoji);
      // Immediately update current user's UI using HTTP response
      dispatch(updateMessageReaction({
        conversationId: response.conversationId || conversationId,
        messageId: response.messageId || messageId,
        userId: response.userId || currentUserIdRef.current,
        emoji: response.emoji || emoji,
        action: response.action || 'ADDED'
      }));
      return response;
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  }, [dispatch]);

  // Removes message reaction via backend REST API and dispatches Redux update
  const removeReaction = useCallback(async (conversationId, messageId) => {
    if (!messageId) return;
    try {
      const response = await reactionService.removeReaction(messageId);
      // Immediately update current user's UI using HTTP response
      dispatch(updateMessageReaction({
        conversationId: response.conversationId || conversationId,
        messageId: response.messageId || messageId,
        userId: response.userId || currentUserIdRef.current,
        emoji: null,
        action: 'DELETED'
      }));
      return response;
    } catch (error) {
      console.error('Remove reaction error:', error);
      throw error;
    }
  }, [dispatch]);

  // Fetch raw conversation entities via GET /conversation/get
  const fetchRawConversations = useCallback(async (currentUserId, page = 0, size = 20) => {
    try {
      return await conversationService.getConversations(currentUserId, page, size);
    } catch (error) {
      console.error('Fetch raw conversations error:', error);
      throw error;
    }
  }, []);

  // Sends local typing status to the backend via WebSocket
  const sendTypingStatus = useCallback((isTyping) => {
    const activeUserId = selectedChatUserIdRef.current;
    if (!activeUserId) return;
    const conv = conversationListRef.current.find(
      (c) => c.receiver.userId.toLowerCase() === activeUserId.toLowerCase()
    );
    if (conv && conv.conversationId) {
      chatService.sendTypingStatus(conv.conversationId, isTyping);
    }
  }, []);

  const contextValue = useMemo(() => ({
    conversationList,
    conversations,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    fetchRawConversations,
    fetchMessages,
    fetchOlderMessages,
    pagination,
    markAsRead,
    startConversation,
    addMessage,
    updateConversationSummary,
    clearConversation,
    removeConversation,
    sendTypingStatus,
    editMessage,
    deleteForEveryone,
    deleteForMe,
    addReaction,
    removeReaction,
    blockUser,
    unblockUser
  }), [
    conversationList,
    conversations,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    fetchRawConversations,
    fetchMessages,
    fetchOlderMessages,
    pagination,
    markAsRead,
    startConversation,
    addMessage,
    updateConversationSummary,
    clearConversation,
    removeConversation,
    sendTypingStatus,
    editMessage,
    deleteForEveryone,
    deleteForMe,
    addReaction,
    removeReaction,
    blockUser,
    unblockUser
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
