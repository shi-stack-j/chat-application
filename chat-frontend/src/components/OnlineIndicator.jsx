// Reusable Online Indicator Component

/**
 * REUSABLE ONLINE INDICATOR DOT
 * 
 * Why this component exists:
 * - Provides a clean visual standard for indicating connection state (online vs offline).
 * - Avoids duplication of color classes and sizing math.
 */

const sizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export const OnlineIndicator = ({ 
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
      {/* 
        Add a subtle glowing pulse animation for online users 
        to enhance the dynamic and premium appearance of the application.
      */}
      {isOnline && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
      )}
    </span>
  );
};

export default OnlineIndicator;
