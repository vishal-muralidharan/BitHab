import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

function ThemeConsumer() {
  const { currentTheme, isDarkMode, toggleDarkMode, setTheme, themes } = useTheme();
  return (
    <div>
      <span data-testid="theme-name">{currentTheme}</span>
      <span data-testid="dark-mode">{isDarkMode ? 'dark' : 'light'}</span>
      <span data-testid="available-themes">{Object.keys(themes).join(',')}</span>
      <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
      <button onClick={() => setTheme('evergreen-forest')}>Set Forest</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('provides default theme (oceanic-depths) and dark mode', () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </AuthProvider>
    );
    expect(screen.getByTestId('theme-name')).toHaveTextContent('oceanic-depths');
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('available-themes').textContent).toContain('oceanic-depths');
    expect(screen.getByTestId('available-themes').textContent).toContain('evergreen-forest');
  });

  it('toggles dark and light mode', async () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </AuthProvider>
    );
    const button = screen.getByText('Toggle Dark Mode');

    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId('dark-mode')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('light');
    const stored = JSON.parse(localStorage.getItem('bithab-theme-preferences'));
    expect(stored.isDarkMode).toBe(false);
  });

  it('changes active theme to evergreen-forest', async () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </AuthProvider>
    );
    const forestButton = screen.getByText('Set Forest');

    await act(async () => {
      forestButton.click();
    });

    expect(screen.getByTestId('theme-name')).toHaveTextContent('evergreen-forest');
    expect(document.documentElement.getAttribute('data-theme')).toBe('evergreen-forest');
    const stored = JSON.parse(localStorage.getItem('bithab-theme-preferences'));
    expect(stored.currentTheme).toBe('evergreen-forest');
  });
});
