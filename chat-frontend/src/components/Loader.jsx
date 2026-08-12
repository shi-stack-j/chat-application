export const Loader = ({ message = 'Please wait…' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/45 backdrop-blur-[2px]">
      <div className="bg-app-elevated border border-app-border rounded-2xl px-8 py-7 flex flex-col items-center shadow-xl">
        <div className="h-10 w-10 rounded-full border-[3px] border-app-border border-t-app-primary animate-spin" />
        <p className="mt-4 text-sm font-medium text-app-text">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loader;
