import { render, screen, act } from '@testing-library/react';
import {
  ScheduleProvider,
  useSchedule,
  generatePatternDates,
  computeActivityProgress
} from '../../src/context/ScheduleContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function ScheduleConsumer() {
  const { 
    schedules, 
    logs, 
    skipped,
    patterns,
    scheduleActivity, 
    unscheduleActivity, 
    setDateStatus,
    applySchedulePattern,
    clearSchedulePattern,
    toggleActivityLog 
  } = useSchedule();

  const testDate = '2026-10-23';
  const scheduledList = schedules[testDate] || [];
  const loggedList = logs[testDate] || [];
  const skippedList = skipped[testDate] || [];

  return (
    <div>
      <div data-testid="scheduled-count">{scheduledList.length}</div>
      <div data-testid="logged-count">{loggedList.length}</div>
      <div data-testid="skipped-count">{skippedList.length}</div>
      <div data-testid="all-scheduled-dates">{Object.keys(schedules).sort().join(',')}</div>
      <div data-testid="has-pattern">{patterns.act_cardio ? patterns.act_cardio.type : 'none'}</div>

      <ul>
        {scheduledList.map(actId => (
          <li key={actId} data-testid={`scheduled-${actId}`}>
            <span>{actId}</span>
            <button onClick={() => unscheduleActivity(actId, testDate).catch(() => {})}>Unschedule</button>
            <button onClick={() => toggleActivityLog(actId, testDate)}>Toggle Log</button>
            <button onClick={() => setDateStatus(actId, testDate, 'skipped')}>Mark Skipped</button>
          </li>
        ))}
      </ul>

      <button onClick={() => scheduleActivity('act_cardio', testDate)}>Schedule Cardio</button>
      <button onClick={() => scheduleActivity('act_cardio', '2026-10-24')}>Schedule Next Day</button>
      <button
        onClick={() =>
          applySchedulePattern('act_cardio', {
            type: 'weekly',
            weekdays: [1, 3, 5],
            startDate: '2026-11-02',
            endDate: '2026-11-08'
          })
        }
      >
        Apply Weekly Pattern
      </button>
      <button onClick={() => clearSchedulePattern('act_cardio')}>Clear Pattern</button>
    </div>
  );
}

describe('ScheduleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    firestore.onSnapshot.mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({}) });
      return vi.fn();
    });
  });

  it('manages scheduling, unscheduling, skipping, and logging activities for specific dates', async () => {
    render(
      <AuthProvider>
        <ScheduleProvider>
          <ScheduleConsumer />
        </ScheduleProvider>
      </AuthProvider>
    );

    await act(async () => {});

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

    // Mark skipped clears completion log and records skip
    await act(async () => {
      screen.getByText('Mark Skipped').click();
    });
    expect(screen.getByTestId('logged-count')).toHaveTextContent('0');
    expect(screen.getByTestId('skipped-count')).toHaveTextContent('1');

    // Toggle log again (re-marks completed and removes skip)
    await act(async () => {
      screen.getByText('Toggle Log').click();
    });
    expect(screen.getByTestId('logged-count')).toHaveTextContent('1');
    expect(screen.getByTestId('skipped-count')).toHaveTextContent('0');

    // Unschedule activity
    await act(async () => {
      screen.getByText('Unschedule').click();
    });
    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('0');
  });

  it('serializes rapid consecutive schedule writes and rolls back on failure', async () => {
    const setDocSpy = vi.spyOn(firestore, 'setDoc');

    render(
      <AuthProvider>
        <ScheduleProvider>
          <ScheduleConsumer />
        </ScheduleProvider>
      </AuthProvider>
    );

    await act(async () => {});

    // Rapidly fire two schedule mutations back-to-back before awaiting
    await act(async () => {
      screen.getByText('Schedule Cardio').click();
      screen.getByText('Schedule Next Day').click();
    });

    // Both dates preserved without stale closure overwrite
    expect(screen.getByTestId('all-scheduled-dates')).toHaveTextContent('2026-10-23,2026-10-24');

    // Verify failure rolls back
    setDocSpy.mockRejectedValueOnce(new Error('Write failed'));
    await act(async () => {
      screen.getByText('Unschedule').click();
    });

    // Schedule remains restored after write failure rollback
    expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
  });

  it('applies and clears recurring weekly patterns cleanly', async () => {
    render(
      <AuthProvider>
        <ScheduleProvider>
          <ScheduleConsumer />
        </ScheduleProvider>
      </AuthProvider>
    );

    await act(async () => {});

    await act(async () => {
      screen.getByText('Apply Weekly Pattern').click();
    });
    // 2026-11-02 (Mon), 2026-11-04 (Wed), 2026-11-06 (Fri)
    expect(screen.getByTestId('has-pattern')).toHaveTextContent('weekly');
    expect(screen.getByTestId('all-scheduled-dates')).toHaveTextContent('2026-11-02,2026-11-04,2026-11-06');

    await act(async () => {
      screen.getByText('Clear Pattern').click();
    });
    expect(screen.getByTestId('has-pattern')).toHaveTextContent('none');
    expect(screen.getByTestId('all-scheduled-dates')).toHaveTextContent('');
  });

  it('generates pattern dates and calculates completion rate excluding future and skipped days while counting parent sub-activities', () => {
    const intervalDates = generatePatternDates({
      type: 'interval',
      everyDays: 2,
      startDate: '2026-11-01',
      endDate: '2026-11-05'
    });
    expect(intervalDates).toEqual(['2026-11-01', '2026-11-03', '2026-11-05']);

    const gymActivity = {
      id: 'gym',
      name: 'Gym',
      subActivities: [{ id: 'chest', name: 'Chest', color: '#22c55e' }]
    };

    const stats = computeActivityProgress({
      activity: gymActivity,
      selectedSubActivityId: null,
      schedules: {
        '2026-11-01': ['gym'], // past, completed via sub-activity chest
        '2026-11-02': ['gym'], // past, explicitly skipped -> excluded from denominator
        '2026-11-03': ['gym'], // past, missed -> counts against completion rate
        '2026-11-26': ['gym'], // today, unmarked -> excluded until logged or past
        '2026-11-28': ['gym']  // future -> excluded from completion rate
      },
      logs: {
        '2026-11-01': ['chest']
      },
      skipped: {
        '2026-11-02': ['gym']
      },
      todayStr: '2026-11-26'
    });

    expect(stats.totalScheduled).toBe(5);
    expect(stats.totalCompleted).toBe(1);
    expect(stats.totalSkipped).toBe(1);
    expect(stats.totalMissed).toBe(1);
    expect(stats.evaluatedCount).toBe(2);
    expect(stats.completionRate).toBe(50);
  });

  it('loads schedules, logs, skipped, and patterns from Firestore user document', async () => {
    vi.spyOn(firestore, 'getDoc').mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        schedules: {
          '2026-10-23': ['act_meditation']
        },
        logs: {
          '2026-10-23': ['act_meditation']
        },
        scheduleSkipped: {},
        schedulePatterns: {}
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
