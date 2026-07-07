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
    return await response.json();
  }
  return await response.text();
};

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
      const response = await fetch(`${API_BASE_URL}/user/get/${userId}`, { method: 'GET' });
      return await handleResponse(response);
    } catch (error) {
      console.error(`Get User API Error for ${userId}:`, error);
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
  connectUser = async (targetId, currentUserId) => {
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