import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

function ThrowingComponent() {
  throw new Error('Test error');
}

function WrappedErrorBoundary({ children }) {
  return (
    <BrowserRouter>
      <ErrorBoundary>{children}</ErrorBoundary>
    </BrowserRouter>
  );
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <WrappedErrorBoundary>
        <div>Test content</div>
      </WrappedErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <WrappedErrorBoundary>
        <ThrowingComponent />
      </WrappedErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
