import apiClient from './apiClient';

/**
 * REACTION SERVICE
 * 
 * Communicates with the backend Message Reaction APIs:
 * - POST /reactions/add-update: Adds or updates an emoji reaction for a message
 * - DELETE /reactions/remove/{messageId}: Removes the current user's reaction on a message
 */
class ReactionService {
  /**
   * Adds or updates a reaction on a message for the current user.
   * POST /reactions/add-update
   * 
   * @param {number|string} messageId 
   * @param {string} emoji 
   * @returns {Promise<Object>} MessageReactionResponseDto { conversationId, messageId, userId, emoji, action }
   */
  addOrUpdateReaction = async (messageId, emoji) => {
    try {
      console.log(`Adding/updating reaction ${emoji} for message ID ${messageId}`);
      return await apiClient.post('/reactions/add-update', {
        messageId: Number(messageId),
        emoji
      });
    } catch (error) {
      console.error(`Add/Update Reaction API Error for message ID ${messageId}:`, error);
      throw error;
    }
  };

  /**
   * Removes the current user's reaction from a message.
   * DELETE /reactions/remove/{messageId}
   * 
   * @param {number|string} messageId 
   * @returns {Promise<Object>} MessageReactionResponseDto { conversationId, messageId, userId, emoji: null, action: 'DELETED' }
   */
  removeReaction = async (messageId) => {
    try {
      console.log(`Removing reaction for message ID ${messageId}`);
      return await apiClient.delete(`/reactions/remove/${Number(messageId)}`);
    } catch (error) {
      console.error(`Remove Reaction API Error for message ID ${messageId}:`, error);
      throw error;
    }
  };
}

const reactionService = new ReactionService();
export default reactionService;
