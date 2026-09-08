import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';
import { useSchedule } from '../context/ScheduleContext';

export default function ScheduleActivities() {
  const navigate = useNavigate();
  const { activities, loading: activitiesLoading } = useActivities();
  const { schedules, loading: scheduleLoading, scheduleActivity, unscheduleActivity } = useSchedule();
  
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (day) => {
    if (!selectedActivityId) return;
    
    // Format YYYY-MM-DD
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const isScheduled = (schedules[dateStr] || []).includes(selectedActivityId);
    
    if (isScheduled) {
      await unscheduleActivity(selectedActivityId, dateStr);
    } else {
      await scheduleActivity(selectedActivityId, dateStr);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Weekday headers
    const headers = weekDays.map(day => (
      <div key={`header-${day}`} style={{textAlign: 'center', fontWeight: 'bold', padding: '10px 0', color: 'var(--text-secondary)'}}>
        {day}
      </div>
    ));

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isScheduled = selectedActivityId && (schedules[dateStr] || []).includes(selectedActivityId);
      
      const today = new Date();
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      
      days.push(
        <div 
          key={`day-${i}`} 
          className={`calendar-day ${isScheduled ? 'scheduled' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(i)}
          style={{
            padding: '15px 5px', 
            textAlign: 'center', 
            border: '1px solid #333', 
            cursor: selectedActivityId ? 'pointer' : 'default',
            backgroundColor: isScheduled ? 'var(--primary-color)' : (isToday ? '#333' : 'transparent'),
            color: isScheduled ? 'white' : 'var(--text-primary)',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
        >
          {i}
        </div>
      );
    }

    return (
      <div style={{marginTop: '20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <button onClick={handlePrevMonth} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '10px'}}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <h2 style={{margin: 0}}>{currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={handleNextMonth} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '10px'}}>
            <i className="fas fa-chevron-right"></i>
          </button>
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
      <div className="management-column">
        <div className="page-header">
          <h1>Schedule Activities</h1>
          <button id="back-to-activities" className="back-btn" onClick={() => navigate('/activities')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
        
        <div className="schedule-controls">
          <p className="section-label" style={{marginBottom: '10px'}}>Select an activity to schedule:</p>
          <div id="activity-grid" className="activity-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px'}}>
            {activitiesLoading ? (
              <p>Loading activities...</p>
            ) : activities.length === 0 ? (
              <p style={{color: 'var(--text-secondary)'}}>No activities to schedule.</p>
            ) : (
              activities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => setSelectedActivityId(activity.id)}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: selectedActivityId === activity.id ? '2px solid var(--primary-color)' : '1px solid #444',
                    backgroundColor: selectedActivityId === activity.id ? 'var(--primary-color-alpha)' : '#222',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {activity.name}
                </button>
              ))
            )}
          </div>
        </div>
        
        <div className="schedule-layout">
          <div className="schedule-calendar-section">
            <div id="schedule-calendar-container" className="schedule-calendar-container" style={{backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px'}}>
              {!selectedActivityId ? (
                <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>
                  <i className="fas fa-hand-pointer" style={{fontSize: '2rem', marginBottom: '10px'}}></i>
                  <p>Select an activity above to view or set its schedule</p>
                </div>
              ) : (
                renderCalendar()
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
