import { useState, useEffect, useRef } from 'react';
import { useNotes } from '../context/NoteContext';

/**
 * Adjusts a note textarea's height to fit its content up to 240px.
 */
function resizeNoteTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(Math.max(el.scrollHeight, 76), 240)}px`;
}

export default function Notes() {
  const { notes, loading, addNote, updateNote, toggleFavorite, deleteNote } = useNotes();
  const [activeType, setActiveType] = useState('daily');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const gridRef = useRef(null);

  const filteredNotes = notes.filter(note => {
    if (note.type !== activeType) return false;
    if (currentFilter === 'favorites' && !note.favorite) return false;
    return true;
  });

  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.querySelectorAll('.note-content-input').forEach(resizeNoteTextarea);
  }, [filteredNotes, activeType, currentFilter]);

  const handleAddNewNote = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (activeType === 'daily') {
      await addNote(todayStr, '', 'daily');
    } else {
      await addNote('Untitled Note', '', 'general');
    }
  };

  const handleContentChange = (noteId, newContent, targetEl) => {
    resizeNoteTextarea(targetEl);
    updateNote(noteId, { content: newContent });
  };

  const handleTitleChange = (noteId, newTitle) => {
    updateNote(noteId, { title: newTitle });
  };

  const handleDateChange = (noteId, newDate) => {
    updateNote(noteId, { date: newDate });
  };

  const requestDeleteNote = (note) => {
    const name = note.type === 'daily' ? (note.date || 'this daily note') : (note.title || 'this note');
    setConfirmDialog({
      message: `Are you sure you want to delete ${name}?`,
      onConfirm: async () => {
        await deleteNote(note.id);
        setConfirmDialog(null);
      }
    });
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="notes-container">
        <div className="page-header">
          <h1>Notes</h1>
          <p className="page-subtitle">Capture thoughts inline with daily and general notes</p>
        </div>

        {/* Toolbar */}
        <div className="notes-toolbar">
          <div className="toolbar-left">
            <button 
              id="daily-notes-btn" 
              className={`note-type-btn ${activeType === 'daily' ? 'active' : ''}`}
              onClick={() => setActiveType('daily')}
            >
              <i className="fas fa-calendar-day"></i>
              Daily
            </button>
            <button 
              id="general-notes-btn" 
              className={`note-type-btn ${activeType === 'general' ? 'active' : ''}`}
              onClick={() => setActiveType('general')}
            >
              <i className="fas fa-sticky-note"></i>
              General
            </button>
          </div>

          <div className="toolbar-right">
            <div className="add-note-wrapper">
              <button id="add-note-btn" className="btn-primary" onClick={handleAddNewNote}>
                <i className="fas fa-plus"></i>
                New Note
              </button>
            </div>
            <div className="filter-group">
              <button 
                id="filter-all-btn" 
                className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('all')}
              >
                <i className="fas fa-list"></i>
                All
              </button>
              <button 
                id="filter-favorites-btn" 
                className={`filter-btn ${currentFilter === 'favorites' ? 'active' : ''}`}
                onClick={() => setCurrentFilter('favorites')}
              >
                <i className="fas fa-star"></i>
                Favorites
              </button>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div id="empty-state" className="empty-state" style={{ display: 'flex' }}>
            <div className="empty-icon">
              <i className="fas fa-note-sticky"></i>
            </div>
            <h3>No notes yet</h3>
            <p>
              {currentFilter === 'favorites' 
                ? 'No favorite notes yet' 
                : `No ${activeType} notes yet. Click "New Note" to create one`}
            </p>
          </div>
        ) : (
          <div ref={gridRef} id="notes-grid" className="notes-grid">
            {filteredNotes.map(note => {
              const favIcon = note.favorite ? 'fas fa-star' : 'far fa-star';

              return (
                <div key={note.id} className="note-card" data-note-id={note.id} data-type={note.type}>
                  <div className="note-header">
                    <div className="note-identifier">
                      {note.type === 'daily' ? (
                        <div className="note-date-display" title="Click to change date">
                          <i className="fas fa-calendar-day" aria-hidden="true"></i>
                          <span>{formatDateDisplay(note.date) || 'Select date'}</span>
                          <input 
                            type="date" 
                            className="note-date-input" 
                            aria-label="Note date"
                            value={note.date || ''}
                            onChange={(e) => handleDateChange(note.id, e.target.value)}
                          />
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          className="note-title-input" 
                          value={note.title || ''} 
                          placeholder="Note title"
                          aria-label="Note title"
                          onChange={(e) => handleTitleChange(note.id, e.target.value)}
                        />
                      )}
                    </div>
                    <div className="note-actions">
                      <button 
                        className={`favorite-note-btn ${note.favorite ? 'is-favorite' : ''}`}
                        title="Toggle favorite"
                        aria-label="Toggle favorite"
                        onClick={() => toggleFavorite(note.id)}
                      >
                        <i className={favIcon} aria-hidden="true"></i>
                      </button>
                      <button 
                        className="delete-note-btn" 
                        title="Delete note"
                        aria-label="Delete note"
                        onClick={() => requestDeleteNote(note)}
                      >
                        <i className="fas fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                  <textarea 
                    className="note-content-input" 
                    placeholder="Write your note here"
                    value={note.content || ''}
                    onChange={(e) => handleContentChange(note.id, e.target.value, e.target)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

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
