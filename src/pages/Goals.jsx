import { Link } from 'react-router-dom';

export default function Goals() {
  return (
    <>

        <div className="management-column">
            <div className="page-header">
                <h1>Goals</h1>
                <p className="page-subtitle">Set, track, and complete your goals</p>
            </div>
      <div className="add-item-form">
        <input type="text" id="add-goal-input" className="add-input" placeholder="Add new goal" />
        <button id="add-goal-btn" className="add-btn" aria-label="Add goal">
          <i className="fas fa-plus icon-only" aria-hidden="true"></i>
        </button>
            </div>
            <ul id="goal-list" className="goal-list"></ul>
            
            <div id="completed-goals-section" className="completed-goals-section" style={{marginTop: '2rem'}}>
                <button id="toggle-completed-goals" className="toggle-completed-btn" style={{display: 'none'}}>
                    <span className="toggle-icon">▼</span>
                    <span className="completed-goals-text">Completed Goals</span>
                </button>
                <ul id="completed-goal-list" className="goal-list"></ul>
            </div>
        </div>
    
    </>
  );
}
