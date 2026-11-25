import { useState } from 'react';
import { useLists } from '../context/ListContext';
import ConfirmModal from '../components/common/ConfirmModal';

export default function Lists() {
  const {
    lists,
    loading,
    addList,
    updateList,
    deleteList,
    addListItem,
    updateListItem,
    toggleListItem,
    deleteListItem
  } = useLists();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListType, setNewListType] = useState('checklist');
  const [newItemTexts, setNewItemTexts] = useState({});
  const [selectedListId, setSelectedListId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const runAction = async (fn, fallbackMessage) => {
    setErrorMsg('');
    try {
      await fn();
    } catch {
      setErrorMsg(fallbackMessage);
    }
  };

  const handleToggleAddForm = () => {
    setShowAddForm(prev => {
      if (prev) {
        setNewListTitle('');
        setNewListType('checklist');
      }
      return !prev;
    });
  };

  const handleAddList = (e) => {
    e.preventDefault();
    const trimmed = newListTitle.trim();
    if (!trimmed) return;
    setNewListTitle('');
    setNewListType('checklist');
    setShowAddForm(false);
    runAction(() => addList(trimmed, newListType), 'Could not create list. Please try again.');
  };

  const startRenameList = (list) => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
  };

  const commitRenameList = (list) => {
    const trimmed = editingListTitle.trim();
    setEditingListId(null);
    if (!trimmed || trimmed === list.title) return;
    runAction(() => updateList(list.id, { title: trimmed }), 'Could not rename list. Please try again.');
  };

  const handleAddItem = (e, listId) => {
    e.preventDefault();
    const text = newItemTexts[listId];
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    setNewItemTexts(prev => ({ ...prev, [listId]: '' }));
    runAction(() => addListItem(listId, trimmed), 'Could not add item. Please try again.');
  };

  const startEditItem = (listId, item) => {
    setEditingItem({ listId, itemId: item.id, text: item.text });
  };

  const commitEditItem = (originalItem) => {
    if (!editingItem) return;
    const { listId, itemId, text } = editingItem;
    const trimmed = text.trim();
    setEditingItem(null);
    if (!trimmed || trimmed === originalItem.text) return;
    runAction(
      () => updateListItem(listId, itemId, { text: trimmed }),
      'Could not update item. Please try again.'
    );
  };

  const requestDeleteList = (list) => {
    setConfirmDialog({
      listId: list.id,
      message: `Are you sure you want to delete "${list.title}"?`,
      onConfirm: () => {
        const targetId = list.id;
        setConfirmDialog(null);
        setSelectedListId(prev => (prev === targetId ? null : prev));
        runAction(() => deleteList(targetId), 'Could not delete list. Please try again.');
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

  const renderListItem = (list, item, displayIndex) => {
    const isCheckable = list.type !== 'numbered' && list.type !== 'bulleted';
    const isEditingThisItem = editingItem?.listId === list.id && editingItem?.itemId === item.id;

    return (
      <li
        key={item.id}
        className={`list-item ${item.completed ? 'completed' : ''}`}
      >
        {list.type === 'numbered' ? (
          <span className="item-number">{displayIndex + 1}.</span>
        ) : list.type === 'bulleted' ? (
          <span className="item-bullet" aria-hidden="true">•</span>
        ) : null}

        {isEditingThisItem ? (
          <form
            className="item-edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              commitEditItem(item);
            }}
            onClick={e => e.stopPropagation()}
          >
            <input
              type="text"
              className="item-text-input item-inline-edit-input"
              aria-label="Edit item text"
              value={editingItem.text}
              onChange={(e) => setEditingItem(prev => (prev ? { ...prev, text: e.target.value } : null))}
              onBlur={() => commitEditItem(item)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setEditingItem(null);
                }
              }}
              autoFocus
            />
          </form>
        ) : isCheckable ? (
          <label className="list-item-label" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              className="list-item-checkbox"
              checked={Boolean(item.completed)}
              onChange={() => runAction(() => toggleListItem(list.id, item.id), 'Could not update item. Please try again.')}
            />
            <span className={`list-item-text ${item.completed ? 'completed' : ''}`}>
              {item.text}
            </span>
          </label>
        ) : (
          <span className="list-item-text" onClick={e => e.stopPropagation()}>
            {item.text}
          </span>
        )}

        <div className="list-item-controls" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="list-item-action-btn"
            onClick={() => startEditItem(list.id, item)}
            aria-label="Edit item"
            title="Edit item"
          >
            <i className="fas fa-pen" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="list-item-action-btn delete"
            onClick={() => runAction(() => deleteListItem(list.id, item.id), 'Could not delete item. Please try again.')}
            aria-label="Delete item"
            title="Delete item"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </li>
    );
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
            type="button"
            id="add-list-btn"
            onClick={handleToggleAddForm}
            className="toolbar-btn primary"
          >
            <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`} aria-hidden="true"></i>
            <span>{showAddForm ? 'Cancel' : 'New List'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="lists-error-alert" role="alert">
            <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
            <span>{errorMsg}</span>
            <button
              type="button"
              className="lists-error-dismiss"
              aria-label="Dismiss error"
              onClick={() => setErrorMsg('')}
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {showAddForm && (
          <form
            onSubmit={handleAddList}
            className="add-item-form lists-create-form"
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleToggleAddForm();
            }}
          >
            <input
              type="text"
              className="add-input lists-create-title-input"
              placeholder="List Title..."
              aria-label="List title"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              autoFocus
            />
            <select
              className="lists-type-select"
              aria-label="List type"
              value={newListType}
              onChange={(e) => setNewListType(e.target.value)}
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
          <div className="lists-loading">Loading lists...</div>
        ) : lists.length === 0 ? (
          <div className="lists-empty-state">
            <i className="fas fa-list" aria-hidden="true"></i>
            <h3>No lists yet</h3>
            <p>Create your first list to get started</p>
          </div>
        ) : (
          <div id="lists-grid" className="lists-grid">
            {lists.map(list => {
              const isSelected = selectedListId === list.id;
              const isCheckable = list.type !== 'numbered' && list.type !== 'bulleted';
              const activeItems = isCheckable ? list.items.filter(i => !i.completed) : list.items;
              const completedItems = isCheckable ? list.items.filter(i => i.completed) : [];
              const draftText = newItemTexts[list.id] || '';

              return (
                <div
                  key={list.id}
                  className={`list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedListId(isSelected ? null : list.id)}
                >
                  <div className="list-card-header-top">
                    <div className="list-card-title-group">
                      <i className={`fas ${getListIcon(list.type)} list-card-icon`} aria-hidden="true"></i>
                      {editingListId === list.id ? (
                        <form
                          className="list-rename-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            commitRenameList(list);
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            className="list-rename-input"
                            aria-label="Edit list title"
                            value={editingListTitle}
                            onChange={(e) => setEditingListTitle(e.target.value)}
                            onBlur={() => commitRenameList(list)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.stopPropagation();
                                setEditingListId(null);
                              }
                            }}
                            autoFocus
                          />
                        </form>
                      ) : (
                        <h3 className="list-card-heading">{list.title}</h3>
                      )}
                    </div>
                    <div className="list-card-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="rename-list-btn"
                        onClick={() => startRenameList(list)}
                        aria-label="Rename list"
                        title="Rename list"
                      >
                        <i className="fas fa-pen" aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        className="delete-list-btn"
                        onClick={() => requestDeleteList(list)}
                        aria-label="Delete list"
                        title="Delete list"
                      >
                        <i className="fas fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>

                  <div className="list-items">
                    {list.items.length === 0 ? (
                      <p className="list-empty-hint">Empty list</p>
                    ) : (
                      <>
                        {activeItems.length > 0 && (
                          <ul className="list-items-ul">
                            {activeItems.map((item, idx) => renderListItem(list, item, idx))}
                          </ul>
                        )}
                        {completedItems.length > 0 && (
                          <div className="list-completed-section">
                            <div className="list-completed-divider">
                              Completed ({completedItems.length})
                            </div>
                            <ul className="list-items-ul list-items-completed">
                              {completedItems.map((item, idx) => renderListItem(list, item, idx))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="add-item-row" onClick={e => e.stopPropagation()}>
                    <form className="add-item-inline-form" onSubmit={(e) => handleAddItem(e, list.id)}>
                      <input
                        type="text"
                        className="add-item-input"
                        placeholder="Add an item..."
                        aria-label={`Add an item to ${list.title}`}
                        value={draftText}
                        onChange={(e) => setNewItemTexts(prev => ({ ...prev, [list.id]: e.target.value }))}
                      />
                      <button
                        type="submit"
                        className="add-item-btn"
                        aria-label="Add item"
                        disabled={!draftText.trim()}
                      >
                        <i className="fas fa-plus" aria-hidden="true"></i>
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmDialog)}
        title="Delete List"
        message={confirmDialog?.message || ''}
        confirmLabel="Yes"
        cancelLabel="No"
        isDanger
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </>
  );
}
