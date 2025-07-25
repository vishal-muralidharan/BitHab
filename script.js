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

    let userId = null;

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

            activityItem.innerHTML = `
                <div class="activity-main">
                    <span>${isExpanded ? '▼' : '►'}</span>
                    <span>${activity.name}</span>
                    <button class="remove-btn" data-id="${activity.id}">&times;</button>
                </div>
                ${subActivitiesHtml}
                <div class="sub-add-row">
                    <input type="color" class="sub-activity-color-picker" value="#3B82F6">
                    <input type="text" class="add-input sub-activity-input" placeholder="Add sub-activity...">
                </div>
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

        calendarView.innerHTML = `
            <div class="calendar-header">
                <button id="prev-month" class="calendar-nav-btn">‹</button>
                <div class="calendar-title-container">
                    <h2 class="calendar-title">${monthName} ${year}</h2>
                    <h3 class="current-activity-title">${activity.name}</h3>
                </div>
                <button id="next-month" class="calendar-nav-btn">›</button>
            </div>
            <div class="calendar-grid weekdays">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="weekday">${day}</div>`).join('')}
            </div>
            <div class="calendar-grid" id="calendar-days"></div>
        `;

        const calendarDays = document.getElementById('calendar-days');
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        calendarDays.innerHTML = '';

        const totalCells = 42; // 6 weeks * 7 days for a consistent height

        for (let i = 0; i < firstDay; i++) {
            calendarDays.innerHTML += '<div class="calendar-day empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            const dateStr = `${year}-${month + 1}-${day}`;
            dayEl.className = 'calendar-day';
            dayEl.dataset.date = dateStr;

            dayEl.innerHTML = `<span class="calendar-date-num">${day}</span>`;

            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'calendar-dots';

            if (state.logs[dateStr]) {
                activity.subActivities.forEach(sub => {
                    if (state.logs[dateStr].includes(sub.id)) {
                        const dot = document.createElement('span');
                        dot.className = 'calendar-dot';
                        dot.style.backgroundColor = sub.color;
                        dotsContainer.appendChild(dot);
                    }
                });
            }
            dayEl.appendChild(dotsContainer);
            calendarDays.appendChild(dayEl);
        }

        const renderedCells = firstDay + daysInMonth;
        const remainingCells = totalCells - renderedCells;
        for (let i = 0; i < remainingCells; i++) {
            calendarDays.innerHTML += '<div class="calendar-day empty"></div>';
        }
    };

    const openLoggingModal = (dateStr) => {
        const activityId = state.ui.selectedActivityId;
        const activity = state.activities.find(a => a.id === activityId);
        if (!activity || !activity.subActivities || activity.subActivities.length === 0) {
            alert("This activity has no sub-activities to log. Add one from the left panel.");
            return;
        }

        loggingModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Log for ${dateStr}</h3>
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

        if (target.closest('.activity-main')) {
            if (state.ui.selectedActivityId !== activityId) {
                state.ui.selectedActivityId = activityId;
            } else {
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

        if (target.classList.contains('sub-activity-input') && e.key === 'Enter' && target.value.trim()) {
            const name = target.value.trim();
            const colorPicker = target.previousElementSibling;
            const color = colorPicker.value;
            const newSubActivity = { id: `sub_${Date.now()}`, name, color };

            const activity = state.activities.find(a => a.id === activityId);
            if (activity) {
                if (!activity.subActivities) activity.subActivities = [];
                activity.subActivities.push(newSubActivity);
                target.value = '';
                saveState();
                renderActivities();
                if (state.ui.selectedActivityId === activityId) renderCalendar();
            }
        }

        if (target.classList.contains('remove-btn') && target.closest('.activity-main')) {
            e.stopPropagation();
            if (confirm(`Delete "${state.activities.find(a=>a.id===activityId).name}" and all its data?`)) {
                const activityToDelete = state.activities.find(a => a.id === activityId);
                const subIdsToDelete = new Set(activityToDelete.subActivities.map(s => s.id));
                
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
            }
        }

        if (target.classList.contains('remove-btn') && target.closest('.sub-activity-item')) {
            e.stopPropagation();
            const subId = target.dataset.id;
            const parentId = activityId;
            const activity = state.activities.find(a => a.id === parentId);
            if (activity) {
                activity.subActivities = activity.subActivities.filter(s => s.id !== subId);
                Object.keys(state.logs).forEach(date => {
                    state.logs[date] = state.logs[date].filter(logId => logId !== subId);
                    if (state.logs[date].length === 0) delete state.logs[date];
                });
                saveState();
                renderActivities();
                if (state.ui.selectedActivityId === parentId) renderCalendar();
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
                    state.goals = state.goals.filter(g => g.id !== goalId);
                } else {
                    goal.completed = !goal.completed;
                }
                saveState();
                renderGoals();
            }
        }
    };

    const handleCalendarActions = (e) => {
        const target = e.target;
        const navButton = target.closest('.calendar-nav-btn');
        if (navButton) {
            if (navButton.id === 'prev-month') state.ui.currentDate.setMonth(state.ui.currentDate.getMonth() - 1);
            if (navButton.id === 'next-month') state.ui.currentDate.setMonth(state.ui.currentDate.getMonth() + 1);
            renderCalendar();
            return;
        }

        const dayCell = target.closest('.calendar-day:not(.empty)');
        if (dayCell) {
            openLoggingModal(dayCell.dataset.date);
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
            saveState();
            loggingModal.classList.add('hidden');
            renderCalendar();
        }
    };

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

    const setupAuth = () => {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');

        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            firebase.auth().signInWithEmailAndPassword(email, password)
                .catch(error => alert(error.message));
        });

        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .catch(error => alert(error.message));
        });

        logoutBtn.addEventListener('click', () => {
            firebase.auth().signOut();
        });

        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.parentElement.classList.add('hidden');
            registerForm.parentElement.classList.remove('hidden');
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.parentElement.classList.add('hidden');
            loginForm.parentElement.classList.remove('hidden');
        });

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                userId = user.uid;
                initApp();
            } else {
                userId = null;
                authContainer.classList.remove('hidden');
                mainLayout.classList.add('hidden');
                logoutBtn.classList.add('hidden');
            }
        });
    };

    const init = () => {
        const savedTheme = localStorage.getItem('bitHabTheme');
        if (savedTheme) document.body.className = savedTheme;
        themeToggle.innerHTML = document.body.classList.contains('dark') ? '☀️' : '🌙';

        setupAuth();

        addActivityInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && addActivityInput.value.trim()) {
                const newActivity = {
                    id: `act_${Date.now()}`,
                    name: addActivityInput.value.trim(),
                    subActivities: []
                };
                state.activities.push(newActivity);
                addActivityInput.value = '';
                
                state.ui.selectedActivityId = newActivity.id;
                state.ui.expandedActivities.add(newActivity.id);
                
                saveState();
                renderActivities();
                renderCalendar();
            }
        });

        addGoalInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && addGoalInput.value.trim()) {
                const newGoal = {
                    id: `goal_${Date.now()}`,
                    name: addGoalInput.value.trim(),
                    completed: false
                };
                state.goals.push(newGoal);
                addGoalInput.value = '';
                saveState();
                renderGoals();
            }
        });

        activityList.addEventListener('click', handleActivityActions);
        activityList.addEventListener('keyup', handleActivityActions);
        goalList.addEventListener('click', handleGoalActions);
        calendarView.addEventListener('click', handleCalendarActions);
        loggingModal.addEventListener('click', handleModalActions);
        themeToggle.addEventListener('click', toggleTheme);
    };

    init();
});
