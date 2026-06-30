import { cn } from '@/lib/utils';

interface BackgroundPatternProps {
  className?: string;
}

export function BackgroundPattern({ className }: BackgroundPatternProps) {
  return (
    <>
      <div
        className={cn('absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none', className)}
        style={{ backgroundImage: "url('/background.avif')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-deep pointer-events-none" />
    </>
  );
}
