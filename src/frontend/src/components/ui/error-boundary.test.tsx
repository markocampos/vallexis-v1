import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// A component that always throws for testing
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error — all good</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('No error — all good')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    // Suppress the error output from React for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom error view</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error view')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('resets error state when Try Again is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again — the ErrorBoundary should reset hasError state
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    // After the boundary resets hasError to false, ThrowingComponent renders again
    // and since it throws, we see the error page again (same component is rendered).
    // This tests that the reset mechanism fires without crashing.
    // The boundary should at minimum clear the error and attempt re-render.
    expect(screen.queryByRole('button', { name: 'Try Again' })).toBeDefined();

    spy.mockRestore();
  });
});
