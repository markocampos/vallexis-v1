import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, HardDrive, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/dashboard/storage', label: 'Storage', icon: HardDrive, end: false },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard, end: false },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 glass border-t border-border-subtle" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="flex h-full items-center justify-around px-1">
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const isActive = end
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className="flex flex-col items-center justify-center gap-1 h-full py-2 group"
              >
                <span
                  className={cn(
                    'relative flex items-center justify-center rounded-lg p-1.5 transition-all duration-200',
                    isActive
                      ? 'bg-bg-card'
                      : 'group-hover:bg-bg-card/50'
                  )}
                >
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-blue-primary to-purple-primary" />
                  )}
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-blue-primary' : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'text-[9px] sm:text-[10px] font-medium leading-none transition-colors duration-200',
                    isActive ? 'text-text-primary' : 'text-text-muted group-hover:text-text-secondary'
                  )}
                >
                  {label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
