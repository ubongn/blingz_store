import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Footer', () => {
  it('renders store name', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/BlingzStore/i)).toBeInTheDocument();
  });

  it('renders address', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/Abuja/i)).toBeInTheDocument();
  });

  it('renders dynamic year', () => {
    renderWithRouter(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders About and Contact links', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByText(/About/i).closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText(/Contact/i).closest('a')).toHaveAttribute('href', '/contact');
  });
});
