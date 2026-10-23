import { render, screen, act } from '@testing-library/react';
import { ScheduleProvider, useSchedule } from '../../src/context/ScheduleContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function ScheduleConsumer() {
  const { 
    schedules, 
    logs, 
    scheduleActivity, 
    unscheduleActivity, 
    toggleActivityLog 
  } = useSchedule();

  const testDate = '2026-10-23';
  const scheduledList = schedules[testDate] || [];
  const loggedList = logs[testDate] || [];

  return (
    <div>
      <div data-testid="scheduled-count">{scheduledList.length}</div>
      <div data-testid="logged-count">{loggedList.length}</div>

      <ul>
        {scheduledList.map(actId => (
          <li key={actId} data-testid={`scheduled-${actId}`}>
            <span>{actId}</span>
            <button onClick={() => unscheduleActivity(actId, testDate)}>Unschedule</button>
            <button onClick={() => toggleActivityLog(actId, testDate)}>Toggle Log</button>
          </li>
        ))}
      </ul>

      <button onClick={() => scheduleActivity('act_cardio', testDate)}>Schedule Cardio</button>
    </div>
  );
}

describe('ScheduleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages scheduling, unscheduling, and logging activities for specific dates', async () => {
    render(
      <AuthProvider>
        <ScheduleProvider>
          <ScheduleConsumer />
        </ScheduleProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('0');
    expect(screen.getByTestId('logged-count')).toHaveTextContent('0');

    // Schedule activity
    await act(async () => {
      screen.getByText('Schedule Cardio').click();
    });
    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
    expect(screen.getByText('act_cardio')).toBeInTheDocument();

    // Idempotent schedule: scheduling same activity again does nothing
    await act(async () => {
      screen.getByText('Schedule Cardio').click();
    });
    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');

    // Toggle log completion (mark as completed)
    await act(async () => {
      screen.getByText('Toggle Log').click();
    });
    expect(screen.getByTestId('logged-count')).toHaveTextContent('1');

    // Toggle log again (unmark)
    await act(async () => {
      screen.getByText('Toggle Log').click();
    });
    expect(screen.getByTestId('logged-count')).toHaveTextContent('0');

    // Unschedule activity
    await act(async () => {
      screen.getByText('Unschedule').click();
    });
    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('0');
  });

  it('loads schedules and logs from Firestore user document', async () => {
    vi.spyOn(firestore, 'getDoc').mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        schedules: {
          '2026-10-23': ['act_meditation']
        },
        logs: {
          '2026-10-23': ['act_meditation']
        }
      })
    });

    render(
      <AuthProvider>
        <ScheduleProvider>
          <ScheduleConsumer />
        </ScheduleProvider>
      </AuthProvider>
    );

    await act(async () => {});

    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
    expect(screen.getByTestId('logged-count')).toHaveTextContent('1');
    expect(screen.getByText('act_meditation')).toBeInTheDocument();
  });
});
