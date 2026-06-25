import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 rounded-full bg-error/10 p-4">
            <AlertTriangle className="h-10 w-10 text-error" />
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
            Something went wrong
          </h2>
          {this.state.error && (
            <p className="text-sm text-text-secondary mb-6 max-w-md">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
          )}
          <Button onClick={this.handleReset} variant="outline" className="gap-2">
            Try Again
          </Button>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
