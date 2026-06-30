import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { BottomNav } from '@/components/layout/BottomNav';

describe('BottomNav', () => {
  it('renders all navigation items', () => {
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<BottomNav />);
    const allLinks = screen.getAllByRole('link');
    const hrefs = allLinks.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/dashboard/projects');
  });

  it('is only visible on mobile (has md:hidden class)', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation');
    expect(nav.classList.contains('md:hidden')).toBe(true);
  });

  it('has a fixed bottom position', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation');
    expect(nav.classList.contains('fixed')).toBe(true);
    expect(nav.classList.contains('bottom-0')).toBe(true);
  });
});
