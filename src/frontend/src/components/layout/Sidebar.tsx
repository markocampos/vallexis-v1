import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  HardDrive,
  Search,
  Sliders
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();

  const match = location.pathname.match(/\/dashboard\/deploys\/([^/]+)/);
  const currentProjectId = match ? match[1] : null;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, hideOnMobile: true },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban, hideOnMobile: true },
    { name: 'Storage', href: '/dashboard/storage', icon: HardDrive, hideOnMobile: true },
    { name: 'SEO Audit', href: '/dashboard/seo', icon: Search, hideOnMobile: false },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, hideOnMobile: true },
  ];

  if (currentProjectId) {
    navigation.push({
      name: 'Project Settings',
      href: `/dashboard/deploys/${currentProjectId}?tab=settings`,
      icon: Sliders,
      hideOnMobile: false
    });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-overlay/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen glass border-r border-border-subtle transition-all duration-200 md:translate-x-0 md:z-30',
          'w-64 md:top-16 md:h-[calc(100vh-4rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex h-full flex-col px-3 py-3 justify-between">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && !item.href.includes('tab=settings'));
              
              // Handle special active check for Project Settings tab query param
              const isProjectSettingsActive = item.name === 'Project Settings' && location.search.includes('tab=settings');
              const isItemActive = item.name === 'Project Settings' ? isProjectSettingsActive : (isActive && !location.search.includes('tab=settings'));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'relative items-center rounded-lg font-medium transition-all duration-200',
                    'gap-3 px-3 py-2.5 text-sm flex',
                    item.hideOnMobile ? 'hidden md:flex' : 'flex',
                    isItemActive
                      ? 'text-text-primary bg-bg-card'
                      : 'text-text-secondary hover:bg-bg-card/50 hover:text-text-primary'
                  )}
                >
                  {isItemActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gradient-to-b from-blue-primary to-purple-primary rounded-r" />
                  )}
                  <item.icon className={cn('h-4 w-4', isItemActive && 'text-blue-primary')} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
