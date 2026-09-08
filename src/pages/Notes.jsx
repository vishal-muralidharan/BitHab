import { useState } from 'react';
import { useNotes } from '../context/NoteContext';

export default function Notes() {
  const { notes, loading, addNote, updateNote, toggleFavorite, deleteNote } = useNotes();
  const [activeType, setActiveType] = useState('daily');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const filteredNotes = notes.filter(note => {
    if (activeType !== 'all' && note.type !== activeType) return false;
    if (filterFavorites && !note.isFavorite) return false;
    return true;
  });

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      setIsAddingNote(false);
      return;
    }
    
    try {
      await addNote(newNoteTitle, newNoteContent, activeType);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsAddingNote(false);
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const renderNoteCard = (note) => (
    <div key={note.id} className="note-card" style={{backgroundColor: 'var(--surface-color)', padding: '15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '10px'}}>
      <div className="note-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h3 style={{margin: 0, fontSize: '1.1rem'}}>{note.title || 'Untitled'}</h3>
        <div className="note-actions" style={{display: 'flex', gap: '8px'}}>
          <button 
            onClick={() => toggleFavorite(note.id)} 
            style={{background: 'none', border: 'none', cursor: 'pointer', color: note.isFavorite ? '#eab308' : 'var(--text-secondary)'}}
          >
            <i className={note.isFavorite ? "fas fa-star" : "far fa-star"}></i>
          </button>
          <button 
            onClick={() => deleteNote(note.id)} 
            style={{background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444'}}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div className="note-content" style={{color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', flex: 1}}>
        {note.content}
      </div>
      <div className="note-footer" style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #333'}}>
        {new Date(note.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <>
        <div className="notes-container">
            <div className="page-header">
                <h1>Notes</h1>
                <p className="page-subtitle">Capture thoughts inline with daily and general notes</p>
            </div>
            
            <div className="notes-toolbar">
                <div className="toolbar-left">
                    <button 
                      className={`note-type-btn ${activeType === 'daily' ? 'active' : ''}`}
                      onClick={() => setActiveType('daily')}
                    >
                        <i className="fas fa-calendar-day"></i> Daily
                    </button>
                    <button 
                      className={`note-type-btn ${activeType === 'general' ? 'active' : ''}`}
                      onClick={() => setActiveType('general')}
                    >
                        <i className="fas fa-sticky-note"></i> General
                    </button>
                </div>
                <div className="toolbar-right">
                    <div className="add-note-wrapper">
                        <button className="btn-primary" onClick={() => setIsAddingNote(true)}>
                            <i className="fas fa-plus"></i> New Note
                        </button>
                    </div>
                    <div className="filter-group">
                        <button 
                          className={`filter-btn ${!filterFavorites ? 'active' : ''}`}
                          onClick={() => setFilterFavorites(false)}
                        >
                            <i className="fas fa-list"></i> All
                        </button>
                        <button 
                          className={`filter-btn ${filterFavorites ? 'active' : ''}`}
                          onClick={() => setFilterFavorites(true)}
                        >
                            <i className="fas fa-star"></i> Favorites
                        </button>
                    </div>
                </div>
            </div>
            
            {isAddingNote && (
              <div className="new-note-form" style={{backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--primary-color)'}}>
                <input 
                  type="text" 
                  placeholder="Note Title" 
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  style={{width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px'}}
                />
                <textarea 
                  placeholder="Note content..." 
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  style={{width: '100%', padding: '10px', minHeight: '100px', marginBottom: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px'}}
                />
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                  <button onClick={() => setIsAddingNote(false)} style={{padding: '8px 16px', background: 'transparent', border: '1px solid #444', color: 'white', borderRadius: '4px', cursor: 'pointer'}}>Cancel</button>
                  <button onClick={handleAddNote} className="btn-primary" style={{padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Save Note</button>
                </div>
              </div>
            )}
            
            <div id="notes-grid" className="notes-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px'}}>
              {loading ? (
                <p>Loading notes...</p>
              ) : filteredNotes.length > 0 ? (
                filteredNotes.map(renderNoteCard)
              ) : null}
            </div>
            
            {!loading && filteredNotes.length === 0 && !isAddingNote && (
              <div id="empty-state" className="empty-state" style={{textAlign: 'center', padding: '40px'}}>
                  <div className="empty-icon" style={{fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '1rem'}}>
                      <i className="fas fa-note-sticky"></i>
                  </div>
                  <h3>No notes found</h3>
                  <p style={{color: 'var(--text-secondary)'}}>Click "New Note" to create one.</p>
              </div>
            )}
        </div>
    </>
  );
}
