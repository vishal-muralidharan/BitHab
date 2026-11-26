import { useEffect, useState } from 'react';
import { useLists } from '../context/ListContext';
import ConfirmModal from '../components/common/ConfirmModal';

const LIST_TYPES = [
  { value: 'checklist', label: 'Checklist', icon: 'fa-check-square' },
  { value: 'todo', label: 'Todo List', icon: 'fa-list-check' },
  { value: 'numbered', label: 'Numbered', icon: 'fa-list-ol' },
  { value: 'bulleted', label: 'Bulleted', icon: 'fa-list-ul' }
];

function getListTypeInfo(type) {
  return LIST_TYPES.find(t => t.value === type) || LIST_TYPES[0];
}

function getListSummary(list) {
  const { label } = getListTypeInfo(list.type);
  const total = list.items.length;
  if (total === 0) return `${label} · Empty list`;

  const isCheckable = list.type !== 'numbered' && list.type !== 'bulleted';
  if (!isCheckable) {
    return `${label} · ${total} ${total === 1 ? 'item' : 'items'}`;
  }

  const completedCount = list.items.filter(item => item.completed).length;
  const activeCount = total - completedCount;
  if (completedCount === 0) {
    return `${label} · ${activeCount} ${activeCount === 1 ? 'item' : 'items'}`;
  }
  return `${label} · ${activeCount} left · ${completedCount} done`;
}

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
  const [activeListId, setActiveListId] = useState(null);
  const [modalTitleDraft, setModalTitleDraft] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const activeList = lists.find(list => list.id === activeListId) || null;

  useEffect(() => {
    if (!activeList || confirmDialog || editingItem) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveListId(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeList, confirmDialog, editingItem]);

  const runAction = async (fn, fallbackMessage) => {
    setErrorMsg('');
    try {
      await fn();
    } catch {
      setErrorMsg(fallbackMessage);
    }
  };

  const openListModal = (list) => {
    setErrorMsg('');
    setEditingItem(null);
    setModalTitleDraft(list.title);
    setActiveListId(list.id);
  };

  const closeListModal = () => {
    setEditingItem(null);
    setActiveListId(null);
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

  const commitModalTitle = (list) => {
    const trimmed = modalTitleDraft.trim();
    if (!trimmed) {
      setModalTitleDraft(list.title);
      return;
    }
    if (trimmed === list.title) return;
    setModalTitleDraft(trimmed);
    runAction(() => updateList(list.id, { title: trimmed }), 'Could not rename list. Please try again.');
  };

  const handleChangeListType = (list, nextType) => {
    if (list.type === nextType) return;
    runAction(() => updateList(list.id, { type: nextType }), 'Could not change list type. Please try again.');
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
        setActiveListId(prev => (prev === targetId ? null : prev));
        runAction(() => deleteList(targetId), 'Could not delete list. Please try again.');
      }
    });
  };

  const renderErrorAlert = () => (
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
  );

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
          <label className="list-item-label">
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
          <span className="list-item-text">{item.text}</span>
        )}

        <div className="list-item-controls">
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

  const activeIsCheckable = activeList
    ? activeList.type !== 'numbered' && activeList.type !== 'bulleted'
    : true;
  const activeModalItems = activeList
    ? (activeIsCheckable ? activeList.items.filter(i => !i.completed) : activeList.items)
    : [];
  const completedModalItems = activeList && activeIsCheckable
    ? activeList.items.filter(i => i.completed)
    : [];
  const activeDraftText = activeList ? (newItemTexts[activeList.id] || '') : '';

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

        {!activeList && errorMsg && renderErrorAlert()}

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
              {LIST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
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
              const typeInfo = getListTypeInfo(list.type);

              return (
                <div key={list.id} className="list-card">
                  <button
                    type="button"
                    className="list-card-open-btn"
                    aria-label={`Open ${list.title}`}
                    onClick={() => openListModal(list)}
                  >
                    <i className={`fas ${typeInfo.icon} list-card-icon`} aria-hidden="true"></i>
                    <div className="list-card-heading-block">
                      <h3 className="list-card-heading">{list.title}</h3>
                      <p className="list-card-summary">{getListSummary(list)}</p>
                    </div>
                  </button>
                  <div className="list-card-actions">
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
              );
            })}
          </div>
        )}
      </div>

      {activeList && (
        <div
          className="custom-modal-overlay show"
          onClick={closeListModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${activeList.title}`}
        >
          <div
            className="custom-modal list-editor-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="list-editor-header">
              <div className="list-editor-header-row">
                <i className={`fas ${getListTypeInfo(activeList.type).icon} list-card-icon`} aria-hidden="true"></i>
                <form
                  className="list-editor-title-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitModalTitle(activeList);
                  }}
                >
                  <input
                    type="text"
                    className="list-editor-title-input"
                    aria-label="Edit list title"
                    value={modalTitleDraft}
                    onChange={(e) => setModalTitleDraft(e.target.value)}
                    onBlur={() => commitModalTitle(activeList)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setModalTitleDraft(activeList.title);
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </form>
                <button
                  type="button"
                  className="list-editor-close-btn"
                  aria-label="Close list editor"
                  onClick={closeListModal}
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="list-type-selector" role="group" aria-label="List type options">
                {LIST_TYPES.map(typeOption => {
                  const isActive = activeList.type === typeOption.value;
                  return (
                    <button
                      key={typeOption.value}
                      type="button"
                      className={`list-type-btn ${isActive ? 'active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => handleChangeListType(activeList, typeOption.value)}
                    >
                      <i className={`fas ${typeOption.icon}`} aria-hidden="true"></i>
                      <span>{typeOption.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && renderErrorAlert()}

            <div className="list-editor-body">
              <div className="list-items">
                {activeList.items.length === 0 ? (
                  <p className="list-empty-hint">Empty list</p>
                ) : (
                  <>
                    {activeModalItems.length > 0 && (
                      <ul className="list-items-ul">
                        {activeModalItems.map((item, idx) => renderListItem(activeList, item, idx))}
                      </ul>
                    )}
                    {completedModalItems.length > 0 && (
                      <div className="list-completed-section">
                        <div className="list-completed-divider">
                          Completed ({completedModalItems.length})
                        </div>
                        <ul className="list-items-ul list-items-completed">
                          {completedModalItems.map((item, idx) => renderListItem(activeList, item, idx))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="list-editor-add-row">
              <form className="add-item-inline-form" onSubmit={(e) => handleAddItem(e, activeList.id)}>
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="Add an item..."
                  aria-label={`Add an item to ${activeList.title}`}
                  value={activeDraftText}
                  onChange={(e) => setNewItemTexts(prev => ({ ...prev, [activeList.id]: e.target.value }))}
                />
                <button
                  type="submit"
                  className="add-item-btn"
                  aria-label="Add item"
                  disabled={!activeDraftText.trim()}
                >
                  <i className="fas fa-plus" aria-hidden="true"></i>
                </button>
              </form>
            </div>

            <div className="list-editor-footer">
              <button
                type="button"
                className="custom-modal-btn custom-modal-btn-danger"
                onClick={() => requestDeleteList(activeList)}
              >
                Delete List
              </button>
              <button
                type="button"
                className="custom-modal-btn custom-modal-btn-primary"
                onClick={closeListModal}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
