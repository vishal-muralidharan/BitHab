import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const MOTIVATIONAL_QUOTES = [
  { text: "Focus is the key to all achievement.", author: "Anonymous" },
  { text: "Concentration is the secret of strength.", author: "Ralph Waldo Emerson" },
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
  { text: "Where focus goes, energy flows and results show.", author: "Tony Robbins" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The art of being wise is knowing what to overlook.", author: "William James" },
  { text: "Clarity of mind means clarity of passion.", author: "Blaise Pascal" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" }
];

export default function Focus() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Clock state
  const [now, setNow] = useState(new Date());

  // Focus data
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectInput, setSubjectInput] = useState('');

  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [completedTasks, setCompletedTasks] = useState({});

  // Quote
  const [quote] = useState(() => 
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load focusData from Firestore
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
        }
      } catch (err) {
        console.error("Failed to load focus data", err);
      }
    }
    loadFocusData();
  }, [currentUser]);

  // Persist focus data
  const saveFocusData = useCallback(async (newSubjects, newTasks, newCompleted) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        focusData: {
          subjects: newSubjects,
          tasks: newTasks,
          completedTasks: newCompleted,
          lastUpdated: Date.now()
        }
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save focus data", err);
    }
  }, [currentUser]);

  const handleAddSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    const next = [...subjects, trimmed];
    setSubjects(next);
    setSubjectInput('');
    saveFocusData(next, tasks, completedTasks);
  };

  const handleDeleteSubject = (subj) => {
    const next = subjects.filter(s => s !== subj);
    setSubjects(next);
    if (selectedSubject === subj) setSelectedSubject('');
    saveFocusData(next, tasks, completedTasks);
  };

  const handleAddTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed || tasks.includes(trimmed)) return;
    const next = [...tasks, trimmed];
    setTasks(next);
    setTaskInput('');
    saveFocusData(subjects, next, completedTasks);
  };

  const handleToggleTask = (task) => {
    const nextCompleted = { ...completedTasks, [task]: !completedTasks[task] };
    setCompletedTasks(nextCompleted);
    saveFocusData(subjects, tasks, nextCompleted);
  };

  const handleDeleteTask = (task) => {
    const next = tasks.filter(t => t !== task);
    const nextCompleted = { ...completedTasks };
    delete nextCompleted[task];
    setTasks(next);
    setCompletedTasks(nextCompleted);
    saveFocusData(subjects, next, nextCompleted);
  };

  // Format clock
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(now.getMinutes()).padStart(2, '0');
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="focus-mode" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div className="focus-header">
        <Link to="/" className="logo-link focus-logo">
          <h1 className="logo">
            <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light focus-page-logo" />
          </h1>
        </Link>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="deep-work-btn" 
            title="Analytics" 
            aria-label="View analytics"
            onClick={() => navigate('/analytics')}
          >
            <i className="fas fa-chart-bar" aria-hidden="true"></i>
          </button>
          <button 
            className="deep-work-btn" 
            id="deep-work-toggle" 
            title="Deep Focus" 
            aria-label="Toggle deep focus mode"
            onClick={async () => {
              try {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                }
              } catch (err) {
                console.warn('Fullscreen entry from Focus page was ignored or denied:', err);
              }
              navigate('/deep-focus');
            }}
          >
            <i className="fas fa-spa" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      {/* Main Focus Container */}
      <div className="focus-container" id="focus-container" style={{ flex: 1 }}>
        <div className="three-column-layout">
          {/* Subject Column (Left) */}
          <div className="subject-column">
            <h3 className="section-title">
              <i className="fas fa-book-open" aria-hidden="true"></i>
              <span>Subjects</span>
            </h3>
            <div className="subject-input-section">
              <div className="input-with-icon">
                <input 
                  type="text" 
                  className="subject-input" 
                  id="session-subject" 
                  placeholder="Enter your subject"
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubject(); }}
                />
                <span className="add-icon" id="add-subject" role="button" tabIndex="0" aria-label="Add subject" onClick={handleAddSubject}>
                  <i className="fas fa-plus" aria-hidden="true"></i>
                </span>
              </div>
              <div className="subjects-list" id="subjects-list" style={{ marginTop: '15px' }}>
                {subjects.map(s => {
                  const isSelected = selectedSubject === s;
                  return (
                    <div 
                      key={s} 
                      className={`subject-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSubject(isSelected ? '' : s)}
                    >
                      <span className="subject-item-text" style={{ fontWeight: isSelected ? '600' : '400' }}>{s}</span>
                      <button 
                        aria-label="Delete subject"
                        className="delete-item-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s); }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Focus Session Column (Center) */}
          <div className="focus-session-column">
            <div className="clock-container" id="clock-container">
              <div className="digital-clock" id="digital-clock">
                <div className="time-display" id="time-display">
                  <span className="hours" id="hours">{hoursStr}</span>
                  <span className="separator">:</span>
                  <span className="minutes" id="minutes">{minutesStr}</span>
                  <div className="ampm-display" id="ampm-display">
                    <span id="ampm">{ampm}</span>
                  </div>
                </div>
                <div className="date-display" id="date-display">
                  <span id="current-date">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Column (Right) */}
          <div className="tasks-column">
            <h3 className="section-title">
              <i className="fas fa-list-check" aria-hidden="true"></i>
              <span>Tasks</span>
            </h3>
            <div className="goal-input-section">
              <div className="input-with-icon">
                <input 
                  type="text" 
                  className="task-input" 
                  id="session-task" 
                  placeholder="Enter your task"
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
                />
                <span className="add-icon" id="add-task" role="button" tabIndex="0" aria-label="Add task" onClick={handleAddTask}>
                  <i className="fas fa-plus" aria-hidden="true"></i>
                </span>
              </div>
              <div className="tasks-list" id="tasks-list" style={{ marginTop: '15px' }}>
                {tasks.map(t => {
                  const isDone = !!completedTasks[t];
                  return (
                    <div 
                      key={t}
                      className={`task-item ${isDone ? 'completed' : ''}`}
                    >
                      <div className="task-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <input 
                          type="checkbox" 
                          checked={isDone} 
                          onChange={() => handleToggleTask(t)}
                        />
                        <span className="task-item-text">
                          {t}
                        </span>
                      </div>
                      <button 
                        aria-label="Delete task"
                        className="delete-item-btn"
                        onClick={() => handleDeleteTask(t)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="motivation-overlay" id="motivation-overlay">
          <div className="quote-container">
            <p className="quote-text" id="quote-text">"{quote.text}"</p>
            <p className="quote-author" id="quote-author">- {quote.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
