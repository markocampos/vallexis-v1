import { Link } from 'react-router-dom';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-surface font-body p-4">
      <FadeIn>
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-xl bg-blue-primary/10 flex items-center justify-center mx-auto border border-blue-primary/20">
            <MapPin className="h-8 w-8 text-blue-glow" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-4xl font-extrabold text-text-primary">404</h1>
            <h2 className="font-heading text-lg font-bold text-text-primary">Page not found</h2>
            <p className="text-sm text-text-secondary">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Button asChild className="bg-blue-primary hover:bg-blue-vivid text-white h-10 px-6">
            <Link to="/" className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </Card>
      </FadeIn>
    </div>
  );
}
