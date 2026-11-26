import { render, screen, act, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { getDoc, onSnapshot } from 'firebase/firestore';
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
    getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    onSnapshot.mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({}) });
      return vi.fn();
    });
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

    // Click notes heading inside Notes card
    const notesHeading = screen.getByRole('heading', { level: 2, name: 'Notes' });
    await act(async () => {
      fireEvent.click(notesHeading);
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

  it('hides activities toggle button when no date is selected and <= 3 activities exist, keeping Notes header on Today', async () => {
    const oneActivity = [
      {
        id: 'gym',
        name: 'Gym',
        subActivities: [
          { id: 'chest', name: 'Chest', color: '#22c55e' },
          { id: 'shoulder', name: 'Shoulder', color: '#3b82f6' }
        ]
      }
    ];
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ activities: oneActivity }) });
    onSnapshot.mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({ activities: oneActivity }) });
      return vi.fn();
    });

    renderDashboard();
    await act(async () => {});

    // When today is selected by default, toggle button is present to exit inline logging
    const showAllBtn = screen.getByRole('button', { name: 'Show all activities' });
    expect(showAllBtn).toBeInTheDocument();
    expect(screen.getByText(/Notes for Today:/)).toBeInTheDocument();

    // Unselect date by clicking the button
    await act(async () => {
      fireEvent.click(showAllBtn);
    });

    // No date selected & <= 3 activities: toggle button is not needed and should be hidden
    expect(screen.queryByRole('button', { name: /^(show all activities|show all|collapse)$/i })).not.toBeInTheDocument();
    expect(document.getElementById('activities-show-all')).not.toBeInTheDocument();
    // Notes header should still reference Today rather than a blank date
    expect(screen.getByText(/Notes for Today:/)).toBeInTheDocument();
  });

  it('shows activities toggle button when no date is selected only when content overflows', async () => {
    const fourActivities = [
      { id: 'a1', name: 'Gym', subActivities: [] },
      { id: 'a2', name: 'Reading', subActivities: [] },
      { id: 'a3', name: 'Running', subActivities: [] },
      { id: 'a4', name: 'Meditation', subActivities: [] }
    ];
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ activities: fourActivities }) });
    onSnapshot.mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({ activities: fourActivities }) });
      return vi.fn();
    });

    renderDashboard();
    await act(async () => {});

    // Unselect date by clicking outside calendar
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    // When 4 activities fit without overflowing (scrollHeight <= clientHeight), all 4 show with no button
    const activityListEl = document.getElementById('activity-list');
    const activityList = within(activityListEl);
    expect(activityList.getByText('Gym')).toBeInTheDocument();
    expect(activityList.getByText('Meditation')).toBeInTheDocument();
    expect(document.getElementById('activities-show-all')).not.toBeInTheDocument();

    // Simulate vertical overflow inside the activities container
    Object.defineProperty(activityListEl, 'clientHeight', { value: 120, configurable: true });
    Object.defineProperty(activityListEl, 'scrollHeight', { value: 220, configurable: true });
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    const expandBtn = screen.getByRole('button', { name: 'Show all' });
    expect(expandBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(expandBtn);
    });

    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('hides Notes show-all button when note content does not overflow and shows it when overflowing', async () => {
    renderDashboard();
    await act(async () => {});

    // Empty note does not overflow -> no button rendered
    expect(document.getElementById('notes-show-all')).not.toBeInTheDocument();

    // Simulate overflowing note content in the editor textarea
    const textarea = screen.getByPlaceholderText('Write your note for this day');
    Object.defineProperty(textarea, 'clientHeight', { value: 120, configurable: true });
    Object.defineProperty(textarea, 'scrollHeight', { value: 260, configurable: true });
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Line 1\n'.repeat(20) } });
    });

    const notesBtn = screen.getByRole('button', { name: 'Show all notes' });
    expect(notesBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(notesBtn);
    });

    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });

  it('hides Goals and Reminders collapse buttons when content fits without overflowing and shows them on overflow', async () => {
    const fiveGoals = [
      { id: 'g1', name: 'Goal 1', completed: false },
      { id: 'g2', name: 'Goal 2', completed: false },
      { id: 'g3', name: 'Goal 3', completed: false },
      { id: 'g4', name: 'Goal 4', completed: false },
      { id: 'g5', name: 'Goal 5', completed: false }
    ];
    const threeReminders = [
      { id: 'r1', text: 'Call doctor', date: '2099-01-01', time: '09:00' },
      { id: 'r2', text: 'Pay bill', date: '2099-01-02', time: '10:00' },
      { id: 'r3', text: 'Submit report', date: '2099-01-03', time: '11:00' }
    ];
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ goals: fiveGoals, reminders: threeReminders }) });
    onSnapshot.mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({ goals: fiveGoals, reminders: threeReminders }) });
      return vi.fn();
    });

    renderDashboard();
    await act(async () => {});

    // Non-overflowing lists show all items without collapse buttons
    expect(screen.getByText('Goal 5')).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(document.getElementById('goals-show-all')).not.toBeInTheDocument();
    expect(document.getElementById('reminders-show-all')).not.toBeInTheDocument();

    // Simulate overflow on both containers
    const goalListEl = document.getElementById('goal-list');
    const remindersEl = document.getElementById('reminders-preview');
    Object.defineProperty(goalListEl, 'clientHeight', { value: 140, configurable: true });
    Object.defineProperty(goalListEl, 'scrollHeight', { value: 260, configurable: true });
    Object.defineProperty(remindersEl, 'clientHeight', { value: 140, configurable: true });
    Object.defineProperty(remindersEl, 'scrollHeight', { value: 260, configurable: true });

    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(document.getElementById('goals-show-all')).toBeInTheDocument();
    expect(document.getElementById('reminders-show-all')).toBeInTheDocument();
  });

  it('compacts notes during inline logging and expands all events on overflow without closing selected date', async () => {
    const manyActivities = [
      {
        id: 'gym',
        name: 'Gym',
        subActivities: [
          { id: 'chest', name: 'Chest', color: '#22c55e' },
          { id: 'shoulder', name: 'Shoulder', color: '#3b82f6' },
          { id: 'back', name: 'Back', color: '#f97316' },
          { id: 'bicep', name: 'Bicep', color: '#a855f7' },
          { id: 'tricep', name: 'Tricep', color: '#ec4899' },
          { id: 'leg', name: 'Leg', color: '#0ea5e9' },
          { id: 'core', name: 'Core', color: '#eab308' },
          { id: 'circuit', name: 'Circuit', color: '#9ca3af' },
          { id: 'cardio', name: 'Cardio', color: '#ef4444' }
        ]
      },
      { id: 'bike', name: 'Bike', subActivities: [] }
    ];
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ activities: manyActivities }) });
    onSnapshot.mockImplementation((_ref, callback) => {
      callback({ exists: () => true, data: () => ({ activities: manyActivities }) });
      return vi.fn();
    });

    renderDashboard();
    await act(async () => {});

    const notesCard = document.querySelector('.notes-component');
    const activitiesCard = document.querySelector('.activities-component');
    const activityListEl = document.getElementById('activity-list');

    expect(activitiesCard).toHaveClass('inline-logging-open');
    expect(notesCard).toHaveClass('compact-for-logging');
    expect(screen.getByText('Bike')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();

    // No extra Show all events button when content fits without overflowing
    expect(screen.queryByRole('button', { name: /show all events|collapse events/i })).not.toBeInTheDocument();

    // Clicking a group title filters calendar without closing inline logging
    const gymGroupTitle = within(activityListEl).getByText('Gym');
    await act(async () => {
      fireEvent.mouseDown(gymGroupTitle);
      fireEvent.click(gymGroupTitle);
    });
    expect(activitiesCard).toHaveClass('inline-logging-open');

    // Simulate vertical overflow when even more events exceed the box
    Object.defineProperty(activityListEl, 'clientHeight', { value: 180, configurable: true });
    Object.defineProperty(activityListEl, 'scrollHeight', { value: 360, configurable: true });
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    const expandEventsBtn = screen.getByRole('button', { name: 'Show all events' });
    expect(expandEventsBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseDown(expandEventsBtn);
      fireEvent.click(expandEventsBtn);
    });

    // Stays in inline logging while expanding the card and main layout
    expect(activitiesCard).toHaveClass('inline-logging-open');
    expect(activitiesCard).toHaveClass('expanded');
    expect(activityListEl).toHaveClass('expanded');
    expect(document.querySelector('.main-layout')).toHaveClass('expanded-active');

    const collapseEventsBtn = screen.getByRole('button', { name: 'Collapse events' });
    await act(async () => {
      fireEvent.mouseDown(collapseEventsBtn);
      fireEvent.click(collapseEventsBtn);
    });
    expect(activitiesCard).toHaveClass('inline-logging-open');
    expect(document.querySelector('.main-layout')).not.toHaveClass('expanded-active');

    // Exiting inline logging removes compact-for-logging on Notes
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    expect(activitiesCard).not.toHaveClass('inline-logging-open');
    expect(notesCard).not.toHaveClass('compact-for-logging');
  });
});
