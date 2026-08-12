export const SidebarSkeleton = () => {
  return (
    <div className="space-y-4 p-4 animate-pulse select-none">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-app-border/70 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex justify-between gap-4">
              <div className="h-3 bg-app-border/70 rounded w-1/3" />
              <div className="h-2.5 bg-app-border/50 rounded w-10" />
            </div>
            <div className="h-3 bg-app-border/50 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MessageListSkeleton = () => {
  return (
    <div className="flex-1 space-y-5 p-4 animate-pulse overflow-hidden chat-canvas select-none min-h-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`
              h-14 w-48 sm:w-60 rounded-2xl bg-app-incoming
              ${i % 2 === 0 ? 'rounded-tr-sm bg-app-outgoing/40' : 'rounded-tl-sm'}
            `}
          />
        </div>
      ))}
    </div>
  );
};

export default {
  SidebarSkeleton,
  MessageListSkeleton
};
