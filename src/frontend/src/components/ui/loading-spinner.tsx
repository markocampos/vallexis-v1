import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-blue-primary/20 border-t-blue-primary animate-spin',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <span
          className={cn('text-text-secondary', size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm')}
        >
          {text}
        </span>
      )}
    </div>
  );
}

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-deep">
      <div className="h-16 w-16 rounded-full border-[3px] border-blue-primary/20 border-t-blue-primary animate-spin" />
      {text && (
        <p className="text-text-secondary text-base animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 rounded-full border-2 border-current/20 border-t-current animate-spin',
        className
      )}
      aria-hidden="true"
    />
  );
}
