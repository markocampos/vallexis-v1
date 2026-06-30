import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Dashboard } from '@/pages/Dashboard';

// Mock the auth context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com', plan: 'free' },
    loading: false,
    logout: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

// Mock React Query to return empty data
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: () => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() }),
  };
});

describe('Dashboard Page', () => {
  it('renders the dashboard heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<Dashboard />);
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('Object Storage')).toBeInTheDocument();
    expect(screen.getByText('Subscription Plan')).toBeInTheDocument();
    expect(screen.getByText('API Status')).toBeInTheDocument();
  });

  it('renders the container applications section', () => {
    render(<Dashboard />);
    expect(screen.getByText('Container Applications')).toBeInTheDocument();
  });

  it('renders empty state when no projects', () => {
    render(<Dashboard />);
    expect(screen.getByText('No active projects yet')).toBeInTheDocument();
  });

  it('renders new project button', () => {
    render(<Dashboard />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });
});
