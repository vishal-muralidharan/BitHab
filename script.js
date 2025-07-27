// BitHab - A Habit Tracking Application
// © 2025, All Rights Reserved.

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        activities: [],
        goals: [],
        logs: {},
        ui: {
            currentDate: new Date(),
            selectedActivityId: null,
            expandedActivities: new Set(),
        },
    };

    // DOM Elements
    const activityList = document.getElementById('activity-list');
    const addActivityInput = document.getElementById('add-activity-input');
    const goalList = document.getElementById('goal-list');
    const addGoalInput = document.getElementById('add-goal-input');
    const calendarView = document.querySelector('.calendar-view');
    const loggingModal = document.getElementById('logging-modal');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingIndicator = document.getElementById('loading-indicator');
    const authContainer = document.getElementById('auth-container');
    const mainLayout = document.querySelector('.main-layout');
    const logoutBtn = document.getElementById('logout-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const addGoalBtn = document.getElementById('add-goal-btn');

    let userId = null;
    let confirmationAction = null;

    const showConfirmation = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmationAction = onConfirm;
        confirmationModal.classList.remove('hidden');
    };
    
        // --- Firebase State Management ---
    const saveState = async () => {
        if (!userId) return;
        showLoadingIndicator('Saving...');
        try {
            const serializableState = {
                ...state,
                ui: {
                    ...state.ui,
                    currentDate: state.ui.currentDate.toISOString(),
                    expandedActivities: Array.from(state.ui.expandedActivities),
                },
            };
            await db.collection('users').doc(userId).set(serializableState);
        } catch (e) {
            console.error("Error saving state to Firebase:", e);
            showLoadingIndicator('Error saving!', true);
        }
    };

    const loadState = async () => {
        if (!userId) return;
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const loadedState = doc.data();
                if (loadedState.activities && loadedState.logs) {
                    Object.assign(state, loadedState);
                    state.ui.currentDate = new Date(loadedState.ui.currentDate);
                    state.ui.expandedActivities = new Set(loadedState.ui.expandedActivities);
                    state.goals = loadedState.goals || [];
                }
            } else {
                console.log("No data found for this user, starting fresh.");
                // Reset state for new user
                state.activities = [];
                state.goals = [];
                state.logs = {};
                state.ui.selectedActivityId = null;
            }
        } catch (e) {
            console.error("Error loading state from Firebase:", e);
        }
    };

    // --- UI Rendering ---
    const renderActivities = () => {
        activityList.innerHTML = '';
        if (state.activities.length === 0) {
            activityList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Add a main activity to begin.</p>';
            return;
        }

        state.activities.forEach(activity => {
            const isExpanded = state.ui.expandedActivities.has(activity.id);
            const isSelected = state.ui.selectedActivityId === activity.id;

            const activityItem = document.createElement('li');
            activityItem.className = `activity-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`;
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

    const renderGoals = () => {
        goalList.innerHTML = '';
        if (state.goals.length === 0) {
            goalList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Add a goal to get started.</p>';
            return;
        }
        state.goals.forEach(goal => {
            const goalItem = document.createElement('li');
            goalItem.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            goalItem.dataset.id = goal.id;
            goalItem.innerHTML = `
                <span>${goal.name}</span>
                <button class="remove-btn" data-id="${goal.id}">&times;</button>
            `;
            goalList.appendChild(goalItem);
        });
    };

    const renderCalendar = () => {
        const activityId = state.ui.selectedActivityId;
        if (!activityId) {
            calendarView.innerHTML = '<div style="text-align: center; opacity: 0.7; padding-top: 2rem;">Select an activity to see its calendar.</div>';
            return;
        }

        const activity = state.activities.find(a => a.id === activityId);
        if (!activity) return;

        const date = state.ui.currentDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = date.toLocaleString('default', { month: 'long' });

        // A single grid for headers and days ensures alignment.
        calendarView.innerHTML = `
            <div class="calendar-header">
                <button id="prev-month" class="calendar-nav-btn">‹</button>
                <div class="calendar-title-container">
                    <h2 class="calendar-title">${monthName} ${year}</h2>
                    <h3 class="current-activity-title">${activity.name}</h3>
                </div>
                <button id="next-month" class="calendar-nav-btn">›</button>
            </div>
            <div class="calendar-grid" id="calendar-grid">
                <!-- Weekdays and days will be injected here -->
            </div>
        `;

        const calendarGrid = document.getElementById('calendar-grid');
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let gridHTML = '';

        // Add weekday headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            gridHTML += `<div class="weekday">${day}</div>`;
        });

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            gridHTML += '<div class="calendar-day empty"></div>';
        }

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month + 1}-${day}`;
            const logs = state.logs[dateStr] || [];
            const dotsContainerClass = logs.length > 4 ? 'calendar-dots small-dots' : 'calendar-dots';
            let dotsHTML = '';

            if (activity.subActivities && activity.subActivities.length > 0) {
                dotsHTML = logs
                    .map(subId => {
                        const sub = activity.subActivities.find(s => s.id === subId);
                        return sub ? `<div class="calendar-dot" style="background-color: ${sub.color};"></div>` : '';
                    })
                    .join('');
            } else if (logs.includes(activity.id)) {
                // For activities without sub-activities, use the primary text color.
                dotsHTML = `<div class="calendar-dot" style="background-color: var(--text-primary);"></div>`;
            }

            gridHTML += `
                <div class="calendar-day" data-date="${dateStr}">
                    <span class="calendar-date-num">${day}</span>
                    <div class="${dotsContainerClass}">${dotsHTML}</div>
                </div>
            `;
        }
        
        calendarGrid.innerHTML = gridHTML;
    };

    const openLoggingModal = (dateStr) => {
        const activityId = state.ui.selectedActivityId;
        const activity = state.activities.find(a => a.id === activityId);
        if (!activity || !activity.subActivities || activity.subActivities.length === 0) {
            return;
        }

        const formatDateForModal = (ds) => {
            const [year, month, day] = ds.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const monthName = date.toLocaleString('default', { month: 'long' });
            let dayWithSuffix;
            if (day > 3 && day < 21) {
                dayWithSuffix = `${day}th`;
            } else {
                switch (day % 10) {
                    case 1: dayWithSuffix = `${day}st`; break;
                    case 2: dayWithSuffix = `${day}nd`; break;
                    case 3: dayWithSuffix = `${day}rd`; break;
                    default: dayWithSuffix = `${day}th`; break;
                }
            }
            return `${dayWithSuffix} ${monthName}`;
        };

        loggingModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>${formatDateForModal(dateStr)}</h3>
                <p>Activity: <strong>${activity.name}</strong></p>
                <div id="pill-container">
                    ${activity.subActivities.map(sub => `
                        <div class="pill" data-id="${sub.id}" style="--pill-color: ${sub.color}">
                            ${sub.name}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const loggedIds = new Set(state.logs[dateStr] || []);
        loggingModal.querySelectorAll('.pill').forEach(pill => {
            if (loggedIds.has(pill.dataset.id)) {
                pill.classList.add('selected');
            }
        });

        loggingModal.classList.remove('hidden');
        loggingModal.dataset.date = dateStr;
    };

    // --- Event Handlers ---
    const handleActivityActions = (e) => {
        const target = e.target;
        const activityItem = target.closest('.activity-item');
        if (!activityItem) return;
        const activityId = activityItem.dataset.id;

        if (target.closest('.activity-main') && !target.classList.contains('remove-btn')) {
            // If it's a new selection
            if (state.ui.selectedActivityId !== activityId) {
                state.ui.selectedActivityId = activityId;
                // Also expand it and collapse others
                state.ui.expandedActivities.clear();
                state.ui.expandedActivities.add(activityId);
            } else { // If it's the same activity, just toggle expansion
                if (state.ui.expandedActivities.has(activityId)) {
                    state.ui.expandedActivities.delete(activityId);
                } else {
                    state.ui.expandedActivities.add(activityId);
                }
            }
            saveState();
            renderActivities();
            renderCalendar();
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
                if (state.ui.selectedActivityId === activityId) renderCalendar();
            }
            return;
        }

        if (target.classList.contains('remove-btn') && target.closest('.activity-main')) {
            e.stopPropagation();
            const activityToDelete = state.activities.find(a => a.id === activityId);
            if (activityToDelete) {
                showConfirmation(`Are you sure you want to delete "${activityToDelete.name}" and all its data?`, () => {
                    const subIdsToDelete = new Set((activityToDelete.subActivities || []).map(s => s.id));
                    
                    state.activities = state.activities.filter(a => a.id !== activityId);
                    
                    Object.keys(state.logs).forEach(date => {
                        state.logs[date] = state.logs[date].filter(logId => !subIdsToDelete.has(logId));
                        if (state.logs[date].length === 0) delete state.logs[date];
                    });

                    if (state.ui.selectedActivityId === activityId) {
                        state.ui.selectedActivityId = state.activities.length > 0 ? state.activities[0].id : null;
                    }
                    saveState();
                    renderActivities();
                    renderCalendar();
                });
            }
        }

        if (target.classList.contains('remove-btn') && target.closest('.sub-activity-item')) {
            e.stopPropagation();
            const subId = target.dataset.id;
            const parentId = activityId;
            const activity = state.activities.find(a => a.id === parentId);
            const subActivity = activity ? activity.subActivities.find(s => s.id === subId) : null;
            
            if (activity && subActivity) {
                showConfirmation(`Are you sure you want to delete sub-activity "${subActivity.name}"?`, () => {
                    activity.subActivities = activity.subActivities.filter(s => s.id !== subId);
                    Object.keys(state.logs).forEach(date => {
                        state.logs[date] = state.logs[date].filter(logId => logId !== subId);
                        if (state.logs[date].length === 0) delete state.logs[date];
                    });
                    saveState();
                    renderActivities();
                    if (state.ui.selectedActivityId === parentId) renderCalendar();
                });
            }
        }
    };

    const handleGoalActions = (e) => {
        const target = e.target;
        const goalItem = target.closest('.goal-item');
        if (goalItem) {
            const goalId = goalItem.dataset.id;
            const goal = state.goals.find(g => g.id === goalId);
            if (goal) {
                if (target.classList.contains('remove-btn')) {
                    e.stopPropagation();
                    showConfirmation(`Are you sure you want to delete goal "${goal.name}"?`, () => {
                        state.goals = state.goals.filter(g => g.id !== goalId);
                        saveState();
                        renderGoals();
                    });
                } else {
                    goal.completed = !goal.completed;
                    saveState();
                    renderGoals();
                }
            }
        }
    };

    const handleCalendarActions = (e) => {
        const target = e.target;
        const navButton = target.closest('.calendar-nav-btn');
        if (navButton) {
            const direction = navButton.id === 'prev-month' ? -1 : 1;
            state.ui.currentDate.setMonth(state.ui.currentDate.getMonth() + direction);
            saveState(); // Save the new month
            renderCalendar();
            return;
        }

        const dayCell = target.closest('.calendar-day:not(.empty)');
        if (dayCell) {
            const dateStr = dayCell.dataset.date;
            const activityId = state.ui.selectedActivityId;
            const activity = state.activities.find(a => a.id === activityId);

            if (activity) {
                // If the activity has sub-activities, open the modal for selection.
                if (activity.subActivities && activity.subActivities.length > 0) {
                    openLoggingModal(dateStr);
                } else {
                    // Otherwise, directly toggle the log for the main activity.
                    if (!state.logs[dateStr]) {
                        state.logs[dateStr] = [];
                    }
                    const logIndex = state.logs[dateStr].indexOf(activity.id);
                    if (logIndex > -1) {
                        // Already logged, so remove it (un-log).
                        state.logs[dateStr].splice(logIndex, 1);
                        if (state.logs[dateStr].length === 0) {
                            delete state.logs[dateStr];
                        }
                    } else {
                        // Not logged, so add it.
                        state.logs[dateStr].push(activity.id);
                    }
                    saveState();
                    renderCalendar(); // Re-render calendar to show/hide the dot.
                    renderActivities(); // Re-render activities to update streak.
                }
            }
        }
    };

    const handleModalActions = (e) => {
        const target = e.target;
        const dateStr = loggingModal.dataset.date;

        if (target.classList.contains('close') || target.id === 'logging-modal') {
            loggingModal.classList.add('hidden');
            renderCalendar();
            return;
        }

        const pill = target.closest('.pill');
        if (pill) {
            const subId = pill.dataset.id;
            if (!state.logs[dateStr]) state.logs[dateStr] = [];

            const logIndex = state.logs[dateStr].indexOf(subId);
            if (logIndex > -1) {
                state.logs[dateStr].splice(logIndex, 1);
                if (state.logs[dateStr].length === 0) delete state.logs[dateStr];
            } else {
                state.logs[dateStr].push(subId);
            }
            // Toggle selection class on the pill itself
            pill.classList.toggle('selected');
            saveState();
            // No need to hide modal immediately, let user select multiple
        }
    };

    const handleModalClose = (e) => {
        const target = e.target;
         if (target.classList.contains('close') || target.id === 'logging-modal') {
            loggingModal.classList.add('hidden');
            renderCalendar(); // Update calendar dots
            renderActivities(); // Update streaks
        }
    }

    // --- Utility Functions ---
    const showLoadingIndicator = (message, isError = false) => {
        loadingIndicator.textContent = message;
        loadingIndicator.style.backgroundColor = isError ? '#e53935' : 'var(--accent-primary)';
        loadingIndicator.classList.remove('hidden');
        setTimeout(() => loadingIndicator.classList.add('hidden'), 1500);
    };

    const toggleTheme = () => {
        document.body.classList.toggle('dark');
        themeToggle.innerHTML = document.body.classList.contains('dark') ? '☀️' : '🌙';
        localStorage.setItem('bitHabTheme', document.body.className);
    };

    // --- Initial Setup ---
    const initApp = async () => {
        await loadState();

        if (!state.ui.selectedActivityId && state.activities.length > 0) {
            state.ui.selectedActivityId = state.activities[0].id;
        }
        if (state.ui.selectedActivityId && !state.ui.expandedActivities.has(state.ui.selectedActivityId)) {
             state.ui.expandedActivities.add(state.ui.selectedActivityId);
        }

        renderActivities();
        renderGoals();
        renderCalendar();

        authContainer.classList.add('hidden');
        mainLayout.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    }

    // Only handle logout and auth state for main app
    const setupAuth = () => {
        logoutBtn.addEventListener('click', () => {
            showConfirmation('Are you sure you want to logout?', () => {
                firebase.auth().signOut();
            });
        });

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                userId = user.uid;
                authContainer.classList.add('hidden');
                mainLayout.classList.remove('hidden');
                logoutBtn.classList.remove('hidden');
                initApp();
            } else {
                userId = null;
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        });
    };

    const init = () => {
        const savedTheme = localStorage.getItem('bitHabTheme');
        if (savedTheme) document.body.className = savedTheme;
        themeToggle.innerHTML = document.body.classList.contains('dark') ? '☀️' : '🌙';

        setupAuth();

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

        const addGoal = () => {
            const name = addGoalInput.value.trim();
            if (name) {
                const newGoal = { id: `goal_${Date.now()}`, name, completed: false };
                state.goals.push(newGoal);
                addGoalInput.value = '';
                saveState();
                renderGoals();
            }
        };

        addActivityInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') addActivity();
        });
        addActivityBtn.addEventListener('click', addActivity);

        addGoalInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') addGoal();
        });
        addGoalBtn.addEventListener('click', addGoal);

        activityList.addEventListener('click', handleActivityActions);
        activityList.addEventListener('keyup', handleActivityActions);
        goalList.addEventListener('click', handleGoalActions);
        calendarView.addEventListener('click', handleCalendarActions);
        loggingModal.addEventListener('click', handleModalActions);
        loggingModal.addEventListener('click', handleModalClose);
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
    };

    init();
});
