import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileTopbar from '../../src/components/layout/MobileTopbar';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MobileTopbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mobile topbar logos and toggles dark/light theme mode', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <MobileTopbar />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByAltText('BitHab Logo')).toHaveLength(2);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle dark/light mode' });
    expect(toggleBtn).toBeInTheDocument();

    await act(async () => {
      toggleBtn.click();
    });

    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('light');
  });
});
