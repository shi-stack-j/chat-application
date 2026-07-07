const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/chat-app/v1';

/**
 * Handles HTTP response validation and parses body/errors.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errText = await response.text();
    let errMsg = 'API Request failed.';
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.message || errJson.errorMessage || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const result = await response.json();
    console.log("Response is :- ", result);
    return result;
  }
  const result = await response.text();
  console.log("Response is :- ", result);
  return result;
};

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
      const response = await fetch(
        `${API_BASE_URL}/messages/get/latestMessages?page=${page}&size=${size}&sort=sentAt,desc`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ conversationId })
        }
      );
      return await handleResponse(response);
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
    try {
      const response = await fetch(`${API_BASE_URL}/messages/mark/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId
        },
        body: JSON.stringify({ conversationId })
      });
      return await handleResponse(response);
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
    try {
      const response = await fetch(`${API_BASE_URL}/messages/mark/delivered`, {
        method: 'POST',
        headers: {
          'X-User-Id': currentUserId
        }
      });
      return await handleResponse(response);
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
  getUnreadCounts = async (currentUserId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/get/unreadCounts`, {
        method: 'GET',
        headers: {
          'X-UserId': currentUserId
        }
      });
      const data = await handleResponse(response);
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
      const response = await fetch(`${API_BASE_URL}/messages/send/message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sender-Id': currentUserId,
          'X-Conversation-Id': String(conversationId)
        },
        body: JSON.stringify({
          receiver: message.receiver,
          content: message.content,
          sendAt: null // Set automatically by backend
        })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Send Message Fallback API Error:', error);
      throw error;
    }
  };
}

const messageService = new MessageService();
export default messageService;
