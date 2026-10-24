import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Header from '../../src/components/layout/Header';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as auth from 'firebase/auth';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo, navigation links, theme toggle, and logout button', () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AuthProvider>
          <ThemeProvider>
            <Header />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByAltText('BitHab Logo')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Activities' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Goals' })).not.toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reminders' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Focus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('toggles dark/light mode when theme button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ThemeProvider>
            <Header />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const themeBtn = screen.getByRole('button', { name: 'Toggle dark/light mode' });
    await act(async () => {
      themeBtn.click();
    });

    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('light');
  });

  it('triggers logout and redirects to /login when logout button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ThemeProvider>
            <Header />
            <Routes>
              <Route path="/" element={<div data-testid="home">Home</div>} />
              <Route path="/login" element={<div data-testid="login">Login Page</div>} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    await act(async () => {
      logoutBtn.click();
    });

    expect(auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('renders only logo, insights and deep focus buttons without nav links on /focus route', () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <AuthProvider>
          <ThemeProvider>
            <Header />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Nav links must not be present
    expect(screen.queryByRole('link', { name: 'Focus' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Activities' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Goals' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();

    // Logo is present
    expect(screen.getAllByAltText('BitHab Logo')).toHaveLength(2);

    // Insights and Deep Focus action buttons are present
    expect(screen.getByRole('button', { name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deep Focus' })).toBeInTheDocument();
  });
});
