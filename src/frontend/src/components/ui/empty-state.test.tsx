import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { EmptyState } from '@/components/ui/empty-state';
import { FolderKanban } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No projects" description="Create your first project" />);
    expect(screen.getByText('No projects')).toBeInTheDocument();
    expect(screen.getByText('Create your first project')).toBeInTheDocument();
  });

  it('renders with emoji', () => {
    render(<EmptyState emoji="🚀" title="Launch your first project" />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<EmptyState icon={FolderKanban} title="No folders" />);
    // Icon container should be rendered
    const container = document.querySelector('.rounded-full');
    expect(container).toBeInTheDocument();
  });

  it('renders action button and calls onClick', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Create Item', onClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Item' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
