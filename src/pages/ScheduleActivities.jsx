import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';
import {
  useSchedule,
  formatLocalDateStr,
  computeActivityProgress
} from '../context/ScheduleContext';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_DATES = Array.from({ length: 31 }, (_, idx) => idx + 1);

function getDefaultPatternDraft(existingPattern, todayStr) {
  if (existingPattern) {
    return {
      type: existingPattern.type || 'weekly',
      weekdays: existingPattern.weekdays || [],
      monthDays: existingPattern.monthDays || [],
      everyDays: existingPattern.everyDays || 2,
      startDate: existingPattern.startDate || todayStr,
      endDate: existingPattern.endDate || todayStr
    };
  }
  const [y, m, d] = todayStr.split('-').map(Number);
  const end = new Date(y, m - 1, d + 60);
  return {
    type: 'weekly',
    weekdays: [new Date(y, m - 1, d).getDay()],
    monthDays: [d],
    everyDays: 2,
    startDate: todayStr,
    endDate: formatLocalDateStr(end)
  };
}

function formatPatternSummary(pattern) {
  if (!pattern) return '';
  if (pattern.type === 'weekly') {
    const names = (pattern.weekdays || []).map(idx => WEEKDAY_LABELS[idx]).filter(Boolean);
    return `Weekly (${names.join(', ') || 'none'}) · ${pattern.startDate} to ${pattern.endDate}`;
  }
  if (pattern.type === 'monthly') {
    const days = (pattern.monthDays || []).join(', ');
    return `Monthly (days ${days || 'none'}) · ${pattern.startDate} to ${pattern.endDate}`;
  }
  return `Every ${pattern.everyDays || 1} day(s) · ${pattern.startDate} to ${pattern.endDate}`;
}

export default function ScheduleActivities() {
  const navigate = useNavigate();
  const { activities, loading: activitiesLoading } = useActivities();
  const {
    schedules,
    logs,
    skipped,
    patterns,
    scheduleActivity,
    unscheduleActivity,
    setDateStatus,
    applySchedulePattern,
    clearSchedulePattern
  } = useSchedule();

  const [todayDate] = useState(() => new Date());
  const todayStr = formatLocalDateStr(todayDate);

  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedSubActivityId, setSelectedSubActivityId] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [clickMode, setClickMode] = useState('toggle'); // 'toggle' | 'status'
  const [toastMessage, setToastMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal states
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternDraft, setPatternDraft] = useState(() => getDefaultPatternDraft(null, todayStr));
  const [dateModalStr, setDateModalStr] = useState(null);

  const toastTimerRef = useRef(null);

  const selectedActivity = activities.find(a => a.id === selectedActivityId) || null;
  const hasSubActivities = Boolean(selectedActivity?.subActivities?.length);
  const validSubId = selectedActivity?.subActivities?.some(s => s.id === selectedSubActivityId)
    ? selectedSubActivityId
    : null;
  const effectiveScheduledId = validSubId || selectedActivity?.id || null;
  const selectedSubActivity = hasSubActivities
    ? selectedActivity.subActivities.find(s => s.id === validSubId) || null
    : null;
  const effectiveTargetName = selectedSubActivity
    ? `${selectedActivity.name} — ${selectedSubActivity.name}`
    : (selectedActivity?.name || '');

  const activePattern = effectiveScheduledId ? patterns[effectiveScheduledId] || null : null;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showPatternModal && !dateModalStr) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (dateModalStr) {
          setDateModalStr(null);
        } else if (showPatternModal) {
          setShowPatternModal(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPatternModal, dateModalStr]);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2200);
  };

  const runScheduleAction = async (fn, successToast, fallbackError) => {
    setErrorMsg('');
    try {
      await fn();
      if (successToast) showToast(successToast);
    } catch {
      setErrorMsg(fallbackError);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const progress = computeActivityProgress({
    activity: selectedActivity,
    selectedSubActivityId: validSubId,
    schedules,
    logs,
    skipped,
    todayStr
  });

  const handleDateClick = async (day) => {
    if (!effectiveScheduledId) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (clickMode === 'status') {
      setDateModalStr(dateStr);
      return;
    }

    const isScheduled = progress.isScheduledOnDate(dateStr);
    if (isScheduled) {
      await runScheduleAction(
        () => unscheduleActivity(effectiveScheduledId, dateStr),
        'Activity removed from schedule',
        'Could not update schedule. Please try again.'
      );
    } else {
      await runScheduleAction(
        () => scheduleActivity(effectiveScheduledId, dateStr),
        'Activity scheduled successfully',
        'Could not save schedule. Please try again.'
      );
    }
  };

  const openPatternModal = () => {
    if (!effectiveScheduledId) return;
    setPatternDraft(getDefaultPatternDraft(activePattern, todayStr));
    setShowPatternModal(true);
  };

  const toggleDraftWeekday = (dayIdx) => {
    setPatternDraft(prev => {
      const exists = prev.weekdays.includes(dayIdx);
      const next = exists
        ? prev.weekdays.filter(d => d !== dayIdx)
        : [...prev.weekdays, dayIdx].sort((a, b) => a - b);
      return { ...prev, weekdays: next };
    });
  };

  const toggleDraftMonthDay = (dayNum) => {
    setPatternDraft(prev => {
      const exists = prev.monthDays.includes(dayNum);
      const next = exists
        ? prev.monthDays.filter(d => d !== dayNum)
        : [...prev.monthDays, dayNum].sort((a, b) => a - b);
      return { ...prev, monthDays: next };
    });
  };

  const isPatternValid = () => {
    if (!patternDraft.startDate || !patternDraft.endDate || patternDraft.endDate < patternDraft.startDate) {
      return false;
    }
    if (patternDraft.type === 'weekly') return patternDraft.weekdays.length > 0;
    if (patternDraft.type === 'monthly') return patternDraft.monthDays.length > 0;
    return Number(patternDraft.everyDays) >= 1;
  };

  const handleApplyPattern = async (e) => {
    e.preventDefault();
    if (!effectiveScheduledId || !isPatternValid()) return;
    setShowPatternModal(false);
    await runScheduleAction(
      () => applySchedulePattern(effectiveScheduledId, patternDraft),
      'Schedule pattern saved',
      'Could not save schedule pattern. Please try again.'
    );
  };

  const handleClearPattern = async () => {
    if (!effectiveScheduledId) return;
    setShowPatternModal(false);
    await runScheduleAction(
      () => clearSchedulePattern(effectiveScheduledId),
      'Schedule pattern cleared',
      'Could not clear schedule pattern. Please try again.'
    );
  };

  const handleSetModalDateStatus = async (status) => {
    if (!effectiveScheduledId || !dateModalStr) return;
    const targetDate = dateModalStr;
    setDateModalStr(null);

    const toastLabels = {
      planned: 'Marked as planned',
      completed: 'Marked as completed',
      skipped: 'Marked as skipped',
      none: 'Removed from schedule'
    };

    await runScheduleAction(
      () => setDateStatus(effectiveScheduledId, targetDate, status),
      toastLabels[status],
      'Could not update date status. Please try again.'
    );
  };

  const getDateVisualState = (dateStr) => {
    const isScheduled = progress.isScheduledOnDate(dateStr);
    const isLogged = progress.isCompletedOnDate(dateStr);
    const isSkipped = progress.isSkippedOnDate(dateStr);

    if (isLogged) return { isScheduled, isLogged, isSkipped, dotVariant: 'completed', label: 'completed' };
    if (isSkipped) return { isScheduled, isLogged, isSkipped, dotVariant: 'skipped', label: 'skipped' };
    if (isScheduled && dateStr < todayStr) return { isScheduled, isLogged, isSkipped, dotVariant: 'missed', label: 'missed' };
    if (isScheduled) return { isScheduled, isLogged, isSkipped, dotVariant: 'planned', label: 'planned' };
    return { isScheduled: false, isLogged: false, isSkipped: false, dotVariant: null, label: 'not scheduled' };
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const headers = WEEKDAY_LABELS.map(day => (
      <div key={`header-${day}`} className="calendar-weekday">
        {day}
      </div>
    ));

    const leadingEmpties = Array.from({ length: firstDay }, (_, idx) => (
      <div key={`empty-${idx}`} className="calendar-day empty" aria-hidden="true"></div>
    ));

    const days = Array.from({ length: daysInMonth }, (_, idx) => idx + 1).map(dayNum => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const state = getDateVisualState(dateStr);

      return (
        <button
          type="button"
          key={`day-${dayNum}`}
          className={`calendar-day ${state.isScheduled ? 'scheduled' : ''} ${isToday ? 'today' : ''} ${state.isLogged ? 'completed' : ''} ${state.isSkipped ? 'skipped' : ''}`}
          aria-label={`${dateStr}, ${state.label}`}
          onClick={() => handleDateClick(dayNum)}
        >
          <span className="day-number">{dayNum}</span>
          {state.dotVariant && (
            <span className={`status-indicator-dot ${state.dotVariant}`} aria-hidden="true"></span>
          )}
        </button>
      );
    });

    return (
      <div>
        <div className="calendar-header">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="calendar-nav-btn"
            aria-label="Previous month"
          >
            <i className="fas fa-chevron-left" aria-hidden="true"></i>
          </button>
          <h2>
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            type="button"
            onClick={handleNextMonth}
            className="calendar-nav-btn"
            aria-label="Next month"
          >
            <i className="fas fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>

        <div className="calendar-grid">
          {headers}
          {leadingEmpties}
          {days}
        </div>

        <div className="schedule-legend">
          <span className="legend-item">
            <span className="status-indicator-dot completed" aria-hidden="true"></span>
            Completed
          </span>
          <span className="legend-item">
            <span className="status-indicator-dot missed" aria-hidden="true"></span>
            Missed
          </span>
          <span className="legend-item">
            <span className="status-indicator-dot planned" aria-hidden="true"></span>
            Planned
          </span>
          <span className="legend-item">
            <span className="status-indicator-dot skipped" aria-hidden="true"></span>
            Skipped
          </span>
        </div>
      </div>
    );
  };

  const modalDateState = dateModalStr ? getDateVisualState(dateModalStr) : null;

  return (
    <>
      <div className="management-column schedule-page">
        <div className="page-header">
          <h1>Schedule Activities</h1>
          <button
            type="button"
            id="back-to-activities"
            className="back-btn"
            onClick={() => navigate('/activities')}
          >
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            <span>Back</span>
          </button>
        </div>

        {errorMsg && (
          <div className="schedule-error-alert" role="alert">
            <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
            <span>{errorMsg}</span>
            <button
              type="button"
              className="schedule-error-dismiss"
              aria-label="Dismiss error"
              onClick={() => setErrorMsg('')}
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        )}

        <div className="schedule-controls">
          <p className="section-label">Select an activity to schedule:</p>
          <div id="activity-grid" className="activity-grid">
            {activitiesLoading ? (
              <p style={{ opacity: 0.7 }}>Loading activities...</p>
            ) : activities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No activities created yet.</p>
            ) : (
              activities.map(activity => {
                const isSelected = selectedActivity?.id === activity.id;
                return (
                  <button
                    type="button"
                    key={activity.id}
                    aria-pressed={isSelected}
                    className={`activity-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedActivityId(activity.id);
                      setSelectedSubActivityId(null);
                    }}
                  >
                    <div className="activity-card-color" aria-hidden="true"></div>
                    <div className="activity-card-content">
                      <div className="activity-card-name">{activity.name}</div>
                      {activity.subActivities && activity.subActivities.length > 0 && (
                        <div className="activity-card-meta">
                          {activity.subActivities.length} sub-activities
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <i className="fas fa-check-circle activity-card-check" aria-hidden="true"></i>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {hasSubActivities && (
            <div id="subactivity-section" className="subactivity-section">
              <p className="section-label">Select a sub-activity (or schedule whole activity):</p>
              <div id="subactivity-grid" className="subactivity-grid">
                {selectedActivity.subActivities.map(sub => {
                  const isSubSelected = validSubId === sub.id;
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      aria-pressed={isSubSelected}
                      className={`subactivity-card ${isSubSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSubActivityId(isSubSelected ? null : sub.id)}
                    >
                      <div
                        className="activity-card-color"
                        style={{ backgroundColor: sub.color || 'var(--accent-primary)' }}
                        aria-hidden="true"
                      ></div>
                      <div className="activity-card-content">
                        <div className="activity-card-name">{sub.name}</div>
                      </div>
                      {isSubSelected && (
                        <i className="fas fa-check-circle activity-card-check" aria-hidden="true"></i>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {effectiveScheduledId && (
            <div className="schedule-action-bar">
              <div className="schedule-mode-group" role="group" aria-label="Calendar click mode">
                <button
                  type="button"
                  className={`schedule-mode-btn ${clickMode === 'toggle' ? 'active' : ''}`}
                  aria-pressed={clickMode === 'toggle'}
                  onClick={() => setClickMode('toggle')}
                >
                  Quick Toggle
                </button>
                <button
                  type="button"
                  className={`schedule-mode-btn ${clickMode === 'status' ? 'active' : ''}`}
                  aria-pressed={clickMode === 'status'}
                  onClick={() => setClickMode('status')}
                >
                  Update Status
                </button>
              </div>

              <button
                type="button"
                className="schedule-pattern-btn"
                onClick={openPatternModal}
              >
                <i className="fas fa-repeat" aria-hidden="true"></i>
                <span>{activePattern ? 'Edit Schedule Pattern' : 'Set Schedule Pattern'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="schedule-layout">
          <div className="schedule-calendar-section">
            <div id="schedule-calendar-container" className="schedule-calendar-container">
              {!effectiveScheduledId ? (
                <div className="calendar-placeholder">
                  <i className="fas fa-hand-pointer" aria-hidden="true"></i>
                  <p>Select an activity above to view or set its schedule</p>
                </div>
              ) : (
                renderCalendar()
              )}
            </div>
          </div>

          <div className="schedule-stats-section">
            <div className="stats-card">
              <h3>Activity Progress</h3>
              <div id="activity-stats" className="activity-stats">
                {!effectiveScheduledId ? (
                  <div className="stat-placeholder">
                    <i className="fas fa-chart-line" aria-hidden="true"></i>
                    <p>Select an activity to view progress</p>
                  </div>
                ) : (
                  <>
                    <div className="schedule-stats-grid">
                      <div className="stat-tile">
                        <span className="stat-label">Scheduled Days</span>
                        <span className="stat-value" data-testid="stat-scheduled">{progress.totalScheduled}</span>
                      </div>
                      <div className="stat-tile">
                        <span className="stat-label">Completed Days</span>
                        <span className="stat-value success" data-testid="stat-completed">{progress.totalCompleted}</span>
                      </div>
                      <div className="stat-tile">
                        <span className="stat-label">Skipped Days</span>
                        <span className="stat-value warning" data-testid="stat-skipped">{progress.totalSkipped}</span>
                      </div>
                      <div className="stat-tile">
                        <span className="stat-label">Completion Rate</span>
                        <span className="stat-value accent" data-testid="stat-rate">{progress.completionRate}%</span>
                      </div>
                    </div>

                    <div className="progress-container">
                      <div className="progress-label">
                        <span>Evaluated to date ({progress.totalCompleted}/{progress.evaluatedCount})</span>
                        <span>{progress.completionRate}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {activePattern && (
                      <div className="active-pattern-summary">
                        <strong>Saved Pattern</strong>
                        <span>{formatPatternSummary(activePattern)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Pattern Modal */}
      {showPatternModal && (
        <div
          className="custom-modal-overlay show"
          role="dialog"
          aria-modal="true"
          aria-label={`Schedule Pattern for ${effectiveTargetName}`}
          onClick={() => setShowPatternModal(false)}
        >
          <div className="custom-modal schedule-modal" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h3 className="custom-modal-title">Schedule Pattern — {effectiveTargetName}</h3>
              <button
                type="button"
                className="schedule-modal-close-btn"
                aria-label="Close schedule pattern modal"
                onClick={() => setShowPatternModal(false)}
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <form onSubmit={handleApplyPattern}>
              <div className="custom-modal-body schedule-modal-body">
                <div className="pattern-type-selector" role="group" aria-label="Pattern frequency">
                  {[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'interval', label: 'Every N Days' }
                  ].map(option => (
                    <button
                      type="button"
                      key={option.value}
                      className={`pattern-type-btn ${patternDraft.type === option.value ? 'active' : ''}`}
                      aria-pressed={patternDraft.type === option.value}
                      onClick={() => setPatternDraft(prev => ({ ...prev, type: option.value }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {patternDraft.type === 'weekly' && (
                  <div className="pattern-details">
                    <span className="pattern-field-label">Select days of the week:</span>
                    <div className="day-selector">
                      {WEEKDAY_LABELS.map((label, dayIdx) => {
                        const selected = patternDraft.weekdays.includes(dayIdx);
                        return (
                          <button
                            type="button"
                            key={label}
                            className={`day-pill-btn ${selected ? 'active' : ''}`}
                            aria-pressed={selected}
                            onClick={() => toggleDraftWeekday(dayIdx)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {patternDraft.type === 'monthly' && (
                  <div className="pattern-details">
                    <span className="pattern-field-label">Select dates of the month:</span>
                    <div className="date-selector">
                      {MONTH_DATES.map(dayNum => {
                        const selected = patternDraft.monthDays.includes(dayNum);
                        return (
                          <button
                            type="button"
                            key={dayNum}
                            className={`date-option-btn ${selected ? 'selected' : ''}`}
                            aria-pressed={selected}
                            onClick={() => toggleDraftMonthDay(dayNum)}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {patternDraft.type === 'interval' && (
                  <div className="pattern-details">
                    <label className="pattern-field-label" htmlFor="pattern-interval-input">
                      Repeat every N days:
                    </label>
                    <input
                      id="pattern-interval-input"
                      type="number"
                      min="1"
                      max="365"
                      className="pattern-input"
                      aria-label="Repeat every N days"
                      value={patternDraft.everyDays}
                      onChange={e =>
                        setPatternDraft(prev => ({ ...prev, everyDays: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                      }
                    />
                  </div>
                )}

                <div className="pattern-date-range">
                  <div className="pattern-date-field">
                    <label className="pattern-field-label" htmlFor="pattern-start-date">
                      Start date
                    </label>
                    <input
                      id="pattern-start-date"
                      type="date"
                      className="pattern-input"
                      aria-label="Start date"
                      value={patternDraft.startDate}
                      onChange={e => setPatternDraft(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="pattern-date-field">
                    <label className="pattern-field-label" htmlFor="pattern-end-date">
                      End date
                    </label>
                    <input
                      id="pattern-end-date"
                      type="date"
                      className="pattern-input"
                      aria-label="End date"
                      value={patternDraft.endDate}
                      onChange={e => setPatternDraft(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="custom-modal-footer">
                {activePattern && (
                  <button
                    type="button"
                    className="custom-modal-btn custom-modal-btn-danger"
                    onClick={handleClearPattern}
                  >
                    Clear Pattern
                  </button>
                )}
                <button
                  type="button"
                  className="custom-modal-btn custom-modal-btn-secondary"
                  onClick={() => setShowPatternModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="custom-modal-btn custom-modal-btn-primary"
                  disabled={!isPatternValid()}
                >
                  Apply Pattern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Status Modal */}
      {dateModalStr && modalDateState && (
        <div
          className="custom-modal-overlay show"
          role="dialog"
          aria-modal="true"
          aria-label={`Date Actions for ${dateModalStr}`}
          onClick={() => setDateModalStr(null)}
        >
          <div className="custom-modal schedule-modal" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h3 className="custom-modal-title">{effectiveTargetName} — {dateModalStr}</h3>
              <button
                type="button"
                className="schedule-modal-close-btn"
                aria-label="Close date status modal"
                onClick={() => setDateModalStr(null)}
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            <div className="custom-modal-body date-status-actions">
              <button
                type="button"
                className={`status-action-btn planned ${modalDateState.dotVariant === 'planned' || modalDateState.dotVariant === 'missed' ? 'active' : ''}`}
                onClick={() => handleSetModalDateStatus('planned')}
              >
                Mark Planned
              </button>
              <button
                type="button"
                className={`status-action-btn completed ${modalDateState.isLogged ? 'active' : ''}`}
                onClick={() => handleSetModalDateStatus('completed')}
              >
                Mark Completed
              </button>
              <button
                type="button"
                className={`status-action-btn skipped ${modalDateState.isSkipped ? 'active' : ''}`}
                onClick={() => handleSetModalDateStatus('skipped')}
              >
                Mark Skipped
              </button>
              <button
                type="button"
                className="status-action-btn none"
                onClick={() => handleSetModalDateStatus('none')}
              >
                Remove from Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="schedule-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </>
  );
}
