document.addEventListener('DOMContentLoaded', async () => {
    const listsGrid = document.getElementById('lists-grid');
    const addListBtn = document.getElementById('add-list-btn');
    const listEditorModal = document.getElementById('list-editor-modal');
    const listTitleInput = document.getElementById('list-title-input');
    const listItemsContainer = document.getElementById('list-items-container');
    const addItemInput = document.getElementById('add-item-input');
    const addItemBtn = document.getElementById('add-item-btn');
    const saveListBtn = document.getElementById('save-list-btn');
    const cancelListBtn = document.getElementById('cancel-list-btn');
    const deleteListBtn = document.getElementById('delete-list-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    let state = {
        lists: []
    };
    let currentList = null;
    let currentListType = 'checklist';
    let draggedItem = null;
    let confirmationAction = null;

    const { setupAuth, waitForUserId } = window.AuthManager;
    let userId = null;
    let db = null;

    const showConfirmation = (message, action) => {
        confirmationMessage.textContent = message;
        confirmationAction = action;
        confirmationModal.classList.remove('hidden');
    };

    const saveState = async () => {
        if (!userId || !db) return;
        try {
            await db.collection('users').doc(userId).set({
                lists: state.lists
            }, { merge: true });
        } catch (error) {
            console.error('Error saving lists:', error);
        }
    };

    const loadState = async () => {
        if (!userId || !db) return;
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                state.lists = data.lists || [];
            }
        } catch (error) {
            console.error('Error loading lists:', error);
        }
    };

    const getListIcon = (type) => {
        const icons = {
            checklist: 'fa-check-square',
            todo: 'fa-list-check',
            numbered: 'fa-list-ol',
            bulleted: 'fa-list-ul'
        };
        return icons[type] || 'fa-list';
    };

    const renderLists = () => {
        if (state.lists.length === 0) {
            listsGrid.innerHTML = `
                <div class="lists-empty-state">
                    <i class="fas fa-list"></i>
                    <h3>No lists yet</h3>
                    <p>Create your first list to get started</p>
                </div>
            `;
            return;
        }

        listsGrid.innerHTML = '';
        state.lists.forEach(list => {
            const card = document.createElement('div');
            card.className = 'list-card';
            card.dataset.listId = list.id;

            const completedCount = list.items.filter(item => item.completed).length;
            const totalCount = list.items.length;
            const previewItems = list.items.slice(0, 3);

            card.innerHTML = `
                <div class="list-card-header">
                    <i class="fas ${getListIcon(list.type)} list-icon"></i>
                    <div class="list-card-title">${list.title || 'Untitled List'}</div>
                </div>
                <div class="list-card-body">
                    ${previewItems.map((item, index) => {
                        const prefix = list.type === 'numbered' ? `${index + 1}.` :
                                     list.type === 'bulleted' ? '•' : '';
                        return `
                            <div class="list-preview-item ${item.completed ? 'completed' : ''}">
                                ${list.type === 'checklist' || list.type === 'todo' ? 
                                    `<i class="fas ${item.completed ? 'fa-check-square' : 'fa-square'}" style="color: ${item.completed ? 'var(--accent-primary)' : 'var(--text-secondary)'}"></i>` : 
                                    `<span style="margin-right: 0.5rem;">${prefix}</span>`
                                }
                                <span>${item.text}</span>
                            </div>
                        `;
                    }).join('')}
                    ${list.items.length > 3 ? `<div class="list-preview-item" style="opacity: 0.5;">+ ${list.items.length - 3} more</div>` : ''}
                </div>
                <div class="list-card-footer">
                    <div class="list-stats">
                        <span><i class="fas fa-list"></i> ${totalCount} items</span>
                        ${(list.type === 'checklist' || list.type === 'todo') ? `<span><i class="fas fa-check"></i> ${completedCount}/${totalCount}</span>` : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openList(list.id));
            listsGrid.appendChild(card);
        });
    };

    const renderListItems = () => {
        if (!currentList) return;

        listItemsContainer.innerHTML = '';
        currentList.items.forEach((item, index) => {
            const itemEl = createListItemElement(item, index);
            listItemsContainer.appendChild(itemEl);

            // Render sub-items if any
            if (item.subItems && item.subItems.length > 0) {
                const subContainer = document.createElement('div');
                subContainer.className = 'sub-items-container';
                item.subItems.forEach(subItem => {
                    const subEl = createSubItemElement(subItem, item.id);
                    subContainer.appendChild(subEl);
                });
                itemEl.querySelector('.item-content').appendChild(subContainer);
            }
        });
    };

    const createListItemElement = (item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'list-item';
        itemEl.dataset.itemId = item.id;
        itemEl.draggable = true;

        let prefix = '';
        if (currentListType === 'numbered') {
            prefix = `<span class="item-number">${index + 1}.</span>`;
        } else if (currentListType === 'bulleted') {
            prefix = `<span class="item-bullet">•</span>`;
        } else if (currentListType === 'checklist' || currentListType === 'todo') {
            prefix = `<i class="fas ${item.completed ? 'fa-check-square' : 'fa-square'} item-checkbox ${item.completed ? 'checked' : ''}" data-item-id="${item.id}"></i>`;
        }

        itemEl.innerHTML = `
            <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
            ${prefix}
            <div class="item-content">
                <input type="text" class="item-text-input ${item.completed ? 'completed' : ''}" value="${item.text}" data-item-id="${item.id}" />
                <button class="item-action-btn delete" data-item-id="${item.id}" title="Delete" style="margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="sub-add-row" data-parent-id="${item.id}" style="display: flex; align-items: center; gap: 0.5rem; margin-left: 2rem; margin-top: 0.5rem;">
                <input type="text" class="sub-add-input" placeholder="Add sub-item..." style="flex: 1;" />
            </div>
        `;

        // Drag events
        itemEl.addEventListener('dragstart', handleDragStart);
        itemEl.addEventListener('dragend', handleDragEnd);
        itemEl.addEventListener('dragover', handleDragOver);
        itemEl.addEventListener('drop', handleDrop);

        // Checkbox toggle
        const checkbox = itemEl.querySelector('.item-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', () => toggleItemCompletion(item.id));
        }

        // Text input
        const textInput = itemEl.querySelector('.item-text-input');
        textInput.addEventListener('blur', () => updateItemText(item.id, textInput.value));
        textInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                textInput.blur();
                addNewItem();
            }
        });

        // Actions
        itemEl.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteItem(item.id);
        });

        const subAddInput = itemEl.querySelector('.sub-add-input');
        if (subAddInput) {
            subAddInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    const text = subAddInput.value.trim();
                    if (text) {
                        // Ensure subItems array exists
                        const parent = currentList.items.find(i => i.id === item.id);
                        if (parent) {
                            if (!parent.subItems) parent.subItems = [];
                            parent.subItems.push({
                                id: `sub_${Date.now()}_${Math.random()}`,
                                text,
                                completed: false
                            });
                            subAddInput.value = '';
                            renderListItems();
                        }
                    }
                }
            });
        }

        return itemEl;
    };

    const createSubItemElement = (subItem, parentId) => {
        const subEl = document.createElement('div');
        subEl.className = 'sub-item';
        subEl.dataset.subItemId = subItem.id;

        let prefix = '';
        if (currentListType === 'checklist' || currentListType === 'todo') {
            prefix = `<i class="fas ${subItem.completed ? 'fa-check-square' : 'fa-square'} item-checkbox ${subItem.completed ? 'checked' : ''}" style="cursor: pointer;"></i>`;
        } else {
            prefix = `<span style="color: var(--accent-primary);">◦</span>`;
        }

        subEl.innerHTML = `
            ${prefix}
            <input type="text" class="item-text-input ${subItem.completed ? 'completed' : ''}" value="${subItem.text}" style="font-size: 0.9rem;" />
            <button class="item-action-btn delete" style="margin-left: auto;">
                <i class="fas fa-times"></i>
            </button>
        `;

        const checkbox = subEl.querySelector('.item-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', () => toggleSubItemCompletion(parentId, subItem.id));
        }

        const textInput = subEl.querySelector('.item-text-input');
        textInput.addEventListener('blur', () => updateSubItemText(parentId, subItem.id, textInput.value));

        subEl.querySelector('.delete').addEventListener('click', () => deleteSubItem(parentId, subItem.id));

        return subEl;
    };

    const handleDragStart = (e) => {
        draggedItem = e.currentTarget;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        draggedItem = null;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const target = e.currentTarget;
        if (target !== draggedItem && target.classList.contains('list-item')) {
            target.classList.add('drag-over');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const target = e.currentTarget;
        target.classList.remove('drag-over');

        if (draggedItem && target !== draggedItem) {
            const draggedId = draggedItem.dataset.itemId;
            const targetId = target.dataset.itemId;

            const draggedIndex = currentList.items.findIndex(item => item.id === draggedId);
            const targetIndex = currentList.items.findIndex(item => item.id === targetId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [movedItem] = currentList.items.splice(draggedIndex, 1);
                currentList.items.splice(targetIndex, 0, movedItem);
                renderListItems();
            }
        }
    };

    const toggleItemCompletion = (itemId) => {
        const item = currentList.items.find(i => i.id === itemId);
        if (item) {
            item.completed = !item.completed;
            renderListItems();
        }
    };

    const toggleSubItemCompletion = (parentId, subItemId) => {
        const item = currentList.items.find(i => i.id === parentId);
        if (item && item.subItems) {
            const subItem = item.subItems.find(si => si.id === subItemId);
            if (subItem) {
                subItem.completed = !subItem.completed;
                renderListItems();
            }
        }
    };

    const updateItemText = (itemId, text) => {
        const item = currentList.items.find(i => i.id === itemId);
        if (item) {
            item.text = text.trim();
        }
    };

    const updateSubItemText = (parentId, subItemId, text) => {
        const item = currentList.items.find(i => i.id === parentId);
        if (item && item.subItems) {
            const subItem = item.subItems.find(si => si.id === subItemId);
            if (subItem) {
                subItem.text = text.trim();
            }
        }
    };

    const deleteItem = (itemId) => {
        currentList.items = currentList.items.filter(i => i.id !== itemId);
        renderListItems();
    };

    const addSubItem = (parentId) => {
        const item = currentList.items.find(i => i.id === parentId);
        if (item) {
            if (!item.subItems) item.subItems = [];
            item.subItems.push({
                id: `sub_${Date.now()}_${Math.random()}`,
                text: 'New sub-item',
                completed: false
            });
            renderListItems();
        }
    };

    const deleteSubItem = (parentId, subItemId) => {
        const item = currentList.items.find(i => i.id === parentId);
        if (item && item.subItems) {
            item.subItems = item.subItems.filter(si => si.id !== subItemId);
            renderListItems();
        }
    };

    const addNewItem = () => {
        const text = addItemInput.value.trim();
        if (!text) return;

        currentList.items.push({
            id: `item_${Date.now()}_${Math.random()}`,
            text: text,
            completed: false,
            subItems: []
        });

        addItemInput.value = '';
        renderListItems();
    };

    const openList = (listId) => {
        currentList = state.lists.find(l => l.id === listId);
        if (!currentList) return;

        currentListType = currentList.type;
        listTitleInput.value = currentList.title;

        // Update type selector
        document.querySelectorAll('.list-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === currentListType);
        });

        renderListItems();
        deleteListBtn.style.display = 'block';
        listEditorModal.classList.remove('hidden');
    };

    const createNewList = () => {
        currentList = {
            id: `list_${Date.now()}`,
            title: '',
            type: 'checklist',
            items: [],
            createdAt: Date.now()
        };
        currentListType = 'checklist';
        listTitleInput.value = '';
        listItemsContainer.innerHTML = '';
        addItemInput.value = '';

        document.querySelectorAll('.list-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'checklist');
        });

        deleteListBtn.style.display = 'none';
        listEditorModal.classList.remove('hidden');
    };

    const saveCurrentList = async () => {
        if (!currentList) return;

        currentList.title = listTitleInput.value.trim() || 'Untitled List';
        currentList.type = currentListType;
        currentList.updatedAt = Date.now();

        const existingIndex = state.lists.findIndex(l => l.id === currentList.id);
        if (existingIndex >= 0) {
            state.lists[existingIndex] = currentList;
        } else {
            state.lists.push(currentList);
        }

        await saveState();
        renderLists();
        listEditorModal.classList.add('hidden');
        currentList = null;
    };

    const deleteCurrentList = () => {
        if (!currentList) return;

        showConfirmation(`Delete list "${currentList.title}"?`, async () => {
            state.lists = state.lists.filter(l => l.id !== currentList.id);
            await saveState();
            renderLists();
            listEditorModal.classList.add('hidden');
            currentList = null;
        });
    };

    // Event Listeners
    addListBtn.addEventListener('click', createNewList);
    saveListBtn.addEventListener('click', saveCurrentList);
    cancelListBtn.addEventListener('click', () => {
        listEditorModal.classList.add('hidden');
        currentList = null;
    });
    deleteListBtn.addEventListener('click', deleteCurrentList);

    addItemBtn.addEventListener('click', addNewItem);
    addItemInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addNewItem();
    });

    document.querySelectorAll('.list-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentListType = btn.dataset.type;
            document.querySelectorAll('.list-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderListItems();
        });
    });

    confirmYes.addEventListener('click', () => {
        if (confirmationAction) {
            confirmationAction();
            confirmationAction = null;
        }
        confirmationModal.classList.add('hidden');
    });

    confirmNo.addEventListener('click', () => {
        confirmationAction = null;
        confirmationModal.classList.add('hidden');
    });

    // Initialize
    setupAuth(async (uid, database) => {
        userId = uid;
        db = database;
        await loadState();
        renderLists();
    });
});
