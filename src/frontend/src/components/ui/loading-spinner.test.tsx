import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { LoadingSpinner, PageLoader, InlineLoader } from '@/components/ui/loading-spinner';

describe('LoadingSpinner', () => {
  it('renders without text by default', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(document.querySelector('.h-4')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(document.querySelector('.h-12')).toBeInTheDocument();
  });
});

describe('PageLoader', () => {
  it('renders with default text', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<PageLoader text="Fetching projects..." />);
    expect(screen.getByText('Fetching projects...')).toBeInTheDocument();
  });
});

describe('InlineLoader', () => {
  it('renders inline spinner', () => {
    render(<InlineLoader />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
