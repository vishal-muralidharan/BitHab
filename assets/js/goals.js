document.addEventListener('DOMContentLoaded', () => {
    const state = {
        goals: [],
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
    const saveGoalEditBtn = document.getElementById('save-goal-edit');
    const cancelGoalEdit = document.getElementById('cancel-goal-edit');

    let userId = null;
    let db;
    let confirmationAction = null;
    let currentEditingGoal = null;

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

    const showEditGoalModal = (goal) => {
        currentEditingGoal = goal;
        editGoalName.value = goal.name;
        editGoalModal.classList.remove('hidden');
    };

    const hideEditGoalModal = () => {
        editGoalModal.classList.add('hidden');
        currentEditingGoal = null;
    };

    const saveState = async () => {
        if (!userId) {
            console.warn('Cannot save goals: userId is null');
            return;
        }
        console.log('Saving goals:', state.goals);
        try {
            // Save using direct Firestore update with merge
            await db.collection('users').doc(userId).set({
                goals: state.goals,
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
                console.log('Goals loaded from Firebase:', state.goals);
            } else {
                console.warn('User document does not exist, creating empty goals array');
                state.goals = [];
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
        if (state.goals.length === 0) {
            goalList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Add a goal to get started.</p>';
            return;
        }
        state.goals.forEach(goal => {
            const goalItem = document.createElement('li');
            // Apply color-coded classes based on goal state
            let stateClass = '';
            if (goal.completed) {
                stateClass = 'completed'; // Green
            } else if (goal.status === 'in-progress' || goal.progress > 0) {
                stateClass = 'in-progress'; // Orange
            } else {
                stateClass = 'pending'; // Red
            }
            goalItem.className = `goal-item ${stateClass}`;
            goalItem.dataset.id = goal.id;
            goalItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5em; flex: 1;">
                    <span>${goal.name}</span>
                </div>
                <div class="activity-actions">
                    <button class="edit-btn edit-goal-btn" data-id="${goal.id}" aria-label="Edit goal">
                        <i class="fas fa-pen" aria-hidden="true"></i>
                    </button>
                    <button class="remove-btn delete-btn" data-id="${goal.id}" aria-label="Delete goal">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            `;
            goalList.appendChild(goalItem);
        });
    };

    const handleGoalActions = (e) => {
        const target = e.target;
        const goalItem = target.closest('.goal-item');
        if (goalItem) {
            const goalId = goalItem.dataset.id;
            const goal = state.goals.find(g => g.id === goalId);
            if (goal) {
                const editBtn = target.closest('.edit-goal-btn');
                const removeBtn = target.closest('.remove-btn');

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
                } else if (!target.closest('.activity-actions')) {
                    // Only toggle completion if not clicking on action buttons
                    goal.completed = !goal.completed;
                    saveState();
                    renderGoals();
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

        // Update goal name
        currentEditingGoal.name = newName;
        
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
                createdAt: Date.now()
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

    setupAuth();
});
