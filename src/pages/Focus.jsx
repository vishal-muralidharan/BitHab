import { useState, useEffect, useRef } from 'react';
import { useActivities } from '../context/ActivityContext';

export default function Focus() {
  const { activities } = useActivities();
  const [selectedActivity, setSelectedActivity] = useState('');
  const [time, setTime] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionLogged, setSessionLogged] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (sessionLogged) {
      setSessionLogged(false);
      setTime(0);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(0);
    setSessionLogged(false);
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const logSession = () => {
    // In a full implementation, this would save to a FocusContext or Activity context
    setIsActive(false);
    setSessionLogged(true);
    console.log(`Logged ${formatTime(time)} for ${selectedActivity || 'Uncategorized'}`);
  };

  return (
    <div className="management-column">
      <div className="page-header">
        <h1>Focus Timer</h1>
        <p className="page-subtitle">Track your time spent on activities</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', gap: '30px' }}>
        
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <select 
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-color)', color: 'white', border: '1px solid #333', fontSize: '1rem' }}
          >
            <option value="">Select an Activity (Optional)</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div style={{
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: `8px solid ${isActive ? 'var(--primary-color)' : '#333'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          fontWeight: 'bold',
          color: isActive ? 'white' : 'var(--text-secondary)',
          transition: 'all 0.3s ease',
          boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none'
        }}>
          {formatTime(time)}
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={toggleTimer}
            className="btn-primary"
            style={{ padding: '15px 40px', fontSize: '1.2rem', borderRadius: '30px' }}
          >
            {isActive ? 'Pause' : (time === 0 || sessionLogged ? 'Start' : 'Resume')}
          </button>
          
          {(time > 0 && !isActive && !sessionLogged) && (
            <button 
              onClick={logSession}
              style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Log Time
            </button>
          )}

          <button 
            onClick={resetTimer}
            style={{ padding: '15px 20px', fontSize: '1.2rem', borderRadius: '30px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid #444', cursor: 'pointer' }}
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>

        {sessionLogged && (
          <div style={{ padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', textAlign: 'center' }}>
            <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
            Session logged successfully! ({formatTime(time)})
          </div>
        )}

      </div>
    </div>
  );
}
