import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {emoji && (
        <div className="text-5xl mb-4 select-none" aria-hidden="true">
          {emoji}
        </div>
      )}
      {Icon && !emoji && (
        <div className="mb-4 rounded-full bg-bg-card p-4 border border-border-subtle">
          <Icon className="h-8 w-8 text-text-muted" />
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
