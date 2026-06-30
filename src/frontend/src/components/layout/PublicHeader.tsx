import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/product', label: 'Product' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/architecture', label: 'Architecture' },
  { to: '/faq', label: 'FAQ' },
  { to: '/security', label: 'Security' },
  { to: '/status', label: 'Status' },
  { to: '/docs', label: 'Documentation' },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border-subtle backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-3 max-w-6xl">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-heading text-lg font-bold gradient-text flex items-center gap-1.5">
            Vallexis
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 text-xs font-semibold">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`transition-colors py-2 px-1 ${
                location.pathname === to
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2">
            Sign In
          </Link>
          <Button size="sm" asChild className="bg-blue-primary hover:bg-blue-vivid text-white shadow-md rounded-lg">
            <Link to="/register">Deploy Free</Link>
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none rounded-lg hover:bg-bg-surface/50 border border-transparent hover:border-border-subtle"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-subtle bg-bg-surface/95 backdrop-blur-md px-4 py-4 space-y-3 animate-fade-in">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2 border-b border-border-subtle/50"
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2">
              Sign In
            </Link>
            <Button asChild className="w-full bg-blue-primary hover:bg-blue-vivid text-white">
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Deploy Free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
