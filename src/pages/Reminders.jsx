import { useState } from 'react';
import { useReminders } from '../context/ReminderContext';

export default function Reminders() {
  const { reminders, loading, addReminder, editReminder, deleteReminder } = useReminders();

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('09:00');
  const [quickDay, setQuickDay] = useState(1);
  const [validationError, setValidationError] = useState(null);

  // Edit Modal State
  const [editingReminder, setEditingReminder] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editQuickDay, setEditQuickDay] = useState(null);
  const [editValidationError, setEditValidationError] = useState(null);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState(null);

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const reminderDate = new Date(`${dateStr}T${timeStr}`);
      if (isNaN(reminderDate.getTime())) return `${dateStr} ${timeStr}`;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

      let dStr;
      if (reminderDay.getTime() === today.getTime()) {
        dStr = 'Today';
      } else if (reminderDay.getTime() === tomorrow.getTime()) {
        dStr = 'Tomorrow';
      } else {
        dStr = reminderDate.toLocaleDateString();
      }

      const tStr = reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${dStr} at ${tStr}`;
    } catch {
      return `${dateStr} at ${timeStr}`;
    }
  };

  const isReminderActive = (dateStr, timeStr) => {
    try {
      const reminderDateTime = new Date(`${dateStr}T${timeStr}`);
      return reminderDateTime > new Date();
    } catch {
      return true;
    }
  };

  const openAddModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('09:00');
    setQuickDay(1);
    setText('');
    setValidationError(null);
    setShowAddModal(true);
  };

  const handleQuickDate = (days, isEdit = false) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    let timeValue = '09:00';
    if (days === 0) {
      const now = new Date();
      const nextHour = (now.getHours() + 1) % 24;
      timeValue = `${nextHour.toString().padStart(2, '0')}:00`;
    }

    const dateValue = targetDate.toISOString().split('T')[0];

    if (isEdit) {
      setEditDate(dateValue);
      setEditTime(timeValue);
      setEditQuickDay(days);
      setEditValidationError(null);
    } else {
      setDate(dateValue);
      setTime(timeValue);
      setQuickDay(days);
      setValidationError(null);
    }
  };

  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) {
      setValidationError('Please enter reminder text');
      return;
    }
    if (!date || !time) {
      setValidationError('Please select both date and time');
      return;
    }

    const reminderDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    if (isNaN(reminderDateTime.getTime()) || reminderDateTime <= now) {
      setValidationError('Please select a future date and time');
      return;
    }

    try {
      await addReminder(text.trim(), date, time);
      setShowAddModal(false);
      setText('');
      setValidationError(null);
    } catch (error) {
      console.error("Failed to add reminder:", error);
      setValidationError('Failed to save reminder. Please try again.');
    }
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setEditText(reminder.text);
    setEditDate(reminder.date);
    setEditTime(reminder.time || '09:00');
    setEditQuickDay(null);
    setEditValidationError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingReminder) return;
    if (!editText.trim()) {
      setEditValidationError('Please enter reminder text');
      return;
    }
    if (!editDate || !editTime) {
      setEditValidationError('Please select both date and time');
      return;
    }

    const reminderDateTime = new Date(`${editDate}T${editTime}`);
    const now = new Date();
    if (isNaN(reminderDateTime.getTime()) || reminderDateTime <= now) {
      setEditValidationError('Please select a future date and time');
      return;
    }

    try {
      await editReminder(editingReminder.id, editText.trim(), editDate, editTime);
      setEditingReminder(null);
      setEditValidationError(null);
    } catch (error) {
      console.error("Failed to edit reminder:", error);
      setEditValidationError('Failed to save changes. Please try again.');
    }
  };

  const requestDelete = (reminder) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this reminder?',
      onConfirm: async () => {
        await deleteReminder(reminder.id);
        setConfirmDialog(null);
      }
    });
  };

  // Sort reminders by date and time
  const sortedReminders = [...reminders].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA - dateTimeB;
  });

  return (
    <>
      <div className="management-column">
        <div className="page-header">
          <h1>Reminders</h1>
          <p className="page-subtitle">Set reminders for future events</p>
        </div>

        <div className="add-item-form reminder-form">
          <button 
            type="button" 
            id="add-reminder-btn" 
            className="add-reminder-main-btn"
            onClick={openAddModal}
          >
            <i className="fas fa-plus icon-prefix" aria-hidden="true" style={{ marginRight: '0.5rem' }}></i>
            <span>Add New Reminder</span>
          </button>
        </div>

        <ul id="reminder-list" className="reminder-list">
          {loading ? (
            <li style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>Loading reminders...</li>
          ) : sortedReminders.length === 0 ? (
            <p style={{ padding: '0 1rem', opacity: 0.7 }}>No reminders set. Add one to get started.</p>
          ) : (
            sortedReminders.map(reminder => {
              const active = isReminderActive(reminder.date, reminder.time);
              const formattedDateTime = formatDateTime(reminder.date, reminder.time);

              return (
                <li 
                  key={reminder.id} 
                  className={`reminder-item ${!active ? 'expired' : ''}`}
                  data-id={reminder.id}
                >
                  <div className="reminder-content">
                    <span className="reminder-text">{reminder.text}</span>
                    <span className="reminder-datetime">{formattedDateTime}</span>
                  </div>
                  <div className="reminder-actions">
                    <button 
                      className="edit-btn" 
                      aria-label="Edit reminder"
                      onClick={() => openEditModal(reminder)}
                    >
                      <i className="fas fa-pen" aria-hidden="true"></i>
                    </button>
                    <button 
                      className="delete-btn" 
                      aria-label="Delete reminder"
                      onClick={() => requestDelete(reminder)}
                    >
                      <i className="fas fa-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* DateTime Picker Modal (Add Reminder) */}
      {showAddModal && (
        <div 
          id="datetime-picker-modal" 
          className="modal"
          onClick={(e) => {
            if (e.target.id === 'datetime-picker-modal') setShowAddModal(false);
          }}
        >
          <div className="modal-content datetime-picker-content">
            <h3 id="datetime-modal-title">Add New Reminder</h3>
            <br />
            {validationError && (
              <div 
                className="error-message" 
                style={{ 
                  color: '#ef4444', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.25)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius)', 
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  textAlign: 'left'
                }}
              >
                <i className="fas fa-exclamation-circle" style={{ marginRight: '0.4rem' }}></i>
                {validationError}
              </div>
            )}
            <div className="reminder-form-section">
              <label htmlFor="modal-reminder-text" className="visually-hidden">Reminder details</label>
              <input 
                type="text" 
                id="modal-reminder-text" 
                className="modal-input" 
                placeholder="What would you like to be reminded about?"
                value={text}
                onChange={e => {
                  setText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSubmit();
                }}
                autoFocus
              />
            </div>
            <div className="datetime-picker">
              <div className="date-section">
                <label htmlFor="picker-date">Date:</label>
                <input 
                  type="date" 
                  id="picker-date" 
                  className="datetime-input"
                  value={date}
                  onChange={e => {
                    setDate(e.target.value);
                    setQuickDay(null);
                    if (validationError) setValidationError(null);
                  }}
                />
              </div>
              <div className="time-section">
                <label htmlFor="picker-time">Time:</label>
                <input 
                  type="time" 
                  id="picker-time" 
                  className="datetime-input"
                  value={time}
                  onChange={e => {
                    setTime(e.target.value);
                    setQuickDay(null);
                    if (validationError) setValidationError(null);
                  }}
                />
              </div>
              <div className="quick-date-buttons">
                <button 
                  type="button" 
                  className={`quick-btn ${quickDay === 0 ? 'selected' : ''}`}
                  onClick={() => handleQuickDate(0, false)}
                >
                  Today
                </button>
                <button 
                  type="button" 
                  className={`quick-btn ${quickDay === 1 ? 'selected' : ''}`}
                  onClick={() => handleQuickDate(1, false)}
                >
                  Tomorrow
                </button>
                <button 
                  type="button" 
                  className={`quick-btn ${quickDay === 7 ? 'selected' : ''}`}
                  onClick={() => handleQuickDate(7, false)}
                >
                  Next Week
                </button>
              </div>
            </div>
            <div className="modal-buttons">
              <button 
                id="confirm-datetime" 
                className="btn-confirm" 
                onClick={handleAddSubmit}
              >
                Add Reminder
              </button>
              <button 
                id="cancel-datetime" 
                className="btn-cancel" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <div 
          id="edit-reminder-modal" 
          className="modal"
          onClick={(e) => {
            if (e.target.id === 'edit-reminder-modal') setEditingReminder(null);
          }}
        >
          <div className="modal-content datetime-picker-content">
            <h3>Edit Reminder</h3>
            <br />
            {editValidationError && (
              <div 
                className="error-message" 
                style={{ 
                  color: '#ef4444', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.25)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius)', 
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  textAlign: 'left'
                }}
              >
                <i className="fas fa-exclamation-circle" style={{ marginRight: '0.4rem' }}></i>
                {editValidationError}
              </div>
            )}
            <div className="reminder-form-section">
              <label htmlFor="edit-reminder-name" className="visually-hidden">Reminder details</label>
              <input 
                type="text" 
                id="edit-reminder-name" 
                className="modal-input" 
                placeholder="What would you like to be reminded about?"
                value={editText}
                onChange={e => {
                  setEditText(e.target.value);
                  if (editValidationError) setEditValidationError(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveEdit();
                }}
                autoFocus
              />
            </div>
            <div className="datetime-picker">
              <div className="date-section">
                <label htmlFor="edit-picker-date">Date:</label>
                <input 
                  type="date" 
                  id="edit-picker-date" 
                  className="datetime-input"
                  value={editDate}
                  onChange={e => {
                    setEditDate(e.target.value);
                    setEditQuickDay(null);
                    if (editValidationError) setEditValidationError(null);
                  }}
                />
              </div>
              <div className="time-section">
                <label htmlFor="edit-picker-time">Time:</label>
                <input 
                  type="time" 
                  id="edit-picker-time" 
                  className="datetime-input"
                  value={editTime}
                  onChange={e => {
                    setEditTime(e.target.value);
                    setEditQuickDay(null);
                    if (editValidationError) setEditValidationError(null);
                  }}
                />
              </div>
              <div className="quick-date-buttons">
                <button 
                  type="button" 
                  className={`quick-btn ${editQuickDay === 0 ? 'selected' : ''}`}
                  onClick={() => handleQuickDate(0, true)}
                >
                  Today
                </button>
                <button 
                  type="button" 
                  className={`quick-btn ${editQuickDay === 1 ? 'selected' : ''}`}
                  onClick={() => handleQuickDate(1, true)}
                >
                  Tomorrow
                </button>
                <button 
                  type="button" 
                  className={`quick-btn ${editQuickDay === 7 ? 'selected' : ''}`}
                  onClick={() => handleQuickDate(7, true)}
                >
                  Next Week
                </button>
              </div>
            </div>
            <div className="modal-buttons">
              <button 
                id="save-reminder-edit" 
                className="btn-confirm" 
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
              <button 
                id="cancel-reminder-edit" 
                className="btn-cancel" 
                onClick={() => setEditingReminder(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div 
          id="confirmation-modal" 
          className="modal"
          onClick={(e) => {
            if (e.target.id === 'confirmation-modal') setConfirmDialog(null);
          }}
        >
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
