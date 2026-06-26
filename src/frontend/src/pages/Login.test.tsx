import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { Login } from '@/pages/Login';

// Mock the auth context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(undefined),
    user: null,
    loading: false,
    logout: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    render(<Login />);
    // Use getByRole since labels may render differently with shadcn
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('renders OAuth buttons', () => {
    render(<Login />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('renders a sign in button', () => {
    render(<Login />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows email validation error for invalid email on submit', async () => {
    render(<Login />);

    // Submit with invalid email
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitBtn = screen.getByText('Sign in');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows password validation error when password too short', async () => {
    render(<Login />);

    const emailInput = document.querySelector('#email') as HTMLInputElement;
    const passwordInput = document.querySelector('#password') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    fireEvent.click(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument();
    });
  });

  it('has a link to register page', () => {
    render(<Login />);
    expect(screen.getByText(/Sign up/)).toBeInTheDocument();
  });

  it('renders show/hide password toggle', () => {
    render(<Login />);
    const toggleBtn = screen.getByLabelText('Show password');
    expect(toggleBtn).toBeInTheDocument();
  });
});
