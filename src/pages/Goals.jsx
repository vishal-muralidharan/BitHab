import { useState } from 'react';
import { useGoals } from '../context/GoalContext';

export default function Goals() {
  const [newGoalName, setNewGoalName] = useState('');
  const [completedSectionExpanded, setCompletedSectionExpanded] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState(new Set());
  const [subgoalInputs, setSubgoalInputs] = useState({});

  // Modals state
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalNameVal, setEditGoalNameVal] = useState('');
  const [editSubgoalsVal, setEditSubgoalsVal] = useState([]);
  const [editNewSubgoalInput, setEditNewSubgoalInput] = useState('');

  const [confirmDialog, setConfirmDialog] = useState(null);

  const { 
    goals, 
    loading, 
    addGoal, 
    toggleGoal, 
    editGoal, 
    deleteGoal, 
    addSubgoal, 
    toggleSubgoal, 
    deleteSubgoal 
  } = useGoals();

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) return;
    try {
      await addGoal(newGoalName.trim());
      setNewGoalName('');
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddGoal();
    }
  };

  const toggleGoalExpanded = (goalId) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleAddSubgoal = async (goalId) => {
    const text = (subgoalInputs[goalId] || '').trim();
    if (!text) return;
    try {
      await addSubgoal(goalId, text);
      setSubgoalInputs(prev => ({ ...prev, [goalId]: '' }));
    } catch (error) {
      console.error("Failed to add subgoal:", error);
    }
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setEditGoalNameVal(goal.name || goal.title || '');
    setEditSubgoalsVal(goal.subgoals ? [...goal.subgoals] : []);
    setEditNewSubgoalInput('');
  };

  const handleSaveGoalEdit = async () => {
    if (!editingGoal || !editGoalNameVal.trim()) return;
    try {
      await editGoal(editingGoal.id, editGoalNameVal.trim(), editSubgoalsVal);
      setEditingGoal(null);
    } catch (error) {
      console.error("Failed to save goal edit:", error);
    }
  };

  const addSubgoalInModal = () => {
    if (!editNewSubgoalInput.trim()) return;
    const newSub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: editNewSubgoalInput.trim(),
      completed: false,
      createdAt: Date.now()
    };
    setEditSubgoalsVal(prev => [...prev, newSub]);
    setEditNewSubgoalInput('');
  };

  const removeSubgoalInModal = (subId) => {
    setEditSubgoalsVal(prev => prev.filter(s => s.id !== subId));
  };

  const requestDeleteGoal = (goal) => {
    setConfirmDialog({
      message: `Are you sure you want to delete "${goal.name || goal.title}"?`,
      onConfirm: async () => {
        await deleteGoal(goal.id);
        setConfirmDialog(null);
      }
    });
  };

  const requestDeleteSubgoal = (goalId, subgoal) => {
    setConfirmDialog({
      message: `Are you sure you want to delete "${subgoal.name}"?`,
      onConfirm: async () => {
        await deleteSubgoal(goalId, subgoal.id);
        setConfirmDialog(null);
      }
    });
  };

  const renderGoalItem = (goal) => {
    const isExpanded = expandedGoals.has(goal.id);
    const hasSubgoals = goal.subgoals && goal.subgoals.length > 0;
    const goalTitle = goal.name || goal.title || 'Unnamed Goal';

    return (
      <li 
        key={goal.id} 
        className={`goal-item ${goal.completed ? 'completed' : ''}`}
        data-id={goal.id}
      >
        <div className="goal-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flex: 1 }}>
            <span 
              className="goal-caret" 
              style={{ cursor: 'pointer', userSelect: 'none', padding: '0.25rem' }}
              onClick={() => toggleGoalExpanded(goal.id)}
            >
              {isExpanded ? '▼' : '►'}
            </span>
            <input 
              type="checkbox"
              checked={goal.completed}
              onChange={() => toggleGoal(goal.id)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              aria-label="Toggle goal complete"
            />
            <span 
              className="goal-name-text" 
              style={{ 
                cursor: 'pointer', 
                flex: 1, 
                textDecoration: goal.completed ? 'line-through' : 'none',
                color: goal.completed ? 'var(--text-secondary)' : 'var(--text-primary)'
              }}
              onClick={() => toggleGoalExpanded(goal.id)}
            >
              {goalTitle}
            </span>
          </div>
          <div className="activity-actions">
            <button 
              className="edit-btn edit-goal-btn" 
              aria-label="Edit goal"
              onClick={() => openEditModal(goal)}
            >
              <i className="fas fa-pen" aria-hidden="true"></i>
            </button>
            <button 
              className="remove-btn delete-btn" 
              aria-label="Delete goal"
              onClick={() => requestDeleteGoal(goal)}
            >
              <i className="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {isExpanded && hasSubgoals && (
          <ul className="sub-goal-list">
            {goal.subgoals.map(sg => (
              <li key={sg.id} className={`sub-goal-item ${sg.completed ? 'completed' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flex: 1 }}>
                  <input 
                    type="checkbox"
                    checked={sg.completed}
                    onChange={() => toggleSubgoal(goal.id, sg.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span className={sg.completed ? 'completed-text' : ''} style={{ textDecoration: sg.completed ? 'line-through' : 'none' }}>
                    {sg.name}
                  </span>
                </div>
                <div className="activity-actions">
                  <button 
                    className="remove-btn delete-subgoal-btn" 
                    aria-label="Delete subgoal"
                    onClick={() => requestDeleteSubgoal(goal.id, sg)}
                  >
                    <i className="fas fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isExpanded && (
          <div className="sub-add-row">
            <input 
              type="text" 
              className="add-subgoal-input" 
              placeholder="Add subgoal"
              value={subgoalInputs[goal.id] || ''}
              onChange={e => setSubgoalInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSubgoal(goal.id);
              }}
            />
            <button 
              className="add-btn sub-add-btn add-subgoal-btn" 
              aria-label="Add subgoal"
              onClick={() => handleAddSubgoal(goal.id)}
            >
              &#10148;
            </button>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <div className="management-column">
        <div className="page-header">
          <h1>Goals</h1>
          <p className="page-subtitle">Set, track, and complete your goals</p>
        </div>

        <div className="add-item-form">
          <input 
            type="text" 
            id="add-goal-input" 
            className="add-input" 
            placeholder="Add new goal"
            value={newGoalName}
            onChange={e => setNewGoalName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            id="add-goal-btn" 
            className="add-btn" 
            aria-label="Add goal"
            onClick={handleAddGoal}
            disabled={!newGoalName.trim()}
          >
            <i className="fas fa-plus icon-only" aria-hidden="true"></i>
          </button>
        </div>

        <ul id="goal-list" className="goal-list">
          {loading ? (
            <li style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>Loading goals...</li>
          ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
            <p style={{ padding: '0 1rem', opacity: 0.7 }}>Add a goal to get started.</p>
          ) : activeGoals.length === 0 ? (
            <p style={{ padding: '0 1rem', opacity: 0.7 }}>All goals completed! 🎉</p>
          ) : (
            activeGoals.map(renderGoalItem)
          )}
        </ul>

        {completedGoals.length > 0 && (
          <div id="completed-goals-section" className="completed-goals-section" style={{ marginTop: '2rem' }}>
            <button 
              id="toggle-completed-goals" 
              className="toggle-completed-btn"
              style={{ display: 'flex' }}
              onClick={() => setCompletedSectionExpanded(!completedSectionExpanded)}
            >
              <span className="toggle-icon">{completedSectionExpanded ? '▲' : '▼'}</span>
              <span className="completed-goals-text">Completed Goals ({completedGoals.length})</span>
            </button>
            {completedSectionExpanded && (
              <ul id="completed-goal-list" className="goal-list expanded">
                {completedGoals.map(renderGoalItem)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div id="edit-goal-modal" className="modal">
          <div className="modal-content">
            <h3>Edit Goal</h3>
            <div className="edit-form">
              <label htmlFor="edit-goal-name">Goal Name:</label>
              <input 
                type="text" 
                id="edit-goal-name" 
                placeholder="Goal name"
                value={editGoalNameVal}
                onChange={e => setEditGoalNameVal(e.target.value)}
                autoFocus
              />

              <label>Subgoals:</label>
              <div id="edit-subgoal-list" className="subgoal-list" style={{ maxHeight: '35vh', overflow: 'auto', padding: '0.25rem' }}>
                {editSubgoalsVal.map(sg => (
                  <div key={sg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #333' }}>
                    <span>{sg.name}</span>
                    <button 
                      onClick={() => removeSubgoalInModal(sg.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="sub-add-row" style={{ marginTop: '10px' }}>
                <input 
                  type="text" 
                  id="edit-add-subgoal-input" 
                  className="add-subgoal-input" 
                  placeholder="Add subgoal"
                  value={editNewSubgoalInput}
                  onChange={e => setEditNewSubgoalInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addSubgoalInModal();
                  }}
                />
                <button 
                  id="edit-add-subgoal-btn" 
                  className="add-subgoal-btn" 
                  aria-label="Add subgoal"
                  type="button"
                  onClick={addSubgoalInModal}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>

              <div className="modal-buttons">
                <button id="save-goal-edit" className="btn-confirm" onClick={handleSaveGoalEdit}>Save</button>
                <button id="cancel-goal-edit" className="btn-cancel" onClick={() => setEditingGoal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div id="confirmation-modal" className="modal">
          <div className="modal-content">
            <p id="confirmation-message">{confirmDialog.message}</p>
            <div className="confirmation-buttons">
              <button id="confirm-yes" className="btn-confirm" onClick={confirmDialog.onConfirm}>Yes</button>
              <button id="confirm-no" className="btn-cancel" onClick={() => setConfirmDialog(null)}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
