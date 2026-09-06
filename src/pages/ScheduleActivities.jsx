import { Link } from 'react-router-dom';

export default function ScheduleActivities() {
  return (
    <>

      <div className="management-column">
        <div className="page-header">
          <h1>Schedule Activities</h1>
          <button id="back-to-activities" className="back-btn">
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
        
        <div className="schedule-controls">
          <div id="activity-grid" className="activity-grid">
            
          </div>
          <div id="subactivity-section" className="subactivity-section" style={{display: 'none'}}>
            <p className="section-label">Select a sub-activity:</p>
            <div id="subactivity-grid" className="subactivity-grid">
              
            </div>
          </div>
          <button id="set-schedule-btn" className="schedule-pattern-btn" style={{display: 'none'}}>
            <i className="fas fa-calendar-days"></i> Set Schedule Pattern
          </button>
        </div>
        
        <div className="schedule-layout">
          <div className="schedule-calendar-section">
            <div id="schedule-calendar-container" className="schedule-calendar-container">
              
            </div>
          </div>
          
          <div className="schedule-stats-section">
            <div className="stats-card">
              <h3>Activity Progress</h3>
              <div id="activity-stats" className="activity-stats">
                <div className="stat-placeholder">
                  <i className="fas fa-chart-line"></i>
                  <p>Select an activity to view progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
}
