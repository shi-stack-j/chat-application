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
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
    console.log('API Response JSON:', data);
    return data;
  }
  data = await response.text();
  console.log('API Response Text:', data);
  return data;
};

/**
 * Centralized API client client.
 * Auto-injects Authorization Bearer tokens from localStorage.
 */
const apiClient = {
  request: async (endpoint, options = {}) => {
    let token = localStorage.getItem('token');
    const headers = {
      ...options.headers,
    };

    // Inject JSON content-type by default unless body is not JSON or custom header overrides
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };
    console.log(`API Request: ${config.method || 'GET'} ${endpoint}`, config);
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If 401 Unauthorized, try to refresh the token using cached credentials
    if (response.status === 401 && !options._retry) {
      const userId = localStorage.getItem('userId');
      const cachedPassword = sessionStorage.getItem('cached_password');
      if (userId && cachedPassword) {
        console.log('JWT expired. Attempting background token refresh...');
        try {
          const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, password: cachedPassword })
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const newToken = loginData.jwtToken;
            if (newToken) {
              localStorage.setItem('token', newToken);

              // Fetch user profile with new token to refresh auth status
              const profileResponse = await fetch(`${API_BASE_URL}/user/current/user`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${newToken}`
                }
              });

              if (profileResponse.ok) {
                const profileData = await profileResponse.json();

                // Dynamic imports to avoid circular dependency
                const { store } = await import('../app/store');
                const { setCurrentUser } = await import('../features/auth/authSlice');
                
                store.dispatch(
                  setCurrentUser({
                    userId: profileData.userId,
                    nickname: profileData.nickName || profileData.userId,
                    avatarUrl: profileData.avatarUrl,
                    token: newToken
                  })
                );

                // Retry original request with new token
                config.headers['Authorization'] = `Bearer ${newToken}`;
                config._retry = true;
                response = await fetch(`${API_BASE_URL}${endpoint}`, config);
              }
            } else {
              localStorage.removeItem('token');
              sessionStorage.removeItem('cached_password');
            }
          }
        } catch (error) {
          console.error('Transparent background token refresh failed:', error);
          localStorage.removeItem('token');
          sessionStorage.removeItem('cached_password');
        }
      } else {
        localStorage.removeItem('token');
      }
    }

    return handleResponse(response);
  },

  get: (endpoint, options = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'GET' });
  },

  post: (endpoint, body, options = {}) => {
    console.log(`POST Request to ${endpoint} with body:`, body);
    const config = {
      ...options,
      method: 'POST',
    };
    if (body !== undefined && body !== null) {
      config.body = JSON.stringify(body);
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Content-Type'] = 'application/json';
    }
    return apiClient.request(endpoint, config);
  },

  put: (endpoint, body, options = {}) => {
    const config = {
      ...options,
      method: 'PUT',
    };
    if (body !== undefined && body !== null) {
      config.body = JSON.stringify(body);
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Content-Type'] = 'application/json';
    }
    return apiClient.request(endpoint, config);
  },

  delete: (endpoint, options = {}) => {
    return apiClient.request(endpoint, { ...options, method: 'DELETE' });
  }
};

export default apiClient;
