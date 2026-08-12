import { memo } from 'react';

const sizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

export const OnlineIndicator = memo(({
  isOnline = false,
  size = 'sm',
  className = ''
}) => {
  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <span
      className={`
        relative flex shrink-0 rounded-full ${sizeClass} ${className}
        ${isOnline ? 'bg-app-success' : 'bg-slate-400 dark:bg-slate-500'}
      `}
      title={isOnline ? 'Online' : 'Offline'}
      aria-label={isOnline ? 'Online' : 'Offline'}
    >
      {isOnline && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-success opacity-60" />
      )}
    </span>
  );
});

export default OnlineIndicator;
