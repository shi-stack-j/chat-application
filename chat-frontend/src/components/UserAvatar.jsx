import { memo, useState } from 'react';
import OnlineIndicator from './OnlineIndicator';

const PALETTES = [
  'from-teal-600 to-emerald-600',
  'from-cyan-700 to-teal-600',
  'from-slate-600 to-slate-800',
  'from-emerald-700 to-teal-700',
  'from-sky-700 to-cyan-700',
  'from-stone-600 to-neutral-700',
  'from-teal-800 to-cyan-800',
  'from-zinc-600 to-slate-700',
];

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-12 h-12 text-base font-semibold',
  xl: 'w-16 h-16 text-xl font-bold',
};

const getDeterministicGradient = (userId) => {
  if (!userId) return PALETTES[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
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
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(userId);
  const gradient = getDeterministicGradient(userId);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const avatarSrc = imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userId || 'guest')}`;
  const showImage = Boolean(avatarSrc) && !imgError;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`
          ${sizeClass}
          rounded-full flex items-center justify-center
          bg-gradient-to-br ${gradient}
          text-white select-none overflow-hidden
          ring-2 ring-app-surface
        `}
      >
        {showImage ? (
          <img
            src={avatarSrc}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showStatus && (
        <OnlineIndicator
          isOnline={isOnline}
          size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'}
          className="absolute bottom-0 right-0 ring-2 ring-app-surface rounded-full"
        />
      )}
    </div>
  );
});

export default UserAvatar;
