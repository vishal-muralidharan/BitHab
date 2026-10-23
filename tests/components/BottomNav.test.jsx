import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BottomNav from '../../src/components/layout/BottomNav';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as auth from 'firebase/auth';

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bottom navigation tabs and marks active item', () => {
    render(
      <MemoryRouter initialEntries={['/goals']}>
        <AuthProvider>
          <BottomNav />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Activities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Goals/i })).toHaveClass('active');
    expect(screen.getByRole('link', { name: /Reminders/i })).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('highlights More when on sub-routes like /notes, /themes, /lists', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/notes']}>
        <AuthProvider>
          <BottomNav />
        </AuthProvider>
      </MemoryRouter>
    );

    const moreItem = screen.getByText('More').closest('.bottom-nav-item');
    expect(moreItem).toHaveClass('active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/themes']}>
        <AuthProvider>
          <BottomNav />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('More').closest('.bottom-nav-item')).toHaveClass('active');
  });

  it('triggers logout from bottom nav dropdown', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <BottomNav />
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/login" element={<div data-testid="login-redirect">Logged Out</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    await act(async () => {
      logoutBtn.click();
    });

    expect(auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('login-redirect')).toBeInTheDocument();
  });
});
