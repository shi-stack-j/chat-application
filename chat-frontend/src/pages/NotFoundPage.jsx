import { useNavigate } from 'react-router';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-app-bg text-app-text">
      <div className="max-w-md w-full p-8 rounded-2xl bg-app-surface border border-app-border">
        <p className="text-xs font-semibold tracking-widest text-app-muted uppercase mb-3">404</p>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Page not found
        </h1>
        <p className="text-sm text-app-muted mb-6 leading-relaxed">
          That link doesn’t exist. Return to ChatApp to continue.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="
            w-full h-11 rounded-xl font-semibold text-sm cursor-pointer
            bg-app-primary hover:bg-app-primary-hover
            text-white dark:text-slate-950
          "
        >
          Back to ChatApp
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
