import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as auth from 'firebase/auth';

function AuthConsumer() {
  const { currentUser, login, signup, logout, signInWithGoogle } = useAuth();

  return (
    <div>
      <div data-testid="user-email">{currentUser ? currentUser.email : 'logged-out'}</div>
      <button onClick={() => login('user@test.com', 'password123')}>Login</button>
      <button onClick={() => signup('new@test.com', 'password123')}>Signup</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => signInWithGoogle()}>Google</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides current authenticated user and delegates login, signup, logout, and google sign-in', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Initial user provided by onAuthStateChanged mock in setup.js
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@bithab.local');

    // Login
    await act(async () => {
      screen.getByText('Login').click();
    });
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'user@test.com',
      'password123'
    );

    // Signup
    await act(async () => {
      screen.getByText('Signup').click();
    });
    expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'new@test.com',
      'password123'
    );

    // Logout
    await act(async () => {
      screen.getByText('Logout').click();
    });
    expect(auth.signOut).toHaveBeenCalledWith(expect.anything());

    // Google Sign-In
    await act(async () => {
      screen.getByText('Google').click();
    });
    expect(auth.signInWithPopup).toHaveBeenCalled();
  });

  it('renders logged-out state when onAuthStateChanged yields null', async () => {
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce((_auth, cb) => {
      cb(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email')).toHaveTextContent('logged-out');
  });
});
