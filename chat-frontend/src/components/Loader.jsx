// Reusable Loader Component

/**
 * REUSABLE LOADER COMPONENT
 * 
 * Why this component exists:
 * - Provides a premium, unified loading screen for blocking operations (e.g. connecting to server).
 * - Avoids duplication of overlay layout code and custom spin animations.
 * 
 * Design Details:
 * - Uses backdrop blur (`backdrop-blur-md`) and a semi-transparent dark background for glassmorphic elegance.
 * - Double ring custom animated spinner for high visual appeal.
 */
export const Loader = ({ message = 'Setting up secure connection...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md transition-all duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
        {/* Inner Ring - Counter spinning */}
        <div className="absolute w-10 h-10 rounded-full border-4 border-indigo-500/20 border-b-indigo-400 animate-spin [animation-direction:reverse] [animation-duration:1s]"></div>
      </div>
      
      {/* Informative text below the spinner */}
      <p className="mt-5 text-sm font-semibold tracking-wide text-slate-200 dark:text-slate-100 animate-pulse">
        {message}
      </p>
      
      {/* Subtext explaining it is frontend-only for now */}
      <span className="mt-2 text-xs text-slate-400 max-w-xs text-center px-4">
        Ready for backend WebSocket binding
      </span>
    </div>
  );
};

export default Loader;
