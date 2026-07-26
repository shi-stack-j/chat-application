import apiClient from './apiClient';

class UserService {
  /**
   * Fetches user profile status by ID.
   * GET /user/get/{userId}
   * 
   * @param {string} userId - User's business key
   * @returns {Promise<Object>} UserResDto - { userId, nickName, avatarUrl, isOnline }
   */
  getUser = async (userId) => {
    try {
      return await apiClient.get(`/user/get/${userId}`);
    } catch (error) {
      console.error(`Get User API Error for ${userId}:`, error);
      throw error;
    }
  };

  /**
   * Fetches the current logged in user's profile details using a JWT token.
   * GET /user/current/user
   * 
   * @param {string} token - Optional token (passed to override if needed)
   * @returns {Promise<Object>} UserResDto - { userId, nickName, avatarUrl, isOnline }
   */
  getCurrentUser = async (token) => {
    try {
      const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
      return await apiClient.get('/user/current/user', options);
    } catch (error) {
      console.error('Get Current User API Error:', error);
      throw error;
    }
  };

  /**
   * Alias for compatibility.
   */
  getAllUsers = async (userId) => {
    return this.getUser(userId);
  };

  /**
   * Initiates a check on a target user before starting chats.
   * 
   * @param {string} targetId 
   * @param {string} currentUserId 
   * @returns {Promise<Object>} Standardized connection info wrapper
   */
  connectUser = async (targetId) => {
    try {
      const data = await this.getUser(targetId);
      return {
        success: true,
        user: {
          userId: data.userId,
          nickname: data.nickName || data.userId,
          avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.userId)}`,
          status: (data.isOnline !== undefined ? data.isOnline : data.online) ? 'online' : 'offline'
        }
      };
    } catch (error) {
      console.error(`Connect User validation failed for ${targetId}:`, error);
      throw error;
    }
  };
}

const userService = new UserService();
export default userService;