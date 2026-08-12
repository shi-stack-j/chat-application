import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { setCurrentUser } from '../features/auth/authSlice';
import { setGlobalLoading } from '../features/ui/uiSlice';
import { setOnlineUsers } from '../features/chat/chatSlice';
import toastHelper from '../utils/toastHelper';
import authService from '../services/authService';
import userService from '../services/userService';

/**
 * LANDING PAGE COMPONENT
 * 
 * Secure entry portal offering toggleable forms for:
 * 1. User Sign In (Login with credentials)
 * 2. User Sign Up (Register with credentials, nickname required)
 */
export const LandingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [nickName, setNickName] = useState('');

  // Password validation helper: 8-20 characters, uppercase, lowercase, digit, and special char
  const validatePassword = (pass) => {
    const minLength = pass.length >= 8 && pass.length <= 20;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
    return minLength && regex.test(pass);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const cleanUserId = userId.trim();
    const cleanPassword = password.trim();

    if (!cleanUserId || !cleanPassword) {
      toastHelper.error('User ID and Password are required.');
      return;
    }

    if (cleanUserId.length < 3) {
      toastHelper.error('User ID must be at least 3 characters.');
      return;
    }

    if (!validatePassword(cleanPassword)) {
      toastHelper.error(
        'Password must be 8-20 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).'
      );
      return;
    }

    dispatch(setGlobalLoading(true));

    if (isRegistering) {
      const cleanNickName = nickName.trim();
      if (!cleanNickName) {
        toastHelper.error('Nickname is required.');
        dispatch(setGlobalLoading(false));
        return;
      }

      // ---------------- REGISTER FLOW ----------------
      try {
        const payload = {
          userId: cleanUserId,
          password: cleanPassword,
          avatarUrl: null, // Avatar URL will be added/input later as requested
          nickName: cleanNickName
        };

        const responseText = await authService.register(payload);
        toastHelper.success(responseText || 'User Registered Successfully!');

        // Clear fields and switch to login mode
        setIsRegistering(false);
        setPassword('');
        setNickName('');
      } catch (error) {
        toastHelper.error(error.message || 'Registration failed.');
      } finally {
        dispatch(setGlobalLoading(false));
      }
    } else {
      // ---------------- LOGIN FLOW ----------------
      toastHelper.connection.connecting();
      try {
        const credentials = {
          userId: cleanUserId,
          password: cleanPassword
        };

        const loginResponse = await authService.login(credentials);
        const jwtToken = loginResponse.jwtToken;
        if (!jwtToken) {
          throw new Error('No JWT token returned from authentication server.');
        }
        
        // Store JWT token in localStorage for WebSocket connection handshake and API calls
        localStorage.setItem('token', jwtToken);

        // Fetch current user profile from backend using the newly acquired token
        const profile = await userService.getCurrentUser(jwtToken);

        // Save active user profile in Redux store
        dispatch(
          setCurrentUser({
            userId: profile.userId,
            nickname: profile.nickName || profile.userId,
            avatarUrl: profile.avatarUrl,
            token: jwtToken
          })
        );

        // Volatile storage of plain password to bypass backend one-time token deletion on websocket reconnects
        sessionStorage.setItem('cached_password', cleanPassword);

        // Reset list of online users
        dispatch(setOnlineUsers([]));

        toastHelper.connection.connected(profile.userId);

        // Navigate to the secure chat portal
        navigate('/chat');
      } catch (error) {
        const errMsg = error.message || '';
        if (errMsg.toLowerCase().includes('already loggedin') || errMsg.toLowerCase().includes('logout first')) {
          toastHelper.error('User is already logged in on another device or tab. Please log out from existing session first.');
        } else {
          toastHelper.error(errMsg || 'Login failed. Please check your credentials.');
        }
        toastHelper.connection.error(errMsg || 'Authentication handshake failed.');
      } finally {
        dispatch(setGlobalLoading(false));
      }
    }
  };

  return (
    <div className="relative w-screen min-h-screen flex flex-col justify-between p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-hidden">

      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none"></div>

      {/* Build Header info */}
      <header className="relative z-10 flex justify-end select-none">
        <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Build v1.2.0
        </span>
      </header>

      {/* Main portal entry card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="
          p-8 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl
          border border-slate-200/50 dark:border-slate-800/80
          shadow-2xl transition-all duration-300
        ">
          {/* Logo Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="
              w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600
              flex items-center justify-center text-white shadow-[0_4px_20px_rgba(99,102,241,0.35)] mb-4
            ">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-slate-200 dark:to-indigo-200 bg-clip-text text-transparent">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] font-medium leading-relaxed">
              {isRegistering
                ? 'Join ChatApp workspace by creating your profile credentials.'
                : 'Enter your credentials to access the secure chat workspace.'}
            </p>
          </div>

          {/* Form wrapper */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">

            {/* User ID Field */}
            <div>
              <label
                htmlFor="user-id"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5"
              >
                User ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="user-id"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. shivam_99"
                  required
                  className="
                    w-full pl-10 pr-4 py-3 text-sm
                    bg-slate-50/70 dark:bg-slate-950/60
                    border border-slate-200 dark:border-slate-800
                    focus:border-indigo-500 dark:focus:border-indigo-500
                    focus:ring-2 focus:ring-indigo-500/20
                    text-slate-900 dark:text-slate-100
                    placeholder-slate-400 dark:placeholder-slate-500
                    rounded-2xl focus:outline-hidden
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="
                    w-full pl-10 pr-4 py-3 text-sm
                    bg-slate-50/70 dark:bg-slate-950/60
                    border border-slate-200 dark:border-slate-800
                    focus:border-indigo-500 dark:focus:border-indigo-500
                    focus:ring-2 focus:ring-indigo-500/20
                    text-slate-900 dark:text-slate-100
                    placeholder-slate-400 dark:placeholder-slate-500
                    rounded-2xl focus:outline-hidden
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Registration-only fields */}
            {isRegistering && (
              <>
                {/* Nickname Field */}
                <div>
                  <label
                    htmlFor="nickname"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5"
                  >
                    Nickname
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      id="nickname"
                      type="text"
                      value={nickName}
                      onChange={(e) => setNickName(e.target.value)}
                      placeholder="e.g. Shivam Gangwar"
                      required
                      className="
                        w-full pl-10 pr-4 py-3 text-sm
                        bg-slate-50/70 dark:bg-slate-950/60
                        border border-slate-200 dark:border-slate-800
                        focus:border-indigo-500 dark:focus:border-indigo-500
                        focus:ring-2 focus:ring-indigo-500/20
                        text-slate-900 dark:text-slate-100
                        placeholder-slate-400 dark:placeholder-slate-500
                        rounded-2xl focus:outline-hidden
                        transition-all duration-200
                      "
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="
                w-full py-3.5 rounded-2xl font-semibold text-sm cursor-pointer mt-4
                bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                active:scale-98 transform hover:-translate-y-0.5 active:translate-y-0
                transition-all duration-200 flex items-center justify-center gap-2
              "
            >
              <span>{isRegistering ? 'Register & Create Account' : 'Sign In to Chat'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Toggle Sign In / Register state */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setPassword('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold cursor-pointer underline decoration-dotted transition-colors duration-200"
              >
                {isRegistering
                  ? 'Already have an account? Sign In here'
                  : "Don't have an account? Register here"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium select-none">
        Made By Shivam
      </footer>
    </div>
  );
};

export default LandingPage;
