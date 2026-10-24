import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';
import { useGoals } from '../context/GoalContext';
import { useNotes } from '../context/NoteContext';
import { useReminders } from '../context/ReminderContext';
import { useSchedule } from '../context/ScheduleContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activities, loading: activitiesLoading } = useActivities();
  const { goals, loading: goalsLoading, toggleGoal } = useGoals();
  const { notes, addNote, updateNote } = useNotes();
  const { reminders, loading: remindersLoading } = useReminders();
  const { logs, toggleActivityLog } = useSchedule();

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [remindersExpanded, setRemindersExpanded] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (dateStr) => {
    if (isEditingNote && noteDraft) {
      if (currentDailyNote) {
        if (noteDraft !== currentDailyNote.content) {
          updateNote(currentDailyNote.id, { content: noteDraft });
        }
      } else if (noteDraft.trim()) {
        addNote(selectedDateStr, noteDraft.trim(), 'daily');
      }
      setIsEditingNote(false);
    }
    setSelectedDateStr(dateStr);
  };

  // Find daily note for selectedDateStr
  const currentDailyNote = notes.find(n => n.type === 'daily' && n.date === selectedDateStr);
  const [noteDraft, setNoteDraft] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Synchronize noteDraft whenever selectedDateStr or currentDailyNote changes (unless currently typing)
  useEffect(() => {
    if (!isEditingNote) {
      setNoteDraft(currentDailyNote ? currentDailyNote.content : '');
    }
  }, [selectedDateStr, currentDailyNote, isEditingNote]);

  // Keep references for auto-save on unmount/navigation
  const noteDraftRef = useRef(noteDraft);
  const currentDailyNoteRef = useRef(currentDailyNote);
  const selectedDateStrRef = useRef(selectedDateStr);
  const isEditingNoteRef = useRef(isEditingNote);

  useEffect(() => {
    noteDraftRef.current = noteDraft;
    currentDailyNoteRef.current = currentDailyNote;
    selectedDateStrRef.current = selectedDateStr;
    isEditingNoteRef.current = isEditingNote;
  }, [noteDraft, currentDailyNote, selectedDateStr, isEditingNote]);

  const handleNoteBlur = async () => {
    setIsEditingNote(false);
    const draft = noteDraft;
    const existing = currentDailyNote;
    if (existing) {
      if (draft !== existing.content) {
        await updateNote(existing.id, { content: draft });
      }
    } else if (draft && draft.trim()) {
      await addNote(selectedDateStr, draft.trim(), 'daily');
    }
  };

  // Auto-save pending note content if navigating or unmounting
  useEffect(() => {
    return () => {
      const draft = noteDraftRef.current;
      const existing = currentDailyNoteRef.current;
      const dateStr = selectedDateStrRef.current;
      const wasEditing = isEditingNoteRef.current;
      if (wasEditing && draft) {
        if (existing) {
          if (draft !== existing.content) {
            updateNote(existing.id, { content: draft });
          }
        } else if (draft.trim()) {
          addNote(dateStr, draft.trim(), 'daily');
        }
      }
    };
  }, [addNote, updateNote]);

  // Format date display
  const formatDateHeader = (ds) => {
    try {
      if (!ds) return '';
      const [year, month, day] = ds.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return ds;
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = date.getDate();
      const yearNum = date.getFullYear();
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${monthName} ${dayNum}, ${yearNum}, ${weekday}`;
    } catch {
      return ds;
    }
  };

  const formatDateForInline = (ds) => {
    try {
      if (!ds) return '';
      const [year, month, day] = ds.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return ds;
      const monthName = date.toLocaleString('default', { month: 'long' });
      let dayWithSuffix;
      if (day > 3 && day < 21) {
        dayWithSuffix = `${day}th`;
      } else {
        switch (day % 10) {
          case 1: dayWithSuffix = `${day}st`; break;
          case 2: dayWithSuffix = `${day}nd`; break;
          case 3: dayWithSuffix = `${day}rd`; break;
          default: dayWithSuffix = `${day}th`; break;
        }
      }
      return `${dayWithSuffix} ${monthName}`;
    } catch {
      return ds;
    }
  };

  const formatDateForNotes = (ds) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (ds === todayStr) return 'Today';

    try {
      const [year, month, day] = ds.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const monthName = date.toLocaleString('default', { month: 'long' });
      let dayWithSuffix;
      if (day > 3 && day < 21) {
        dayWithSuffix = `${day}th`;
      } else {
        switch (day % 10) {
          case 1: dayWithSuffix = `${day}st`; break;
          case 2: dayWithSuffix = `${day}nd`; break;
          case 3: dayWithSuffix = `${day}rd`; break;
          default: dayWithSuffix = `${day}th`; break;
        }
      }
      return `${dayWithSuffix} ${monthName}`;
    } catch {
      return ds;
    }
  };

  const formatReminderTime = (dateStr, timeStr) => {
    try {
      const reminderDate = new Date(`${dateStr}T${timeStr}`);
      if (isNaN(reminderDate.getTime())) return `${dateStr} ${timeStr}`;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

      let dStr;
      if (reminderDay.getTime() === today.getTime()) {
        dStr = 'Today';
      } else if (reminderDay.getTime() === tomorrow.getTime()) {
        dStr = 'Tomorrow';
      } else {
        dStr = reminderDate.toLocaleDateString();
      }
      const tStr = reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${dStr} at ${tStr}`;
    } catch {
      return `${dateStr} at ${timeStr}`;
    }
  };

  const isReminderExpired = (dateStr, timeStr) => {
    try {
      const reminderDateTime = new Date(`${dateStr}T${timeStr}`);
      return reminderDateTime < new Date();
    } catch {
      return false;
    }
  };

  // Activity dots helper for a date (supports filtering by selected activity)
  const getDotsForDate = (dateStr) => {
    const loggedIds = new Set(logs[dateStr] || []);
    if (loggedIds.size === 0) return null;

    const colors = [];
    const activitiesToConsider = selectedActivityId
      ? activities.filter(a => a.id === selectedActivityId)
      : activities;

    activitiesToConsider.forEach(activity => {
      if (activity.subActivities && activity.subActivities.length > 0) {
        activity.subActivities.forEach(sub => {
          if (loggedIds.has(sub.id)) {
            colors.push(sub.color || '#3B82F6');
          }
        });
      } else if (loggedIds.has(activity.id)) {
        colors.push('var(--accent-primary)');
      }
    });

    if (colors.length === 0) return null;

    return (
      <div className="calendar-dots">
        {colors.slice(0, 4).map((color, idx) => (
          <span key={idx} className="calendar-dot" style={{ backgroundColor: color }}></span>
        ))}
      </div>
    );
  };

  // Calendar render
  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDate.getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells = [];

    // Weekdays
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayHeaders = weekdays.map(day => (
      <div key={`weekday-${day}`} className="weekday">{day}</div>
    ));

    // Previous month days
    for (let i = firstDay; i > 0; i--) {
      const day = prevMonthDays - i + 1;
      const prevDate = new Date(year, month - 1, day);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push(
        <div 
          key={`prev-${day}`} 
          className="calendar-day other-month"
          onClick={() => handleDateClick(dateStr)}
        >
          <span className="calendar-date-num">{day}</span>
          {getDotsForDate(dateStr)}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDateStr;

      let dayClasses = 'calendar-day';
      if (isToday) dayClasses += ' today';
      if (isSelected) dayClasses += ' selected';

      cells.push(
        <div 
          key={`curr-${day}`} 
          className={dayClasses}
          onClick={() => handleDateClick(dateStr)}
        >
          <span className="calendar-date-num">{day}</span>
          {getDotsForDate(dateStr)}
        </div>
      );
    }

    // Next month days
    const totalCells = 42;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push(
        <div 
          key={`next-${i}`} 
          className="calendar-day other-month"
          onClick={() => handleDateClick(dateStr)}
        >
          <span className="calendar-date-num">{i}</span>
          {getDotsForDate(dateStr)}
        </div>
      );
    }

    const selectedActivity = activities.find(a => a.id === selectedActivityId);

    return (
      <section className="calendar-view" id="calendar-view">
        <div className="calendar-header">
          <button id="prev-month" className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
          <div className="calendar-title-container">
            <h2 className="calendar-title" id="calendar-title">{monthName} {year}</h2>
            {selectedActivity && (
              <h3 className="current-activity-title" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', margin: '0.2rem 0 0 0', fontWeight: '600' }}>
                {selectedActivity.name}
              </h3>
            )}
          </div>
          <button id="next-month" className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
        </div>
        <div className="calendar-grid" id="calendar-grid">
          {weekdayHeaders}
          {cells}
        </div>
      </section>
    );
  };

  // Goals to show
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const goalsToShow = goalsExpanded ? [...activeGoals, ...completedGoals] : activeGoals.slice(0, 4);

  // Reminders to show
  const sortedReminders = [...reminders].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA - dateTimeB;
  });
  const now = new Date();
  const futureReminders = sortedReminders.filter(r => new Date(`${r.date}T${r.time}`) >= now);
  const pastReminders = sortedReminders.filter(r => new Date(`${r.date}T${r.time}`) < now).reverse();

  let remindersToShow;
  if (remindersExpanded) {
    remindersToShow = sortedReminders;
  } else {
    remindersToShow = futureReminders.slice(0, 2);
    if (remindersToShow.length < 2 && pastReminders.length > 0) {
      remindersToShow.push(...pastReminders.slice(0, 2 - remindersToShow.length));
    }
  }

  // Currently logged IDs for selectedDateStr
  const currentLoggedIds = new Set(logs[selectedDateStr] || []);

  return (
    <div className="main-layout">
      {/* Left Column: Activities and Notes */}
      <div className="left-column">
        {/* Activities Component */}
        <div 
          className="activities-component inline-logging-open" 
          onClick={(e) => {
            if (e.target.closest('.show-all-btn, .activity-item, .pill, .activity-group-title, button')) return;
            navigate('/activities');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="section-header">
            <h2>Activities</h2>
            <button 
              className="show-all-btn" 
              id="activities-show-all" 
              title="Show all activities"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/activities');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div id="activity-list" className="activity-list inline-logging-active">
            {activitiesLoading ? (
              <p style={{ padding: '0 1rem', opacity: 0.7 }}>Loading activities...</p>
            ) : (
              <div className="inline-logging-interface">
                <div className="inline-logging-header">
                  <h3>{formatDateForInline(selectedDateStr)}</h3>
                </div>
                <div className="inline-activities-container">
                  {activities.length === 0 ? (
                    <p style={{ padding: '0 0.5rem', opacity: 0.7 }}>No activities yet.</p>
                  ) : (
                    activities.map(activity => {
                    const hasSubs = activity.subActivities && activity.subActivities.length > 0;
                    
                    if (hasSubs) {
                      return (
                        <div key={activity.id} className="activity-group">
                          <h4 
                            className="activity-group-title"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivityId(prev => prev === activity.id ? null : activity.id);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            title={selectedActivityId === activity.id ? "Click to clear calendar filter" : "Click to filter calendar for this activity"}
                          >
                            <span>{activity.name}</span>
                            {selectedActivityId === activity.id && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'normal' }}>filtered</span>
                            )}
                          </h4>
                          <div className="pills-container">
                            {activity.subActivities.map(sub => {
                              const isSelected = currentLoggedIds.has(sub.id);
                              const color = sub.color || '#3B82F6';
                              return (
                                <div
                                  key={sub.id}
                                  className={`pill ${isSelected ? 'selected' : ''}`}
                                  data-id={sub.id}
                                  data-date={selectedDateStr}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleActivityLog(sub.id, selectedDateStr);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    borderColor: isSelected ? color : `${color}55`,
                                    backgroundColor: isSelected ? `${color}25` : 'var(--bg-primary)',
                                    color: isSelected ? color : 'var(--text-primary)'
                                  }}
                                >
                                  {sub.name}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    const isSelected = currentLoggedIds.has(activity.id);
                    const color = 'var(--accent-primary)';
                    return (
                      <div key={activity.id} className="activity-group">
                        <div className="pills-container">
                          <div
                            key={activity.id}
                            className={`pill ${isSelected ? 'selected' : ''}`}
                            data-id={activity.id}
                            data-date={selectedDateStr}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActivityLog(activity.id, selectedDateStr);
                            }}
                            style={{
                              cursor: 'pointer',
                              borderColor: isSelected ? color : 'var(--border-color)',
                              backgroundColor: isSelected ? 'var(--primary-color-alpha)' : 'var(--bg-primary)',
                              color: isSelected ? color : 'var(--text-primary)'
                            }}
                          >
                            {activity.name}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Notes Component */}
        <div 
          className="notes-component"
          onClick={(e) => {
            if (e.target.closest('.show-all-btn, .notes-editor, textarea, button')) return;
            navigate('/notes');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="section-header">
            <h2>Notes</h2>
            <button 
              className="show-all-btn" 
              id="notes-show-all" 
              title="Show all notes"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/notes');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div id="notes-preview" className="notes-preview">
            <div className="notes-date-header">
              📝 Notes for {formatDateForNotes(selectedDateStr)}:
            </div>
            <div className="notes-editor-container home-notes-editor-container">
              <textarea 
                className="notes-editor home-notes-editor"
                placeholder="Write your note for this day"
                value={noteDraft}
                onFocus={() => setIsEditingNote(true)}
                onChange={e => setNoteDraft(e.target.value)}
                onBlur={handleNoteBlur}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Column: Date and Calendar */}
      <div className="center-column">
        <div className="date-display">
          <div className="current-date-colored" id="current-date">
            {formatDateHeader(selectedDateStr)}
          </div>
        </div>

        {renderCalendar()}
      </div>

      {/* Right Column: Goals and Reminders */}
      <div className="right-column">
        {/* Goals Component */}
        <div 
          className="goals-component"
          onClick={(e) => {
            if (e.target.closest('.show-all-btn, .goal-item, button')) return;
            navigate('/goals');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="section-header">
            <h2>Goals</h2>
            {(activeGoals.length > 4 || completedGoals.length > 0) && (
              <button 
                className={`show-all-btn ${goalsExpanded ? 'expanded' : ''}`}
                id="goals-show-all" 
                title={goalsExpanded ? 'Collapse' : 'Show all'}
                onClick={(e) => {
                  e.stopPropagation();
                  setGoalsExpanded(!goalsExpanded);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                </svg>
              </button>
            )}
          </div>
          <ul id="goal-list" className={`goal-list ${goalsExpanded ? 'expanded' : ''}`}>
            {goalsLoading ? (
              <p style={{ padding: '0 1rem', opacity: 0.7 }}>Loading goals...</p>
            ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
              <p style={{ padding: '0 1rem', opacity: 0.7 }}>Add a goal to get started.</p>
            ) : activeGoals.length === 0 && !goalsExpanded ? (
              <p style={{ padding: '0 1rem', opacity: 0.7 }}>All goals completed! 🎉</p>
            ) : (
              goalsToShow.map(goal => (
                <li 
                  key={goal.id} 
                  className={`goal-item ${goal.completed ? 'completed' : 'pending'}`}
                  data-id={goal.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGoal(goal.id);
                  }}
                  title={goal.completed ? "Click to mark as pending" : "Click to mark as completed"}
                >
                  <span style={{ textDecoration: goal.completed ? 'line-through' : 'none' }}>
                    {goal.name || goal.title}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Reminders Component */}
        <div 
          className="reminders-component"
          onClick={(e) => {
            if (e.target.closest('.show-all-btn, .reminder-preview-item, button')) return;
            navigate('/reminders');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="section-header">
            <h2>Reminders</h2>
            {sortedReminders.length > 2 && (
              <button 
                className={`show-all-btn ${remindersExpanded ? 'expanded' : ''}`}
                id="reminders-show-all" 
                title={remindersExpanded ? 'Collapse' : 'Show all'}
                onClick={(e) => {
                  e.stopPropagation();
                  setRemindersExpanded(!remindersExpanded);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                </svg>
              </button>
            )}
          </div>
          <div id="reminders-preview" className={`reminders-preview ${remindersExpanded ? 'expanded' : ''}`}>
            {remindersLoading ? (
              <p style={{ padding: '0 1rem', opacity: 0.7 }}>Loading reminders...</p>
            ) : remindersToShow.length === 0 ? (
              <p style={{ padding: '0 1rem', opacity: 0.7 }}>No reminders set.</p>
            ) : (
              remindersToShow.map(reminder => {
                const expired = isReminderExpired(reminder.date, reminder.time);
                return (
                  <div 
                    key={reminder.id} 
                    className={`reminder-preview-item ${expired ? 'expired' : ''}`}
                    onClick={() => navigate('/reminders')}
                  >
                    <div className="reminder-preview-title">{reminder.text}</div>
                    <div className="reminder-preview-time">{formatReminderTime(reminder.date, reminder.time)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
