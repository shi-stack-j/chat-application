import apiClient from './apiClient';

class MessageService {
  /**
   * Fetches latest messages for a specific conversation session.
   * POST /messages/get/latestMessages
   * 
   * @param {number} conversationId 
   * @param {number} page 
   * @param {number} size 
   * @returns {Promise<Object>} Page<MessageResDto>
   */
  getLatestMessages = async (conversationId, page = 0, size = 20) => {
    try {
      console.log("Conversation ID is :- ", conversationId);
      return await apiClient.post(
        `/messages/get/latestMessages?page=${page}&size=${size}&sort=sentAt,desc`,
        { conversationId }
      );
    } catch (error) {
      console.error(`Get Latest Messages API Error for ID ${conversationId}:`, error);
      throw error;
    }
  };

  /**
   * Marks all messages within a conversation as read.
   * POST /messages/mark/read
   * 
   * @param {number} conversationId 
   * @param {string} currentUserId 
   * @returns {Promise<string>} Status message
   */
  markAsRead = async (conversationId, currentUserId) => {
    console.log(`Marking messages as read for conversation ${conversationId} and user ${currentUserId}`);
    try {
      return await apiClient.post(
        '/messages/mark/read',
        { conversationId }
      );
    } catch (error) {
      console.error(`Mark As Read API Error for conversation ${conversationId}:`, error);
      throw error;
    }
  };

  /**
   * Marks all messages for the current user as delivered.
   * POST /messages/mark/delivered
   * 
   * @param {string} currentUserId 
   * @returns {Promise<string>} Status message
   */
  markAsDelivered = async (currentUserId) => {
    console.log(`Marking messages as delivered for user ${currentUserId}`);
    try {
      return await apiClient.post(
        '/messages/mark/delivered',null
      );
    } catch (error) {
      console.error(`Mark As Delivered API Error for user ${currentUserId}:`, error);
      throw error;
    }
  };

  /**
   * Fetches the total number of unread messages across all conversations.
   * GET /messages/get/unreadCounts
   * 
   * @param {string} currentUserId 
   * @returns {Promise<number>} Unread count
   */
  getUnreadCounts = async () => {
    try {
      const data = await apiClient.get('/messages/get/unreadCounts', {});
      return parseInt(data, 10) || 0;
    } catch (error) {
      console.error('Get Unread Counts API Error:', error);
      throw error;
    }
  };

  /**
   * REST-based fallback for sending messages when WebSocket is unavailable.
   * POST /messages/send/message/
   * 
   * @param {Object} message - { receiver, content }
   * @param {string} currentUserId 
   * @param {number} conversationId 
   * @returns {Promise<string>} Status message
   */
  sendMessageFallback = async (message, currentUserId, conversationId) => {
    try {
      return await apiClient.post(
        '/messages/send/message/',
        {
          receiver: message.receiver,
          content: message.content,
          sendAt: null // Set automatically by backend
        },
        {
          headers: {
            'X-Sender-Id': currentUserId,
            'X-Conversation-Id': String(conversationId)
          }
        }
      );
    } catch (error) {
      console.error('Send Message Fallback API Error:', error);
      throw error;
    }
  };
}

const messageService = new MessageService();
export default messageService;
