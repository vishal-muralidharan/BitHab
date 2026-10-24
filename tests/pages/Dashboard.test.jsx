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
    const today = new Date();
    const expectedMonth = today.toLocaleDateString('en-US', { month: 'long' });
    const expectedYear = today.getFullYear();
    const currentDateEl = document.getElementById('current-date');
    expect(currentDateEl).toHaveTextContent(expectedMonth);
    expect(currentDateEl).toHaveTextContent(String(expectedYear));
    expect(currentDateEl.textContent).not.toMatch(/^Today,/);
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

  it('renders inline logging interface for today by default on load, unselects on outside click, and switches date on calendar click', async () => {
    renderDashboard();

    await act(async () => {});

    const activityList = document.getElementById('activity-list');
    // On load, today is selected by default and inline logging is active
    expect(activityList).toHaveClass('inline-logging-active');
    expect(activityList.querySelector('.inline-logging-interface')).toBeInTheDocument();

    // Click outside calendar (e.g. document body)
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    // Date is unselected, logging state undone, and all activities are shown
    expect(activityList).not.toHaveClass('inline-logging-active');
    expect(activityList.querySelector('.inline-logging-interface')).not.toBeInTheDocument();

    // Click a calendar day
    const dayCell = document.querySelector('.calendar-day:not(.other-month)');
    await act(async () => {
      fireEvent.click(dayCell);
    });

    // Logging state is active again for the clicked date
    expect(activityList).toHaveClass('inline-logging-active');
    expect(activityList.querySelector('.inline-logging-interface')).toBeInTheDocument();
  });

  it('displays activity name in calendar header and opens year/month picker modal on date header click', async () => {
    renderDashboard();

    await act(async () => {});

    // Calendar title element exists and displays current activity or All Activities
    const calendarTitle = document.getElementById('calendar-title');
    expect(calendarTitle).toBeInTheDocument();
    expect(calendarTitle.textContent).toBeTruthy();

    // Modal is initially not rendered
    expect(document.getElementById('year-month-picker-modal')).not.toBeInTheDocument();

    // Click date header
    const currentDateEl = document.getElementById('current-date');
    await act(async () => {
      fireEvent.click(currentDateEl.closest('.date-display'));
    });

    // Modal is now open
    const modal = document.getElementById('year-month-picker-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Select Year, Month, and Activity')).toBeInTheDocument();

    // Select Year 2025 and Month March (index 2)
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    fireEvent.change(yearSelect, { target: { value: '2025' } });
    fireEvent.change(monthSelect, { target: { value: '2' } });

    // Click Apply
    const applyBtn = document.getElementById('apply-year-month');
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    // Modal closes
    expect(document.getElementById('year-month-picker-modal')).not.toBeInTheDocument();

    // Date display and calendar subtitle reflect March 2025
    expect(document.getElementById('current-date')).toHaveTextContent('March');
    expect(document.getElementById('current-date')).toHaveTextContent('2025');
  });

  it('cancels year/month picker modal without applying changes when clicking cancel', async () => {
    renderDashboard();

    await act(async () => {});

    // Click date header
    const currentDateEl = document.getElementById('current-date');
    await act(async () => {
      fireEvent.click(currentDateEl.closest('.date-display'));
    });

    expect(document.getElementById('year-month-picker-modal')).toBeInTheDocument();

    // Click cancel
    const cancelBtn = document.getElementById('cancel-year-month');
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(document.getElementById('year-month-picker-modal')).not.toBeInTheDocument();
  });
});
