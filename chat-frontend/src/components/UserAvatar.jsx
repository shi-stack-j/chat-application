import { memo } from 'react';
import OnlineIndicator from './OnlineIndicator';

/**
 * REUSABLE USER AVATAR COMPONENT
 * 
 * Unifies avatar rendering across the app. Wrapped in React.memo.
 */
const GRADIENT_PALETTES = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-teal-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-violet-600',
  'from-fuchsia-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-12 h-12 text-base font-semibold',
  xl: 'w-16 h-16 text-xl font-bold',
};

const getDeterministicGradient = (userId) => {
  if (!userId) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
};

const getInitials = (userId) => {
  if (!userId) return '?';
  const cleanId = userId.trim();
  if (cleanId.length <= 2) return cleanId.toUpperCase();
  const parts = cleanId.split(/[\s_-]+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanId.substring(0, 2).toUpperCase();
};

export const UserAvatar = memo(({ 
  userId, 
  imageUrl, 
  size = 'md', 
  showStatus = false, 
  isOnline = false,
  className = '' 
}) => {
  const initials = getInitials(userId);
  const gradient = getDeterministicGradient(userId);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  const avatarSrc = imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userId || 'guest')}`;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      
      <div 
        className={`
          ${sizeClass} 
          rounded-full flex items-center justify-center 
          bg-gradient-to-tr ${gradient} 
          text-white select-none overflow-hidden shadow-sm
          border border-slate-200/10 dark:border-slate-800/50
        `}
      >
        <img 
          src={avatarSrc} 
          alt={userId || 'User Avatar'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <span className="absolute">{initials}</span>
      </div>

      {showStatus && (
        <OnlineIndicator 
          isOnline={isOnline} 
          size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'} 
          className="absolute bottom-0 right-0 border-2 border-white dark:border-slate-900 rounded-full"
        />
      )}
    </div>
  );
});

export default UserAvatar;
