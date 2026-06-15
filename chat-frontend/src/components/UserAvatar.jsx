import OnlineIndicator from './OnlineIndicator';

/**
 * REUSABLE USER AVATAR COMPONENT
 * 
 * Why this component exists:
 * - Unifies avatar rendering across the app (sidebar listing, header details, chat bubbles, user profile settings).
 * - Avoids duplication of fallback gradient logic and size classes.
 * 
 * Design Details:
 * - Generates initials automatically from the given user ID.
 * - Computes a deterministic gradient based on the character codes of the user ID, ensuring the same user always gets the same gradient.
 * - Supports sizes: 'xs' (24px), 'sm' (32px), 'md' (40px), 'lg' (48px), 'xl' (56px).
 * - Integrates status indicator positioning.
 */

// Preset premium gradient pairs for fallback avatars
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
  // Take first and last character or split by spaces if name
  const parts = cleanId.split(/[\s_-]+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanId.substring(0, 2).toUpperCase();
};

export const UserAvatar = ({ 
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
  
  // Use Dicebear avatar URL based on user ID for premium cartoon aesthetics, fallback to custom letter gradient
  const avatarSrc = imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userId || 'guest')}`;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      
      {/* Avatar circular frame */}
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
            // If Dicebear fails or offline, hide image and show initials
            e.target.style.display = 'none';
          }}
        />
        {/* Initials overlay in case image fails or is absent */}
        <span className="absolute">{initials}</span>
      </div>

      {/* Optional real-time status indicator dot */}
      {showStatus && (
        <OnlineIndicator 
          isOnline={isOnline} 
          size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'} 
          className="absolute bottom-0 right-0 border-2 border-white dark:border-slate-900 rounded-full"
        />
      )}
    </div>
  );
};

export default UserAvatar;
