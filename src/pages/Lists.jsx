import { useState } from 'react';
import { useLists } from '../context/ListContext';

export default function Lists() {
  const { lists, loading, addList, updateList, deleteList, addListItem, toggleListItem, deleteListItem } = useLists();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  // Track input for new items per list
  const [newItemTexts, setNewItemTexts] = useState({});

  const handleAddList = (e) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      addList(newListTitle.trim());
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

  return (
    <div className="lists-container">
      <div className="page-header">
        <h1>Lists</h1>
        <p className="page-subtitle">Organize your thoughts with flexible lists</p>
      </div>

      <div className="lists-toolbar" style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn-primary" 
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
          <span>{showAddForm ? 'Cancel' : 'New List'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddList} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="List Title..." 
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            autoFocus
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'var(--surface-color)', color: 'white' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>Create</button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading lists...</div>
      ) : lists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
          <i className="fas fa-list-ul" style={{ fontSize: '2rem', marginBottom: '15px' }}></i>
          <p>You haven't created any lists yet.</p>
        </div>
      ) : (
        <div className="lists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {lists.map(list => (
            <div key={list.id} style={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              {/* List Header */}
              <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{list.title}</h3>
                <button onClick={() => deleteList(list.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
              
              {/* List Items */}
              <div style={{ padding: '15px', flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.items.length === 0 ? (
                    <li style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>Empty list</li>
                  ) : (
                    list.items.map(item => (
                      <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                          onClick={() => toggleListItem(list.id, item.id)}
                          style={{
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '4px', 
                            border: item.completed ? 'none' : '2px solid #555',
                            backgroundColor: item.completed ? 'var(--primary-color)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {item.completed && <i className="fas fa-check" style={{ color: 'white', fontSize: '10px' }}></i>}
                        </div>
                        <span style={{ 
                          flex: 1, 
                          textDecoration: item.completed ? 'line-through' : 'none',
                          color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                          fontSize: '0.95rem'
                        }}>
                          {item.text}
                        </span>
                        <button 
                          onClick={() => deleteListItem(list.id, item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              
              {/* Add Item Form */}
              <div style={{ padding: '15px', borderTop: '1px solid #333' }}>
                <form onSubmit={(e) => handleAddItem(e, list.id)} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Add an item..." 
                    value={newItemTexts[list.id] || ''}
                    onChange={(e) => setNewItemTexts({...newItemTexts, [list.id]: e.target.value})}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem' }}
                  />
                  <button type="submit" style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer' }}>
                    <i className="fas fa-plus"></i>
                  </button>
                </form>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
