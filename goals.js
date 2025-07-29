document.addEventListener('DOMContentLoaded', () => {
    const state = {
        goals: [],
    };

    const goalList = document.getElementById('goal-list');
    const addGoalInput = document.getElementById('add-goal-input');
    const addGoalBtn = document.getElementById('add-goal-btn');
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
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                await db.collection('users').doc(userId).update({ goals: state.goals });
            } else {
                await db.collection('users').doc(userId).set({ goals: state.goals });
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
                state.goals = loadedData.goals || [];
            }
        } catch (e) {
            console.error("Error loading state from Firebase:", e);
        }
    };

    const renderGoals = () => {
        goalList.innerHTML = '';
        if (state.goals.length === 0) {
            goalList.innerHTML = '';
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

    const initApp = async () => {
        await loadState();
        renderGoals();
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

    addGoalInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addGoal();
    });
    addGoalBtn.addEventListener('click', addGoal);
    goalList.addEventListener('click', handleGoalActions);
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
