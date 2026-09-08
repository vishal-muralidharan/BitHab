import { useState } from 'react';
import { useReminders } from '../context/ReminderContext';

export default function Reminders() {
  const { reminders, loading, addReminder, toggleCompleted, deleteReminder } = useReminders();
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    
    try {
      await addReminder(newText.trim(), newTime);
      setNewText('');
      setNewTime('');
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add reminder:", error);
    }
  };

  const renderReminder = (reminder) => (
    <li key={reminder.id} className="reminder-item" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #333'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '15px', flex: 1}}>
        <input 
          type="checkbox" 
          checked={reminder.completed} 
          onChange={() => toggleCompleted(reminder.id)}
          style={{width: '20px', height: '20px', cursor: 'pointer'}}
        />
        <div className="reminder-content" style={{textDecoration: reminder.completed ? 'line-through' : 'none', color: reminder.completed ? 'var(--text-secondary)' : 'var(--text-primary)'}}>
          <div style={{fontSize: '1.1rem'}}>{reminder.text}</div>
          {reminder.time && (
            <div style={{fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '4px'}}>
              <i className="far fa-clock"></i> {new Date(`2000-01-01T${reminder.time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          )}
        </div>
      </div>
      <button 
        className="delete-btn" 
        onClick={() => deleteReminder(reminder.id)}
        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px' }}
      >
        <i className="fas fa-trash"></i>
      </button>
    </li>
  );

  return (
    <>
        <div className="management-column">
            <div className="page-header">
                <h1>Reminders</h1>
                <p className="page-subtitle">Set reminders for future events</p>
            </div>
            
            <div className="add-item-form reminder-form" style={{marginBottom: '20px'}}>
              {!isAdding ? (
                <button type="button" className="add-reminder-main-btn btn-primary" onClick={() => setIsAdding(true)} style={{width: '100%', padding: '15px', borderRadius: '8px', cursor: 'pointer', border: 'none'}}>
                  <i className="fas fa-plus icon-prefix" aria-hidden="true"></i>
                  <span>Add New Reminder</span>
                </button>
              ) : (
                <form onSubmit={handleAddReminder} style={{display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--surface-color)', padding: '15px', borderRadius: '8px', border: '1px solid var(--primary-color)'}}>
                  <input 
                    type="text" 
                    placeholder="What do you need to be reminded of?" 
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    autoFocus
                    style={{padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px'}}
                  />
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px'}}
                  />
                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px'}}>
                    <button type="button" onClick={() => setIsAdding(false)} style={{padding: '8px 16px', background: 'transparent', border: '1px solid #444', color: 'white', borderRadius: '4px', cursor: 'pointer'}}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={!newText.trim()} style={{padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Save</button>
                  </div>
                </form>
              )}
            </div>
            
            <ul id="reminder-list" className="reminder-list" style={{listStyle: 'none', padding: 0}}>
              {loading ? (
                <li style={{ padding: '1rem', textAlign: 'center' }}>Loading reminders...</li>
              ) : reminders.length === 0 ? (
                <li style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <i className="fas fa-bell-slash" style={{fontSize: '2rem', marginBottom: '1rem'}}></i>
                  <br />No reminders set.
                </li>
              ) : (
                reminders.sort((a, b) => {
                  // Sort incomplete first, then by time/creation
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  return b.createdAt - a.createdAt;
                }).map(renderReminder)
              )}
            </ul>
        </div>
    </>
  );
}
