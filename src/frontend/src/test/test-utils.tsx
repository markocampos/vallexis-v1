/**
 * Test utilities — provides a custom render wrapper that sets up all providers
 */
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toaster';

// Create a fresh QueryClient for each test (no retries in tests)
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = makeQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render — wraps component in all required providers.
 * Use this instead of @testing-library/react's render() for component tests.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
