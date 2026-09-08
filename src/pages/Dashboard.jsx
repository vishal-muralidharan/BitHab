import { Link, useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';
import { useGoals } from '../context/GoalContext';
import { useNotes } from '../context/NoteContext';
import { useReminders } from '../context/ReminderContext';
import { useSchedule } from '../context/ScheduleContext';
import { useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activities, loading: activitiesLoading } = useActivities();
  const { goals, loading: goalsLoading } = useGoals();
  const { notes, loading: notesLoading } = useNotes();
  const { reminders, loading: remindersLoading } = useReminders();
  const { schedules, logs, toggleActivityLog } = useSchedule();
  
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const handleDateClick = (dateStr) => {
    setSelectedDateStr(dateStr);
  };

  const renderDashboardCalendar = () => {
    const [year, month] = selectedDateStr.split('-').map(Number);
    // Use the month from selectedDateStr (0-indexed for Date constructor)
    const displayMonth = month - 1;
    
    const daysInMonth = new Date(year, displayMonth + 1, 0).getDate();
    const firstDay = new Date(year, displayMonth, 1).getDay();
    
    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const headers = weekDays.map((day, i) => (
      <div key={`header-${i}`} style={{textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
        {day}
      </div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`}></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(displayMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = selectedDateStr === dateStr;
      
      const today = new Date();
      const isToday = today.getDate() === i && today.getMonth() === displayMonth && today.getFullYear() === year;
      
      const daySchedules = schedules[dateStr] || [];
      const dayLogs = logs[dateStr] || [];
      const hasScheduled = daySchedules.length > 0;
      const allCompleted = hasScheduled && daySchedules.every(id => dayLogs.includes(id));
      
      days.push(
        <div 
          key={`day-${i}`} 
          onClick={() => handleDateClick(dateStr)}
          style={{
            padding: '8px 5px', 
            textAlign: 'center', 
            cursor: 'pointer',
            backgroundColor: isSelected ? 'var(--primary-color)' : (isToday ? '#333' : 'transparent'),
            color: isSelected ? 'white' : 'var(--text-primary)',
            borderRadius: '50%',
            aspectRatio: '1/1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontSize: '0.9rem'
          }}
        >
          {i}
          {hasScheduled && (
            <div style={{
              position: 'absolute', 
              bottom: '2px', 
              width: '4px', 
              height: '4px', 
              borderRadius: '50%', 
              backgroundColor: allCompleted ? '#10b981' : (isSelected ? 'white' : 'var(--primary-color)')
            }}></div>
          )}
        </div>
      );
    }

    return (
      <div style={{padding: '15px', backgroundColor: 'var(--surface-color)', borderRadius: '12px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <h3 style={{margin: 0, fontSize: '1.1rem'}}>
            {new Date(year, displayMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px'}}>
          {headers}
          {days}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="main-layout">
            
            <div className="left-column">
                <div className="activities-component" data-page="pages/activities.html">
                    <div className="section-header">
                        <h2>Activities</h2>
                        <button className="show-all-btn" id="activities-show-all" title="Show all" onClick={() => navigate('/activities')}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <ul id="activity-list" className="activity-list">
                      {activitiesLoading ? (
                        <li style={{ padding: '1rem', textAlign: 'center' }}>Loading activities...</li>
                      ) : activities.length === 0 ? (
                        <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No activities yet. Add one!</li>
                      ) : (
                        activities.slice(0, 5).map(activity => (
                          <li key={activity.id} className="activity-item" style={{display: 'flex', padding: '10px', borderBottom: '1px solid #333'}}>
                            <div className="activity-content">
                              <span className="activity-name">{activity.name}</span>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                </div>
                
                <div className="notes-component" data-page="pages/notes.html">
                    <div className="section-header">
                        <h2>Notes</h2>
                        <button className="show-all-btn" id="notes-show-all" title="Show all" onClick={() => navigate('/notes')}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <div id="notes-preview" className="notes-preview" style={{display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px'}}>
                        {notesLoading ? (
                          <div style={{ padding: '1rem', textAlign: 'center' }}>Loading notes...</div>
                        ) : notes.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No notes yet.</div>
                        ) : (
                          notes.slice(0, 3).map(note => (
                            <div key={note.id} style={{backgroundColor: 'var(--surface-color)', padding: '10px', borderRadius: '6px', border: '1px solid #333'}}>
                              <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{note.title || 'Untitled'}</div>
                              <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{note.content}</div>
                            </div>
                          ))
                        )}
                    </div>
                </div>
            </div>

            
            <div className="center-column">
                <div className="date-display" style={{marginBottom: '20px'}}>
                    <div className="current-date-colored" id="current-date" style={{fontSize: '1.2rem', fontWeight: 'bold'}}>
                        {selectedDateStr === new Date().toISOString().split('T')[0] ? 'Today' : new Date(selectedDateStr).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <section className="calendar-view" id="calendar-view" style={{marginBottom: '20px'}}>
                  {renderDashboardCalendar()}
                </section>
                
                
                <div className="activity-logging-section" id="activity-logging-section">
                    <div className="logging-header" style={{marginBottom: '15px'}}>
                        <h3>Activities for {selectedDateStr === new Date().toISOString().split('T')[0] ? 'Today' : selectedDateStr}</h3>
                    </div>
                    <div className="logging-content" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {!(schedules[selectedDateStr] && schedules[selectedDateStr].length > 0) ? (
                          <div style={{padding: '20px', textAlign: 'center', backgroundColor: 'var(--surface-color)', borderRadius: '8px', color: 'var(--text-secondary)'}}>
                            No activities scheduled for this date.
                            <br />
                            <button onClick={() => navigate('/schedule-activities')} className="btn-primary" style={{marginTop: '10px'}}>Schedule Activities</button>
                          </div>
                        ) : (
                          schedules[selectedDateStr].map(activityId => {
                            const activity = activities.find(a => a.id === activityId);
                            if (!activity) return null;
                            
                            const isLogged = (logs[selectedDateStr] || []).includes(activityId);
                            
                            return (
                              <div 
                                key={activityId} 
                                onClick={() => toggleActivityLog(activityId, selectedDateStr)}
                                style={{
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  padding: '15px', 
                                  backgroundColor: isLogged ? 'var(--primary-color-alpha)' : 'var(--surface-color)', 
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  border: isLogged ? '1px solid var(--primary-color)' : '1px solid #333',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  border: isLogged ? 'none' : '2px solid #555',
                                  backgroundColor: isLogged ? 'var(--primary-color)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '15px'
                                }}>
                                  {isLogged && <i className="fas fa-check" style={{color: 'white', fontSize: '12px'}}></i>}
                                </div>
                                <span style={{
                                  textDecoration: isLogged ? 'line-through' : 'none',
                                  color: isLogged ? 'var(--text-secondary)' : 'var(--text-primary)',
                                  fontSize: '1.1rem'
                                }}>
                                  {activity.name}
                                </span>
                              </div>
                            );
                          })
                        )}
                    </div>
                </div>
            </div>

            
            <div className="right-column">
                <div className="goals-component" data-page="pages/goals.html">
                    <div className="section-header">
                        <h2>Goals</h2>
                        <button className="show-all-btn" id="goals-show-all" title="Show all" onClick={() => navigate('/goals')}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <ul id="goal-list" className="goal-list">
                      {goalsLoading ? (
                        <li style={{ padding: '1rem', textAlign: 'center' }}>Loading goals...</li>
                      ) : goals.length === 0 ? (
                        <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No goals yet. Add one!</li>
                      ) : (
                        goals.slice(0, 5).map(goal => (
                          <li key={goal.id} className="goal-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333'}}>
                            <span className="goal-name">{goal.title}</span>
                            <span className="goal-progress">{goal.current} / {goal.target}</span>
                          </li>
                        ))
                      )}
                    </ul>
                </div>
                
                <div className="reminders-component" data-page="pages/reminders.html">
                    <div className="section-header">
                        <h2>Reminders</h2>
                        <button className="show-all-btn" id="reminders-show-all" title="Show all" onClick={() => navigate('/reminders')}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <div id="reminders-preview" className="reminders-preview" style={{padding: '10px'}}>
                        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                          {remindersLoading ? (
                            <li style={{ padding: '1rem', textAlign: 'center' }}>Loading reminders...</li>
                          ) : reminders.length === 0 ? (
                            <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No reminders set.</li>
                          ) : (
                            reminders.filter(r => !r.completed).slice(0, 3).map(reminder => (
                              <li key={reminder.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #333'}}>
                                <i className="far fa-circle" style={{color: 'var(--text-secondary)'}}></i>
                                <div>
                                  <div style={{fontSize: '0.9rem'}}>{reminder.text}</div>
                                  {reminder.time && <div style={{fontSize: '0.75rem', color: 'var(--primary-color)'}}>{new Date(`2000-01-01T${reminder.time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
}
