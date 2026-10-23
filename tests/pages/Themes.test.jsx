import { render, screen, act } from '@testing-library/react';
import Themes from '../../src/pages/Themes';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Themes Page', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  it('renders theme list and highlights the current active theme', () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <Themes />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Themes' })).toBeInTheDocument();
    expect(screen.getAllByText('Oceanic Depths').length).toBeGreaterThanOrEqual(1);

    const currentCard = document.querySelector('.theme-card[data-theme="oceanic-depths"]');
    expect(currentCard).toHaveClass('active');
  });

  it('switches theme when user clicks Select Theme on a different card', async () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <Themes />
        </ThemeProvider>
      </AuthProvider>
    );

    const forestSelectBtn = document.querySelector('.theme-card[data-theme="evergreen-forest"] .theme-select-btn');
    expect(forestSelectBtn).toBeInTheDocument();

    await act(async () => {
      forestSelectBtn.click();
    });

    const activeCard = document.querySelector('.theme-card[data-theme="evergreen-forest"]');
    expect(activeCard).toHaveClass('active');
    expect(document.documentElement.getAttribute('data-theme')).toBe('evergreen-forest');
  });
});
