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

  it('renders reminders header, empty state, opens datetime modal and creates a reminder', async () => {
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

    // Click "Add New Reminder" button
    const openBtn = screen.getByRole('button', { name: /Add New Reminder/i });
    await act(async () => {
      openBtn.click();
    });

    expect(screen.getByText('Add New Reminder', { selector: '#datetime-modal-title' })).toBeInTheDocument();

    const input = screen.getByPlaceholderText('What would you like to be reminded about?');
    fireEvent.change(input, { target: { value: 'Annual Doctor Checkup' } });

    // Select Tomorrow quick button
    const tomorrowBtn = screen.getByRole('button', { name: 'Tomorrow' });
    fireEvent.click(tomorrowBtn);

    await act(async () => {
      screen.getByRole('button', { name: 'Add Reminder' }).click();
    });

    expect(screen.getByText('Annual Doctor Checkup')).toBeInTheDocument();
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

    // Open add modal and add reminder
    await act(async () => {
      screen.getByRole('button', { name: /Add New Reminder/i }).click();
    });

    const input = screen.getByPlaceholderText('What would you like to be reminded about?');
    fireEvent.change(input, { target: { value: 'Buy Groceries' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Add Reminder' }).click();
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
      screen.getByRole('button', { name: 'Save Changes' }).click();
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

    // Open add modal and add reminder
    await act(async () => {
      screen.getByRole('button', { name: /Add New Reminder/i }).click();
    });

    const input = screen.getByPlaceholderText('What would you like to be reminded about?');
    fireEvent.change(input, { target: { value: 'Water Fern' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Add Reminder' }).click();
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
