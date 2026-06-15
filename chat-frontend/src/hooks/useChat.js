import { useContext } from 'react';
import { ChatContext } from '../context/ChatContextInstance';

/**
 * useChat Hook
 * 
 * Why this hook exists:
 * - Abstracts the useContext(ChatContext) lookup, avoiding repetitive imports.
 * - Prevents runtime errors by throwing a clear exception if this hook is called outside the context provider boundary.
 * - Centralizes hook dependencies, making it easier for backend developers to insert middlewares, loggers, or event triggers.
 * 
 * Usage:
 *   const { conversations, addMessage, createConversation, removeConversation, clearConversation } = useChat();
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider. Make sure <ChatProvider> wraps the component tree.');
  }
  
  return context;
};

export default useChat;
