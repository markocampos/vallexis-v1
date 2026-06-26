import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    startTimeRef.current = Date.now();
    
    const loop = () => {
      if (startTimeRef.current === null) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / 1500) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        logout();
      } else {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const endHold = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass border-b border-border-subtle">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-bg-card transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="font-heading text-base sm:text-lg md:text-xl font-bold gradient-text">
                Vallexis
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 rounded-full glass border border-border-subtle hover:border-border-interactive transition-colors cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 text-text-primary text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass border border-border-subtle" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-2.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-text-primary">{user.name}</p>
                      <p className="text-xs leading-none text-text-muted">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="cursor-pointer flex items-center text-text-secondary hover:text-text-primary w-full p-2.5 rounded-lg hover:bg-bg-card transition-colors">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  <DropdownMenuItem
                    className="cursor-pointer text-error hover:bg-error/10 p-2.5 rounded-lg transition-colors flex items-center"
                    onClick={() => setShowLogoutModal(true)}
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
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-blue-primary text-white rounded-lg hover:bg-blue-vivid transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Hold-to-Confirm Dialog */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">Confirm Log Out</h3>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed mb-5">
              Hold the action button down for 1.5 seconds to confirm you really want to log out.
            </p>
            <div className="flex gap-2 justify-end text-xs">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowLogoutModal(false);
                  endHold();
                }} 
                className="h-9 text-xs px-3 rounded-lg border-border-subtle"
              >
                Cancel
              </Button>
              <button
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                className="relative overflow-hidden h-9 px-4 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-semibold select-none cursor-pointer active:scale-95 transition-transform flex items-center justify-center min-w-[140px]"
              >
                {/* Hold Progress Indicator */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-error/25 transition-all ease-linear"
                  style={{ 
                    width: `${progress}%`, 
                    transitionDuration: progress === 0 ? '150ms' : '0ms' 
                  }}
                />
                <span className="relative z-10">
                  {progress > 0 ? `Holding (${Math.round(progress)}%)` : 'Hold to Log Out'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
