// Reusable Empty State Component

/**
 * REUSABLE EMPTY STATE COMPONENT
 * 
 * Why this component exists:
 * - Solves the visual empty-slot problem when the user has logged in but has not yet clicked a chat conversation.
 * - Educates the user on how to initiate chats (using the search box or selecting online users).
 * 
 * Design Details:
 * - Premium glassmorphic background container.
 * - Custom illustrated SVG icon with gradient highlights.
 */
export const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/20 text-center">
      <div className="max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 shadow-xl backdrop-blur-md animate-fade-in">
        
        {/* Modern Illustrated SVG chat graphic */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400 animate-bounce [animation-duration:3s]">
            <svg 
              className="w-12 h-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
          Private Real-time Messenger
        </h2>

        {/* Instructive Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Select an active conversation from the sidebar, choose a peer from the online users tray, or search for a specific User ID to open a new private session.
        </p>

        {/* Technical Notice Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 mr-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ready for WebSocket Binding
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
