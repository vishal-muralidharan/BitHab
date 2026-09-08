import { useState, useEffect, useRef } from 'react';
import { useActivities } from '../context/ActivityContext';

export default function DeepFocus() {
  const { activities } = useActivities();
  const [selectedActivity, setSelectedActivity] = useState('');
  
  // Pomodoro settings
  const FOCUS_TIME = 25 * 60; // 25 minutes
  const BREAK_TIME = 5 * 60; // 5 minutes
  
  const [time, setTime] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'
  const [cycles, setCycles] = useState(0);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && time > 0) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && time === 0) {
      // Timer finished
      clearInterval(timerRef.current);
      handleTimerComplete();
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, time]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (mode === 'focus') {
      // Finished focus, switch to break
      setMode('break');
      setTime(BREAK_TIME);
      setCycles(c => c + 1);
      // Here you would log the completed pomodoro session
      console.log(`Completed Pomodoro for ${selectedActivity || 'Uncategorized'}`);
    } else {
      // Finished break, switch to focus
      setMode('focus');
      setTime(FOCUS_TIME);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTime(FOCUS_TIME);
  };

  const skipBreak = () => {
    setIsActive(false);
    setMode('focus');
    setTime(FOCUS_TIME);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calculate progress percentage for SVG circle
  const totalDuration = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  const progress = ((totalDuration - time) / totalDuration) * 100;
  
  const circleRadius = 130;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="management-column">
      <div className="page-header">
        <h1>Deep Focus</h1>
        <p className="page-subtitle">Pomodoro technique to maximize productivity</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', gap: '30px' }}>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
          <button 
            onClick={() => { setMode('focus'); setTime(FOCUS_TIME); setIsActive(false); }}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px', 
              backgroundColor: mode === 'focus' ? 'var(--primary-color)' : 'transparent', 
              color: mode === 'focus' ? 'white' : 'var(--text-secondary)',
              border: mode === 'focus' ? 'none' : '1px solid #444',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Focus (25m)
          </button>
          <button 
            onClick={() => { setMode('break'); setTime(BREAK_TIME); setIsActive(false); }}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px', 
              backgroundColor: mode === 'break' ? '#10b981' : 'transparent', 
              color: mode === 'break' ? 'white' : 'var(--text-secondary)',
              border: mode === 'break' ? 'none' : '1px solid #444',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Break (5m)
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <select 
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            disabled={isActive}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-color)', color: 'white', border: '1px solid #333', fontSize: '1rem', opacity: isActive ? 0.6 : 1 }}
          >
            <option value="">Select an Activity (Optional)</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle 
              cx="150" 
              cy="150" 
              r={circleRadius} 
              fill="transparent" 
              stroke="#333" 
              strokeWidth="8" 
            />
            <circle 
              cx="150" 
              cy="150" 
              r={circleRadius} 
              fill="transparent" 
              stroke={mode === 'focus' ? 'var(--primary-color)' : '#10b981'} 
              strokeWidth="8" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{ fontSize: '4.5rem', fontWeight: 'bold', color: mode === 'focus' ? 'white' : '#10b981' }}>
              {formatTime(time)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '10px' }}>
              {mode === 'focus' ? 'Time to Focus' : 'Take a break!'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={toggleTimer}
            style={{ 
              padding: '15px 50px', 
              fontSize: '1.2rem', 
              borderRadius: '30px',
              backgroundColor: mode === 'focus' ? 'var(--primary-color)' : '#10b981',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: `0 4px 14px ${mode === 'focus' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          
          {mode === 'break' && (
            <button 
              onClick={skipBreak}
              style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid #444', cursor: 'pointer' }}
            >
              Skip
            </button>
          )}

          <button 
            onClick={resetTimer}
            style={{ padding: '15px 20px', fontSize: '1.2rem', borderRadius: '30px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid #444', cursor: 'pointer' }}
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '10px' }}>
          <i className="fas fa-fire" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
          Completed Cycles: <span style={{ color: 'white', fontWeight: 'bold' }}>{cycles}</span>
        </div>

      </div>
    </div>
  );
}
