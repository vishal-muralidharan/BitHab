import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../context/ActivityContext';

export default function Activities() {
  const [newActivityName, setNewActivityName] = useState('');
  const { 
    activities, 
    loading, 
    addActivity, 
    editActivity, 
    deleteActivity,
    addSubActivity,
    editSubActivity,
    deleteSubActivity
  } = useActivities();
  const navigate = useNavigate();

  const [expandedActivities, setExpandedActivities] = useState(new Set());
  const [subActivityInputs, setSubActivityInputs] = useState({});
  const [subActivityColors, setSubActivityColors] = useState({});

  // Modals state
  const [editingActivity, setEditingActivity] = useState(null);
  const [editActivityNameVal, setEditActivityNameVal] = useState('');

  const [editingSubActivity, setEditingSubActivity] = useState(null);
  const [editSubActivityNameVal, setEditSubActivityNameVal] = useState('');
  const [editSubActivityColorVal, setEditSubActivityColorVal] = useState('#3B82F6');

  const [confirmDialog, setConfirmDialog] = useState(null);

  const toggleExpand = (id) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const handleAddSubActivity = async (activityId) => {
    const text = (subActivityInputs[activityId] || '').trim();
    if (!text) return;
    const color = subActivityColors[activityId] || '#3B82F6';
    try {
      await addSubActivity(activityId, text, color);
      setSubActivityInputs(prev => ({ ...prev, [activityId]: '' }));
    } catch (error) {
      console.error("Failed to add sub-activity:", error);
    }
  };

  const openEditActivityModal = (activity) => {
    setEditingActivity(activity);
    setEditActivityNameVal(activity.name);
  };

  const saveEditedActivity = async () => {
    if (!editingActivity || !editActivityNameVal.trim()) return;
    try {
      await editActivity(editingActivity.id, editActivityNameVal.trim());
      setEditingActivity(null);
    } catch (error) {
      console.error("Failed to edit activity:", error);
    }
  };

  const openEditSubActivityModal = (activityId, subActivity) => {
    setEditingSubActivity({ activityId, sub: subActivity });
    setEditSubActivityNameVal(subActivity.name);
    setEditSubActivityColorVal(subActivity.color || '#3B82F6');
  };

  const saveEditedSubActivity = async () => {
    if (!editingSubActivity || !editSubActivityNameVal.trim()) return;
    try {
      await editSubActivity(
        editingSubActivity.activityId, 
        editingSubActivity.sub.id, 
        editSubActivityNameVal.trim(), 
        editSubActivityColorVal
      );
      setEditingSubActivity(null);
    } catch (error) {
      console.error("Failed to edit sub-activity:", error);
    }
  };

  const requestDeleteActivity = (activity) => {
    setConfirmDialog({
      message: `Are you sure you want to delete "${activity.name}"?`,
      onConfirm: async () => {
        await deleteActivity(activity.id);
        setConfirmDialog(null);
      }
    });
  };

  const requestDeleteSubActivity = (activityId, subActivity) => {
    setConfirmDialog({
      message: `Are you sure you want to delete "${subActivity.name}"?`,
      onConfirm: async () => {
        await deleteSubActivity(activityId, subActivity.id);
        setConfirmDialog(null);
      }
    });
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
            <li style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>Loading activities...</li>
          ) : activities.length === 0 ? (
            <p style={{ padding: '0 1rem', opacity: 0.7 }}>Add a main activity to begin.</p>
          ) : (
            activities.map(activity => {
              const isExpanded = expandedActivities.has(activity.id);
              const hasSubActivities = activity.subActivities && activity.subActivities.length > 0;

              return (
                <li key={activity.id} className={`activity-item ${isExpanded ? 'expanded' : ''}`} data-id={activity.id}>
                  <div className="activity-main" onClick={() => toggleExpand(activity.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flex: 1 }}>
                      <span style={{ fontSize: '0.8rem', userSelect: 'none' }}>{isExpanded ? '▼' : '►'}</span>
                      <span className="activity-name">{activity.name}</span>
                    </div>
                    <div className="activity-actions" onClick={e => e.stopPropagation()}>
                      <button 
                        className="edit-btn edit-activity-btn" 
                        aria-label="Edit activity"
                        onClick={() => openEditActivityModal(activity)}
                      >
                        <i className="fas fa-pen" aria-hidden="true"></i>
                      </button>
                      <button 
                        className="remove-btn delete-btn" 
                        aria-label="Delete activity"
                        onClick={() => requestDeleteActivity(activity)}
                      >
                        <i className="fas fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>

                  {hasSubActivities && (
                    <ul className="sub-activity-list">
                      {activity.subActivities.map(sub => (
                        <li key={sub.id} className="sub-activity-item" data-id={sub.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flex: 1 }}>
                            <span className="color-dot" style={{ backgroundColor: sub.color || '#888' }}></span>
                            <span>{sub.name}</span>
                          </div>
                          <div className="activity-actions">
                            <button 
                              className="edit-btn edit-sub-btn" 
                              aria-label="Edit sub-activity"
                              onClick={() => openEditSubActivityModal(activity.id, sub)}
                            >
                              <i className="fas fa-pen" aria-hidden="true"></i>
                            </button>
                            <button 
                              className="remove-btn delete-btn" 
                              aria-label="Delete sub-activity"
                              onClick={() => requestDeleteSubActivity(activity.id, sub)}
                            >
                              <i className="fas fa-trash" aria-hidden="true"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isExpanded && (
                    <div className="sub-add-row" onClick={e => e.stopPropagation()}>
                      <input 
                        type="color" 
                        className="sub-activity-color-picker" 
                        value={subActivityColors[activity.id] || '#3B82F6'}
                        onChange={(e) => setSubActivityColors(prev => ({ ...prev, [activity.id]: e.target.value }))}
                      />
                      <input 
                        type="text" 
                        className="add-input sub-activity-input" 
                        placeholder="Add sub-activity"
                        value={subActivityInputs[activity.id] || ''}
                        onChange={(e) => setSubActivityInputs(prev => ({ ...prev, [activity.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddSubActivity(activity.id);
                        }}
                      />
                      <button 
                        className="add-btn sub-add-btn" 
                        aria-label="Add sub-activity"
                        onClick={() => handleAddSubActivity(activity.id)}
                      >
                        &#10148;
                      </button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div id="edit-activity-modal" className="modal">
          <div className="modal-content">
            <h3>Edit Activity</h3>
            <div className="edit-form">
              <label htmlFor="edit-activity-name">Activity Name:</label>
              <input 
                type="text" 
                id="edit-activity-name" 
                placeholder="Activity name"
                value={editActivityNameVal}
                onChange={e => setEditActivityNameVal(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button id="save-activity-edit" className="btn-confirm" onClick={saveEditedActivity}>Save</button>
                <button id="cancel-activity-edit" className="btn-cancel" onClick={() => setEditingActivity(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Activity Modal */}
      {editingSubActivity && (
        <div id="edit-subactivity-modal" className="modal">
          <div className="modal-content">
            <h3>Edit Sub-Activity</h3>
            <div className="edit-form">
              <label htmlFor="edit-subactivity-name">Sub-Activity Name:</label>
              <input 
                type="text" 
                id="edit-subactivity-name" 
                placeholder="Sub-activity name"
                value={editSubActivityNameVal}
                onChange={e => setEditSubActivityNameVal(e.target.value)}
                autoFocus
              />
              <label htmlFor="edit-subactivity-color">Color:</label>
              <input 
                type="color" 
                id="edit-subactivity-color" 
                value={editSubActivityColorVal}
                onChange={e => setEditSubActivityColorVal(e.target.value)}
              />
              <div className="modal-buttons">
                <button id="save-subactivity-edit" className="btn-confirm" onClick={saveEditedSubActivity}>Save</button>
                <button id="cancel-subactivity-edit" className="btn-cancel" onClick={() => setEditingSubActivity(null)}>Cancel</button>
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
