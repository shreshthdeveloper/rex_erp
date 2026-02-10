import { cn, getInitials } from '../../utils/helpers';

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
};

const colorClasses = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-orange-500'
];

function getColorFromName(name) {
  if (!name) return colorClasses[0];
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return colorClasses[charCode % colorClasses.length];
}

export function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className 
}) {
  const initials = getInitials(name || alt);
  const bgColor = getColorFromName(name || alt);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium',
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({ avatars = [], max = 4, size = 'sm' }) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          {...avatar}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-medium ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
