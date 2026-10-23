import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoals } from '../context/GoalContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Analytics() {
  const { currentUser } = useAuth();
  const { goals } = useGoals();

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function loadSessions() {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'users', currentUser.uid, 'focusSessions'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const loaded = [];
        snap.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() });
        });
        setSessions(loaded);
      } catch (err) {
        console.error('Failed to load focus sessions for analytics:', err);
      }
    }

    loadSessions();
  }, [currentUser]);

  // Calculate current week (Monday to Sunday)
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  // Distance to Monday (if Sunday (0), distance is -6; else 1 - currentDayOfWeek)
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const weekDayDefs = [
    { label: 'M', name: 'Mon', dayOffset: 0 },
    { label: 'T', name: 'Tue', dayOffset: 1 },
    { label: 'W', name: 'Wed', dayOffset: 2 },
    { label: 'T', name: 'Thu', dayOffset: 3 },
    { label: 'F', name: 'Fri', dayOffset: 4 },
    { label: 'S', name: 'Sat', dayOffset: 5 },
    { label: 'S', name: 'Sun', dayOffset: 6 },
  ];

  const weekChartData = weekDayDefs.map(def => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + def.dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    // Sum minutes for this date
    const daySessions = sessions.filter(s => s.date === dateStr);
    const minutes = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      label: def.label,
      name: def.name,
      date: dateStr,
      minutes
    };
  });

  const maxMinutesInWeek = Math.max(...weekChartData.map(d => d.minutes), 30); // at least 30m scale

  // Subject breakdown
  const subjectTotals = {};
  sessions.forEach(s => {
    if (s.subject) {
      subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + (s.duration || 0);
    }
  });
  const subjectEntries = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  // Productivity Metrics
  // 1. Longest session
  const longestSessionMinutes = sessions.reduce((max, s) => Math.max(max, s.duration || 0), 0);
  const longestSessionStr = longestSessionMinutes >= 60
    ? `${Math.floor(longestSessionMinutes / 60)}h ${longestSessionMinutes % 60}m`
    : `${longestSessionMinutes}m`;

  // 2. Focus Streak
  const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();
  let streak = 0;
  if (uniqueDates.length > 0) {
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Can only have active streak if logged today or yesterday
    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      let checkDate = uniqueDates.includes(todayStr) ? new Date(now) : yesterday;
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  // 3. Total This Month
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthMinutes = sessions
    .filter(s => s.date && s.date.startsWith(currentYearMonth))
    .reduce((acc, s) => acc + (s.duration || 0), 0);
  const monthTotalStr = `${(monthMinutes / 60).toFixed(1)}h`;

  // 4. Completion Rate
  let completionRate = 0;
  if (goals.length > 0) {
    const completedGoals = goals.filter(g => g.completed).length;
    completionRate = Math.round((completedGoals / goals.length) * 100);
  }

  return (
    <div className="focus-mode" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div className="focus-header">
        <Link to="/" className="focus-logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab" className="logo-img logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab" className="logo-img logo-dark" />
        </Link>
        <div>
          <Link className="deep-work-btn" to="/focus" title="Back to Focus">
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
          </Link>
        </div>
      </div>

      {/* Main Focus Container */}
      <div className="focus-container" style={{ paddingTop: '90px', flex: 1 }}>
        <div className="analytics-bar" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="analytics-header">
            <h3>Focus Analytics</h3>
          </div>
          <div className="analytics-content" style={{ background: 'transparent', border: 'none', padding: 0, maxHeight: 'none' }}>
            
            {/* Week Chart */}
            <div className="analytics-section">
              <h4>This Week</h4>
              <div className="week-chart" id="week-chart">
                <div className="chart-bars">
                  {weekChartData.map((day, idx) => {
                    const heightPercent = Math.min(100, Math.round((day.minutes / maxMinutesInWeek) * 100));
                    return (
                      <div className="chart-day" data-day={day.name} key={idx}>
                        <span className="day-label">{day.label}</span>
                        <div 
                          className="bar" 
                          style={{ height: `${day.minutes > 0 ? Math.max(heightPercent, 8) : 0}%` }}
                        ></div>
                        <span className="time-label">{day.minutes}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="analytics-section">
              <h4>Subject Breakdown</h4>
              <div className="subject-stats" id="subject-stats">
                {subjectEntries.length > 0 ? (
                  subjectEntries.map(([subject, minutes]) => (
                    <div className="subject-stat-item" key={subject}>
                      <span className="subject-name">{subject}</span>
                      <span className="subject-time">
                        {minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No data available</div>
                )}
              </div>
            </div>

            {/* Goal Progress */}
            <div className="analytics-section">
              <h4>Goal Progress</h4>
              <div className="goal-progress" id="goal-progress">
                {goals.length > 0 ? (
                  goals.map(goal => {
                    const totalSub = goal.subgoals?.length || 0;
                    const completedSub = goal.subgoals?.filter(s => s.completed)?.length || 0;
                    const percent = goal.completed ? 100 : (totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0);
                    return (
                      <div className="goal-progress-item" key={goal.id}>
                        <div className="goal-name">{goal.name || goal.title}</div>
                        <div className="goal-progress-bar">
                          <div className="goal-progress-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className="goal-stats">
                          <span>{percent}%</span>
                          <span>{totalSub > 0 ? `${completedSub}/${totalSub} subgoals` : (goal.completed ? 'Completed' : 'In progress')}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-data">No active goals</div>
                )}
              </div>
            </div>

            {/* Productivity Metrics */}
            <div className="analytics-section">
              <h4>Productivity Metrics</h4>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">Longest Session</span>
                  <span className="metric-value" id="longest-session">{longestSessionStr}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Focus Streak</span>
                  <span className="metric-value" id="focus-streak">{streak} {streak === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Total This Month</span>
                  <span className="metric-value" id="month-total">{monthTotalStr}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Completion Rate</span>
                  <span className="metric-value" id="completion-rate">{completionRate}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
