import { Link } from 'react-router-dom';

export default function Activities() {
  return (
    <>

        <div className="management-column">
            <div className="page-header">
                <h1>Activities</h1>
                <button id="open-schedule-btn" className="schedule-link-btn">
                    <i className="fas fa-calendar-check"></i> Schedule Activities
                </button>
            </div>
      <div className="add-item-form">
        <input type="text" id="add-activity-input" className="add-input" placeholder="Add new activity" />
        <button id="add-activity-btn" className="add-btn" aria-label="Add activity">
          <i className="fas fa-plus icon-only" aria-hidden="true"></i>
        </button>
            </div>
            <ul id="activity-list" className="activity-list"></ul>
        </div>
    
    </>
  );
}
