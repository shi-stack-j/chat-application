import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import { ChatProvider } from './context/ChatContext';
import AppRoutes from './routes/AppRoutes';

/**
 * ROOT APPLICATION ENTRYPOINT
 * 
 * Why this file exists:
 * - Serves as the bootstrapping root of the React application.
 * - Wraps the component tree with necessary global provider shells:
 *   1. Redux Store Provider: Connects global slices (current user, active selection, theme, online list).
 *   2. Chat Provider (Context API): Provides direct message databases and session storage utilities.
 *   3. Browser Router: Handles client-side navigation.
 *   4. Toaster: Renders react-hot-toast messages overlay at the absolute root.
 */
function App() {
  return (
    <Provider store={store}>
      <ChatProvider>
        <BrowserRouter>
          {/* Application routing map */}
          <AppRoutes />
          
          {/* 
            React Hot Toast Configuration
            Positioned at bottom-right for desktop and top-center for mobile notifications.
          */}
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              duration: 4000,
              // Overridden by toastHelper custom styles
            }}
          />
        </BrowserRouter>
      </ChatProvider>
    </Provider>
  );
}

export default App;
