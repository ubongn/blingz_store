import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('PasswordInput', () => {
  it('renders password input', () => {
    renderWithRouter(<PasswordInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const { user } = await import('@testing-library/user-event');
    const userEvent = user.setup();

    renderWithRouter(<PasswordInput value="test123" onChange={() => {}} />);

    const input = screen.getByLabelText(/password/i);
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
  });
});
