import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorState({ message, onRetry }: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-error/10 p-4">
        <AlertTriangle className="h-8 w-8 text-error" />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">Something went wrong</p>
      <p className="text-xs text-text-secondary mb-4 max-w-sm">{message || 'Failed to load data.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="h-8 text-xs px-3 rounded-lg">
          Try Again
        </Button>
      )}
    </div>
  );
}
