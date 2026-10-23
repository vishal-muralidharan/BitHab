import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ScheduleActivities from '../../src/pages/ScheduleActivities';
import { ActivityProvider } from '../../src/context/ActivityContext';
import { ScheduleProvider } from '../../src/context/ScheduleContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

describe('ScheduleActivities Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders schedule activities page and handles back navigation', async () => {
    render(
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

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Schedule Activities' })).toBeInTheDocument();
    expect(screen.getByText('Select an activity to schedule:')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Back/i });
    await act(async () => {
      backBtn.click();
    });

    expect(screen.getByTestId('activities-page')).toBeInTheDocument();
  });

  it('selects an activity and clicks calendar date to schedule it', async () => {
    vi.spyOn(firestore, 'getDoc').mockResolvedValue({
      exists: () => true,
      data: () => ({
        activities: [{ id: 'act_swimming', name: 'Swimming', subActivities: [] }],
        schedules: {},
        logs: {}
      })
    });

    render(
      <MemoryRouter initialEntries={['/schedule-activities']}>
        <AuthProvider>
          <ActivityProvider>
            <ScheduleProvider>
              <ScheduleActivities />
            </ScheduleProvider>
          </ActivityProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    // Activity card should exist
    const activityCard = screen.getByText('Swimming');
    expect(activityCard).toBeInTheDocument();

    // Select Swimming
    await act(async () => {
      activityCard.click();
    });

    // Click day 15 on calendar
    const day15 = screen.getByText('15').closest('.calendar-day');
    expect(day15).not.toHaveClass('scheduled');

    await act(async () => {
      day15.click();
    });

    expect(day15).toHaveClass('scheduled');
    expect(screen.getByText('Activity scheduled successfully')).toBeInTheDocument();
  });
});
