
/**
 * SIDEBAR SKELETON LOADER
 * 
 * Pulsing skeleton screen indicating conversation summaries are loading.
 */
export const SidebarSkeleton = () => {
  return (
    <div className="space-y-5 p-4 animate-pulse select-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3.5">
          {/* Avatar frame */}
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
          {/* Text lines */}
          <div className="flex-1 space-y-2 py-1 min-w-0">
            <div className="flex justify-between">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/12" />
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * MESSAGES THREAD SKELETON LOADER
 * 
 * Pulsing skeleton bubbles indicating active chat log loading.
 */
export const MessageListSkeleton = () => {
  return (
    <div className="flex-1 space-y-6 p-4 animate-pulse overflow-y-auto bg-slate-50/10 dark:bg-slate-950/2 select-none">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`
              max-w-[65%] px-4 py-2.5 rounded-2xl h-16 w-60 bg-slate-200 dark:bg-slate-800
              ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}
            `}
          >
            <div className="space-y-2 py-1">
              <div className="h-2 bg-slate-300 dark:bg-slate-700 rounded w-5/6" />
              <div className="h-2 bg-slate-300 dark:bg-slate-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  SidebarSkeleton,
  MessageListSkeleton
};
