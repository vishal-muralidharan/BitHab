import { useState } from 'react';
import { useReminders } from '../context/ReminderContext';

export default function Reminders() {
  const { reminders, loading, addReminder, editReminder, deleteReminder } = useReminders();

  const [text, setText] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('09:00');

  // Edit Modal State
  const [editingReminder, setEditingReminder] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Confirmation Modal
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
      return reminderDateTime >= new Date();
    } catch {
      return true;
    }
  };

  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    try {
      await addReminder(text.trim(), date, time);
      setText('');
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add reminder:", error);
    }
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setEditText(reminder.text);
    setEditDate(reminder.date);
    setEditTime(reminder.time || '09:00');
  };

  const saveEditedReminder = async () => {
    if (!editingReminder || !editText.trim()) return;
    try {
      await editReminder(editingReminder.id, editText.trim(), editDate, editTime);
      setEditingReminder(null);
    } catch (error) {
      console.error("Failed to edit reminder:", error);
    }
  };

  const requestDelete = (reminder) => {
    setConfirmDialog({
      message: `Are you sure you want to delete this reminder?`,
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

        <div className="add-item-form reminder-form" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="add-input" 
            placeholder="Add new reminder"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddSubmit();
            }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <input 
            type="date" 
            className="date-input"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
          <input 
            type="time" 
            className="time-input"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
          <button 
            id="add-reminder-btn" 
            className="add-btn" 
            aria-label="Add reminder"
            onClick={handleAddSubmit}
            disabled={!text.trim()}
          >
            <i className="fas fa-plus icon-only" aria-hidden="true"></i>
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

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <div id="edit-reminder-modal" className="modal">
          <div className="modal-content">
            <h3>Edit Reminder</h3>
            <div className="edit-form">
              <label htmlFor="edit-reminder-name">Reminder Text:</label>
              <input 
                type="text" 
                id="edit-reminder-name" 
                placeholder="Reminder text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                autoFocus
              />
              <label htmlFor="edit-picker-date">Date:</label>
              <input 
                type="date" 
                id="edit-picker-date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
              />
              <label htmlFor="edit-picker-time">Time:</label>
              <input 
                type="time" 
                id="edit-picker-time"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
              />
              <div className="modal-buttons">
                <button id="save-reminder-edit" className="btn-confirm" onClick={saveEditedReminder}>Save</button>
                <button id="cancel-reminder-edit" className="btn-cancel" onClick={() => setEditingReminder(null)}>Cancel</button>
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
