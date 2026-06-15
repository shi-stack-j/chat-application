import { useNavigate } from 'react-router';

/**
 * NOT FOUND PAGE (404)
 * 
 * Why this page exists:
 * - Gracefully captures invalid routes (e.g. `/unknown-path`) and returns the user to safety.
 * - Prevents empty/broken frames when navigating or deep-linking.
 */
export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className={`
      w-screen h-screen flex flex-col items-center justify-center p-6 text-center select-none
      bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300
    `}>
      <div className="max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-2xl">
        
        {/* Animated 404 Visual badge */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Page Not Found
        </h1>

        {/* Informative descriptions */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          The link you followed might be broken, or the page may have been removed. Let's get you back to the application.
        </p>

        {/* Return Button */}
        <button
          onClick={() => navigate('/')}
          className="
            w-full py-3 px-4 rounded-xl font-semibold text-sm cursor-pointer
            bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-98
            transition-all duration-200
          "
        >
          Back to Portal
        </button>

      </div>
    </div>
  );
};

export default NotFoundPage;
