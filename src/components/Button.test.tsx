import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and forwards clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Refresh</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('while busy: shows a spinner, disables itself, and swallows clicks', () => {
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Refresh
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows no spinner when idle', () => {
    render(<Button>Refresh</Button>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('applies the variant class on top of the base class', () => {
    render(<Button variant="primary">Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn', 'btn-primary');
  });
});
