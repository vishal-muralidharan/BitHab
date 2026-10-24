import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const isFullscreenActive = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

const requestBrowserFullscreen = async () => {
  if (typeof document === 'undefined') return;
  try {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen entry failed or denied:', err);
  }
};

const exitBrowserFullscreen = async () => {
  if (typeof document === 'undefined') return;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen exit failed:', err);
  }
};

export default function DeepFocus() {
  const { currentUser } = useAuth();

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(() => isFullscreenActive());

  // Clock
  const [now, setNow] = useState(new Date());

  // Focus context data
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});

  // Duration target (minutes)
  const [targetHours, setTargetHours] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(25);

  // Timer states: 'idle' | 'running' | 'paused' | 'stopped'
  const [timerState, setTimerState] = useState('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const sessionStartRef = useRef(null);
  const pausedAtRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const targetDurationRef = useRef(25);

  // Keep targetDurationRef in sync
  useEffect(() => {
    targetDurationRef.current = targetDurationMinutes;
  }, [targetDurationMinutes]);

  // Current clock update
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Load Focus Data from Firestore
  useEffect(() => {
    async function loadFocusData() {
      if (!currentUser) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().focusData) {
          const fd = snap.data().focusData;
          if (Array.isArray(fd.subjects)) setSubjects(fd.subjects);
          if (Array.isArray(fd.tasks)) setTasks(fd.tasks);
          if (fd.completedTasks && typeof fd.completedTasks === 'object') {
            setCompletedTasks(fd.completedTasks);
          }
          if (Number.isFinite(fd.targetDuration) && fd.targetDuration > 0) {
            setTargetDurationMinutes(fd.targetDuration);
            setTargetHours(Math.floor(fd.targetDuration / 60));
            setTargetMinutes(fd.targetDuration % 60);
          }
        }
      } catch (err) {
        console.error('Failed to load focus data in deep focus:', err);
      }
    }
    loadFocusData();
  }, [currentUser]);

  // Record session to Firestore
  const recordSession = useCallback(async (durationMs) => {
    if (!currentUser || durationMs < 5000) return; // Ignore less than 5 seconds
    try {
      const minutes = Math.max(1, Math.round(durationMs / 60000));
      const todayStr = new Date().toISOString().split('T')[0];
      const primarySubject = subjects[0] || null;
      const incomplete = tasks.filter(t => !completedTasks?.[t]);
      const primaryTask = incomplete[0] || tasks[0] || null;

      await addDoc(collection(db, 'users', currentUser.uid, 'focusSessions'), {
        userId: currentUser.uid,
        startTime: new Date(Date.now() - durationMs).toISOString(),
        endTime: new Date().toISOString(),
        duration: minutes,
        subject: primarySubject,
        goalId: primaryTask,
        deep: true,
        targetDuration: targetDurationRef.current || 25,
        completed: durationMs >= (targetDurationRef.current * 60 * 1000),
        date: todayStr,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to record deep focus session:', err);
    }
  }, [currentUser, subjects, tasks, completedTasks]);

  const stopTimer = useCallback((isAutoCompleted = false) => {
    if (!sessionStartRef.current) return;

    let finalDuration;
    if (pausedAtRef.current) {
      finalDuration = pausedAtRef.current - sessionStartRef.current;
    } else {
      finalDuration = Date.now() - sessionStartRef.current;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    recordSession(finalDuration);

    if (isAutoCompleted) {
      setShowCompleteDialog(true);
    }

    sessionStartRef.current = null;
    pausedAtRef.current = null;
    setElapsedMs(0);
    setTimerState('idle');
  }, [recordSession]);

  const pauseTimer = useCallback(() => {
    if (!sessionStartRef.current || pausedAtRef.current) return;
    pausedAtRef.current = Date.now();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setElapsedMs(pausedAtRef.current - sessionStartRef.current);
    setTimerState('paused');
  }, []);

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (!sessionStartRef.current) {
      // Starting fresh
      sessionStartRef.current = Date.now();
      pausedAtRef.current = null;
    } else if (pausedAtRef.current) {
      // Resuming from pause
      const pauseDuration = Date.now() - pausedAtRef.current;
      sessionStartRef.current += pauseDuration;
      pausedAtRef.current = null;
    }

    const onTick = () => {
      if (!sessionStartRef.current) return;
      const nowMs = Date.now();
      const currentElapsed = pausedAtRef.current
        ? pausedAtRef.current - sessionStartRef.current
        : nowMs - sessionStartRef.current;

      const targetMs = targetDurationRef.current * 60 * 1000;
      if (targetMs > 0 && currentElapsed >= targetMs) {
        stopTimer(true);
        return;
      }

      setElapsedMs(currentElapsed);
    };

    timerIntervalRef.current = setInterval(onTick, 250);
    setTimerState('running');
  }, [stopTimer]);

  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    sessionStartRef.current = null;
    pausedAtRef.current = null;
    setElapsedMs(0);
    setTimerState('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Keyboard shortcut (Spacebar start/pause, Esc exit)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ') {
        e.preventDefault();
        if (timerState === 'running') {
          pauseTimer();
        } else {
          startTimer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, pauseTimer, startTimer]);

  const wasFullscreenRef = useRef(isFullscreenActive());

  // Synchronize fullscreen state and enforce auto-pause if user exits
  useEffect(() => {
    const updateFullscreenState = () => {
      const active = isFullscreenActive();
      const previouslyActive = wasFullscreenRef.current;
      wasFullscreenRef.current = active;
      setIsFullscreen(active);

      // If user actively exited fullscreen while session was running, enforce pause
      if (previouslyActive && !active) {
        if (sessionStartRef.current && !pausedAtRef.current) {
          pauseTimer();
        }
      }
    };

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    updateFullscreenState();
    if (!isFullscreenActive()) {
      requestBrowserFullscreen();
    }

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      document.removeEventListener('mozfullscreenchange', updateFullscreenState);
      document.removeEventListener('MSFullscreenChange', updateFullscreenState);
    };
  }, [pauseTimer]);

  const handleExitDeepWork = async () => {
    if (isFullscreenActive()) {
      await exitBrowserFullscreen();
    }
  };

  const handleToggleFullscreen = async () => {
    if (isFullscreenActive()) {
      await exitBrowserFullscreen();
    } else {
      await requestBrowserFullscreen();
    }
  };

  // Primary action button (START / PAUSE / RESUME)
  const handlePrimaryAction = () => {
    if (timerState === 'idle' || timerState === 'stopped') {
      startTimer();
    } else if (timerState === 'running') {
      pauseTimer();
    } else if (timerState === 'paused') {
      startTimer();
    }
  };

  // Secondary action button (RESET / STOP)
  const handleSecondaryAction = () => {
    if (timerState === 'running') {
      stopTimer(false);
    } else {
      resetTimer();
    }
  };

  // Save Target
  const handleSaveTarget = async () => {
    const h = parseInt(targetHours) || 0;
    const m = parseInt(targetMinutes) || 0;
    let total = h * 60 + m;
    if (total <= 0) total = 25;

    setTargetDurationMinutes(total);
    setTargetHours(Math.floor(total / 60));
    setTargetMinutes(total % 60);

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          focusData: { targetDuration: total }
        }, { merge: true });
      } catch (err) {
        console.error('Failed to save target duration:', err);
      }
    }
  };

  // Calculations
  const targetMs = targetDurationMinutes * 60 * 1000;
  const remainingMs = targetMs > 0 ? Math.max(0, targetMs - elapsedMs) : elapsedMs;
  const progress = targetMs > 0 ? Math.min((elapsedMs / targetMs) * 100, 100) : 0;

  // Format Timer String MM:SS
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;
  const timerStr = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  // Current Time Display
  let currentHours = now.getHours();
  const ampm = currentHours >= 12 ? 'PM' : 'AM';
  currentHours = currentHours % 12 || 12;
  const currentHoursStr = String(currentHours).padStart(2, '0');
  const currentMinutesStr = String(now.getMinutes()).padStart(2, '0');

  // Incomplete tasks
  const incompleteTasks = tasks.filter(t => !completedTasks?.[t]);

  // Primary & Secondary button texts and icons
  let primaryIcon = '▶';
  let primaryText = 'START';
  let secondaryIcon = '↻';
  let secondaryText = 'RESET';
  let secondaryDisabled = true;

  if (timerState === 'running') {
    primaryIcon = '⏸';
    primaryText = 'PAUSE';
    secondaryIcon = '⏹';
    secondaryText = 'STOP';
    secondaryDisabled = false;
  } else if (timerState === 'paused') {
    primaryIcon = '▶';
    primaryText = 'RESUME';
    secondaryIcon = '↻';
    secondaryText = 'RESET';
    secondaryDisabled = false;
  } else if (timerState === 'stopped') {
    primaryIcon = '▶';
    primaryText = 'START';
    secondaryIcon = '↻';
    secondaryText = 'RESET';
    secondaryDisabled = false;
  }

  return (
    <div className="deep-work-mode" id="deep-work-mode">
      {/* Header with title and close button */}
      <div className="deep-work-header">
        <div className="deep-work-goal">
          <i className="fas fa-bullseye" aria-hidden="true"></i>
          <span>Deep Work Session</span>
        </div>
        <div className="deep-work-header-right">
          <button 
            className="deep-work-fullscreen-btn" 
            id="fullscreen-toggle-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`} aria-hidden="true"></i>
          </button>
          <Link 
            className="exit-deep-work" 
            to="/focus" 
            onClick={handleExitDeepWork}
            title="Back to Focus" 
            id="exit-deep-work" 
            aria-label="Exit deep focus"
          >
            <i className="fas fa-xmark" aria-hidden="true"></i>
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div className="deep-work-content">
        {/* Current Time Display */}
        <div className="deep-work-current-time">
          <div className="current-time-display">
            <span className="current-hours" id="current-hours">{currentHoursStr}</span>
            <span className="current-separator">:</span>
            <span className="current-minutes" id="current-minutes">{currentMinutesStr}</span>
            <span className="current-ampm" id="current-ampm">{ampm}</span>
          </div>
        </div>

        {/* Session Timer */}
        <div className="deep-work-timer" id="deep-timer">
          {timerStr}
        </div>

        {/* Progress Bar with Percentage */}
        <div className="deep-work-progress-container">
          <div className="progress-bar-wrapper">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                id="deep-progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-percentage" id="deep-percentage">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="deep-work-timer-controls">
          <button 
            className={`deep-work-control-btn ${timerState === 'running' ? 'pause-state' : 'start-state'}`} 
            id="deep-primary-btn"
            onClick={handlePrimaryAction}
          >
            <span className="btn-icon">{primaryIcon}</span>
            <span className="btn-text">{primaryText}</span>
          </button>
          <button 
            className={`deep-work-control-btn ${timerState === 'running' ? 'stop-state' : 'reset-state'}`} 
            id="deep-secondary-btn"
            onClick={handleSecondaryAction}
            disabled={secondaryDisabled}
          >
            <span className="btn-icon">{secondaryIcon}</span>
            <span className="btn-text">{secondaryText}</span>
          </button>
        </div>

        {/* Target Duration Settings */}
        <div className="deep-work-target">
          <div className="target-selector">
            <div className="target-label">Set Target Duration:</div>
            <div className="time-inputs">
              <input 
                type="number" 
                id="target-hours" 
                className="time-input" 
                min="0" 
                max="23" 
                value={targetHours}
                onChange={e => setTargetHours(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="time-separator">h</span>
              <input 
                type="number" 
                id="target-minutes" 
                className="time-input" 
                min="0" 
                max="59" 
                value={targetMinutes}
                onChange={e => setTargetMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="time-separator">m</span>
            </div>
            <button className="save-target-btn" id="save-target" onClick={handleSaveTarget}>SAVE</button>
          </div>
        </div>

        {/* Minimalistic Subjects and Tasks Display */}
        <div className="deep-work-subjects-tasks">
          <div className="deep-work-section subjects">
            <h4>
              <i className="fas fa-book-open" aria-hidden="true"></i>
              <span>Subjects</span>
            </h4>
            <ul className="deep-work-list" id="deep-subjects-list">
              {subjects.length > 0 ? (
                subjects.slice(0, 5).map((subject, i) => (
                  <li key={i}>
                    {subject}
                  </li>
                ))
              ) : (
                <li className="empty-notice">
                  Add subjects in focus mode
                </li>
              )}
            </ul>
          </div>
          <div className="deep-work-section tasks">
            <h4>
              <i className="fas fa-list-check" aria-hidden="true"></i>
              <span>Tasks</span>
            </h4>
            <ul className="deep-work-list" id="deep-tasks-list">
              {incompleteTasks.length > 0 ? (
                incompleteTasks.slice(0, 5).map((task, i) => (
                  <li key={i}>
                    {task}
                  </li>
                ))
              ) : (
                <li className="empty-notice">
                  Add tasks in focus mode
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      {showCompleteDialog && (
        <div id="completion-dialog" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#000000', color: '#ffffff', padding: '40px',
          borderRadius: '12px', zIndex: 5000, textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
          border: '2px solid var(--success-color, #28a745)', maxWidth: '420px', width: '90%',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', lineHeight: 1 }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: '#ffffff' }}>
            Deep Work Session Completed!
          </div>
          <div style={{ fontSize: '15px', marginBottom: '32px', color: '#ffffff', lineHeight: 1.4 }}>
            Great job staying focused.
          </div>
          <button 
            id="completion-ok-btn"
            onClick={() => setShowCompleteDialog(false)}
            style={{
              padding: '14px 28px', border: 'none', borderRadius: '8px', 
              background: 'var(--success-color, #28a745)', color: '#ffffff', cursor: 'pointer', 
              fontSize: '16px', fontWeight: 600, width: '120px',
              boxShadow: '0 4px 12px rgba(46, 160, 67, 0.3)'
            }}
          >
            OK
          </button>
        </div>
      )}

      {/* Compulsory Fullscreen Enforcement Overlay */}
      {!isFullscreen && (
        <div className="fullscreen-enforcement-backdrop" id="fullscreen-prompt">
          <div className="fullscreen-enforcement-card">
            <div className="fullscreen-icon-badge">
              <i className="fas fa-expand" aria-hidden="true"></i>
            </div>
            <h2 className="fullscreen-title">Fullscreen Mode Required</h2>
            <p className="fullscreen-desc">
              Deep Focus requires full screen mode to maintain an uninterrupted, distraction-free environment.
            </p>
            <div className="fullscreen-actions">
              <button 
                className="fullscreen-primary-btn" 
                id="enter-fullscreen-btn" 
                onClick={requestBrowserFullscreen}
              >
                <i className="fas fa-expand" aria-hidden="true"></i>
                <span>Enter Fullscreen</span>
              </button>
              <Link 
                className="fullscreen-secondary-btn" 
                to="/focus" 
                id="skip-fullscreen-btn" 
                onClick={handleExitDeepWork}
              >
                <span>Return to Focus</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
