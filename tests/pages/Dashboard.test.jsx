import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../../src/pages/Dashboard';
import { AuthProvider } from '../../src/context/AuthContext';
import { ActivityProvider } from '../../src/context/ActivityContext';
import { GoalProvider } from '../../src/context/GoalContext';
import { NoteProvider } from '../../src/context/NoteContext';
import { ReminderProvider } from '../../src/context/ReminderContext';
import { ScheduleProvider } from '../../src/context/ScheduleContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestore from 'firebase/firestore';

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <ActivityProvider>
          <GoalProvider>
            <NoteProvider>
              <ReminderProvider>
                <ScheduleProvider>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/activities" element={<div data-testid="activities-page">Activities</div>} />
                    <Route path="/goals" element={<div data-testid="goals-page">Goals</div>} />
                    <Route path="/reminders" element={<div data-testid="reminders-page">Reminders</div>} />
                    <Route path="/notes" element={<div data-testid="notes-page">Notes</div>} />
                  </Routes>
                </ScheduleProvider>
              </ReminderProvider>
            </NoteProvider>
          </GoalProvider>
        </ActivityProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard widgets: activities, calendar, daily note editor, goals, reminders', async () => {
    renderDashboard();

    await act(async () => {});

    expect(screen.getByRole('heading', { level: 2, name: 'Activities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Goals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Reminders' })).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Write your note for this day')).toBeInTheDocument();
    expect(document.getElementById('current-date')).toHaveTextContent('Today');
  });

  it('types and saves a daily note in the home notes editor on blur', async () => {
    renderDashboard();

    await act(async () => {});

    const textarea = screen.getByPlaceholderText('Write your note for this day');
    fireEvent.change(textarea, { target: { value: 'Productive morning coding session' } });

    await act(async () => {
      fireEvent.blur(textarea);
    });

    expect(textarea.value).toBe('Productive morning coding session');
  });

  it('navigates to individual feature pages when clicking section headers', async () => {
    renderDashboard();

    await act(async () => {});

    // Click notes show-all button
    const notesShowAll = document.getElementById('notes-show-all');
    await act(async () => {
      notesShowAll.click();
    });

    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });
});
