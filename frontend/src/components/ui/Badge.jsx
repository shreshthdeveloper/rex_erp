import { cn, getStatusColor } from '../../utils/helpers';

const colorClasses = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800'
};

export function Badge({ 
  children, 
  variant = 'gray',
  size = 'md',
  className,
  ...props 
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        colorClasses[variant] || colorClasses.gray,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const color = getStatusColor(status);
  const displayText = status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Badge variant={color} className={className}>
      {displayText}
    </Badge>
  );
}
