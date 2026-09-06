import { Link } from 'react-router-dom';

export default function Notes() {
  return (
    <>

        <div className="notes-container">
            <div className="page-header">
                <h1>Notes</h1>
                <p className="page-subtitle">Capture thoughts inline with daily and general notes</p>
            </div>
            
            
            <div className="notes-toolbar">
                <div className="toolbar-left">
                    <button id="daily-notes-btn" className="note-type-btn active">
                        <i className="fas fa-calendar-day"></i>
                        Daily
                    </button>
                    <button id="general-notes-btn" className="note-type-btn">
                        <i className="fas fa-sticky-note"></i>
                        General
                    </button>
                </div>
                <div className="toolbar-right">
                    <div className="add-note-wrapper">
                        <button id="add-note-btn" className="btn-primary">
                            <i className="fas fa-plus"></i>
                            New Note
                        </button>
                    </div>
                    <div className="filter-group">
                        <button id="filter-all-btn" className="filter-btn active">
                            <i className="fas fa-list"></i>
                            All
                        </button>
                        <button id="filter-favorites-btn" className="filter-btn">
                            <i className="fas fa-star"></i>
                            Favorites
                        </button>
                    </div>
                </div>
            </div>
            
            
            <div id="notes-grid" className="notes-grid"></div>
            
            
            <div id="empty-state" className="empty-state" style={{display: 'none'}}>
                <div className="empty-icon">
                    <i className="fas fa-note-sticky"></i>
                </div>
                <h3>No notes yet</h3>
                <p>Click "Add Note" to create your first note</p>
            </div>
        </div>
    
    </>
  );
}
