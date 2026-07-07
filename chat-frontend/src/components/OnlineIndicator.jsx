import React, { memo } from 'react';

/**
 * REUSABLE ONLINE INDICATOR DOT
 * 
 * Provides a clean visual indicator of online presence. Wrapped in React.memo.
 */
const sizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
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
        ${isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}
      `}
      title={isOnline ? 'Online' : 'Offline'}
    >
      {isOnline && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
      )}
    </span>
  );
});

export default OnlineIndicator;
