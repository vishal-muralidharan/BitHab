import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DeepFocus from '../../src/pages/DeepFocus';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DeepFocus Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders countdown timer, controls, and handles start, pause, and reset', async () => {
    render(
      <MemoryRouter initialEntries={['/deep-focus']}>
        <AuthProvider>
          <DeepFocus />
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByText('Deep Work Session')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();

    const primaryBtn = document.getElementById('deep-primary-btn');
    const secondaryBtn = document.getElementById('deep-secondary-btn');

    expect(primaryBtn).toHaveTextContent('START');
    expect(secondaryBtn).toBeDisabled();

    // Start timer
    await act(async () => {
      primaryBtn.click();
    });

    expect(primaryBtn).toHaveTextContent('PAUSE');
    expect(secondaryBtn).not.toBeDisabled();
    expect(secondaryBtn).toHaveTextContent('STOP');

    // Pause timer
    await act(async () => {
      primaryBtn.click();
    });

    expect(primaryBtn).toHaveTextContent('RESUME');
    expect(secondaryBtn).toHaveTextContent('RESET');

    // Reset timer
    await act(async () => {
      secondaryBtn.click();
    });

    expect(primaryBtn).toHaveTextContent('START');
  });

  it('updates and saves target duration', async () => {
    render(
      <MemoryRouter initialEntries={['/deep-focus']}>
        <AuthProvider>
          <DeepFocus />
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    const minInput = document.getElementById('target-minutes');
    expect(minInput).toBeInTheDocument();

    fireEvent.change(minInput, { target: { value: '45' } });

    const saveBtn = document.getElementById('save-target');
    await act(async () => {
      saveBtn.click();
    });

    expect(screen.getByText('45:00')).toBeInTheDocument();
  });

  it('navigates back to /focus when exit button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/deep-focus']}>
        <AuthProvider>
          <Routes>
            <Route path="/deep-focus" element={<DeepFocus />} />
            <Route path="/focus" element={<div data-testid="focus-page">Focus Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    const exitBtn = screen.getByRole('link', { name: 'Exit deep focus' });
    await act(async () => {
      exitBtn.click();
    });

    expect(screen.getByTestId('focus-page')).toBeInTheDocument();
  });
});
