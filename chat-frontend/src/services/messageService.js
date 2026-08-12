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
      let res=await apiClient.post(
        `/messages/get/latestMessages?page=${page}&size=${size}&sort=sentAt,desc`,
        { conversationId } );
        console.log("Message response is :- ",res);
      return res;
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
          tempMessageId: message.tempMessageId || message.id,
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

  /**
   * Edits content of an existing message sent within 30 minutes.
   * PUT /messages/edit
   * 
   * @param {number} messageId 
   * @param {string} newContent 
   * @returns {Promise<string>} Status message
   */
  editMessage = async (messageId, newContent) => {
    try {
      console.log(`Editing message ID ${messageId} with new content: ${newContent}`);
      return await apiClient.put('/messages/edit', {
        messageId: Number(messageId),
        newContent
      });
    } catch (error) {
      console.error(`Edit Message API Error for ID ${messageId}:`, error);
      throw error;
    }
  };

  /**
   * Deletes a message for everyone within 30 minutes.
   * DELETE /messages/{messageId}/delete-for-everyone
   * 
   * @param {number} messageId 
   * @returns {Promise<string>} Status message
   */
  deleteForEveryone = async (messageId) => {
    try {
      return await apiClient.delete(`/messages/${messageId}/delete-for-everyone`);
    } catch (error) {
      console.error(`Delete For Everyone API Error for ID ${messageId}:`, error);
      throw error;
    }
  };

  /**
   * Deletes one or more messages only for the current user.
   * DELETE /delete-for-me
   * 
   * @param {Array<number>|number} messageIds 
   * @returns {Promise<string>} Status message
   */
  deleteForMe = async (messageIds) => {
    try {
      const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
      return await apiClient.delete('/delete-for-me', {
        body: JSON.stringify({ deleteMessageIds: ids.map(Number) }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Delete For Me API Error:', error);
      throw error;
    }
  };
}

const messageService = new MessageService();
export default messageService;
