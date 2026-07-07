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
      console.log("Response is :- ", response);
      console.log("Error is :- ", errJson);
      errMsg = errJson.message || errJson.errorMessage || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    console.log("Response is without error :- ", response);
    return await response.json();
  }
  console.log("Response is with error :- ", response);
  return await response.text();
};

class AuthService {
  /**
   * Registers a new user account.
   * POST /auth/register
   * 
   * @param {Object} registerData - { userId, password, nickName, avatarUrl }
   * @returns {Promise<string>} Success message
   */
  register = async (registerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Registration API Error:', error);
      throw error;
    }
  };

  /**
   * Logs in an existing user and returns session details + token.
   * POST /auth/login
   * 
   * @param {Object} credentials - { userId, password }
   * @returns {Promise<Object>} LogResDto - { userId, nickName, avatarUrl, token }
   */
  login = async (credentials) => {
    try {
      console.log("Credentials are :- ", credentials);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  };

  /**
   * Checks backend system health.
   * GET /auth/health
   * 
   * @returns {Promise<string>} Health status
   */
  healthCheck = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/health`, { method: 'GET' });
      return await handleResponse(response);
    } catch (error) {
      console.error('Health Check API Error:', error);
      throw error;
    }
  };
}

const authService = new AuthService();
export default authService;
