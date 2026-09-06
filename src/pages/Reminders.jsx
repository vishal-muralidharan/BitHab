import { Link } from 'react-router-dom';

export default function Reminders() {
  return (
    <>

        <div className="management-column">
            <div className="page-header">
                <h1>Reminders</h1>
                <p className="page-subtitle">Set reminders for future events</p>
            </div>
      <div className="add-item-form reminder-form">
        <button type="button" id="add-reminder-btn" className="add-reminder-main-btn">
          <i className="fas fa-plus icon-prefix" aria-hidden="true"></i>
          <span>Add New Reminder</span>
        </button>
            </div>
            <ul id="reminder-list" className="reminder-list"></ul>
        </div>
    
    </>
  );
}
