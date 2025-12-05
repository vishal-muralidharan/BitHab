class FocusMode {
    constructor() {
        this.sessionStartTime = null;
        this.sessionTimer = null;
        this.isSessionActive = false;
        this.isPaused = false;
        this.sessionDuration = 0;

        this.focusData = this.createEmptyFocusData();
        this.targetDuration = this.focusData.targetDuration;
        this.currentGoal = null;
        this.currentSubject = null;
        this.isInDeepWorkMode = false;

        this.todayStats = {
            totalTime: 0,
            sessions: 0,
            goalsSessions: 0,
            goalsCompleted: 0
        };
        this.weeklyStats = {};
        this.subjectStats = {};
        this.deepStats = {
            todayMinutes: 0,
            sessions: 0,
            longest: 0,
            totalMinutes: 0,
            totalSessions: 0
        };

        this.motivationalQuotes = [
            { text: "Focus is the key to all achievement.", author: "Anonymous" },
            { text: "Concentration is the secret of strength.", author: "Ralph Waldo Emerson" },
            { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
            { text: "Where focus goes, energy flows and results show.", author: "Tony Robbins" },
            { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
            { text: "The art of being wise is knowing what to overlook.", author: "William James" },
            { text: "Clarity of mind means clarity of passion.", author: "Blaise Pascal" },
            { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" }
        ];

        this.auth = null;
        this.db = null;

        this.init();
    }

    createEmptyFocusData() {
        return {
            tasks: [],
            subjects: [],
            completedTasks: {},
            targetDuration: 25
        };
    }

    normalizeFocusData(rawData = {}) {
        const normalized = this.createEmptyFocusData();

        if (Array.isArray(rawData.tasks)) {
            normalized.tasks = [...new Set(rawData.tasks.filter(item => typeof item === 'string' && item.trim()))];
        }
        if (Array.isArray(rawData.subjects)) {
            normalized.subjects = [...new Set(rawData.subjects.filter(item => typeof item === 'string' && item.trim()))];
        }
        if (rawData.completedTasks && typeof rawData.completedTasks === 'object') {
            normalized.completedTasks = { ...rawData.completedTasks };
        }
        if (Number.isFinite(rawData.targetDuration)) {
            normalized.targetDuration = Math.max(0, Math.round(rawData.targetDuration));
        }

        return normalized;
    }

    getUserRef() {
        if (!this.db || !this.auth?.currentUser) {
            return null;
        }
        return this.db.collection('users').doc(this.auth.currentUser.uid);
    }

    async persistFocusData() {
        const userRef = this.getUserRef();
        if (!userRef) return;

        const payload = {
            focusData: {
                tasks: this.focusData.tasks,
                subjects: this.focusData.subjects,
                completedTasks: this.focusData.completedTasks,
                targetDuration: this.focusData.targetDuration,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }
        };

        try {
            await userRef.set(payload, { merge: true });
        } catch (error) {
            console.error('Failed to persist focus data:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Focus Data Sync Failed',
                    message: 'We could not save your focus tasks or subjects to the cloud.',
                    details: error.message || String(error),
                    type: 'error'
                });
            }
            throw error;
        }
    }

    init() {
        console.log('FocusMode initializing...');
        this.waitForFirebase(() => {
            this.setupAuth();
            this.setupEventListeners();
            this.setupClickHandlers();
            this.initializeTargetButtons();
            this.displayRandomQuote();
            this.updateSessionDisplay();
            this.loadUserData();
            console.log('FocusMode initialized');
        });
    }

    waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            callback();
        } else {
            console.log('Waiting for Firebase to load...');
            setTimeout(() => this.waitForFirebase(callback), 100);
        }
    }

    setupAuth() {
        console.log('Setting up auth...');

        const handleUser = (user) => {
            console.log('Auth state changed:', user ? 'logged in' : 'not logged in');
            if (user) {
                this.loadUserData();
            } else {
                this.focusData = this.createEmptyFocusData();
                this.renderFocusData(this.focusData);
            }
        };

        if (typeof authManager !== 'undefined' && authManager?.onAuthStateChange) {
            authManager.onAuthStateChange(handleUser);
        } else if (this.auth?.onAuthStateChanged) {
            this.auth.onAuthStateChanged(handleUser);
        } else {
            console.warn('Auth manager not available, continuing with local data only');
            handleUser(null);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        const startBtn = document.getElementById('start-session');
        const pauseBtn = document.getElementById('pause-session');
        const stopBtn = document.getElementById('stop-session');
        const headerFullscreenBtn = document.getElementById('fullscreen-toggle');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.toggleStartResume());
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseSession());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopSession());
        }
        if (headerFullscreenBtn) {
            headerFullscreenBtn.addEventListener('click', () => {
                console.log('Fullscreen toggle not supported - removed fullscreen functionality');
            });
        }

        const targetTimeSelector = document.getElementById('target-time');
        if (targetTimeSelector) {
            targetTimeSelector.addEventListener('change', (e) => {
                const value = parseInt(e.target.value, 10);
                this.setTargetDuration(Number.isFinite(value) ? value : this.targetDuration, { persist: true });
                this.updateProgressRing();
            });
        }

        this.disableAnalyticsPanels();

        document.addEventListener('keydown', (e) => {
            if (e.target && e.target.tagName === 'INPUT') return;

            if (e.key === ' ') {
                e.preventDefault();
                if (this.isSessionActive && !this.isPaused) {
                    this.pauseSession();
                } else {
                    this.toggleStartResume();
                }
            }

            if (e.key === 'Escape') {
                if (this.isInDeepWorkMode) {
                    this.exitDeepWorkMode();
                } else if (this.isSessionActive || this.isPaused) {
                    this.stopSession();
                }
            }
        });

        console.log('Event listeners setup complete');
    }

    disableAnalyticsPanels() {
        const dashboard = document.getElementById('analytics-dashboard');
        const toggle = document.getElementById('analytics-toggle');
        const closeButton = document.getElementById('close-analytics');
        const sectionsToClear = [
            'weekly-chart',
            'subject-stats',
            'goal-progress',
            'productivity-score',
            'current-streak',
            'longest-session',
            'monthly-total',
            'completion-rate'
        ];

        if (dashboard) {
            dashboard.classList.add('hidden');
        }
        if (toggle) {
            toggle.classList.add('hidden');
        }
        if (closeButton) {
            closeButton.classList.add('hidden');
        }

        sectionsToClear.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            if (Object.prototype.hasOwnProperty.call(element, 'innerHTML')) {
                element.innerHTML = '';
            }
            if (Object.prototype.hasOwnProperty.call(element, 'textContent')) {
                element.textContent = '';
            }
        });
    }

    showAnalyticsDashboard() {
        this.disableAnalyticsPanels();
    }

    updateAnalyticsDashboard() {
        this.disableAnalyticsPanels();
    }

    setupClickHandlers() {
        document.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('.remove-btn');
            if (removeBtn) {
                const type = removeBtn.getAttribute('data-type');
                const value = removeBtn.getAttribute('data-value');
                const label = type === 'goal' ? 'task' : 'subject';
                this.showConfirmDialog(`Remove this ${label}: "${value}"?`).then(confirmed => {
                    if (!confirmed) return;
                    if (type === 'goal') {
                        this.removeUserGoal(value);
                    } else if (type === 'subject') {
                        this.removeUserSubject(value);
                    }
                });
                return;
            }

            const goalEl = event.target.closest('.goal-item, .task-item');
            if (goalEl && goalEl.parentElement?.id === 'tasks-list') {
                goalEl.classList.toggle('completed');

                const label = goalEl.querySelector('.item-text');
                const taskText = label ? label.textContent : goalEl.getAttribute('data-value') || goalEl.textContent.trim();
                const isCompleted = goalEl.classList.contains('completed');
                this.saveTaskCompletionState(taskText, isCompleted);
                return;
            }

            const subjectEl = event.target.closest('.subject-item');
            if (subjectEl && subjectEl.parentElement?.id === 'subjects-list') {
                return;
            }
        });

        const goalInput = document.getElementById('session-task') || document.getElementById('session-goal');
        const subjectInput = document.getElementById('session-subject');

        if (goalInput) {
            goalInput.addEventListener('input', (e) => {
                this.currentGoal = e.target.value;
            });

            goalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.saveUserGoal(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        if (subjectInput) {
            subjectInput.addEventListener('input', (e) => {
                this.currentSubject = e.target.value;
            });

            subjectInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.saveUserSubject(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        const addSubjectIcon = document.getElementById('add-subject');
        if (addSubjectIcon) {
            const handleAddSubject = () => {
                const input = document.getElementById('session-subject');
                const value = input?.value?.trim();
                if (!value) return;
                this.saveUserSubject(value);
                input.value = '';
                this.showAddConfirmation(addSubjectIcon);
            };

            addSubjectIcon.addEventListener('click', handleAddSubject);
            addSubjectIcon.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleAddSubject();
                }
            });
        }

        const addGoalIcon = document.getElementById('add-task') || document.getElementById('add-goal');
        if (addGoalIcon) {
            const handleAddGoal = () => {
                const input = document.getElementById('session-task') || document.getElementById('session-goal');
                const value = input?.value?.trim();
                if (!value) return;
                this.saveUserGoal(value);
                input.value = '';
                this.showAddConfirmation(addGoalIcon);
            };

            addGoalIcon.addEventListener('click', handleAddGoal);
            addGoalIcon.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleAddGoal();
                }
            });
        }

        const deepWorkBtn = document.getElementById('deep-work-toggle');
        if (deepWorkBtn && deepWorkBtn.tagName !== 'A') {
            deepWorkBtn.addEventListener('click', (event) => {
                event.preventDefault();
                this.enterDeepWorkMode();
            });
        }

        const exitDeepWorkBtn = document.getElementById('exit-deep-work');
        if (exitDeepWorkBtn) {
            exitDeepWorkBtn.addEventListener('click', () => this.exitDeepWorkMode());
        }

        const deepWorkTargetSelect = document.getElementById('deep-work-target-select');
        if (deepWorkTargetSelect) {
            deepWorkTargetSelect.addEventListener('change', (e) => {
                const value = parseInt(e.target.value, 10);
                this.setTargetDuration(Number.isFinite(value) ? value : this.targetDuration);
            });
        }

        const targetTimeSelect = document.getElementById('target-time');
        if (targetTimeSelect) {
            targetTimeSelect.addEventListener('change', (e) => {
                this.setTargetDuration(parseInt(e.target.value));
            });
        }

        // Deep work timer controls
        const deepWorkStart = document.getElementById('deep-work-start');
        const deepWorkPause = document.getElementById('deep-work-pause');
        const deepWorkStop = document.getElementById('deep-work-stop');

        if (deepWorkStart) {
            deepWorkStart.addEventListener('click', () => {
                this.toggleStartResume();
            });
        }

        if (deepWorkPause) {
            deepWorkPause.addEventListener('click', () => {
                this.pauseSession();
            });
        }

        if (deepWorkStop) {
            deepWorkStop.addEventListener('click', () => {
                this.stopSession();
            });
        }

        // Analytics button handler
        const viewAnalyticsBtn = document.getElementById('view-analytics');
        if (viewAnalyticsBtn) {
            viewAnalyticsBtn.addEventListener('click', () => {
                this.showAnalyticsDashboard();
            });
        }

        // Initialize target selection buttons
        this.initializeTargetButtons();
    }

    // Reusable Confirm/Prompt Dialogs
    showConfirmDialog(message, title = 'Confirm') {
        return new Promise(resolve => {
            const modal = document.getElementById('app-modal');
            if (!modal) { resolve(window.confirm(message)); return; }
            const titleEl = document.getElementById('modal-title');
            const msgEl = document.getElementById('modal-message');
            const inputWrap = document.getElementById('modal-input-wrap');
            const okBtn = document.getElementById('modal-ok');
            const cancelBtn = document.getElementById('modal-cancel');
            inputWrap.classList.add('hidden');
            titleEl.textContent = title;
            msgEl.textContent = message;
            modal.classList.remove('hidden');

            const cleanup = (result) => {
                modal.classList.add('hidden');
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                modal.removeEventListener('click', onBackdrop);
                resolve(result);
            };
            const onBackdrop = (ev) => {
                if (ev.target.classList && ev.target.classList.contains('modal-overlay')) cleanup(false);
            };
            okBtn.onclick = () => cleanup(true);
            cancelBtn.onclick = () => cleanup(false);
            modal.addEventListener('click', onBackdrop);
        });
    }

    showPromptDialog(message, placeholder = '', title = 'Input') {
        return new Promise(resolve => {
            const modal = document.getElementById('app-modal');
            if (!modal) { const v = window.prompt(message, ''); resolve(v); return; }
            const titleEl = document.getElementById('modal-title');
            const msgEl = document.getElementById('modal-message');
            const inputWrap = document.getElementById('modal-input-wrap');
            const inputEl = document.getElementById('modal-input');
            const okBtn = document.getElementById('modal-ok');
            const cancelBtn = document.getElementById('modal-cancel');
            titleEl.textContent = title;
            msgEl.textContent = message;
            inputEl.value = '';
            inputEl.placeholder = placeholder;
            inputWrap.classList.remove('hidden');
            modal.classList.remove('hidden');
            setTimeout(() => inputEl.focus(), 0);

            const cleanup = (value) => {
                modal.classList.add('hidden');
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                inputEl.onkeypress = null;
                modal.removeEventListener('click', onBackdrop);
                resolve(value);
            };
            const onBackdrop = (ev) => {
                if (ev.target.classList && ev.target.classList.contains('modal-overlay')) cleanup(null);
            };
            okBtn.onclick = () => cleanup(inputEl.value.trim());
            cancelBtn.onclick = () => cleanup(null);
            inputEl.onkeypress = (e) => { if (e.key === 'Enter') okBtn.click(); };
            modal.addEventListener('click', onBackdrop);
        });
    }

    initializeTargetButtons() {
        // Handle save target button
        const saveTargetBtn = document.getElementById('save-target');
        const hoursInput = document.getElementById('target-hours');
        const minutesInput = document.getElementById('target-minutes');
        const hiddenInput = document.getElementById('deep-work-target-select');
        
        if (saveTargetBtn && hoursInput && minutesInput && hiddenInput) {
            saveTargetBtn.addEventListener('click', () => {
                const hours = parseInt(hoursInput.value) || 0;
                const minutes = parseInt(minutesInput.value) || 0;
                const totalMinutes = (hours * 60) + minutes;
                
                hiddenInput.value = totalMinutes;
                console.log('Target set to:', totalMinutes, 'minutes');
                
                // Update progress bar if session is running
                if (this.isInDeepWorkMode) {
                    this.updateDeepWorkDisplay();
                }
            });
        }
        
        // Handle quick target buttons
        const quickButtons = document.querySelectorAll('.quick-btn');
        quickButtons.forEach(button => {
            button.addEventListener('click', () => {
                const minutes = parseInt(button.getAttribute('data-minutes'));
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                
                if (hoursInput) hoursInput.value = hours;
                if (minutesInput) minutesInput.value = remainingMinutes;
                if (hiddenInput) hiddenInput.value = minutes;
                
                // Update progress bar if session is running
                if (this.isInDeepWorkMode) {
                    this.updateDeepWorkDisplay();
                }
            });
        });
    }

    async loadTodayStats() {
        this.todayStats = {
            totalTime: 0,
            sessions: 0,
            goalsSessions: 0,
            goalsCompleted: 0
        };

        const statsPanel = document.querySelector('.today-stats');
        if (statsPanel) {
            statsPanel.classList.add('hidden');
        }
    }

    startSession() {
        console.log('startSession called');
        if (!this.isPaused) {
            // Starting new session
            this.sessionStartTime = new Date();
            this.sessionDuration = 0;
            console.log('Starting new session');
        } else {
            // Resuming paused session
            this.sessionStartTime = new Date(Date.now() - (this.sessionDuration * 1000));
            console.log('Resuming paused session');
        }

        this.isSessionActive = true;
        this.isPaused = false;
        
        this.updateSessionButtons();
        this.startSessionTimer();
        
        console.log('Focus session started');
    }

    toggleStartResume() {
        if (this.isSessionActive && !this.isPaused) {
            // Currently running - this shouldn't happen from start button
            console.log('Session already running');
            return;
        } else if (this.isPaused) {
            // Paused - resume
            console.log('Resuming paused session');
            this.startSession();
        } else {
            // Stopped - start new
            console.log('Starting new session');
            this.startSession();
        }
    }

    pauseSession() {
        if (!this.isSessionActive) return;
        
        this.isPaused = true;
        this.isSessionActive = false;
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        this.updateSessionButtons();
        console.log('Focus session paused');
    }

    async stopSession() {
        if (!this.isSessionActive && !this.isPaused) return;
        
        this.isSessionActive = false;
        this.isPaused = false;
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        // Save session if it was meaningful (at least 1 minute)
        if (this.sessionDuration >= 60) {
            await this.saveSession();
        }
        
        this.sessionDuration = 0;
        this.sessionStartTime = null;
        
        this.updateSessionButtons();
        this.updateSessionDisplay();
        
        console.log('Focus session stopped');
    }

    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            const now = new Date();
            this.sessionDuration = Math.floor((now - this.sessionStartTime) / 1000);
            console.log('Session timer tick, duration:', this.sessionDuration, 'isInDeepWorkMode:', this.isInDeepWorkMode);
            this.updateSessionDisplay();
            this.updateDeepWorkDisplay(); // Also update deep work display
        }, 1000);
    }

    updateSessionDisplay() {
        const sessionTimeElement = document.getElementById('session-timer');
        if (sessionTimeElement) {
            const hours = Math.floor(this.sessionDuration / 3600);
            const minutes = Math.floor((this.sessionDuration % 3600) / 60);
            const seconds = this.sessionDuration % 60;
            
            sessionTimeElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update progress ring if target is set
        if (this.targetDuration > 0) {
            this.updateProgressRingValue();
        }
        
        // Update fullscreen display if in fullscreen mode - REMOVED OLD CODE
    }

    // Deep Work Session Mode with Auto Fullscreen
    async enterDeepWorkMode() {
        const deepWorkMode = document.getElementById('deep-work-mode');
        const mainContent = document.querySelector('.focus-container');
        
        if (deepWorkMode && mainContent) {
            // Set deep work mode flag
            this.isInDeepWorkMode = true;
            
            // Enter browser fullscreen first
            try {
                await document.documentElement.requestFullscreen();
            } catch (err) {
                console.warn('Could not enter fullscreen:', err);
            }
            
            deepWorkMode.classList.remove('hidden');
            mainContent.classList.add('hidden');
            
            // Sync target duration with regular selector
            this.syncTargetSelectors();
            
            // Update deep work content
            this.updateDeepWorkDisplay();
            
            // Start updating time in deep work mode
            this.updateDeepWorkTime();
            this.deepWorkTimeInterval = setInterval(() => {
                this.updateDeepWorkTime();
            }, 1000);
        }
    }

    async exitDeepWorkMode() {
        const deepWorkMode = document.getElementById('deep-work-mode');
        const mainContent = document.querySelector('.focus-container');
        
        if (deepWorkMode && mainContent) {
            // Clear deep work mode flag
            this.isInDeepWorkMode = false;
            
            // Exit browser fullscreen
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
            } catch (err) {
                console.warn('Could not exit fullscreen:', err);
            }
            
            deepWorkMode.classList.add('hidden');
            mainContent.classList.remove('hidden');
            
            // Stop time updating
            this.stopDeepWorkTimer();
        }
    }

    syncTargetSelectors() {
        const regularSelect = document.getElementById('target-time');
        const deepWorkSelect = document.getElementById('deep-work-target-select');
        
        if (regularSelect && deepWorkSelect) {
            deepWorkSelect.value = regularSelect.value;
        }
    }

    setTargetDuration(minutes, { persist = true } = {}) {
        const sanitized = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 25;
        this.targetDuration = sanitized;
        this.focusData.targetDuration = sanitized;
        if (persist && this.auth?.currentUser) {
            this.persistFocusData().catch(err => console.error('Failed to sync target duration:', err));
        }
        
        // Sync both selectors
        const regularSelect = document.getElementById('target-time');
        const deepWorkSelect = document.getElementById('deep-work-target-select');
        
        if (regularSelect) regularSelect.value = sanitized;
        if (deepWorkSelect) deepWorkSelect.value = sanitized;
        
        console.log(`Target duration set to: ${sanitized} minutes`);
    }

    updateDeepWorkTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        // Update individual elements in deep work mode
        const hoursElement = document.getElementById('current-hours');
        const minutesElement = document.getElementById('current-minutes');
        const ampmElement = document.getElementById('current-ampm');
        
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (ampmElement) ampmElement.textContent = ampm;
    }

    updateDeepWorkDisplay() {
        console.log('updateDeepWorkDisplay called, isInDeepWorkMode:', this.isInDeepWorkMode);
        if (!this.isInDeepWorkMode) return;
        
        // Populate subjects and tasks
        this.populateDeepWorkSubjectsAndTasks();
        
        const targetDropdown = document.getElementById('deep-work-target-select');
        if (!targetDropdown) {
            console.log('Target dropdown not found');
            return;
        }
        
        const targetMinutes = parseInt(targetDropdown.value);
        console.log('Target minutes:', targetMinutes, 'Session duration:', this.sessionDuration);
        const progressContainer = document.querySelector('.deep-work-progress-container');
        
        if (targetMinutes === 0) {
            // No target mode - show elapsed time and hide progress bar
            console.log('No target mode');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
            
            const timerElement = document.getElementById('deep-work-timer');
            if (timerElement) {
                const hours = Math.floor(this.sessionDuration / 3600);
                const minutes = Math.floor((this.sessionDuration % 3600) / 60);
                const seconds = this.sessionDuration % 60;
                
                if (hours > 0) {
                    timerElement.textContent = 
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    timerElement.textContent = 
                        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
            return;
        }
        
        // Show progress bar for target mode
        console.log('Target mode active');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        const targetSeconds = targetMinutes * 60;
        const elapsed = this.sessionDuration; // Use sessionDuration instead of elapsedTime
        const remaining = Math.max(0, targetSeconds - elapsed);
        
        console.log('Target seconds:', targetSeconds, 'Elapsed:', elapsed, 'Remaining:', remaining);
        
        // Update timer display (countdown)
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        
        const timerElement = document.getElementById('deep-work-timer');
        if (timerElement) {
            if (hours > 0) {
                timerElement.textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timerElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            console.log('Updated timer to:', timerElement.textContent);
        }
        
        // Update progress bar
        const progressPercentage = Math.min(100, (elapsed / targetSeconds) * 100);
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            console.log('Updated progress bar to:', progressPercentage + '%');
        }
        
        // Update progress text
        const progressText = document.querySelector('.progress-percentage');
        if (progressText) {
            progressText.textContent = `${Math.round(progressPercentage)}%`;
        }
        
        // Check if target reached
        if (remaining === 0 && this.isRunning) {
            this.pauseSession();
            this.showNotification('🎉 Deep Work Target Reached!', 'Congratulations! You\'ve completed your deep work session.');
        }
    }

    populateDeepWorkSubjectsAndTasks() {
        const subjectsList = document.getElementById('deep-subjects-list');
        const tasksList = document.getElementById('deep-tasks-list');

        if (!subjectsList || !tasksList) {
            return;
        }

        subjectsList.innerHTML = '';
        tasksList.innerHTML = '';

        const snapshot = this.normalizeFocusData(this.focusData);
        const completed = snapshot.completedTasks || {};

        const subjects = snapshot.subjects.slice(0, 5);
        if (subjects.length > 0) {
            subjects.forEach(subject => {
                const li = document.createElement('li');
                li.textContent = subject;
                subjectsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No subjects added';
            li.style.opacity = '0.5';
            li.style.fontStyle = 'italic';
            subjectsList.appendChild(li);
        }

        const tasks = snapshot.tasks.filter(task => !completed[task]).slice(0, 5);
        if (tasks.length > 0) {
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = task;
                tasksList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No tasks added';
            li.style.opacity = '0.5';
            li.style.fontStyle = 'italic';
            tasksList.appendChild(li);
        }
    }

    stopDeepWorkTimer() {
        if (this.deepWorkTimeInterval) {
            clearInterval(this.deepWorkTimeInterval);
            this.deepWorkTimeInterval = null;
        }
    }

    updateSessionButtons() {
        const startBtn = document.getElementById('start-session');
        const pauseBtn = document.getElementById('pause-session');
        const stopBtn = document.getElementById('stop-session');
        
        // Also update deep work buttons
        const deepWorkStart = document.getElementById('deep-work-start');
        const deepWorkPause = document.getElementById('deep-work-pause');
        const deepWorkStop = document.getElementById('deep-work-stop');

        if (this.isSessionActive) {
            // Session is running
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = 'RUNNING...';
            }
            if (deepWorkStart) {
                deepWorkStart.disabled = true;
                deepWorkStart.textContent = 'RUNNING...';
            }
            if (pauseBtn) pauseBtn.disabled = false;
            if (deepWorkPause) deepWorkPause.disabled = false;
            if (stopBtn) stopBtn.disabled = false;
            if (deepWorkStop) deepWorkStop.disabled = false;
        } else if (this.isPaused) {
            // Session is paused
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = 'RESUME';
            }
            if (deepWorkStart) {
                deepWorkStart.disabled = false;
                deepWorkStart.textContent = 'RESUME';
            }
            if (pauseBtn) pauseBtn.disabled = true;
            if (deepWorkPause) deepWorkPause.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            if (deepWorkStop) deepWorkStop.disabled = false;
        } else {
            // Session is stopped
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = 'START';
            }
            if (deepWorkStart) {
                deepWorkStart.disabled = false;
                deepWorkStart.textContent = 'START';
            }
            if (pauseBtn) pauseBtn.disabled = true;
            if (deepWorkPause) deepWorkPause.disabled = true;
            if (stopBtn) stopBtn.disabled = true;
            if (deepWorkStop) deepWorkStop.disabled = true;
        }
    }

    async saveSession() {
        await this.saveSessionToFirestore();
    }

    displayRandomQuote() {
        const quote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
        
        const quoteTextElement = document.getElementById('quote-text');
        const quoteAuthorElement = document.getElementById('quote-author');
        
        if (quoteTextElement) quoteTextElement.textContent = `"${quote.text}"`;
        if (quoteAuthorElement) quoteAuthorElement.textContent = `- ${quote.author}`;
    }

    // Utility method to format duration
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Method to get current session info
    getCurrentSessionInfo() {
        return {
            isActive: this.isSessionActive,
            isPaused: this.isPaused,
            duration: this.sessionDuration,
            startTime: this.sessionStartTime
        };
    }

    // Method to export session data
    async exportSessionData() {
        try {
            const user = this.auth.currentUser;
            if (!user) return null;

            const sessionsRef = this.db.collection('users').doc(user.uid).collection('focusSessions');
            const sessions = await sessionsRef.orderBy('startTime', 'desc').get();
            
            const sessionData = [];
            sessions.forEach(doc => {
                sessionData.push(doc.data());
            });
            
            return sessionData;
        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Export Error',
                message: 'Failed to export session data. Please try again.',
                details: error.message || 'Unknown error occurred during export',
                type: 'error'
            });
            return null;
        }
    }

    // Load user goals from Firestore
    async loadGoals() {
        try {
            if (!this.auth.currentUser) return;
            
            const user = this.auth.currentUser;
            const goalsSnapshot = await this.db.collection('users').doc(user.uid).collection('goals')
                .where('status', '==', 'active')
                .get();
            
            const goalSelector = document.getElementById('session-task') || document.getElementById('session-goal');
            if (goalSelector && goalSelector.tagName && goalSelector.tagName.toLowerCase() === 'select') {
                // Clear existing options except the first one
                while (goalSelector.children.length > 1) {
                    goalSelector.removeChild(goalSelector.lastChild);
                }
                
                goalsSnapshot.forEach(doc => {
                    const goal = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = goal.title;
                    goalSelector.appendChild(option);
                });
            } else {
                // Current UI uses a text input for tasks; skip select population
            }
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }

    // Load weekly statistics (analytics disabled)
    async loadWeeklyStats() {
        const statsSection = document.querySelector('.weekly-trends');
        const chartElement = document.getElementById('weekly-chart');
        const subjectList = document.getElementById('subject-stats');

        if (statsSection) {
            statsSection.classList.add('hidden');
        }

        if (chartElement) {
            chartElement.innerHTML = '';
        }

        if (subjectList) {
            subjectList.innerHTML = '';
        }

        this.weeklyStats = {};
        this.subjectStats = {};
    }

    // ---------- Deep Focus helpers used by deep-focus.html ----------
    // Persist a deep session and update in-memory stats
    async recordDeepSession(durationMs, subject, task) {
        try {
            const minutes = Math.max(0, Math.round(durationMs / 60000));
            // Update in-memory counters
            const todayStr = new Date().toISOString().split('T')[0];
            this.deepStats.todayMinutes += minutes;
            this.deepStats.sessions += 1;
            this.deepStats.longest = Math.max(this.deepStats.longest, minutes);
            this.deepStats.totalMinutes += minutes;
            this.deepStats.totalSessions += 1;

            if (this.auth?.currentUser) {
                const user = this.auth.currentUser;
                const sessionData = {
                    userId: user.uid,
                    startTime: new Date(Date.now() - durationMs).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: minutes, // store minutes for deep sessions for simplicity
                    subject: subject || null,
                    goalId: task || null,
                    deep: true,
                    targetDuration: this.targetDuration || 0,
                    completed: false,
                    date: todayStr,
                    createdAt: new Date().toISOString()
                };
                await this.db.collection('users').doc(user.uid).collection('focusSessions').add(sessionData);
            } else {
                console.warn('Deep focus session stored in memory only; sign in to sync with Firebase.');
            }
        } catch (e) {
            console.error('recordDeepSession error:', e);
        }
    }

    // Load deep metrics from Firestore or local storage
    async loadDeepMetrics() {
        try {
            // Reset
            this.deepStats = { todayMinutes: 0, sessions: 0, longest: 0, totalMinutes: 0, totalSessions: 0 };
            const todayStr = new Date().toISOString().split('T')[0];

            if (this.auth?.currentUser) {
                const user = this.auth.currentUser;
                const coll = this.db.collection('users').doc(user.uid).collection('focusSessions');
                // Today deep sessions
                const todaySnap = await coll.where('deep', '==', true).where('date', '==', todayStr).get();
                todaySnap.forEach(d => {
                    const m = d.data().duration || 0; // minutes
                    this.deepStats.todayMinutes += m;
                    this.deepStats.sessions += 1;
                });
                // Recent deep sessions (30 days) to compute longest and avg
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const recentSnap = await coll.where('deep', '==', true).where('startTime', '>=', thirtyDaysAgo.toISOString()).get();
                recentSnap.forEach(d => {
                    const m = d.data().duration || 0;
                    this.deepStats.totalMinutes += m;
                    this.deepStats.totalSessions += 1;
                    this.deepStats.longest = Math.max(this.deepStats.longest, m);
                });
            } else {
                console.warn('Deep focus metrics require authentication to load history.');
            }
        } catch (e) {
            console.warn('loadDeepMetrics warning:', e);
        }
    }

    // Update progress ring for target time
    updateProgressRing() {
        const progressRing = document.getElementById('progress-ring');
        const targetTime = this.targetDuration;
        
        if (targetTime > 0) {
            progressRing.style.display = 'block';
            this.updateProgressRingValue();
        } else {
            progressRing.style.display = 'none';
        }
    }

    // Update progress ring value during session
    updateProgressRingValue() {
        if (this.targetDuration <= 0) return;
        
        const progressCircle = document.getElementById('progress-circle');
        const progressText = document.getElementById('progress-text');
        
        if (progressCircle && progressText) {
            const elapsedMinutes = this.sessionDuration / 60;
            const percentage = Math.min((elapsedMinutes / this.targetDuration) * 100, 100);
            const circumference = 2 * Math.PI * 25; // radius = 25
            const offset = circumference - (percentage / 100) * circumference;
            
            progressCircle.style.strokeDashoffset = offset;
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    // Enhanced session saving with subject and goal tracking
    async saveSessionToFirestore() {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const sessionData = {
                userId: user.uid,
                startTime: this.sessionStartTime.toISOString(),
                endTime: new Date().toISOString(),
                duration: this.sessionDuration,
                subject: this.currentSubject || null,
                goalId: this.currentGoal || null,
                targetDuration: this.targetDuration,
                completed: this.targetDuration > 0 ? this.sessionDuration >= (this.targetDuration * 60) : false,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };

            await this.db.collection('users').doc(user.uid).collection('focusSessions').add(sessionData);
            
            // Save goals and subjects to user profile
            if (this.currentGoal && this.currentGoal.trim()) {
                await this.saveUserGoal(this.currentGoal.trim());
            }
            if (this.currentSubject && this.currentSubject.trim()) {
                await this.saveUserSubject(this.currentSubject.trim());
            }
            
            // Update goal progress if session was linked to a goal
            if (this.currentGoal && sessionData.completed) {
                await this.updateGoalProgress(this.currentGoal, this.sessionDuration);
            }
            
            // Reload user data to show updated suggestions
            this.loadUserData();
            
            console.log('Enhanced focus session saved:', sessionData);
        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Save Session Error',
                message: 'Failed to save focus session to the cloud. Session data is saved locally.',
                details: error.message || 'Unknown error occurred while saving session',
                type: 'warning'
            });
        }
    }

    // Update goal progress in Firestore
    async updateGoalProgress(goalId, sessionDuration) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;
            
            const goalRef = this.db.collection('users').doc(user.uid).collection('goals').doc(goalId);
            const goalDoc = await goalRef.get();
            
            if (goalDoc.exists) {
                const goal = goalDoc.data();
                const newProgress = (goal.currentValue || 0) + (sessionDuration / 60); // Convert to minutes
                
                await goalRef.update({
                    currentValue: newProgress,
                    lastUpdated: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error updating goal progress:', error);
        }
    }

    async loadSavedData() {
        try {
            await this.loadUserData();
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    async loadUserData() {
        try {
            if (!this.db || !this.auth?.currentUser) {
                this.renderFocusData(this.focusData);
                return;
            }

            const userDoc = await this.db.collection('users').doc(this.auth.currentUser.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data?.focusData) {
                    this.focusData = this.normalizeFocusData(data.focusData);
                    this.targetDuration = this.focusData.targetDuration;
                }
            }

            this.renderFocusData(this.focusData);
            this.setTargetDuration(this.focusData.targetDuration, { persist: false });
        } catch (error) {
            console.error('Error loading focus data:', error);
            this.renderFocusData(this.focusData);
        }
    }

    renderFocusData(focusData) {
        this.populateUserList('tasks-list', focusData.tasks, 'task-item');
        this.populateUserList('subjects-list', focusData.subjects, 'subject-item');
        this.populateDeepWorkSubjectsAndTasks?.();
    }

    populateUserList(containerId, items, itemClass) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const list = Array.isArray(items) ? items : [];
        container.innerHTML = '';
        const isSubjectList = containerId.includes('subject');

        list.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = itemClass;
            itemElement.setAttribute('data-value', item);

            const isTask = itemClass.includes('task') || itemClass.includes('goal');
            if (isTask && this.loadTaskCompletionState(item)) {
                itemElement.classList.add('completed');
            }

            const text = document.createElement('span');
            text.className = 'item-text';
            text.textContent = item;

            const btn = document.createElement('button');
            btn.className = 'remove-btn delete-btn';
            const isSubject = isSubjectList || itemClass.includes('subject');
            btn.setAttribute('data-type', isSubject ? 'subject' : 'goal');
            btn.setAttribute('data-value', item);
            btn.setAttribute('title', 'Delete');
            btn.setAttribute('aria-label', 'Delete');
            btn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';

            itemElement.appendChild(text);
            itemElement.appendChild(btn);
            container.appendChild(itemElement);
        });

        console.log(`Rendered ${list.length} items in ${containerId}`);
    }

    async saveUserGoal(goal) {
        try {
            const trimmedGoal = goal.trim();
            if (!trimmedGoal) return;

            const tasks = [...this.focusData.tasks];
            if (!tasks.includes(trimmedGoal)) {
                tasks.push(trimmedGoal);
            }
            if (tasks.length > 10) {
                tasks.splice(0, tasks.length - 10);
            }

            this.focusData.tasks = tasks;
            delete this.focusData.completedTasks[trimmedGoal];
            this.renderFocusData(this.focusData);

            if (this.auth?.currentUser) {
                await this.persistFocusData();
            }
        } catch (error) {
            console.error('Error saving user goal:', error);
        }
    }

    async saveUserSubject(subject) {
        try {
            const trimmedSubject = subject.trim();
            if (!trimmedSubject) return;

            const subjects = [...this.focusData.subjects];
            if (!subjects.includes(trimmedSubject)) {
                subjects.push(trimmedSubject);
            }
            if (subjects.length > 10) {
                subjects.splice(0, subjects.length - 10);
            }

            this.focusData.subjects = subjects;
            this.renderFocusData(this.focusData);

            if (this.auth?.currentUser) {
                await this.persistFocusData();
            }
        } catch (error) {
            console.error('Error saving user subject:', error);
        }
    }

    async removeUserGoal(goal) {
        try {
            this.focusData.tasks = this.focusData.tasks.filter(g => g !== goal);
            delete this.focusData.completedTasks[goal];
            this.renderFocusData(this.focusData);

            if (this.auth?.currentUser) {
                await this.persistFocusData();
            }
        } catch (error) {
            console.error('Error removing user goal:', error);
        }
    }

    async removeUserSubject(subject) {
        try {
            this.focusData.subjects = this.focusData.subjects.filter(s => s !== subject);
            this.renderFocusData(this.focusData);

            if (this.auth?.currentUser) {
                await this.persistFocusData();
            }
        } catch (error) {
            console.error('Error removing user subject:', error);
        }
    }

    // Save task completion state
    saveTaskCompletionState(taskText, isCompleted) {
        try {
            if (isCompleted) {
                this.focusData.completedTasks[taskText] = true;
            } else {
                delete this.focusData.completedTasks[taskText];
            }

            if (this.auth?.currentUser) {
                this.persistFocusData().catch(err => console.error('Error syncing completion state:', err));
            }
        } catch (error) {
            console.error('Error saving task completion state:', error);
        }
    }

    // Load task completion state
    loadTaskCompletionState(taskText) {
        try {
            return !!this.focusData.completedTasks[taskText];
        } catch (error) {
            console.error('Error loading task completion state:', error);
            return false;
        }
    }

    showAddConfirmation(icon) {
        const originalText = icon.textContent;
        
        // Show confirmation
        icon.textContent = '✓';
        icon.style.background = 'rgba(76, 175, 80, 1)';
        icon.style.transform = 'scale(1.2)';
        
        // Reset after 1 second
        setTimeout(() => {
            icon.textContent = originalText;
            icon.style.background = 'rgba(76, 175, 80, 0.2)';
            icon.style.transform = 'scale(1)';
        }, 1000);
    }

    showSaveConfirmation(button, message) {
        const originalText = button.textContent;
        const originalColor = button.style.backgroundColor;
        
        // Show confirmation
        button.textContent = message;
        button.style.backgroundColor = 'rgba(76, 175, 80, 1)';
        button.style.transform = 'scale(0.95)';
        
        // Reset after 1.5 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalColor;
            button.style.transform = 'scale(1)';
        }, 1500);
    }

    // Method to get subjects and tasks data for deep focus mode
    async getSubjectsAndTasksData() {
        try {
            const userRef = this.getUserRef();
            if (userRef) {
                const doc = await userRef.get();
                if (doc.exists && doc.data().focusData) {
                    this.focusData = this.normalizeFocusData(doc.data().focusData);
                }
            }

            return {
                subjects: [...this.focusData.subjects],
                tasks: [...this.focusData.tasks]
            };
        } catch (error) {
            console.error('Error getting subjects and tasks data:', error);
            return {
                subjects: [...this.focusData.subjects],
                tasks: [...this.focusData.tasks]
            };
        }
    }

}

// Initialize Focus Mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.focusMode = new FocusMode();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusMode;
}
