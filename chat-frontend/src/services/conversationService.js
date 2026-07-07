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
    console.log("All conversations are  :- ", result);
    return result;
  }
  const result = await response.text();
  console.log("All conversations are  is :- ", result);
  return result;
};

class ConversationService {
  /**
   * Fetches or creates a 1-to-1 conversation session between two users.
   * POST /conversation/create
   * 
   * @param {string} receiverId - ID of recipient user
   * @param {string} currentUserId - ID of current user (sender)
   * @returns {Promise<Object>} ConversationDto
   */
  createConversation = async (receiverId, currentUserId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sender-Id': currentUserId
        },
        body: JSON.stringify({ receiverId })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Create Conversation API Error:', error);
      throw error;
    }
  };

  /**
   * Retrieves raw conversations for a user.
   * GET /conversation/get
   * 
   * @param {string} currentUserId 
   * @param {number} page 
   * @param {number} size 
   * @returns {Promise<Object>} Page<ConversationEn>
   */
  getConversations = async (currentUserId, page = 0, size = 20) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversation/get?page=${page}&size=${size}&sort=lastMessageAt,desc`,
        {
          method: 'GET',
          headers: {
            'X-Sender-Id': currentUserId
          }
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get Conversations API Error:', error);
      throw error;
    }
  };

  /**
   * Retrieves conversation summaries for the sidebar chat listing.
   * GET /conversation/get/conversationSummary
   * 
   * @param {string} currentUserId 
   * @param {number} page 
   * @param {number} size 
   * @returns {Promise<Object>} Page<ConversationSummaryResDto>
   */
  getConversationSummaries = async (currentUserId, page = 0, size = 20) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversation/get/conversationSummary?page=${page}&size=${size}&sort=lastMessageAt,desc`,
        {
          method: 'GET',
          headers: {
            'X-User-Id': currentUserId
          }
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get Conversation Summaries API Error:', error);
      throw error;
    }
  };
}

const conversationService = new ConversationService();
export default conversationService;
