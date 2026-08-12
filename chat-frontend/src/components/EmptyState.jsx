export const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 chat-canvas text-center">
      <div className="max-w-md w-full px-6 py-8 rounded-2xl bg-app-surface border border-app-border animate-fade-in">
        <div className="flex justify-center mb-5">
          <div className="h-14 w-14 rounded-2xl bg-app-primary-soft text-app-primary flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-app-text mb-2">
          Select a conversation
        </h2>
        <p className="text-sm text-app-muted leading-relaxed">
          Choose a chat from the sidebar, pick someone who’s online, or search a user ID to start a private message.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
