document.addEventListener('DOMContentLoaded', () => {
    const state = {
        goals: [], // [{id, name, completed, createdAt, subgoals:[{id,name,completed,createdAt}]}]
        ui: {
            expandedGoals: new Set(),
        },
    };

    const goalList = document.getElementById('goal-list');
    const addGoalInput = document.getElementById('add-goal-input');
    const addGoalBtn = document.getElementById('add-goal-btn');
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    
    // Edit modal elements
    const editGoalModal = document.getElementById('edit-goal-modal');
    const editGoalName = document.getElementById('edit-goal-name');
    const editSubgoalList = document.getElementById('edit-subgoal-list');
    const editAddSubgoalInput = document.getElementById('edit-add-subgoal-input');
    const editAddSubgoalBtn = document.getElementById('edit-add-subgoal-btn');
    const saveGoalEditBtn = document.getElementById('save-goal-edit');
    const cancelGoalEdit = document.getElementById('cancel-goal-edit');

    let userId = null;
    let db;
    let confirmationAction = null;
    let currentEditingGoal = null;
    let currentEditingDraft = null;

    // Show loading immediately
    const showLoading = () => {
        if (goalList) {
            goalList.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.7;">Loading goals...</div>';
        }
    };

    showLoading();

    const showConfirmation = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmationAction = onConfirm;
        confirmationModal.classList.remove('hidden');
    };

    const renderEditSubgoals = () => {
        if (!currentEditingDraft || !editSubgoalList) return;
        const list = currentEditingDraft.subgoals || [];
        if (list.length === 0) {
            editSubgoalList.innerHTML = '<p style="opacity:0.7; padding: 0.25rem 0.5rem;">No subgoals yet.</p>';
            return;
        }
        editSubgoalList.innerHTML = list.map(sg => `
            <div class="subgoal-item ${sg.completed ? 'completed' : ''}" data-id="${sg.id}">
                <label class="subgoal-check">
                    <input type="checkbox" class="edit-toggle-subgoal" data-id="${sg.id}" ${sg.completed ? 'checked' : ''} />
                </label>
                <span class="subgoal-name">${sg.name}</span>
                <div class="subgoal-actions">
                    <button class="edit-subgoal-name-btn" data-id="${sg.id}" aria-label="Edit subgoal"><i class="fas fa-pen"></i></button>
                    <button class="delete-subgoal-modal-btn" data-id="${sg.id}" aria-label="Delete subgoal"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    };

    const enforceGoalCompletionFromSubgoals = (goal) => {
        if (!goal) return;
        if (Array.isArray(goal.subgoals) && goal.subgoals.length > 0) {
            goal.completed = goal.subgoals.every(s => !!s.completed);
        }
    };

    const showEditGoalModal = (goal) => {
        currentEditingGoal = goal;
        // Create a deep draft copy to avoid mutating live state until Save
        currentEditingDraft = JSON.parse(JSON.stringify({
            id: goal.id,
            name: goal.name,
            completed: !!goal.completed,
            subgoals: Array.isArray(goal.subgoals) ? goal.subgoals : []
        }));
        editGoalName.value = currentEditingDraft.name;
        renderEditSubgoals();
        editGoalModal.classList.remove('hidden');
    };

    const hideEditGoalModal = () => {
        editGoalModal.classList.add('hidden');
        currentEditingGoal = null;
        currentEditingDraft = null;
    };

    const saveState = async () => {
        if (!userId) {
            console.warn('Cannot save goals: userId is null');
            return;
        }
        console.log('Saving goals:', state.goals);
        try {
            // Convert Set to Array for storage
            const expandedGoalsArray = state.ui?.expandedGoals ? Array.from(state.ui.expandedGoals) : [];
            
            // Save using direct Firestore update with merge
            await db.collection('users').doc(userId).set({
                goals: state.goals,
                goalsUI: {
                    expandedGoals: expandedGoalsArray
                },
                lastUpdated: Date.now(),
                lastUpdatedBy: 'goals_page'
            }, { merge: true });
            
            console.log('Goals successfully saved to Firebase');
            
            // Notify data sync
            if (window.BitHabDataSync) {
                window.BitHabDataSync.notifyListeners('data_saved', {
                    goals: state.goals,
                    lastUpdatedBy: 'goals_page'
                });
            }
        } catch (e) {
            console.error("Error saving goals:", e);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Firebase Save Error',
                    message: 'Could not save goals to the server. Please try again.',
                    details: e.message,
                    type: 'error'
                });
            }
        }
    };

    const loadState = async () => {
        if (!userId) {
            console.warn('Cannot load goals: userId is null');
            return;
        }
        console.log('Loading goals for user:', userId);
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const loadedData = doc.data();
                state.goals = loadedData.goals || [];
                
                // Load UI state and convert Array back to Set
                if (!state.ui) state.ui = { expandedGoals: new Set() };
                if (loadedData.goalsUI && Array.isArray(loadedData.goalsUI.expandedGoals)) {
                    state.ui.expandedGoals = new Set(loadedData.goalsUI.expandedGoals);
                } else {
                    state.ui.expandedGoals = new Set();
                }
                
                console.log('Goals loaded from Firebase:', state.goals);
                console.log('UI state loaded:', { expandedGoals: Array.from(state.ui.expandedGoals) });
            } else {
                console.warn('User document does not exist, creating empty goals array');
                state.goals = [];
                if (!state.ui) state.ui = { expandedGoals: new Set() };
            }
        } catch (e) {
            console.error("Error loading goals:", e);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Firebase Load Error',
                    message: 'Failed to load goals from the cloud. Using local data.',
                    details: e.message || 'Unknown error occurred while loading from Firebase',
                    type: 'warning'
                });
            }
        }
    };

    const renderGoals = () => {
        goalList.innerHTML = '';
        const completedGoalList = document.getElementById('completed-goal-list');
        const toggleCompletedBtn = document.getElementById('toggle-completed-goals');
        
        if (completedGoalList) {
            completedGoalList.innerHTML = '';
        }
        
        const activeGoals = state.goals.filter(g => !g.completed);
        const completedGoals = state.goals.filter(g => g.completed);
        
        // Update toggle button visibility
        if (toggleCompletedBtn) {
            toggleCompletedBtn.style.display = completedGoals.length > 0 ? 'flex' : 'none';
        }
        
        if (activeGoals.length === 0 && completedGoals.length === 0) {
            goalList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Add a goal to get started.</p>';
            return;
        }
        
        if (activeGoals.length === 0) {
            goalList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">All goals completed! 🎉</p>';
        }
        
        // Render active goals
        activeGoals.forEach(goal => {
            renderGoalItem(goal, goalList);
        });
        
        // Render completed goals
        if (completedGoalList) {
            completedGoals.forEach(goal => {
                renderGoalItem(goal, completedGoalList);
            });
        }
    };
    
    const renderGoalItem = (goal, targetList) => {
            // Ensure subgoals array exists and has proper structure
            if (!Array.isArray(goal.subgoals)) {
                goal.subgoals = [];
            }
            // Ensure each subgoal has required fields
            goal.subgoals = goal.subgoals.map(sg => ({
                id: sg.id || `sub_${Date.now()}_${Math.random()}`,
                name: sg.name || 'Unnamed subgoal',
                completed: !!sg.completed,
                createdAt: sg.createdAt || Date.now()
            }));

            // Ensure UI state exists
            if (!state.ui) state.ui = { expandedGoals: new Set() };
            if (!state.ui.expandedGoals) state.ui.expandedGoals = new Set();
            
            const isExpanded = state.ui.expandedGoals.has(goal.id);
            const hasSubgoals = isExpanded && (goal.subgoals.length > 0 || isExpanded);
            const goalItem = document.createElement('li');
            let stateClass = '';
            if (goal.completed) stateClass = 'completed';
            else if (goal.status === 'in-progress' || goal.progress > 0) stateClass = 'in-progress';
            else stateClass = 'pending';

            goalItem.className = hasSubgoals ? `goal-with-subgoals ${stateClass}` : `goal-item ${stateClass}`;
            goalItem.dataset.id = goal.id;
            
            let subgoalsHtml = '';
            if (goal.subgoals.length > 0) {
                subgoalsHtml = `
                    <ul class="sub-goal-list">
                        ${goal.subgoals.map(sg => `
                            <li class="sub-goal-item ${sg.completed ? 'completed' : ''}" data-id="${sg.id}" data-parent="${goal.id}">
                                <div style="display: flex; align-items: center; gap: 0.5em; flex: 1;">
                                    <span class="${sg.completed ? 'completed-text' : ''}">${sg.name}</span>
                                </div>
                                <div class="activity-actions">
                                    <button class="edit-btn edit-subgoal-btn" data-id="${sg.id}" data-parent="${goal.id}" aria-label="Edit subgoal">
                                        <i class="fas fa-pen" aria-hidden="true"></i>
                                    </button>
                                    <button class="remove-btn delete-subgoal-btn" data-id="${sg.id}" data-parent="${goal.id}" aria-label="Delete subgoal">
                                        <i class="fas fa-trash" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                `;
            }

            let subAddRowHtml = '';
            if (isExpanded) {
                subAddRowHtml = `
                    <div class="sub-add-row">
                        <input type="text" class="add-subgoal-input" data-parent="${goal.id}" placeholder="Add subgoal" />
                        <button class="add-btn sub-add-btn add-subgoal-btn" data-parent="${goal.id}" aria-label="Add subgoal">&#10148;</button>
                    </div>
                `;
            }

            goalItem.innerHTML = `
                <div class="goal-main">
                    <div style="display: flex; align-items: center; gap: 0.5em; flex: 1;">
                        <span class="goal-caret" style="cursor: pointer; user-select: none; padding: 0.25rem;">${isExpanded ? '▼' : '►'}</span>
                        <span class="goal-name-text" style="cursor: pointer; flex: 1;">${goal.name}</span>
                    </div>
                    <div class="activity-actions">
                        <button class="edit-btn edit-goal-btn" data-id="${goal.id}" aria-label="Edit goal">
                            <i class="fas fa-pen" aria-hidden="true"></i>
                        </button>
                        <button class="remove-btn delete-btn" data-id="${goal.id}" aria-label="Delete goal">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Append subgoals and add row as child elements inside the goal box
            if (isExpanded) {
                if (goal.subgoals.length > 0) {
                    const subgoalContainer = document.createElement('div');
                    subgoalContainer.className = 'subgoal-container';
                    subgoalContainer.dataset.goalId = goal.id;
                    subgoalContainer.innerHTML = subgoalsHtml;
                    goalItem.appendChild(subgoalContainer);
                }
                
                const addRowContainer = document.createElement('div');
                addRowContainer.className = 'subgoal-add-container';
                addRowContainer.dataset.goalId = goal.id;
                addRowContainer.innerHTML = subAddRowHtml;
                goalItem.appendChild(addRowContainer);
            }
            
            targetList.appendChild(goalItem);
    };

    const handleGoalActions = (e) => {
        const target = e.target;
        
        // Handle Enter key on add subgoal input
        if (e.type === 'keyup' && e.key === 'Enter' && target.classList.contains('add-subgoal-input')) {
            const container = target.closest('.subgoal-add-container');
            if (container && container.dataset.goalId) {
                const goal = state.goals.find(g => g.id === container.dataset.goalId);
                if (goal) {
                    const name = target.value.trim();
                    if (name) {
                        goal.subgoals = goal.subgoals || [];
                        goal.subgoals.push({ id: `sub_${Date.now()}`, name, completed: false, createdAt: Date.now() });
                        target.value = '';
                        enforceGoalCompletionFromSubgoals(goal);
                        saveState();
                        renderGoals();
                    }
                }
            }
            return;
        }
        
        const goalItem = target.closest('.goal-item, .goal-with-subgoals');
        if (goalItem) {
            const goalId = goalItem.dataset.id;
            const goal = state.goals.find(g => g.id === goalId);
            if (goal) {
                const editBtn = target.closest('.edit-goal-btn');
                const removeBtn = target.closest('.remove-btn');
                const expandBtn = target.closest('.expand-btn');
                const addSubBtn = target.closest('.add-subgoal-btn');
                const toggleSub = target.closest('.toggle-subgoal');
                const editSubBtn = target.closest('.edit-subgoal-btn');
                const deleteSubBtn = target.closest('.delete-subgoal-btn');

                if (editBtn) {
                    e.stopPropagation();
                    showEditGoalModal(goal);
                } else if (removeBtn) {
                    e.stopPropagation();
                    showConfirmation(`Are you sure you want to delete goal "${goal.name}"?`, () => {
                        state.goals = state.goals.filter(g => g.id !== goalId);
                        saveState();
                        renderGoals();
                    });
                } else if (target.closest('.goal-caret')) {
                    // Toggle expand/collapse on clicking the caret
                    e.stopPropagation();
                    if (state.ui.expandedGoals.has(goalId)) {
                        state.ui.expandedGoals.delete(goalId);
                    } else {
                        state.ui.expandedGoals.add(goalId);
                    }
                    saveState();
                    renderGoals();
                    return;
                } else if (target.closest('.goal-name-text')) {
                    // Toggle goal completion on clicking goal name
                    e.stopPropagation();
                    const wasCompleted = goal.completed;
                    if (goal.subgoals && goal.subgoals.length > 0) {
                        const allDone = goal.subgoals.every(s => !!s.completed);
                        const next = !allDone;
                        goal.subgoals.forEach(s => { s.completed = next; });
                        goal.completed = next;
                    } else {
                        goal.completed = !goal.completed;
                    }
                    
                    // Add animation when marking complete/incomplete
                    if (wasCompleted !== goal.completed) {
                        goalItem.classList.add('completing');
                        setTimeout(() => {
                            saveState();
                            renderGoals();
                        }, 300);
                    } else {
                        saveState();
                        renderGoals();
                    }
                    return;
                } else if (addSubBtn) {
                    e.stopPropagation();
                    const container = target.closest('.subgoal-add-container');
                    const input = container ? container.querySelector('.add-subgoal-input') : null;
                    if (!input) return;
                    const name = input.value.trim();
                    if (!name) return;
                    goal.subgoals = goal.subgoals || [];
                    goal.subgoals.push({ id: `sub_${Date.now()}`, name, completed: false, createdAt: Date.now() });
                    input.value = '';
                    enforceGoalCompletionFromSubgoals(goal);
                    saveState();
                    renderGoals();
                    return;
                } else if (target.closest('.sub-goal-item') && !editSubBtn && !deleteSubBtn) {
                    // Toggle subgoal completion by clicking on the item
                    e.stopPropagation();
                    const subItem = target.closest('.sub-goal-item');
                    const subId = subItem.dataset.id;
                    const sg = (goal.subgoals || []).find(s => s.id === subId);
                    if (sg) {
                        sg.completed = !sg.completed;
                        enforceGoalCompletionFromSubgoals(goal);
                        saveState();
                        renderGoals();
                    }
                    return;
                } else if (editSubBtn) {
                    e.stopPropagation();
                    const subId = editSubBtn.dataset.id;
                    const sg = (goal.subgoals || []).find(s => s.id === subId);
                    if (sg) {
                        const newName = prompt('Edit subgoal name', sg.name) || '';
                        const trimmed = newName.trim();
                        if (trimmed) {
                            sg.name = trimmed;
                            saveState();
                            renderGoals();
                        }
                    }
                } else if (deleteSubBtn) {
                    e.stopPropagation();
                    const subId = deleteSubBtn.dataset.id;
                    showConfirmation('Delete this subgoal?', () => {
                        goal.subgoals = (goal.subgoals || []).filter(s => s.id !== subId);
                        enforceGoalCompletionFromSubgoals(goal);
                        saveState();
                        renderGoals();
                    });
                }
            }
        }
    };

    const initApp = async () => {
        await loadState();
        renderGoals();
        if(logoutBtnSidebar) logoutBtnSidebar.classList.remove('hidden');
    };

    const saveGoalEdit = async () => {
        if (!currentEditingGoal) return;
        
        const newName = editGoalName.value.trim();
        if (!newName) {
            errorHandler.showErrorDialog({
                title: 'Invalid Goal Name',
                message: 'Please enter a valid goal name.',
                type: 'validation'
            });
            return;
        }

        // Update draft name
        currentEditingDraft.name = newName;
        // Enforce completion rule from subgoals on draft
        enforceGoalCompletionFromSubgoals(currentEditingDraft);

        // Apply draft to live goal
        currentEditingGoal.name = currentEditingDraft.name;
        currentEditingGoal.subgoals = Array.isArray(currentEditingDraft.subgoals) ? currentEditingDraft.subgoals : [];
        currentEditingGoal.completed = !!currentEditingDraft.completed;
        
        try {
            await saveState();
            renderGoals();
            hideEditGoalModal();
        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Save Error',
                message: 'Failed to save changes. Please try again.',
                details: error.message || 'Unknown error occurred while saving goal',
                type: 'error',
                onRetry: saveGoalEdit
            });
        }
    };

    const setupAuth = () => {
        db = firebase.firestore();
        if(logoutBtnSidebar) {
            logoutBtnSidebar.addEventListener('click', () => {
                showConfirmation('Are you sure you want to logout?', () => {
                    firebase.auth().signOut();
                });
            });
        }

        // Use authManager for faster initialization
        authManager.onAuthStateChange(user => {
            if (user) {
                userId = user.uid;
                db = firebase.firestore();
                
                // Initialize DatabaseService
                if (window.DatabaseService) {
                    window.DatabaseService.init(userId, db);
                }
                
                // Initialize data sync system
                if (window.BitHabDataSync) {
                    window.BitHabDataSync.init(userId, db);
                    
                    // Add listener for data updates from other pages
                    window.BitHabDataSync.addListener((event, data) => {
                        try {
                            if (event === 'data_updated' && data.lastUpdatedBy !== 'goals_page') {
                                console.log('Data updated from another page, refreshing goals...');
                                if (data.goals) {
                                    state.goals = data.goals;
                                    renderGoals();
                                }
                            }
                        } catch (error) {
                            console.warn('Data sync listener error:', error);
                        }
                    });
                }
                
                initApp();
            } else {
                userId = null;
                // Auth manager will handle redirect
            }
        });
        
        // Refresh goals when window gets focus
        window.addEventListener('focus', async () => {
            if (userId) {
                console.log('Window focused, reloading goals...');
                try {
                    await loadState();
                    renderGoals();
                } catch (error) {
                    console.error('Error reloading goals on focus:', error);
                }
            }
        });
    };

    const addGoal = async () => {
        const name = addGoalInput.value.trim();
        if (name) {
            const newGoal = { 
                id: `goal_${Date.now()}`, 
                name, 
                completed: false,
                createdAt: Date.now(),
                subgoals: []
            };
            state.goals.push(newGoal);
            addGoalInput.value = '';
            
            console.log('Adding new goal:', newGoal);
            try {
                await saveState();
                renderGoals();
                console.log('Goal added and saved successfully');
            } catch (error) {
                console.error('Error saving new goal:', error);
                // Show error to user
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showErrorDialog({
                        title: 'Save Error',
                        message: 'Failed to save new goal. Please try again.',
                        details: error.message,
                        type: 'error'
                    });
                }
            }
        }
    };

    addGoalInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addGoal();
    });
    addGoalBtn.addEventListener('click', addGoal);
    goalList.addEventListener('click', handleGoalActions);
    goalList.addEventListener('keyup', handleGoalActions);
    
    // Add event listeners for completed goals list
    const completedGoalList = document.getElementById('completed-goal-list');
    if (completedGoalList) {
        completedGoalList.addEventListener('click', handleGoalActions);
        completedGoalList.addEventListener('keyup', handleGoalActions);
    }

    confirmNo.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        confirmationAction = null;
    });

    confirmYes.addEventListener('click', () => {
        if (confirmationAction) {
            confirmationAction();
        }
        confirmationModal.classList.add('hidden');
        confirmationAction = null;
    });

    // Edit modal event listeners
    saveGoalEditBtn.addEventListener('click', saveGoalEdit);
    cancelGoalEdit.addEventListener('click', hideEditGoalModal);
    
    // Close modal when clicking outside
    editGoalModal.addEventListener('click', (e) => {
        if (e.target === editGoalModal) {
            hideEditGoalModal();
        }
    });
    
    // Handle Enter key in edit form
    editGoalName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') saveGoalEdit();
    });

    // Add subgoal from modal
    if (editAddSubgoalBtn) {
        editAddSubgoalBtn.addEventListener('click', () => {
            if (!currentEditingDraft || !editAddSubgoalInput) return;
            const name = editAddSubgoalInput.value.trim();
            if (!name) return;
            currentEditingDraft.subgoals = currentEditingDraft.subgoals || [];
            currentEditingDraft.subgoals.push({ id: `sub_${Date.now()}`, name, completed: false, createdAt: Date.now() });
            editAddSubgoalInput.value = '';
            enforceGoalCompletionFromSubgoals(currentEditingDraft);
            renderEditSubgoals();
        });
    }

    if (editAddSubgoalInput) {
        editAddSubgoalInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                if (!currentEditingDraft) return;
                const name = editAddSubgoalInput.value.trim();
                if (!name) return;
                currentEditingDraft.subgoals = currentEditingDraft.subgoals || [];
                currentEditingDraft.subgoals.push({ id: `sub_${Date.now()}`, name, completed: false, createdAt: Date.now() });
                editAddSubgoalInput.value = '';
                enforceGoalCompletionFromSubgoals(currentEditingDraft);
                renderEditSubgoals();
            }
        });
    }

    // Delegate actions inside modal subgoal list
    if (editSubgoalList) {
        editSubgoalList.addEventListener('click', (e) => {
            if (!currentEditingDraft) return;
            const toggle = e.target.closest('.edit-toggle-subgoal');
            const editBtn = e.target.closest('.edit-subgoal-name-btn');
            const delBtn = e.target.closest('.delete-subgoal-modal-btn');

            if (toggle) {
                const subId = toggle.dataset.id;
                const sg = (currentEditingDraft.subgoals || []).find(s => s.id === subId);
                if (sg) {
                    sg.completed = toggle.checked;
                    enforceGoalCompletionFromSubgoals(currentEditingDraft);
                    renderEditSubgoals();
                }
            } else if (editBtn) {
                const subId = editBtn.dataset.id;
                const sg = (currentEditingDraft.subgoals || []).find(s => s.id === subId);
                if (sg) {
                    const newName = prompt('Edit subgoal name', sg.name) || '';
                    const trimmed = newName.trim();
                    if (trimmed) {
                        sg.name = trimmed;
                        renderEditSubgoals();
                    }
                }
            } else if (delBtn) {
                const subId = delBtn.dataset.id;
                currentEditingDraft.subgoals = (currentEditingDraft.subgoals || []).filter(s => s.id !== subId);
                enforceGoalCompletionFromSubgoals(currentEditingDraft);
                renderEditSubgoals();
            }
        });
    }
    
    // Toggle completed goals section
    const toggleCompletedBtn = document.getElementById('toggle-completed-goals');
    if (toggleCompletedBtn && completedGoalList) {
        toggleCompletedBtn.addEventListener('click', () => {
            const isExpanded = completedGoalList.classList.contains('expanded');
            if (isExpanded) {
                completedGoalList.classList.remove('expanded');
            } else {
                completedGoalList.classList.add('expanded');
            }
            const icon = toggleCompletedBtn.querySelector('.toggle-icon');
            if (icon) {
                icon.textContent = isExpanded ? '▼' : '▲';
            }
        });
    }

    setupAuth();
});
