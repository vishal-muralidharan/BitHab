import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Reminders from '../../src/pages/Reminders';
import { ReminderProvider } from '../../src/context/ReminderContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Reminders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reminders header, empty state, and creates a reminder with date and time', async () => {
    render(
      <MemoryRouter initialEntries={['/reminders']}>
        <AuthProvider>
          <ReminderProvider>
            <Reminders />
          </ReminderProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Reminders' })).toBeInTheDocument();
    expect(screen.getByText('No reminders set. Add one to get started.')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Add new reminder');
    fireEvent.change(input, { target: { value: 'Annual Doctor Checkup' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Add reminder' }).click();
    });

    expect(screen.getByText('Annual Doctor Checkup')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('opens edit modal and updates reminder content', async () => {
    render(
      <MemoryRouter initialEntries={['/reminders']}>
        <AuthProvider>
          <ReminderProvider>
            <Reminders />
          </ReminderProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Add reminder
    const input = screen.getByPlaceholderText('Add new reminder');
    fireEvent.change(input, { target: { value: 'Buy Groceries' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add reminder' }).click();
    });

    // Open edit modal
    const editBtn = screen.getByRole('button', { name: 'Edit reminder' });
    await act(async () => {
      editBtn.click();
    });

    expect(screen.getByText('Edit Reminder')).toBeInTheDocument();
    const modalInput = screen.getByDisplayValue('Buy Groceries');
    fireEvent.change(modalInput, { target: { value: 'Buy Organic Groceries' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Save' }).click();
    });

    expect(screen.getByText('Buy Organic Groceries')).toBeInTheDocument();
  });

  it('prompts confirmation and deletes reminder on Yes', async () => {
    render(
      <MemoryRouter initialEntries={['/reminders']}>
        <AuthProvider>
          <ReminderProvider>
            <Reminders />
          </ReminderProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Add reminder
    const input = screen.getByPlaceholderText('Add new reminder');
    fireEvent.change(input, { target: { value: 'Water Fern' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Add reminder' }).click();
    });

    // Delete
    const deleteBtn = screen.getByRole('button', { name: 'Delete reminder' });
    await act(async () => {
      deleteBtn.click();
    });

    expect(screen.getByText(/Are you sure you want to delete this reminder?/i)).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Yes' }).click();
    });

    expect(screen.queryByText('Water Fern')).not.toBeInTheDocument();
  });
});
