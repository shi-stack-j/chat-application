import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { setCurrentUser } from '../features/auth/authSlice';
import { setGlobalLoading, selectGlobalLoading, selectTheme, toggleTheme } from '../features/ui/uiSlice';
import { setOnlineUsers } from '../features/chat/chatSlice';
import toastHelper from '../utils/toastHelper';
import authService from '../services/authService';
import userService from '../services/userService';

export const LandingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectGlobalLoading);
  const theme = useSelector(selectTheme);

  const [isRegistering, setIsRegistering] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [nickName, setNickName] = useState('');

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

      try {
        const payload = {
          userId: cleanUserId,
          password: cleanPassword,
          avatarUrl: null,
          nickName: cleanNickName
        };

        const responseText = await authService.register(payload);
        toastHelper.success(responseText || 'User Registered Successfully!');

        setIsRegistering(false);
        setPassword('');
        setNickName('');
      } catch (error) {
        toastHelper.error(error.message || 'Registration failed.');
      } finally {
        dispatch(setGlobalLoading(false));
      }
    } else {
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

        localStorage.setItem('token', jwtToken);

        const profile = await userService.getCurrentUser(jwtToken);

        dispatch(
          setCurrentUser({
            userId: profile.userId,
            nickname: profile.nickName || profile.userId,
            avatarUrl: profile.avatarUrl,
            token: jwtToken
          })
        );

        sessionStorage.setItem('cached_password', cleanPassword);
        dispatch(setOnlineUsers([]));
        toastHelper.connection.connected(profile.userId);
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

  const fieldClass = `
    w-full pl-10 pr-4 h-11 text-sm
    bg-app-bg border border-app-border
    focus:border-app-primary focus:ring-2 focus:ring-app-primary/20
    text-app-text placeholder:text-app-muted
    rounded-xl outline-none
    transition-colors duration-150
  `;

  return (
    <div className="relative w-full h-full overflow-y-auto bg-app-bg text-app-text">
      <div className="min-h-full flex flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-app-primary text-white dark:text-slate-950 flex items-center justify-center">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">ChatApp</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className="h-9 w-9 rounded-xl text-app-muted hover:bg-app-surface hover:text-app-text cursor-pointer inline-flex items-center justify-center"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md bg-app-surface border border-app-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-app-text">
                {isRegistering ? 'Create your account' : 'Sign in'}
              </h1>
              <p className="text-sm text-app-muted mt-1.5 leading-relaxed">
                {isRegistering
                  ? 'Choose a user ID and password to join ChatApp.'
                  : 'Enter your credentials to open your conversations.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label htmlFor="user-id" className="block text-xs font-semibold text-app-muted mb-1.5">
                  User ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    id="user-id"
                    type="text"
                    autoComplete="username"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="your_user_id"
                    required
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-app-muted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type="password"
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={fieldClass}
                  />
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label htmlFor="nickname" className="block text-xs font-semibold text-app-muted mb-1.5">
                    Nickname
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      id="nickname"
                      type="text"
                      value={nickName}
                      onChange={(e) => setNickName(e.target.value)}
                      placeholder="Display name"
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full h-11 rounded-xl font-semibold text-sm cursor-pointer mt-2
                  bg-app-primary hover:bg-app-primary-hover
                  text-white dark:text-slate-950
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors duration-150
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary
                "
              >
                {isLoading
                  ? (isRegistering ? 'Creating account…' : 'Signing in…')
                  : (isRegistering ? 'Create account' : 'Sign in')}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setPassword('');
                  }}
                  className="text-sm text-app-primary hover:underline font-medium cursor-pointer"
                >
                  {isRegistering
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
