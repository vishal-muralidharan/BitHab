import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <>
<div className="main-layout">
            
            <div className="left-column">
                <div className="activities-component" data-page="pages/activities.html">
                    <div className="section-header">
                        <h2>Activities</h2>
                        <button className="show-all-btn" id="activities-show-all" title="Show all">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <ul id="activity-list" className="activity-list"></ul>
                </div>
                
                <div className="notes-component" data-page="pages/notes.html">
                    <div className="section-header">
                        <h2>Notes</h2>
                        <button className="show-all-btn" id="notes-show-all" title="Show all">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <div id="notes-preview" className="notes-preview">
                        
                    </div>
                </div>
            </div>

            
            <div className="center-column">
                <div className="date-display">
                    <div className="current-date-colored" id="current-date">
                        Today
                    </div>
                </div>
                <section className="calendar-view" id="calendar-view">
                  
                </section>
                
                
                <div className="activity-logging-section hidden" id="activity-logging-section">
                    <div className="logging-header">
                        <h3>Log Activities for <span id="selected-date-text">Today</span></h3>
                        <button className="close-logging-btn" id="close-logging-btn" aria-label="Close activity logging">
                            <i className="fas fa-xmark" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div className="logging-content">
                        
                    </div>
                </div>
            </div>

            
            <div className="right-column">
                <div className="goals-component" data-page="pages/goals.html">
                    <div className="section-header">
                        <h2>Goals</h2>
                        <button className="show-all-btn" id="goals-show-all" title="Show all">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <ul id="goal-list" className="goal-list"></ul>
                </div>
                
                <div className="reminders-component" data-page="pages/reminders.html">
                    <div className="section-header">
                        <h2>Reminders</h2>
                        <button className="show-all-btn" id="reminders-show-all" title="Show all">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 10L4 6h8l-4 4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <div id="reminders-preview" className="reminders-preview">
                        
                    </div>
                </div>
            </div>
        </div>
    </>
  );
}
