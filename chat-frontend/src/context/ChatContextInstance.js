import { createContext } from 'react';

/**
 * CHAT CONTEXT INSTANCE
 * 
 * Why this file exists:
 * - Decouples the React Context creation from the Provider component file.
 * - This resolves the Vite Fast Refresh warning ("Fast refresh only works when a file only exports components.
 *   Move your React context(s) to a separate file").
 */
export const ChatContext = createContext(null);

export default ChatContext;
