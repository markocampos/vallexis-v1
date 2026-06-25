import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User, CreditCard, Menu } from 'lucide-react';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
  };
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const location = useLocation();
  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-deep/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md hover:bg-bg-card transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="font-heading text-lg sm:text-xl font-bold text-blue-primary">
              Vallexis
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-text-primary ${
              location.pathname === '/dashboard'
                ? 'text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard/projects"
            className={`text-sm font-medium transition-colors hover:text-text-primary ${
              location.pathname === '/dashboard/projects'
                ? 'text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            Projects
          </Link>
          <Link
            to="/dashboard/billing"
            className={`text-sm font-medium transition-colors hover:text-text-primary ${
              location.pathname === '/dashboard/billing'
                ? 'text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            Billing
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-9 w-9 rounded-full border border-border-subtle bg-bg-card hover:bg-bg-card/80 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-primary/15 text-blue-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-text-muted">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-error"
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-2 text-sm font-medium bg-blue-primary text-text-primary rounded-lg hover:bg-blue-vivid transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
