import { render, screen, act } from '@testing-library/react';
import { ReminderProvider, useReminders } from '../../src/context/ReminderContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function ReminderConsumer() {
  const { 
    reminders, 
    addReminder, 
    editReminder, 
    deleteReminder, 
    toggleCompleted 
  } = useReminders();

  return (
    <div>
      <div data-testid="reminders-count">{reminders.length}</div>
      <ul>
        {reminders.map(r => (
          <li key={r.id} data-testid={`reminder-${r.id}`}>
            <span data-testid={`reminder-text-${r.id}`}>{r.text}</span>
            <span data-testid={`reminder-date-${r.id}`}>{r.date}</span>
            <span data-testid={`reminder-time-${r.id}`}>{r.time}</span>
            <span data-testid={`reminder-status-${r.id}`}>{r.completed ? 'completed' : 'pending'}</span>
            <button onClick={() => toggleCompleted(r.id)}>Toggle Status</button>
            <button onClick={() => editReminder(r.id, `${r.text} Updated`, '2026-12-31', '14:30')}>Edit Reminder</button>
            <button onClick={() => deleteReminder(r.id)}>Delete Reminder</button>
          </li>
        ))}
      </ul>
      <button onClick={() => addReminder('Call dentist', '2026-11-01', '10:00')}>Add Dental Reminder</button>
    </div>
  );
}

describe('ReminderContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages reminders lifecycle: adding, toggling completion, editing, and deleting', async () => {
    render(
      <AuthProvider>
        <ReminderProvider>
          <ReminderConsumer />
        </ReminderProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('reminders-count')).toHaveTextContent('0');

    // Add reminder
    await act(async () => {
      screen.getByText('Add Dental Reminder').click();
    });
    expect(screen.getByTestId('reminders-count')).toHaveTextContent('1');
    expect(screen.getByText('Call dentist')).toBeInTheDocument();
    expect(screen.getByText('2026-11-01')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();

    // Toggle completed
    await act(async () => {
      screen.getByText('Toggle Status').click();
    });
    expect(screen.getByText('completed')).toBeInTheDocument();

    // Edit reminder
    await act(async () => {
      screen.getByText('Edit Reminder').click();
    });
    expect(screen.getByText('Call dentist Updated')).toBeInTheDocument();
    expect(screen.getByText('2026-12-31')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();

    // Delete reminder
    await act(async () => {
      screen.getByText('Delete Reminder').click();
    });
    expect(screen.getByTestId('reminders-count')).toHaveTextContent('0');
  });

  it('normalizes legacy reminders from Firestore snapshot', async () => {
    const rawLegacyReminder = {
      id: 'legacy_rem_1',
      text: 'Water Plants'
      // missing date and time
    };

    vi.spyOn(firestore, 'getDoc').mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        reminders: [rawLegacyReminder]
      })
    });

    render(
      <AuthProvider>
        <ReminderProvider>
          <ReminderConsumer />
        </ReminderProvider>
      </AuthProvider>
    );

    await act(async () => {});

    expect(screen.getByTestId('reminders-count')).toHaveTextContent('1');
    expect(screen.getByText('Water Plants')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });
});
