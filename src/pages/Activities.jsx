import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';

export default function Activities() {
  const [newActivityName, setNewActivityName] = useState('');
  const { activities, loading, addActivity, deleteActivity } = useActivities();
  const navigate = useNavigate();

  const handleAddActivity = async () => {
    if (!newActivityName.trim()) return;
    
    try {
      await addActivity(newActivityName.trim());
      setNewActivityName('');
    } catch (error) {
      console.error("Failed to add activity:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddActivity();
    }
  };

  return (
    <>
        <div className="management-column">
            <div className="page-header">
                <h1>Activities</h1>
                <button id="open-schedule-btn" className="schedule-link-btn" onClick={() => navigate('/schedule-activities')}>
                    <i className="fas fa-calendar-check"></i> Schedule Activities
                </button>
            </div>
            <div className="add-item-form">
              <input 
                type="text" 
                id="add-activity-input" 
                className="add-input" 
                placeholder="Add new activity" 
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                id="add-activity-btn" 
                className="add-btn" 
                aria-label="Add activity"
                onClick={handleAddActivity}
                disabled={!newActivityName.trim()}
              >
                <i className="fas fa-plus icon-only" aria-hidden="true"></i>
              </button>
            </div>
            <ul id="activity-list" className="activity-list">
              {loading ? (
                <li style={{ padding: '1rem', textAlign: 'center' }}>Loading activities...</li>
              ) : activities.length === 0 ? (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No activities yet. Add one!</li>
              ) : (
                activities.map(activity => (
                  <li key={activity.id} className="activity-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333'}}>
                    <div className="activity-content">
                      <span className="activity-name">{activity.name}</span>
                    </div>
                    <button 
                      className="delete-btn" 
                      onClick={() => deleteActivity(activity.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </li>
                ))
              )}
            </ul>
        </div>
    </>
  );
}
