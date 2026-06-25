import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, HardDrive, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/dashboard/storage', label: 'Storage', icon: HardDrive, end: false },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border-subtle bg-bg-surface/95 backdrop-blur-md">
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
                    'flex items-center justify-center rounded-lg p-1.5 transition-all duration-200',
                    isActive
                      ? 'bg-blue-primary/15 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'group-hover:bg-bg-card'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-blue-primary' : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none transition-colors duration-200',
                    isActive ? 'text-blue-primary' : 'text-text-muted group-hover:text-text-secondary'
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
