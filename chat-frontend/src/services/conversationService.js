import apiClient from './apiClient';

class ConversationService {
  /**
   * Fetches or creates a 1-to-1 conversation session between two users.
   * POST /conversation/create
   * 
   * @param {string} receiverId - ID of recipient user
   * @param {string} currentUserId - ID of current user (sender)
   * @returns {Promise<Object>} ConversationDto
   */
  createConversation = async (receiverId) => {
    try {
      return await apiClient.post('/conversation/create', { receiverId });
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
      return await apiClient.get(
        `/conversation/get?page=${page}&size=${size}&sort=lastMessageAt,desc`
      );
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
      return await apiClient.get(
        `/conversation/get/conversationSummary?page=${page}&size=${size}&sort=lastMessageAt,desc`
      );
    } catch (error) {
      console.error('Get Conversation Summaries API Error:', error);
      throw error;
    }
  };

  /**
   * Clears all messages in a conversation for the current user.
   * POST /{conversationId}/clear
   * 
   * @param {number} conversationId 
   * @returns {Promise<string>} Success message
   */
  clearConversation = async (conversationId) => {
    try {
      return await apiClient.post(`/${conversationId}/clear`);
    } catch (error) {
      console.error(`Clear Conversation API Error for ${conversationId}:`, error);
      throw error;
    }
  };
}

const conversationService = new ConversationService();
export default conversationService;
