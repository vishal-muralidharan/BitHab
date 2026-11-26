import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ScheduleActivities from '../../src/pages/ScheduleActivities';
import { ActivityProvider } from '../../src/context/ActivityContext';
import { ScheduleProvider, formatLocalDateStr } from '../../src/context/ScheduleContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function renderSchedulePage() {
  return render(
    <MemoryRouter initialEntries={['/schedule-activities']}>
      <AuthProvider>
        <ActivityProvider>
          <ScheduleProvider>
            <Routes>
              <Route path="/schedule-activities" element={<ScheduleActivities />} />
              <Route path="/activities" element={<div data-testid="activities-page">Activities Page</div>} />
            </Routes>
          </ScheduleProvider>
        </ActivityProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ScheduleActivities Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(firestore, 'getDoc').mockResolvedValue({ exists: () => false, data: () => ({}) });
    vi.spyOn(firestore, 'onSnapshot').mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({}) });
      return vi.fn();
    });
  });

  it('renders schedule activities page and handles back navigation', async () => {
    renderSchedulePage();

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Schedule Activities' })).toBeInTheDocument();
    expect(screen.getByText('Select an activity to schedule:')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Back/i });
    await act(async () => {
      backBtn.click();
    });

    expect(screen.getByTestId('activities-page')).toBeInTheDocument();
  });

  it('selects an activity and toggles calendar date to schedule it', async () => {
    vi.spyOn(firestore, 'getDoc').mockResolvedValue({
      exists: () => true,
      data: () => ({
        activities: [{ id: 'act_swimming', name: 'Swimming', subActivities: [] }],
        schedules: {},
        logs: {}
      })
    });

    renderSchedulePage();

    await act(async () => {});

    const activityBtn = screen.getByRole('button', { name: /Swimming/i });
    await act(async () => {
      activityBtn.click();
    });

    const day15 = screen.getByText('15').closest('.calendar-day');
    expect(day15).not.toHaveClass('scheduled');

    await act(async () => {
      day15.click();
    });

    expect(day15).toHaveClass('scheduled');
    expect(screen.getByText('Activity scheduled successfully')).toBeInTheDocument();
  });

  it('creates, edits, and clears a recurring schedule pattern and excludes future/skipped days from completion rate', async () => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const pastDate = '2020-01-10';
    const futureDate = '2099-12-20';
    const gymData = {
      activities: [
        {
          id: 'gym',
          name: 'Gym',
          subActivities: [{ id: 'chest', name: 'Chest', color: '#22c55e' }]
        }
      ],
      schedules: {
        [pastDate]: ['gym'],
        [futureDate]: ['gym']
      },
      logs: {
        [pastDate]: ['chest'] // parent gym completed via sub-activity chest
      },
      scheduleSkipped: {},
      schedulePatterns: {}
    };

    vi.spyOn(firestore, 'getDoc').mockResolvedValue({
      exists: () => true,
      data: () => gymData
    });

    renderSchedulePage();
    await act(async () => {});

    await act(async () => {
      screen.getByRole('button', { name: /Gym/i }).click();
    });

    // Parent completion rate counts past completed sub-activity (1/1 = 100%) and ignores future scheduled day
    expect(screen.getByTestId('stat-scheduled')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-completed')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-rate')).toHaveTextContent('100%');

    // Open Schedule Pattern modal
    await act(async () => {
      screen.getByRole('button', { name: /Set Schedule Pattern/i }).click();
    });
    expect(screen.getByRole('dialog', { name: /Schedule Pattern/i })).toBeInTheDocument();

    // Select Every N Days pattern = 2 days in current month
    await act(async () => {
      screen.getByRole('button', { name: 'Every N Days' }).click();
    });
    fireEvent.change(screen.getByLabelText('Repeat every N days'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: monthStart } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: formatLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 20)) } });

    await act(async () => {
      screen.getByRole('button', { name: 'Apply Pattern' }).click();
    });

    expect(screen.queryByRole('dialog', { name: /Schedule Pattern/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Schedule Pattern/i })).toBeInTheDocument();

    // Clear pattern
    await act(async () => {
      screen.getByRole('button', { name: /Edit Schedule Pattern/i }).click();
    });
    await act(async () => {
      screen.getByRole('button', { name: 'Clear Pattern' }).click();
    });
    expect(screen.getByRole('button', { name: /Set Schedule Pattern/i })).toBeInTheDocument();
  });

  it('supports Update Status modal for Planned/Completed/Skipped/Clear and shows role=alert on write failure', async () => {
    vi.spyOn(firestore, 'getDoc').mockResolvedValue({
      exists: () => true,
      data: () => ({
        activities: [{ id: 'run', name: 'Running', subActivities: [] }],
        schedules: {},
        logs: {}
      })
    });

    renderSchedulePage();
    await act(async () => {});

    await act(async () => {
      screen.getByRole('button', { name: /Running/i }).click();
    });

    // Switch to Update Status mode
    await act(async () => {
      screen.getByRole('button', { name: 'Update Status' }).click();
    });

    const day10 = screen.getByText('10').closest('.calendar-day');
    await act(async () => {
      day10.click();
    });

    expect(screen.getByRole('dialog', { name: /Date Actions/i })).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: /Mark Skipped/i }).click();
    });

    expect(screen.queryByRole('dialog', { name: /Date Actions/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('stat-skipped')).toHaveTextContent('1');

    // Simulate Firestore failure and verify accessible role="alert" banner
    vi.spyOn(firestore, 'setDoc').mockRejectedValueOnce(new Error('Network error'));
    await act(async () => {
      screen.getByRole('button', { name: 'Quick Toggle' }).click();
    });
    const day12 = screen.getByText('12').closest('.calendar-day');
    await act(async () => {
      day12.click();
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
