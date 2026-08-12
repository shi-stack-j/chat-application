import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useSelector } from 'react-redux';
import { selectCurrentUserId } from '../features/auth/authSlice';

// Import Pages
import LandingPage from '../pages/LandingPage';
import ChatPage from '../pages/ChatPage';
import NotFoundPage from '../pages/NotFoundPage';
import Loader from '../components/Loader';
import { selectGlobalLoading, selectTheme } from '../features/ui/uiSlice';

/**
 * PROTECTED ROUTE COMPONENT
 * 
 * Why this component exists:
 * - Secures pages like `/chat` by ensuring a User ID is present in the Redux store.
 * - If a user directly visits `/chat` without entering a session user ID, we redirect them to `/`.
 */
const ProtectedRoute = ({ children }) => {
  const currentUserId = useSelector(selectCurrentUserId);

  if (!currentUserId) {
    // Redirect to landing page if user has not entered an identity ID
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * ROUTING CONFIGURATION
 * 
 * Routes:
 * - `/` : Entry portal (LandingPage) where the user sets their ID.
 * - `/chat` : Main layout (ChatPage) displaying the sidebar, conversation thread, and active panels. Protected.
 * - `/*` : Fallback 404 page (NotFoundPage).
 */
export const AppRoutes = () => {
  const isGlobalLoading = useSelector(selectGlobalLoading);
  const theme = useSelector(selectTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="h-full">
      {isGlobalLoading && <Loader />}
      
      <Routes>
        {/* Public landing portal */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected workspace */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default AppRoutes;
