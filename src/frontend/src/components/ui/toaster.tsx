import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = React.createContext<ToastContextValue | null>(null);

// ─── Variant Config ───────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: React.ElementType | null; bg: string; border: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-bg-surface',
    border: 'border-green-500/40',
    iconClass: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-bg-surface',
    border: 'border-red-500/40',
    iconClass: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-bg-surface',
    border: 'border-yellow-500/40',
    iconClass: 'text-yellow-500',
  },
  info: {
    icon: Info,
    bg: 'bg-bg-surface',
    border: 'border-blue-primary/40',
    iconClass: 'text-blue-primary',
  },
  default: {
    icon: null,
    bg: 'bg-bg-surface',
    border: 'border-border-subtle',
    iconClass: '',
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...opts }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({
      toast: addToast,
      success: (title, description) => addToast({ title, description, variant: 'success' }),
      error: (title, description) => addToast({ title, description, variant: 'error' }),
      warning: (title, description) => addToast({ title, description, variant: 'warning' }),
      info: (title, description) => addToast({ title, description, variant: 'info' }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => {
          const config = variantConfig[t.variant];
          const IconComponent = config.icon;
          return (
            <ToastPrimitives.Root
              key={t.id}
              duration={t.duration ?? 5000}
              onOpenChange={(open) => {
                if (!open) removeToast(t.id);
              }}
              className={cn(
                'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg',
                'transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
                'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
                'data-[state=open]:slide-in-from-bottom-full',
                config.bg,
                config.border
              )}
            >
              {IconComponent && (
                <span className="mt-0.5 shrink-0">
                  <IconComponent className={cn('h-5 w-5', config.iconClass)} />
                </span>
              )}
              <div className="flex-1 space-y-1">
                {t.title && (
                  <ToastPrimitives.Title className="text-sm font-semibold font-heading text-text-primary">
                    {t.title}
                  </ToastPrimitives.Title>
                )}
                {t.description && (
                  <ToastPrimitives.Description className="text-xs text-text-secondary">
                    {t.description}
                  </ToastPrimitives.Description>
                )}
              </div>
              <ToastPrimitives.Close
                className="shrink-0 rounded p-0.5 text-text-secondary/50 opacity-0 transition-opacity hover:text-text-secondary group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </ToastPrimitives.Close>
            </ToastPrimitives.Root>
          );
        })}
        <ToastPrimitives.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 md:bottom-6 md:right-6" />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
