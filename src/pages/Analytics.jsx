import { useGoals } from '../context/GoalContext';
import { useActivities } from '../context/ActivityContext';
import { useSchedule } from '../context/ScheduleContext';
import { useNotes } from '../context/NoteContext';
import { useReminders } from '../context/ReminderContext';

export default function Analytics() {
  const { goals } = useGoals();
  const { activities } = useActivities();
  const { logs } = useSchedule();
  const { notes } = useNotes();
  const { reminders } = useReminders();

  // Derived stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const totalActivities = activities.length;
  let totalLoggedActivities = 0;
  Object.values(logs).forEach(dayLogs => {
    totalLoggedActivities += dayLogs.length;
  });

  const totalNotes = notes.length;
  const favoriteNotes = notes.filter(n => n.isFavorite).length;

  const totalReminders = reminders.length;
  const completedReminders = reminders.filter(r => r.completed).length;
  const pendingReminders = totalReminders - completedReminders;

  // Recent 7 days activity trend
  const today = new Date();
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const loggedCount = (logs[dateStr] || []).length;
    return {
      label: d.toLocaleDateString('default', { weekday: 'short' }),
      count: loggedCount
    };
  });

  const maxDailyLogs = Math.max(...last7Days.map(d => d.count), 5); // Minimum height scale of 5

  return (
    <div className="management-column">
      <div className="page-header">
        <h1>Analytics</h1>
        <p className="page-subtitle">Track your overall progress and statistics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '30px' }}>
        
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
            <i className="fas fa-bullseye" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i> 
            Goal Completion
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
            {goalCompletionRate}%
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '5px' }}>
            {completedGoals} of {totalGoals} goals achieved
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
            <i className="fas fa-check-square" style={{ marginRight: '8px', color: '#10b981' }}></i> 
            Total Logs
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
            {totalLoggedActivities}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '5px' }}>
            Across {totalActivities} unique activities
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
            <i className="fas fa-bell" style={{ marginRight: '8px', color: '#f59e0b' }}></i> 
            Pending Reminders
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
            {pendingReminders}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '5px' }}>
            {completedReminders} reminders completed
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-color)', padding: '25px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
            <i className="fas fa-sticky-note" style={{ marginRight: '8px', color: '#8b5cf6' }}></i> 
            Total Notes
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
            {totalNotes}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '5px' }}>
            {favoriteNotes} favorited
          </div>
        </div>

      </div>

      <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px', border: '1px solid #333', marginTop: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '30px', fontSize: '1.2rem', color: 'white' }}>7-Day Activity Trend</h3>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingBottom: '30px', borderBottom: '1px solid #444', position: 'relative' }}>
          {last7Days.map((day, i) => {
            const heightPercentage = (day.count / maxDailyLogs) * 100;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${heightPercentage}%`, 
                    minHeight: day.count > 0 ? '10px' : '0',
                    backgroundColor: 'var(--primary-color)', 
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: day.count > 0 ? '5px' : '0'
                  }}
                >
                  {day.count > 0 && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>{day.count}</span>}
                </div>
                <div style={{ position: 'absolute', bottom: '0', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '10px' }}>
                  {day.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
