import { useState } from 'react';
import { useLists } from '../context/ListContext';

export default function Lists() {
  const { lists, loading, addList, deleteList, addListItem, toggleListItem, deleteListItem } = useLists();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListType, setNewListType] = useState('checklist');
  const [newItemTexts, setNewItemTexts] = useState({});
  const [selectedListId, setSelectedListId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const handleAddList = (e) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      addList(newListTitle.trim(), newListType);
      setNewListTitle('');
      setShowAddForm(false);
    }
  };

  const handleAddItem = (e, listId) => {
    e.preventDefault();
    const text = newItemTexts[listId];
    if (text && text.trim()) {
      addListItem(listId, text.trim());
      setNewItemTexts({ ...newItemTexts, [listId]: '' });
    }
  };

  const requestDeleteList = (list) => {
    setConfirmDialog({
      message: `Are you sure you want to delete "${list.title}"?`,
      onConfirm: async () => {
        await deleteList(list.id);
        setConfirmDialog(null);
      }
    });
  };

  const getListIcon = (type) => {
    switch (type) {
      case 'todo': return 'fa-list-check';
      case 'numbered': return 'fa-list-ol';
      case 'bulleted': return 'fa-list-ul';
      case 'checklist':
      default:
        return 'fa-check-square';
    }
  };

  return (
    <>
      <div className="lists-container">
        <div className="page-header">
          <h1>Lists</h1>
          <p className="page-subtitle">Organize your thoughts with flexible lists</p>
        </div>

        <div className="lists-toolbar">
          <button 
            id="add-list-btn"
            onClick={() => setShowAddForm(!showAddForm)} 
            className="toolbar-btn primary"
          >
            <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
            <span>{showAddForm ? 'Cancel' : 'New List'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddList} className="add-item-form" style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="add-input"
              placeholder="List Title..." 
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              autoFocus
              style={{ flex: 1, minWidth: '220px' }}
            />
            <select
              value={newListType}
              onChange={(e) => setNewListType(e.target.value)}
              style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="checklist">Checklist</option>
              <option value="todo">Todo List</option>
              <option value="numbered">Numbered</option>
              <option value="bulleted">Bulleted</option>
            </select>
            <button type="submit" className="toolbar-btn primary" disabled={!newListTitle.trim()}>
              Create
            </button>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>Loading lists...</div>
        ) : lists.length === 0 ? (
          <div className="lists-empty-state">
            <i className="fas fa-list"></i>
            <h3>No lists yet</h3>
            <p>Create your first list to get started</p>
          </div>
        ) : (
          <div id="lists-grid" className="lists-grid">
            {lists.map(list => {
              const isSelected = selectedListId === list.id;

              return (
                <div 
                  key={list.id} 
                  className={`list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedListId(isSelected ? null : list.id)}
                >
                  <div className="list-card-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <i className={`fas ${getListIcon(list.type)}`} style={{ color: 'var(--accent-primary)' }}></i>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{list.title}</h3>
                    </div>
                    <div className="list-card-actions" onClick={e => e.stopPropagation()}>
                      <button 
                        className="delete-list-btn"
                        onClick={() => requestDeleteList(list)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        aria-label="Delete list"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="list-items" style={{ width: '100%', marginTop: '0.5rem' }}>
                    {list.items.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', margin: '0.5rem 0' }}>Empty list</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {list.items.map((item, idx) => (
                          <li key={item.id} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {list.type === 'numbered' ? (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '18px' }}>{idx + 1}.</span>
                            ) : list.type === 'bulleted' ? (
                              <span style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', lineHeight: '1', width: '18px' }}>•</span>
                            ) : (
                              <input 
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleListItem(list.id, item.id)}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                            )}
                            <span 
                              style={{ 
                                flex: 1, 
                                textDecoration: item.completed ? 'line-through' : 'none',
                                color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: '0.95rem'
                              }}
                            >
                              {item.text}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteListItem(list.id, item.id);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5, padding: '2px 4px' }}
                              aria-label="Delete item"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="add-item-row" style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', width: '100%' }} onClick={e => e.stopPropagation()}>
                    <form onSubmit={(e) => handleAddItem(e, list.id)} style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <input 
                        type="text" 
                        className="add-item-input"
                        placeholder="Add an item..."
                        value={newItemTexts[list.id] || ''}
                        onChange={(e) => setNewItemTexts({ ...newItemTexts, [list.id]: e.target.value })}
                        style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                      />
                      <button 
                        type="submit" 
                        className="add-item-btn"
                        style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '0 0.875rem', cursor: 'pointer' }}
                        aria-label="Add item"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </form>
                  </div>
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
