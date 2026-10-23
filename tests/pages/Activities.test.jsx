import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Activities from '../../src/pages/Activities';
import { ActivityProvider } from '../../src/context/ActivityContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Activities Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activities header, empty state, and adds a new activity', async () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AuthProvider>
          <ActivityProvider>
            <Activities />
          </ActivityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Activities' })).toBeInTheDocument();
    expect(screen.getByText('Add a main activity to begin.')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Add new activity');
    fireEvent.change(input, { target: { value: 'Deep Reading' } });

    const addBtn = screen.getByRole('button', { name: 'Add activity' });
    expect(addBtn).not.toBeDisabled();

    await act(async () => {
      addBtn.click();
    });

    expect(screen.getByText('Deep Reading')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('navigates to schedule page when schedule button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AuthProvider>
          <ActivityProvider>
            <Routes>
              <Route path="/activities" element={<Activities />} />
              <Route path="/schedule-activities" element={<div data-testid="schedule-page">Schedule Page</div>} />
            </Routes>
          </ActivityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const scheduleBtn = screen.getByRole('button', { name: /Schedule Activities/i });
    await act(async () => {
      scheduleBtn.click();
    });

    expect(screen.getByTestId('schedule-page')).toBeInTheDocument();
  });

  it('supports editing an activity through the edit modal', async () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AuthProvider>
          <ActivityProvider>
            <Activities />
          </ActivityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Add activity
    const input = screen.getByPlaceholderText('Add new activity');
    fireEvent.change(input, { target: { value: 'Running' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add activity' }).click();
    });

    expect(screen.getByText('Running')).toBeInTheDocument();

    // Open edit modal
    const editBtn = screen.getByRole('button', { name: 'Edit activity' });
    await act(async () => {
      editBtn.click();
    });

    expect(screen.getByText('Edit Activity')).toBeInTheDocument();
    const editInput = screen.getByDisplayValue('Running');
    fireEvent.change(editInput, { target: { value: 'Trail Running' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Save' }).click();
    });

    expect(screen.getByText('Trail Running')).toBeInTheDocument();
  });

  it('deletes an activity after confirming dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <AuthProvider>
          <ActivityProvider>
            <Activities />
          </ActivityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Add activity
    const input = screen.getByPlaceholderText('Add new activity');
    fireEvent.change(input, { target: { value: 'Meditation' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add activity' }).click();
    });

    expect(screen.getByText('Meditation')).toBeInTheDocument();

    // Click delete
    const deleteBtn = screen.getByRole('button', { name: 'Delete activity' });
    await act(async () => {
      deleteBtn.click();
    });

    // Confirm dialog appears
    expect(screen.getByText(/Are you sure you want to delete "Meditation"?/i)).toBeInTheDocument();

    // Click Yes in confirmation dialog
    const confirmBtn = screen.getByRole('button', { name: 'Yes' });
    await act(async () => {
      confirmBtn.click();
    });

    expect(screen.queryByText('Meditation')).not.toBeInTheDocument();
  });
});
