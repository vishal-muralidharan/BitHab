import { useState } from 'react';
import { useGoals } from '../context/GoalContext';

export default function Goals() {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(1);
  const [showCompleted, setShowCompleted] = useState(false);
  const { goals, loading, addGoal, deleteGoal, saveGoals } = useGoals();

  const activeGoals = goals.filter(g => g.current < g.target);
  const completedGoals = goals.filter(g => g.current >= g.target);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || newGoalTarget < 1) return;
    
    try {
      // In a real app we'd need to update GoalContext to support custom targets
      // but for now let's just create it directly or update the existing addGoal method
      const newGoal = {
        id: 'goal-' + Date.now(),
        title: newGoalTitle.trim(),
        target: newGoalTarget,
        current: 0,
        createdAt: Date.now()
      };
      
      await saveGoals([...goals, newGoal]);
      setNewGoalTitle('');
      setNewGoalTarget(1);
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddGoal();
    }
  };

  const incrementProgress = async (goalId) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId && g.current < g.target) {
        return { ...g, current: g.current + 1 };
      }
      return g;
    });
    await saveGoals(updatedGoals);
  };

  const renderGoalItem = (goal) => (
    <li key={goal.id} className="goal-item" style={{display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #333'}}>
      <div className="goal-content" style={{flex: 1}}>
        <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{goal.title}</div>
        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
          Progress: {goal.current} / {goal.target}
        </div>
        <div style={{width: '100%', backgroundColor: '#333', height: '6px', borderRadius: '3px', marginTop: '8px'}}>
          <div style={{
            width: `${Math.min(100, (goal.current / goal.target) * 100)}%`, 
            backgroundColor: 'var(--primary-color)', 
            height: '100%', 
            borderRadius: '3px'
          }}></div>
        </div>
      </div>
      <div className="goal-actions" style={{display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '15px'}}>
        {goal.current < goal.target && (
          <button 
            className="btn-primary" 
            onClick={() => incrementProgress(goal.id)}
            style={{padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', border: 'none'}}
          >
            +1
          </button>
        )}
        <button 
          className="delete-btn" 
          onClick={() => deleteGoal(goal.id)}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </li>
  );

  return (
    <>
        <div className="management-column">
            <div className="page-header">
                <h1>Goals</h1>
                <p className="page-subtitle">Set, track, and complete your goals</p>
            </div>
            
            <div className="add-item-form" style={{display: 'flex', gap: '10px'}}>
              <input 
                type="text" 
                className="add-input" 
                placeholder="Add new goal" 
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{flex: 2}}
              />
              <input 
                type="number" 
                className="add-input" 
                placeholder="Target" 
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                min="1"
                style={{flex: 1}}
              />
              <button 
                className="add-btn" 
                onClick={handleAddGoal}
                disabled={!newGoalTitle.trim()}
              >
                <i className="fas fa-plus icon-only" aria-hidden="true"></i>
              </button>
            </div>

            <ul id="goal-list" className="goal-list">
              {loading ? (
                <li style={{ padding: '1rem', textAlign: 'center' }}>Loading goals...</li>
              ) : activeGoals.length === 0 ? (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active goals. Time to set one!</li>
              ) : (
                activeGoals.map(renderGoalItem)
              )}
            </ul>
            
            {completedGoals.length > 0 && (
              <div id="completed-goals-section" className="completed-goals-section" style={{marginTop: '2rem'}}>
                  <button 
                    id="toggle-completed-goals" 
                    className="toggle-completed-btn" 
                    onClick={() => setShowCompleted(!showCompleted)}
                    style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px 0'}}
                  >
                      <span className="toggle-icon">{showCompleted ? '▼' : '▶'}</span>
                      <span className="completed-goals-text">Completed Goals ({completedGoals.length})</span>
                  </button>
                  
                  {showCompleted && (
                    <ul id="completed-goal-list" className="goal-list">
                      {completedGoals.map(renderGoalItem)}
                    </ul>
                  )}
              </div>
            )}
        </div>
    </>
  );
}
