import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';
import { useSchedule } from '../context/ScheduleContext';

export default function ScheduleActivities() {
  const navigate = useNavigate();
  const { activities, loading: activitiesLoading } = useActivities();
  const { schedules, logs, scheduleActivity, unscheduleActivity } = useSchedule();
  
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedSubActivityId, setSelectedSubActivityId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toastMessage, setToastMessage] = useState('');

  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  const hasSubActivities = selectedActivity?.subActivities && selectedActivity.subActivities.length > 0;
  const effectiveScheduledId = selectedSubActivityId || selectedActivityId;

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (day) => {
    if (!effectiveScheduledId) return;
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isScheduled = (schedules[dateStr] || []).includes(effectiveScheduledId);
    
    if (isScheduled) {
      await unscheduleActivity(effectiveScheduledId, dateStr);
      showToast('Activity removed from schedule');
    } else {
      await scheduleActivity(effectiveScheduledId, dateStr);
      showToast('Activity scheduled successfully');
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  // Calculate activity progress
  let totalScheduled = 0;
  let totalCompleted = 0;
  if (effectiveScheduledId) {
    Object.entries(schedules).forEach(([dateStr, scheduledIds]) => {
      if (scheduledIds.includes(effectiveScheduledId)) {
        totalScheduled++;
        if ((logs[dateStr] || []).includes(effectiveScheduledId)) {
          totalCompleted++;
        }
      }
    });
  }
  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const headers = weekDays.map(day => (
      <div key={`header-${day}`} className="weekday" style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px 0', color: 'var(--text-secondary)' }}>
        {day}
      </div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isScheduled = effectiveScheduledId && (schedules[dateStr] || []).includes(effectiveScheduledId);
      const isLogged = effectiveScheduledId && (logs[dateStr] || []).includes(effectiveScheduledId);
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      
      days.push(
        <div 
          key={`day-${i}`} 
          className={`calendar-day ${isScheduled ? 'scheduled' : ''} ${isToday ? 'today' : ''} ${isLogged ? 'completed' : ''}`}
          onClick={() => handleDateClick(i)}
          style={{
            padding: '12px 5px', 
            textAlign: 'center', 
            border: '1px solid var(--border-color)', 
            cursor: effectiveScheduledId ? 'pointer' : 'default',
            backgroundColor: isScheduled ? 'var(--primary-color-alpha)' : (isToday ? 'var(--surface-color)' : 'transparent'),
            borderColor: isScheduled ? 'var(--primary-color)' : 'var(--border-color)',
            color: isScheduled ? 'var(--primary-color)' : 'var(--text-primary)',
            borderRadius: '6px',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          <span>{i}</span>
          {isScheduled && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isLogged ? '#10b981' : 'var(--primary-color)',
              margin: '3px auto 0'
            }}></div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button onClick={handlePrevMonth} className="calendar-nav-btn" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem' }}>
            ‹
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={handleNextMonth} className="calendar-nav-btn" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem' }}>
            ›
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {headers}
          {days}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="management-column">
        <div className="page-header">
          <h1>Schedule Activities</h1>
          <button id="back-to-activities" className="back-btn" onClick={() => navigate('/activities')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
        
        <div className="schedule-controls">
          <p className="section-label" style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
            Select an activity to schedule:
          </p>
          <div id="activity-grid" className="activity-grid" style={{ marginBottom: '1.5rem' }}>
            {activitiesLoading ? (
              <p style={{ opacity: 0.7 }}>Loading activities...</p>
            ) : activities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No activities created yet.</p>
            ) : (
              activities.map(activity => {
                const isSelected = selectedActivityId === activity.id;
                return (
                  <div
                    key={activity.id}
                    className={`activity-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedActivityId(activity.id);
                      setSelectedSubActivityId(null);
                    }}
                  >
                    <div className="activity-card-color" style={{ backgroundColor: 'var(--primary-color)' }}></div>
                    <div className="activity-card-content">
                      <div className="activity-card-name">{activity.name}</div>
                      {activity.subActivities && activity.subActivities.length > 0 && (
                        <div className="activity-card-meta">
                          {activity.subActivities.length} sub-activities
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <i className="fas fa-check-circle activity-card-check"></i>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Subactivities Section */}
          {hasSubActivities && (
            <div id="subactivity-section" className="subactivity-section" style={{ marginBottom: '1.5rem' }}>
              <p className="section-label">Select a sub-activity (or schedule whole activity):</p>
              <div id="subactivity-grid" className="subactivity-grid">
                {selectedActivity.subActivities.map(sub => {
                  const isSubSelected = selectedSubActivityId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={`subactivity-card activity-card ${isSubSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSubActivityId(isSubSelected ? null : sub.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="activity-card-color" style={{ backgroundColor: sub.color || '#3B82F6' }}></div>
                      <div className="activity-card-content">
                        <div className="activity-card-name">{sub.name}</div>
                      </div>
                      {isSubSelected && (
                        <i className="fas fa-check-circle activity-card-check"></i>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="schedule-layout">
          <div className="schedule-calendar-section">
            <div id="schedule-calendar-container" className="schedule-calendar-container">
              {!effectiveScheduledId ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <i className="fas fa-hand-pointer" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <p>Select an activity above to view or set its schedule</p>
                </div>
              ) : (
                renderCalendar()
              )}
            </div>
          </div>

          <div className="schedule-stats-section" style={{ marginTop: '1.5rem' }}>
            <div className="stats-card">
              <h3>Activity Progress</h3>
              <div id="activity-stats" className="activity-stats">
                {!effectiveScheduledId ? (
                  <div className="stat-placeholder">
                    <i className="fas fa-chart-line"></i>
                    <p>Select an activity to view progress</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '10px 0' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scheduled Days</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalScheduled}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completed Days</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{totalCompleted}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completion Rate</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{completionRate}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
