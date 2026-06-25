import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Dashboard } from '@/pages/Dashboard';

describe('Dashboard Page', () => {
  it('renders the page heading', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders the Quick Deploy card', () => {
    render(<Dashboard />);
    expect(screen.getByText('Quick Deploy')).toBeInTheDocument();
  });

  it('renders the Projects card', () => {
    render(<Dashboard />);
    expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
  });

  it('renders the Storage card', () => {
    render(<Dashboard />);
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    render(<Dashboard />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders project statuses', () => {
    render(<Dashboard />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Building')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
