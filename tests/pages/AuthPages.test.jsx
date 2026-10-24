import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../../src/pages/Login';
import Register from '../../src/pages/Register';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as auth from 'firebase/auth';

describe('Auth Pages (Login and Register)', () => {
  beforeEach(() => {
    document.body.className = '';
    vi.clearAllMocks();
  });

  describe('Login', () => {
    it('renders login form, handles input, and submits credentials', async () => {
      // Mock logged out state so it doesn't auto-redirect to /
      vi.spyOn(auth, 'onAuthStateChanged').mockImplementation((_auth, cb) => {
        cb(null);
        return vi.fn();
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(document.body.classList.contains('auth-page')).toBe(true);
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });

      await act(async () => {
        screen.getByRole('button', { name: /Login/i }).click();
      });

      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com',
        'secret123'
      );
    });

    it('handles Google sign in on login page', async () => {
      vi.spyOn(auth, 'onAuthStateChanged').mockImplementation((_auth, cb) => {
        cb(null);
        return vi.fn();
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      await act(async () => {
        screen.getByText('Continue with Google').click();
      });

      expect(auth.signInWithPopup).toHaveBeenCalled();
    });
  });

  describe('Register', () => {
    it('validates matching passwords before calling signup', async () => {
      vi.spyOn(auth, 'onAuthStateChanged').mockImplementation((_auth, cb) => {
        cb(null);
        return vi.fn();
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <AuthProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/register" element={<Register />} />
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'newuser@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'different' } });

      await act(async () => {
        screen.getByRole('button', { name: /Register/i }).click();
      });

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(auth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('submits signup when passwords match', async () => {
      vi.spyOn(auth, 'onAuthStateChanged').mockImplementation((_auth, cb) => {
        cb(null);
        return vi.fn();
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <AuthProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'newuser@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'matchingPass' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'matchingPass' } });
      fireEvent.click(screen.getByRole('checkbox'));

      await act(async () => {
        screen.getByRole('button', { name: /Register/i }).click();
      });

      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'matchingPass'
      );
    });

    it('requires agreement to terms before submitting registration', async () => {
      vi.spyOn(auth, 'onAuthStateChanged').mockImplementation((_auth, cb) => {
        cb(null);
        return vi.fn();
      });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <AuthProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/register" element={<Register />} />
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'matchingPass' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'matchingPass' } });

      await act(async () => {
        screen.getByRole('button', { name: /Register/i }).click();
      });

      expect(screen.getByText(/You must agree to the Terms of Service/i)).toBeInTheDocument();
      expect(auth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });
});
