document.addEventListener('DOMContentLoaded', async () => {
    const listsGrid = document.getElementById('lists-grid');
    const addListBtn = document.getElementById('add-list-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    let state = {
        lists: []
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

            // Add sub-item input
            const subAddRow = createSubAddRow(item, list);
            body.appendChild(subAddRow);
        });

        // Add item row
        const addItemRow = createAddItemRow(list);
        body.appendChild(addItemRow);

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
        if (item.completed && list.type === 'checklist') input.classList.add('completed');
        input.addEventListener('blur', async () => {
            item.text = input.value.trim();
            if (!item.text) {
                list.items = list.items.filter(i => i.id !== item.id);
            }
            await saveState();
            renderLists();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
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
        if (subItem.completed && list.type === 'checklist') input.classList.add('completed');
        input.addEventListener('blur', async () => {
            subItem.text = input.value.trim();
            if (!subItem.text) {
                parentItem.subItems = parentItem.subItems.filter(si => si.id !== subItem.id);
            }
            await saveState();
            renderLists();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
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
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    if (!parentItem.subItems) parentItem.subItems = [];
                    parentItem.subItems.push({
                        id: `sub_${Date.now()}_${Math.random()}`,
                        text,
                        completed: false
                    });
                    await saveState();
                    renderLists();
                }
            }
        });

        row.appendChild(input);

        return row;
    };

    const createAddItemRow = (list) => {
        const row = document.createElement('div');
        row.className = 'list-card-add-item';

        const icon = document.createElement('i');
        icon.className = 'fas fa-plus add-icon';
        row.appendChild(icon);

        const input = document.createElement('input');
        input.placeholder = 'Add item...';
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    list.items.push({
                        id: `item_${Date.now()}_${Math.random()}`,
                        text,
                        completed: false,
                        subItems: []
                    });
                    await saveState();
                    renderLists();
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
