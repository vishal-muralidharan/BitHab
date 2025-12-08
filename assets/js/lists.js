document.addEventListener('DOMContentLoaded', async () => {
    const listsGrid = document.getElementById('lists-grid');
    const addListBtn = document.getElementById('add-list-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    let state = {
        lists: [],
        selectedListId: null,
        focusedItemId: null
    };
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

    const getListTypeName = (type) => {
        const names = {
            checklist: 'Checklist',
            todo: 'Todo List',
            numbered: 'Numbered',
            bulleted: 'Bulleted'
        };
        return names[type] || 'List';
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
            const card = createListCard(list);
            listsGrid.appendChild(card);
        });
    };

    const createListCard = (list) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        card.dataset.listId = list.id;
        
        // Add selected class if this is the selected list
        if (state.selectedListId === list.id) {
            card.classList.add('selected');
        }
        
        // Add click handler to select list
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on input fields or buttons
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            // Toggle selection
            if (state.selectedListId === list.id) {
                state.selectedListId = null;
            } else {
                state.selectedListId = list.id;
            }
            renderLists();
        });

        // Header with icon, title, and delete
        const header = document.createElement('div');
        header.className = 'list-card-header-top';
        
        const iconDropdown = document.createElement('div');
        iconDropdown.className = 'list-type-dropdown';
        iconDropdown.innerHTML = `
            <i class="fas ${getListIcon(list.type)} list-icon"></i>
            <div class="list-type-dropdown-content">
                <div class="list-type-option" data-type="checklist">
                    <i class="fas fa-check-square"></i>
                    <span>Checklist</span>
                </div>
                <div class="list-type-option" data-type="todo">
                    <i class="fas fa-list-check"></i>
                    <span>Todo List</span>
                </div>
                <div class="list-type-option" data-type="numbered">
                    <i class="fas fa-list-ol"></i>
                    <span>Numbered</span>
                </div>
                <div class="list-type-option" data-type="bulleted">
                    <i class="fas fa-list-ul"></i>
                    <span>Bulleted</span>
                </div>
            </div>
        `;

        const icon = iconDropdown.querySelector('.list-icon');
        const dropdown = iconDropdown.querySelector('.list-type-dropdown-content');
        
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        iconDropdown.querySelectorAll('.list-type-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newType = option.dataset.type;
                list.type = newType;
                icon.className = `fas ${getListIcon(newType)} list-icon`;
                dropdown.classList.remove('show');
                await saveState();
                renderLists();
            });
        });

        const titleInput = document.createElement('input');
        titleInput.className = 'list-card-title';
        titleInput.value = list.title || '';
        titleInput.placeholder = 'List title...';
        
        titleInput.addEventListener('focus', () => {
            state.selectedListId = list.id;
        });
        
        titleInput.addEventListener('blur', async () => {
            list.title = titleInput.value.trim() || 'Untitled List';
            await saveState();
        });
        
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleInput.blur();
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'list-card-delete';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            showConfirmation(`Delete list "${list.title}"?`, async () => {
                state.lists = state.lists.filter(l => l.id !== list.id);
                await saveState();
                renderLists();
            });
        });

        header.appendChild(iconDropdown);
        header.appendChild(titleInput);
        header.appendChild(deleteBtn);

        // Body with items
        const body = document.createElement('div');
        body.className = 'list-card-body';

        list.items.forEach((item, index) => {
            const itemRow = createItemRow(item, index, list);
            body.appendChild(itemRow);

            // Add sub-items
            if (item.subItems && item.subItems.length > 0) {
                item.subItems.forEach(subItem => {
                    const subRow = createSubItemRow(subItem, item, list);
                    body.appendChild(subRow);
                });
            }

            // Add sub-item input - always render but hide if not focused
            if (state.selectedListId === list.id) {
                const subAddRow = createSubAddRow(item, list);
                if (state.focusedItemId !== item.id) {
                    subAddRow.style.display = 'none';
                }
                body.appendChild(subAddRow);
            }
        });

        // Add item row - only show if list is selected
        if (state.selectedListId === list.id) {
            const addItemRow = createAddItemRow(list);
            body.appendChild(addItemRow);
        }

        card.appendChild(header);
        card.appendChild(body);

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!iconDropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        return card;
    };

    const createItemRow = (item, index, list) => {
        const row = document.createElement('div');
        row.className = 'list-preview-item';
        if (item.completed && list.type === 'checklist') row.classList.add('completed');

        let prefix = '';
        if (list.type === 'numbered') {
            prefix = `<span style="font-weight: 600; color: var(--text-secondary); min-width: 1.5rem; flex-shrink: 0;">${index + 1}.</span>`;
        } else if (list.type === 'bulleted') {
            prefix = `<span style="color: var(--accent-primary); font-weight: bold; flex-shrink: 0;">•</span>`;
        } else if (list.type === 'todo') {
            prefix = `<span style="color: var(--accent-primary); font-weight: bold; flex-shrink: 0; min-width: 1.5rem;">☐</span>`;
        } else if (list.type === 'checklist') {
            const checkbox = document.createElement('i');
            checkbox.className = `fas ${item.completed ? 'fa-check-square' : 'fa-square'} preview-checkbox`;
            checkbox.style.color = item.completed ? 'var(--accent-primary)' : 'var(--text-secondary)';
            checkbox.style.cursor = 'pointer';
            checkbox.addEventListener('click', async (e) => {
                e.stopPropagation();
                item.completed = !item.completed;
                await saveState();
                renderLists();
            });
            row.appendChild(checkbox);
        }

        if (prefix) {
            row.innerHTML += prefix;
        }

        const input = document.createElement('input');
        input.value = item.text;
        input.dataset.itemId = item.id;
        if (item.completed && list.type === 'checklist') input.classList.add('completed');
        
        input.addEventListener('focus', () => {
            state.selectedListId = list.id;
            state.focusedItemId = item.id;
            
            // Show sub-add row for this item
            const card = input.closest('.list-card');
            if (card) {
                // Hide all other sub-add rows in this card
                card.querySelectorAll('.sub-add-row-inline').forEach(row => row.style.display = 'none');
                
                // Show this item's sub-add row
                const nextSubAdd = input.closest('.list-preview-item').nextElementSibling;
                while (nextSubAdd && nextSubAdd.classList.contains('sub-item-row')) {
                    if (nextSubAdd.nextSibling && nextSubAdd.nextSibling.classList?.contains('sub-add-row-inline')) {
                        break;
                    }
                }
                // Find the sub-add row after all sub-items
                let subAddRow = input.closest('.list-preview-item').nextElementSibling;
                while (subAddRow && subAddRow.classList.contains('sub-item-row')) {
                    subAddRow = subAddRow.nextElementSibling;
                }
                if (subAddRow && subAddRow.classList.contains('sub-add-row-inline')) {
                    subAddRow.style.display = 'flex';
                }
            }
        });
        
        input.addEventListener('blur', async () => {
            item.text = input.value.trim();
            if (!item.text) {
                list.items = list.items.filter(i => i.id !== item.id);
            }
            state.focusedItemId = null;
            await saveState();
        });
        
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    item.text = text;
                    await saveState();
                    
                    // Create new item after current one
                    const currentIndex = list.items.findIndex(i => i.id === item.id);
                    const newItem = {
                        id: `item_${Date.now()}_${Math.random()}`,
                        text: '',
                        completed: false,
                        subItems: []
                    };
                    list.items.splice(currentIndex + 1, 0, newItem);
                    await saveState();
                    renderLists();
                    
                    // Focus on new item
                    setTimeout(() => {
                        const newInput = document.querySelector(`input[data-item-id="${newItem.id}"]`);
                        if (newInput) newInput.focus();
                    }, 50);
                }
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'item-delete';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            list.items = list.items.filter(i => i.id !== item.id);
            await saveState();
            renderLists();
        });

        row.appendChild(input);
        row.appendChild(deleteBtn);

        return row;
    };

    const createSubItemRow = (subItem, parentItem, list) => {
        const row = document.createElement('div');
        row.className = 'sub-item-row';
        if (subItem.completed && list.type === 'checklist') row.classList.add('completed');

        if (list.type === 'checklist') {
            const checkbox = document.createElement('i');
            checkbox.className = `fas ${subItem.completed ? 'fa-check-square' : 'fa-square'} preview-checkbox`;
            checkbox.style.color = subItem.completed ? 'var(--accent-primary)' : 'var(--text-secondary)';
            checkbox.style.cursor = 'pointer';
            checkbox.style.flexShrink = '0';
            checkbox.addEventListener('click', async (e) => {
                e.stopPropagation();
                subItem.completed = !subItem.completed;
                await saveState();
                renderLists();
            });
            row.appendChild(checkbox);
        } else if (list.type === 'todo') {
            const bullet = document.createElement('span');
            bullet.textContent = '☐';
            bullet.style.color = 'var(--accent-primary)';
            bullet.style.flexShrink = '0';
            row.appendChild(bullet);
        } else {
            const bullet = document.createElement('span');
            bullet.textContent = '◦';
            bullet.style.color = 'var(--accent-primary)';
            bullet.style.flexShrink = '0';
            row.appendChild(bullet);
        }

        const input = document.createElement('input');
        input.value = subItem.text;
        input.dataset.subItemId = subItem.id;
        if (subItem.completed && list.type === 'checklist') input.classList.add('completed');
        
        input.addEventListener('focus', () => {
            state.selectedListId = list.id;
            state.focusedItemId = parentItem.id;
        });
        
        input.addEventListener('blur', async () => {
            subItem.text = input.value.trim();
            if (!subItem.text) {
                parentItem.subItems = parentItem.subItems.filter(si => si.id !== subItem.id);
            }
            await saveState();
        });
        
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    subItem.text = text;
                    await saveState();
                    
                    // Create new sub-item after current one
                    const currentIndex = parentItem.subItems.findIndex(si => si.id === subItem.id);
                    const newSubItem = {
                        id: `sub_${Date.now()}_${Math.random()}`,
                        text: '',
                        completed: false
                    };
                    parentItem.subItems.splice(currentIndex + 1, 0, newSubItem);
                    await saveState();
                    renderLists();
                    
                    // Focus on new sub-item
                    setTimeout(() => {
                        const newInput = document.querySelector(`input[data-sub-item-id="${newSubItem.id}"]`);
                        if (newInput) newInput.focus();
                    }, 50);
                }
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'item-delete';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            parentItem.subItems = parentItem.subItems.filter(si => si.id !== subItem.id);
            await saveState();
            renderLists();
        });

        row.appendChild(input);
        row.appendChild(deleteBtn);

        return row;
    };

    const createSubAddRow = (parentItem, list) => {
        const row = document.createElement('div');
        row.className = 'sub-add-row-inline';

        const placeholder = document.createElement('span');
        placeholder.style.color = 'var(--text-secondary)';
        placeholder.style.fontSize = '0.85rem';
        placeholder.style.flexShrink = '0';
        placeholder.textContent = '◦';
        row.appendChild(placeholder);

        const input = document.createElement('input');
        input.placeholder = 'Add sub-item...';
        
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    if (!parentItem.subItems) parentItem.subItems = [];
                    const newSubItem = {
                        id: `sub_${Date.now()}_${Math.random()}`,
                        text,
                        completed: false
                    };
                    parentItem.subItems.push(newSubItem);
                    input.value = '';
                    await saveState();
                    renderLists();
                    
                    // Focus on new sub-item
                    setTimeout(() => {
                        const newInput = document.querySelector(`input[data-sub-item-id="${newSubItem.id}"]`);
                        if (newInput) newInput.focus();
                    }, 50);
                }
            }
        });

        row.appendChild(input);

        return row;
    };

    const createAddItemRow = (list) => {
        const row = document.createElement('div');
        row.className = 'list-card-add-item';

        const input = document.createElement('input');
        input.placeholder = 'Add item...';
        input.className = 'add-item-input';
        
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    const newItem = {
                        id: `item_${Date.now()}_${Math.random()}`,
                        text,
                        completed: false,
                        subItems: []
                    };
                    list.items.push(newItem);
                    input.value = '';
                    await saveState();
                    renderLists();
                    
                    // Focus on new item
                    setTimeout(() => {
                        const newInput = document.querySelector(`input[data-item-id="${newItem.id}"]`);
                        if (newInput) newInput.focus();
                    }, 50);
                }
            }
        });

        row.appendChild(input);

        return row;
    };

    const createNewList = async () => {
        const newList = {
            id: `list_${Date.now()}`,
            title: 'New List',
            type: 'checklist',
            items: [],
            createdAt: Date.now()
        };
        state.lists.unshift(newList);
        state.selectedListId = newList.id; // Auto-select new list
        await saveState();
        renderLists();

        // Focus on the new list title
        setTimeout(() => {
            const card = listsGrid.querySelector(`[data-list-id="${newList.id}"]`);
            if (card) {
                const titleInput = card.querySelector('.list-card-title');
                if (titleInput) {
                    titleInput.select();
                }
            }
        }, 100);
    };

    // Event Listeners
    addListBtn.addEventListener('click', createNewList);

    // Click outside lists to deselect
    listsGrid.addEventListener('click', (e) => {
        if (e.target === listsGrid) {
            state.selectedListId = null;
            renderLists();
        }
    });

    // Click on page container to deselect
    document.addEventListener('click', (e) => {
        const clickedInsideList = e.target.closest('.list-card');
        const clickedToolbar = e.target.closest('.lists-toolbar');
        const clickedModal = e.target.closest('.modal');
        
        if (!clickedInsideList && !clickedToolbar && !clickedModal && state.selectedListId) {
            state.selectedListId = null;
            renderLists();
        }
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
