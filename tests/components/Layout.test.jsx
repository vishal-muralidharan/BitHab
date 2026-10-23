import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../src/components/layout/Layout';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

function renderWithLayout(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ThemeProvider>
          <Layout>
            <div data-testid="page-child">Child Content</div>
          </Layout>
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    document.body.className = '';
    vi.clearAllMocks();
  });

  it('renders standard shell (Header, MobileTopbar, BottomNav) on normal route and sets index-page body class', () => {
    renderWithLayout('/');

    expect(screen.getByTestId('page-child')).toBeInTheDocument();
    expect(document.querySelector('.header')).toBeInTheDocument();
    expect(document.querySelector('.mobile-topbar')).toBeInTheDocument();
    expect(document.querySelector('.bottom-nav')).toBeInTheDocument();
    expect(document.body.classList.contains('index-page')).toBe(true);
  });

  it('sets themes-page body class when on /themes', () => {
    renderWithLayout('/themes');

    expect(document.body.classList.contains('themes-page')).toBe(true);
  });

  it('bypasses header, mobile topbar, and bottom nav on /focus and sets focus-mode class', () => {
    renderWithLayout('/focus');

    expect(screen.getByTestId('page-child')).toBeInTheDocument();
    expect(document.querySelector('.header')).not.toBeInTheDocument();
    expect(document.querySelector('.mobile-topbar')).not.toBeInTheDocument();
    expect(document.querySelector('.bottom-nav')).not.toBeInTheDocument();
    expect(document.body.classList.contains('focus-mode')).toBe(true);
  });

  it('bypasses navigation on /deep-focus and /analytics routes', () => {
    const { unmount } = renderWithLayout('/deep-focus');
    expect(document.body.classList.contains('focus-mode')).toBe(true);
    expect(document.querySelector('.header')).not.toBeInTheDocument();
    unmount();

    renderWithLayout('/analytics');
    expect(document.body.classList.contains('focus-mode')).toBe(true);
    expect(document.querySelector('.header')).not.toBeInTheDocument();
  });
});
