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
    <div className="h-full">
    <Provider store={store}>
      <ChatProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: 'text-sm',
            }}
          />
        </BrowserRouter>
      </ChatProvider>
    </Provider>
    </div>
  );
}

export default App;
