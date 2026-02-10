import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2 className={cn('animate-spin text-blue-600', sizes[size], className)} />
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <Spinner size="xl" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message }) {
  return (
    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
      <Spinner size="lg" />
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="bg-gray-50 px-6 py-3 flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 flex gap-4 border-t border-gray-200 animate-pulse">
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
