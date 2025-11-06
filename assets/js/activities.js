document.addEventListener('DOMContentLoaded', () => {
    const state = {
        activities: [],
        logs: {}, // Add logs for streak calculation
        ui: {
            expandedActivities: new Set(),
        },
    };

    const activityList = document.getElementById('activity-list');
    const addActivityInput = document.getElementById('add-activity-input');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    
    // Edit modal elements
    const editActivityModal = document.getElementById('edit-activity-modal');
    const editActivityName = document.getElementById('edit-activity-name');
    const saveActivityEditBtn = document.getElementById('save-activity-edit');
    const cancelActivityEdit = document.getElementById('cancel-activity-edit');
    
    const editSubactivityModal = document.getElementById('edit-subactivity-modal');
    const editSubactivityName = document.getElementById('edit-subactivity-name');
    const editSubactivityColor = document.getElementById('edit-subactivity-color');
    const saveSubactivityEditBtn = document.getElementById('save-subactivity-edit');
    const cancelSubactivityEdit = document.getElementById('cancel-subactivity-edit');

    let userId = null;
    let db;
    let confirmationAction = null;
    let currentEditingActivity = null;
    let currentEditingSubActivity = null;

    // Show loading immediately
    const showLoading = () => {
        if (activityList) {
            activityList.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.7;">Loading activities...</div>';
        }
    };

    showLoading();

    const showConfirmation = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmationAction = onConfirm;
        confirmationModal.classList.remove('hidden');
    };

    const showEditActivityModal = (activity) => {
        currentEditingActivity = activity;
        editActivityName.value = activity.name;
        editActivityModal.classList.remove('hidden');
    };

    const hideEditActivityModal = () => {
        editActivityModal.classList.add('hidden');
        currentEditingActivity = null;
    };

    const showEditSubactivityModal = (activity, subActivity) => {
        currentEditingActivity = activity;
        currentEditingSubActivity = subActivity;
        editSubactivityName.value = subActivity.name;
        editSubactivityColor.value = subActivity.color || '#3B82F6';
        editSubactivityModal.classList.remove('hidden');
    };

    const hideEditSubactivityModal = () => {
        editSubactivityModal.classList.add('hidden');
        currentEditingActivity = null;
        currentEditingSubActivity = null;
    };

    const saveState = async () => {
        if (!userId) {
            console.warn('Cannot save: No user logged in');
            return;
        }
        try {
            console.log('Saving activities to Firebase:', state.activities.length, 'total activities');
            
            // Save using direct Firestore update with merge
            await db.collection('users').doc(userId).set({
                activities: state.activities,
                lastUpdated: Date.now(),
                lastUpdatedBy: 'activities_page'
            }, { merge: true });
            
            console.log('Activities successfully saved to Firebase');
            
            // Notify data sync
            if (window.BitHabDataSync) {
                window.BitHabDataSync.notifyListeners('data_saved', {
                    activities: state.activities,
                    lastUpdatedBy: 'activities_page'
                });
            }
        } catch (e) {
            console.error("Error saving activities to Firebase:", e);
            throw e; // Re-throw so calling code can handle it
        }
    };

    const calculateStreaks = (activityId) => {
        const today = new Date();
        const logs = state.logs;
        
        // Helper function to format date as YYYY-MM-DD
        const formatDate = (date) => {
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        };
        
        // Helper function to check if activity was logged on a specific date
        const isActivityLoggedOnDate = (dateStr) => {
            const dayLogs = logs[dateStr];
            if (!dayLogs || !Array.isArray(dayLogs)) return false;
            
            // Find the activity object
            const activity = state.activities.find(a => a.id === activityId);
            if (!activity) return false;
            
            // Check if main activity was logged
            if (dayLogs.includes(activityId)) return true;
            
            // Check if any sub-activities were logged
            if (activity.subActivities && activity.subActivities.length > 0) {
                return activity.subActivities.some(sub => dayLogs.includes(sub.id));
            }
            
            return false;
        };
        
        // Calculate current streak (going backwards from today)
        let currentStreak = 0;
        const currentDate = new Date(today);
        
        // Start from today and go backwards
        while (true) {
            const dateStr = formatDate(currentDate);
            if (isActivityLoggedOnDate(dateStr)) {
                currentStreak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        // Calculate longest streak by checking all dates
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Get all logged dates and sort them
        const allDates = Object.keys(logs).sort();
        
        if (allDates.length > 0) {
            const startDate = new Date(allDates[0]);
            const endDate = new Date(Math.max(today.getTime(), new Date(allDates[allDates.length - 1]).getTime()));
            
            const checkDate = new Date(startDate);
            while (checkDate <= endDate) {
                const dateStr = formatDate(checkDate);
                if (isActivityLoggedOnDate(dateStr)) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 0;
                }
                checkDate.setDate(checkDate.getDate() + 1);
            }
        }
        
        return { currentStreak, longestStreak };
    };

    const loadState = async () => {
        if (!userId) return;
        try {
            // Use DatabaseService for v2.0 compatibility
            if (window.DatabaseService && window.DatabaseService.isInitialized) {
                const allData = await window.DatabaseService.loadAllData();
                state.activities = allData.activities;
                state.logs = await window.DatabaseService.loadLogs();
                console.log('Data loaded via DatabaseService');
            } else {
                // Fallback to direct Firebase access
                const doc = await db.collection('users').doc(userId).get();
                if (doc.exists) {
                    const loadedData = doc.data();
                    state.activities = loadedData.activities || [];
                }
                
                // Load logs separately as they are in a sub-collection
                const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
                state.logs = {}; // Reset logs before loading
                logsSnapshot.forEach(doc => {
                    // Use backwards-compatible log reading
                    if (typeof DatabaseMigration !== 'undefined') {
                        state.logs[doc.id] = DatabaseMigration.readLogsWithCompatibility(doc.data());
                    } else {
                        // Fallback to old format for backwards compatibility
                        const logData = doc.data();
                        state.logs[doc.id] = logData.loggedSubActivityIds || [];
                    }
                });
                console.log('Data loaded via direct Firebase access');
            }
        } catch (e) {
            console.error("Error loading state from Firebase:", e);
        }
    };

    const renderActivities = () => {
        activityList.innerHTML = '';
        if (state.activities.length === 0) {
            activityList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Add a main activity to begin.</p>';
            return;
        }

        state.activities.forEach(activity => {
            const isExpanded = state.ui.expandedActivities.has(activity.id);
            const { currentStreak, longestStreak } = calculateStreaks(activity.id);
            
            const activityItem = document.createElement('li');
            activityItem.className = `activity-item ${isExpanded ? 'expanded' : ''}`;
            activityItem.dataset.id = activity.id;

            // Create streak display
            let streakDisplay = '';
            if (currentStreak > 0 || longestStreak > 0) {
                streakDisplay = `
                    <div class="streak-info">
                        ${currentStreak > 0 ? `<div class="current-streak">🔥 Current: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}</div>` : ''}
                        ${longestStreak > 0 ? `<div class="longest-streak">🏆 Longest: ${longestStreak} day${longestStreak !== 1 ? 's' : ''}</div>` : ''}
                    </div>
                `;
            }

            let subActivitiesHtml = '';
            if (activity.subActivities && activity.subActivities.length > 0) {
                subActivitiesHtml = `
                    <ul class="sub-activity-list">
                        ${activity.subActivities.map(sub => `
                            <li class="sub-activity-item" data-id="${sub.id}">
                                <div style="display: flex; align-items: center; gap: 0.5em; flex: 1;">
                                    <span class="color-dot" style="background-color: ${sub.color || '#888'}"></span>
                                    <span>${sub.name}</span>
                                </div>
                                <div class="activity-actions">
                                    <button class="edit-btn edit-sub-btn" data-id="${sub.id}" data-parent-id="${activity.id}" aria-label="Edit sub-activity">
                                        <i class="fas fa-pen" aria-hidden="true"></i>
                                    </button>
                                    <button class="remove-btn delete-btn" data-id="${sub.id}" data-parent-id="${activity.id}" aria-label="Delete sub-activity">
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
                    <input type="color" class="sub-activity-color-picker" value="#3B82F6">
                    <input type="text" class="add-input sub-activity-input" placeholder="Add sub-activity...">
                    <button class="add-btn sub-add-btn" aria-label="Add sub-activity">&#10148;</button>
                </div>`;
            }

            activityItem.innerHTML = `
                <div class="activity-main">
                    <div style="display: flex; align-items: center; gap: 0.5em; flex: 1;">
                        <span>${isExpanded ? '▼' : '►'}</span>
                        <span>${activity.name}</span>
                    </div>
                    <div class="activity-actions">
                        <button class="edit-btn edit-activity-btn" data-id="${activity.id}" aria-label="Edit activity">
                            <i class="fas fa-pen" aria-hidden="true"></i>
                        </button>
                        <button class="remove-btn delete-btn" data-id="${activity.id}" aria-label="Delete activity">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                ${streakDisplay}
                ${subActivitiesHtml}
                ${subAddRowHtml}
            `;
            activityList.appendChild(activityItem);
        });
    };

    const handleActivityActions = async (e) => {
        const target = e.target;
        const activityItem = target.closest('.activity-item');
        if (!activityItem) return;
        const activityId = activityItem.dataset.id;

        const activityMain = target.closest('.activity-main');
        const removeBtn = target.closest('.remove-btn');
        const editBtn = target.closest('.edit-btn');
        const editActivityBtn = target.closest('.edit-activity-btn');
        const editSubBtn = target.closest('.edit-sub-btn');

        // Handle main activity click (expand/collapse)
        if (activityMain && !removeBtn && !editBtn) {
            if (state.ui.expandedActivities.has(activityId)) {
                state.ui.expandedActivities.delete(activityId);
            } else {
                state.ui.expandedActivities.add(activityId);
            }
            saveState();
            renderActivities();
            return;
        }

        // Handle edit activity button
        if (editActivityBtn) {
            e.stopPropagation();
            const activity = state.activities.find(a => a.id === activityId);
            if (activity) {
                showEditActivityModal(activity);
            }
            return;
        }

        // Handle edit sub-activity button
        if (editSubBtn) {
            e.stopPropagation();
            const subId = editSubBtn.dataset.id;
            const activity = state.activities.find(a => a.id === activityId);
            const subActivity = activity ? activity.subActivities.find(s => s.id === subId) : null;
            if (activity && subActivity) {
                showEditSubactivityModal(activity, subActivity);
            }
            return;
        }

        const subActivityInput = target.closest('.sub-add-row')?.querySelector('.sub-activity-input');
        if ((target.classList.contains('sub-add-btn') || (target === subActivityInput && e.key === 'Enter')) && subActivityInput && subActivityInput.value.trim()) {
            const name = subActivityInput.value.trim();
            const colorPicker = subActivityInput.previousElementSibling;
            const color = colorPicker.value;
            const newSubActivity = { id: `sub_${Date.now()}`, name, color };

            const activity = state.activities.find(a => a.id === activityId);
            if (activity) {
                if (!activity.subActivities) activity.subActivities = [];
                activity.subActivities.push(newSubActivity);
                subActivityInput.value = '';
                
                console.log('Adding new subactivity:', newSubActivity, 'to activity:', activity.name);
                console.log('Activity now has', activity.subActivities.length, 'subactivities');
                
                try {
                    await saveState();
                    console.log('Subactivity saved successfully');
                    renderActivities();
                } catch (error) {
                    console.error('Error saving new subactivity:', error);
                    // Show error to user
                    if (typeof errorHandler !== 'undefined') {
                        errorHandler.showErrorDialog({
                            title: 'Save Error',
                            message: 'Failed to save new subactivity. Please try again.',
                            details: error.message,
                            type: 'error'
                        });
                    }
                }
            }
            return;
        }

        if (removeBtn && removeBtn.closest('.activity-main')) {
            e.stopPropagation();
            const activityToDelete = state.activities.find(a => a.id === activityId);
            if (activityToDelete) {
                showConfirmation(`Are you sure you want to delete "${activityToDelete.name}" and all its data? This action cannot be undone.`, async () => {
                    try {
                        // Find all logs associated with this activityId (includes main and all sub-activities)
                        const snapshot = await db.collection('users').doc(userId).collection('logs')
                            .where('activityId', '==', activityId).get();

                        const batch = db.batch();
                        snapshot.docs.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                        console.log('Associated logs deleted.');

                        // Now remove the activity from the state and save
                        state.activities = state.activities.filter(a => a.id !== activityId);
                        await saveState();
                        
                        console.log('Activity deleted from state.');
                    } catch (err) {
                        errorHandler.showErrorDialog({
                            title: 'Delete Activity Error',
                            message: 'Failed to delete activity. Please try again.',
                            details: err.message || 'Unknown error occurred while deleting activity',
                            type: 'error'
                        });
                    } finally {
                        renderActivities();
                    }
                });
            }
        }

        if (removeBtn && removeBtn.closest('.sub-activity-item')) {
            e.stopPropagation();
            const subId = removeBtn.dataset.id;
            const activity = state.activities.find(a => a.id === activityId);
            const subActivity = activity ? activity.subActivities.find(s => s.id === subId) : null;
            
            if (activity && subActivity) {
                showConfirmation(`Are you sure you want to delete sub-activity "${subActivity.name}" and its logged data? This action cannot be undone.`, async () => {
                    try {
                        // Delete logs for this sub-activity
                        const snapshot = await db.collection('users').doc(userId).collection('logs')
                            .where('subActivityId', '==', subId).get();
                        
                        const batch = db.batch();
                        snapshot.docs.forEach(doc => batch.delete(doc.ref));
                        await batch.commit();
                        console.log('Sub-activity logs deleted.');

                        // Remove sub-activity from state and save
                        activity.subActivities = activity.subActivities.filter(s => s.id !== subId);
                        await saveState();
                        
                        console.log('Sub-activity deleted from state.');

                    } catch (err) {
                        errorHandler.showErrorDialog({
                            title: 'Delete Sub-Activity Error',
                            message: 'Failed to delete sub-activity. Please try again.',
                            details: err.message || 'Unknown error occurred while deleting sub-activity',
                            type: 'error'
                        });
                    } finally {
                        renderActivities();
                    }
                });
            }
        }
    };

    const initApp = async () => {
        try {
            // Verify database connection
            db = firebase.firestore();
            console.log('Firebase initialized, user ID:', userId);
            
            await loadState();
            renderActivities();
            if(logoutBtnSidebar) logoutBtnSidebar.classList.remove('hidden');
            
            console.log('Activities app initialized successfully');
        } catch (error) {
            console.error('Error initializing activities app:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Initialization Error',
                    message: 'Failed to initialize the activities page. Please refresh and try again.',
                    details: error.message,
                    type: 'error'
                });
            }
        }
    };

    const saveActivityEdit = async () => {
        if (!currentEditingActivity) return;
        
        const newName = editActivityName.value.trim();
        if (!newName) {
            errorHandler.showErrorDialog({
                title: 'Invalid Activity Name',
                message: 'Please enter a valid activity name.',
                type: 'validation'
            });
            return;
        }

        // Update activity name
        currentEditingActivity.name = newName;
        
        try {
            await saveState();
            renderActivities();
            hideEditActivityModal();
        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Save Activity Error',
                message: 'Failed to save changes. Please try again.',
                details: error.message || 'Unknown error occurred while saving activity',
                type: 'error',
                onRetry: saveActivityEdit
            });
        }
    };

    const saveSubactivityEdit = async () => {
        if (!currentEditingActivity || !currentEditingSubActivity) return;
        
        const newName = editSubactivityName.value.trim();
        const newColor = editSubactivityColor.value;
        
        if (!newName) {
            errorHandler.showErrorDialog({
                title: 'Invalid Sub-Activity Name',
                message: 'Please enter a valid sub-activity name.',
                type: 'validation'
            });
            return;
        }

        // Update sub-activity name and color
        currentEditingSubActivity.name = newName;
        currentEditingSubActivity.color = newColor;
        
        try {
            await saveState();
            renderActivities();
            hideEditSubactivityModal();
        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Save Sub-Activity Error',
                message: 'Failed to save changes. Please try again.',
                details: error.message || 'Unknown error occurred while saving sub-activity',
                type: 'error',
                onRetry: saveSubactivityEdit
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
                
                console.log('User authenticated:', userId);
                initApp();
            } else {
                userId = null;
                // Auth manager will handle redirect
            }
        });
    };

    const addActivity = () => {
        const name = addActivityInput.value.trim();
        if (name) {
            const newActivity = {
                id: `act_${Date.now()}`,
                name,
                subActivities: [],
            };
            state.activities.push(newActivity);
            addActivityInput.value = '';
            saveState();
            renderActivities();
        }
    };

    addActivityInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addActivity();
    });
    addActivityBtn.addEventListener('click', addActivity);
    activityList.addEventListener('click', handleActivityActions);
    activityList.addEventListener('keyup', handleActivityActions);

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
    saveActivityEditBtn.addEventListener('click', saveActivityEdit);
    cancelActivityEdit.addEventListener('click', hideEditActivityModal);
    
    saveSubactivityEditBtn.addEventListener('click', saveSubactivityEdit);
    cancelSubactivityEdit.addEventListener('click', hideEditSubactivityModal);
    
    // Close modals when clicking outside
    editActivityModal.addEventListener('click', (e) => {
        if (e.target === editActivityModal) {
            hideEditActivityModal();
        }
    });
    
    editSubactivityModal.addEventListener('click', (e) => {
        if (e.target === editSubactivityModal) {
            hideEditSubactivityModal();
        }
    });
    
    // Handle Enter key in edit forms
    editActivityName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') saveActivityEdit();
    });
    
    editSubactivityName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') saveSubactivityEdit();
    });

    // Refresh data when window gets focus (e.g., coming back from main dashboard)
    window.addEventListener('focus', async () => {
        if (userId) {
            try {
                // Load logs from subcollection
                const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
                state.logs = {}; // Reset logs before loading
                logsSnapshot.forEach(doc => {
                    // Use backwards-compatible log reading
                    if (typeof DatabaseMigration !== 'undefined') {
                        state.logs[doc.id] = DatabaseMigration.readLogsWithCompatibility(doc.data());
                    } else {
                        // Fallback to old format for backwards compatibility
                        const logData = doc.data();
                        state.logs[doc.id] = logData.loggedSubActivityIds || [];
                    }
                });
                // Re-render to update streaks with latest data
                renderActivities();
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }
    });

    setupAuth();
});
