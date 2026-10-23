import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Goals from '../../src/pages/Goals';
import { GoalProvider } from '../../src/context/GoalContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Goals Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders goals header, creates a goal, and toggles completion into completed section', async () => {
    render(
      <MemoryRouter initialEntries={['/goals']}>
        <AuthProvider>
          <GoalProvider>
            <Goals />
          </GoalProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Goals' })).toBeInTheDocument();
    expect(screen.getByText('Add a goal to get started.')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Add new goal');
    fireEvent.change(input, { target: { value: 'Learn TypeScript' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Add goal' }).click();
    });

    expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();

    // Toggle completion
    const checkbox = screen.getByRole('checkbox', { name: 'Toggle goal complete' });
    expect(checkbox.checked).toBe(false);

    await act(async () => {
      checkbox.click();
    });

    const completedCheckbox = screen.getByRole('checkbox', { name: 'Toggle goal complete' });
    expect(completedCheckbox.checked).toBe(true);
    expect(screen.getByText(/Completed Goals/i)).toBeInTheDocument();
  });

  it('edits a goal name via the edit modal', async () => {
    render(
      <MemoryRouter initialEntries={['/goals']}>
        <AuthProvider>
          <GoalProvider>
            <Goals />
          </GoalProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Add goal
    const input = screen.getByPlaceholderText('Add new goal');
    fireEvent.change(input, { target: { value: 'Run 5k' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add goal' }).click();
    });

    // Open edit modal
    const editBtn = screen.getByRole('button', { name: 'Edit goal' });
    await act(async () => {
      editBtn.click();
    });

    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    const modalInput = screen.getByDisplayValue('Run 5k');
    fireEvent.change(modalInput, { target: { value: 'Run Marathon' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Save' }).click();
    });

    expect(screen.getByText('Run Marathon')).toBeInTheDocument();
  });

  it('deletes a goal after confirming dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/goals']}>
        <AuthProvider>
          <GoalProvider>
            <Goals />
          </GoalProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Add goal
    const input = screen.getByPlaceholderText('Add new goal');
    fireEvent.change(input, { target: { value: 'Read Books' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add goal' }).click();
    });

    // Click delete
    const deleteBtn = screen.getByRole('button', { name: 'Delete goal' });
    await act(async () => {
      deleteBtn.click();
    });

    expect(screen.getByText(/Are you sure you want to delete "Read Books"?/i)).toBeInTheDocument();

    // Confirm Yes
    await act(async () => {
      screen.getByRole('button', { name: 'Yes' }).click();
    });

    expect(screen.queryByText('Read Books')).not.toBeInTheDocument();
  });
});
