document.addEventListener('DOMContentLoaded', () => {
    const state = {
        activities: [],
        ui: {
            expandedActivities: new Set(),
        },
    };

    const activityList = document.getElementById('activity-list');
    const addActivityInput = document.getElementById('add-activity-input');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    let userId = null;
    let db;
    let confirmationAction = null;

    const setThemeFromStorage = () => {
        const savedTheme = localStorage.getItem('bitHabTheme');
        if (savedTheme) {
            document.body.className = savedTheme;
        }
        themeToggle.innerHTML = document.body.classList.contains('dark') ? '☀️' : '🌙';
    };

    const toggleTheme = () => {
        document.body.classList.toggle('dark');
        themeToggle.innerHTML = document.body.classList.contains('dark') ? '☀️' : '🌙';
        localStorage.setItem('bitHabTheme', document.body.className);
    };

    const showConfirmation = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmationAction = onConfirm;
        confirmationModal.classList.remove('hidden');
    };

    const saveState = async () => {
        if (!userId) return;
        try {
            const serializableState = {
                activities: state.activities,
                ui: {
                    ...state.ui,
                    expandedActivities: Array.from(state.ui.expandedActivities),
                },
            };
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                await db.collection('users').doc(userId).update(serializableState);
            } else {
                await db.collection('users').doc(userId).set(serializableState);
            }
        } catch (e) {
            console.error("Error saving state to Firebase:", e);
        }
    };

    const loadState = async () => {
        if (!userId) return;
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const loadedData = doc.data();
                state.activities = loadedData.activities || [];
                if (loadedData.ui) {
                    state.ui.expandedActivities = new Set(loadedData.ui.expandedActivities || []);
                }
            }
        } catch (e) {
            console.error("Error loading state from Firebase:", e);
        }
    };

    const renderActivities = () => {
        activityList.innerHTML = '';
        if (state.activities.length === 0) {
            activityList.innerHTML = '';
            return;
        }

        state.activities.forEach(activity => {
            const isExpanded = state.ui.expandedActivities.has(activity.id);
            const activityItem = document.createElement('li');
            activityItem.className = `activity-item ${isExpanded ? 'expanded' : ''}`;
            activityItem.dataset.id = activity.id;

            let subActivitiesHtml = '';
            if (activity.subActivities && activity.subActivities.length > 0) {
                subActivitiesHtml = `
                    <ul class="sub-activity-list">
                        ${activity.subActivities.map(sub => `
                            <li class="sub-activity-item" data-id="${sub.id}">
                                <span class="color-dot" style="background-color: ${sub.color || '#888'}"></span>
                                <span>${sub.name}</span>
                                <button class="remove-btn" data-id="${sub.id}" data-parent-id="${activity.id}">&times;</button>
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
                    <span>${isExpanded ? '▼' : '►'}</span>
                    <span>${activity.name}</span>
                    <button class="remove-btn" data-id="${activity.id}">&times;</button>
                </div>
                ${subActivitiesHtml}
                ${subAddRowHtml}
            `;
            activityList.appendChild(activityItem);
        });
    };

    const handleActivityActions = (e) => {
        const target = e.target;
        const activityItem = target.closest('.activity-item');
        if (!activityItem) return;
        const activityId = activityItem.dataset.id;

        if (target.closest('.activity-main') && !target.classList.contains('remove-btn')) {
            if (state.ui.expandedActivities.has(activityId)) {
                state.ui.expandedActivities.delete(activityId);
            } else {
                state.ui.expandedActivities.add(activityId);
            }
            saveState();
            renderActivities();
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
                saveState();
                renderActivities();
            }
            return;
        }

        if (target.classList.contains('remove-btn') && target.closest('.activity-main')) {
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
                        console.error("Error removing activity and its logs:", err);
                        alert("Failed to delete activity. Please check the console for details.");
                    } finally {
                        renderActivities();
                    }
                });
            }
        }

        if (target.classList.contains('remove-btn') && target.closest('.sub-activity-item')) {
            e.stopPropagation();
            const subId = target.dataset.id;
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
                        console.error("Error removing sub-activity and its logs:", err);
                        alert("Failed to delete sub-activity. Please check the console for details.");
                    } finally {
                        renderActivities();
                    }
                });
            }
        }
    };

    const initApp = async () => {
        await loadState();
        renderActivities();
        logoutBtn.classList.remove('hidden');
        setThemeFromStorage();
    };

    const setupAuth = () => {
        db = firebase.firestore();
        logoutBtn.addEventListener('click', () => {
            showConfirmation('Are you sure you want to logout?', () => {
                firebase.auth().signOut();
            });
        });

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                userId = user.uid;
                initApp();
            } else {
                userId = null;
                window.location.href = 'login.html';
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
    themeToggle.addEventListener('click', toggleTheme);

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

    setupAuth();
});
