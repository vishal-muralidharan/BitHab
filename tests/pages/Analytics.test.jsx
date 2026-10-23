import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Analytics from '../../src/pages/Analytics';
import { AuthProvider } from '../../src/context/AuthContext';
import { GoalProvider } from '../../src/context/GoalContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics charts, goal progress, and session summary metrics', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const mockSessions = [
      { id: 's1', date: todayStr, duration: 45, subject: 'Math', completed: true },
      { id: 's2', date: todayStr, duration: 30, subject: 'Physics', completed: true }
    ];

    vi.spyOn(firestore, 'getDocs').mockResolvedValueOnce({
      forEach: (cb) => {
        mockSessions.forEach(s => cb({ id: s.id, data: () => s }));
      }
    });

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AuthProvider>
          <GoalProvider>
            <Analytics />
          </GoalProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 3, name: 'Focus Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'This Week' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Subject Breakdown' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Goal Progress' })).toBeInTheDocument();

    // Check subjects breakdown rendered
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getAllByText('45m')).toHaveLength(2);
    expect(screen.getByText('30m')).toBeInTheDocument();

    // Overview cards
    expect(screen.getByText('Focus Streak')).toBeInTheDocument();
    expect(screen.getByText('Total This Month')).toBeInTheDocument();
    expect(screen.getByText('1.3h')).toBeInTheDocument(); // 75 minutes = 1.3h
  });

  it('displays empty states gracefully when no sessions or goals exist', async () => {
    vi.spyOn(firestore, 'getDocs').mockResolvedValueOnce({
      forEach: () => {}
    });

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AuthProvider>
          <GoalProvider>
            <Analytics />
          </GoalProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {});

    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText('No active goals')).toBeInTheDocument();
    expect(screen.getByText('0.0h')).toBeInTheDocument();
  });
});
