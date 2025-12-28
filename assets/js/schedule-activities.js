// Simplified Schedule Activities for BitHab
document.addEventListener('DOMContentLoaded', () => {
    // Initialize custom dialogs
    if (!window.customDialogs) {
        window.customDialogs = new CustomDialogs();
    }
    
    const state = {
        activities: [],
        schedules: {}, // { activityId: { subActivityId: { 'YYYY-MM-DD': count } } }
        skipped: {}, // { activityId: { subActivityId: { 'YYYY-MM-DD': true } } }
        cleared: {}, // { activityId: { subActivityId: { 'YYYY-MM-DD': true } } } - tracks explicitly cleared dates
        patterns: {}, // { activityId: { subActivityId: { type, days/dates } } }
        selectedActivityId: null,
        selectedSubActivityId: null,
        currentDate: null,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear()
    };

    let userId = null;
    let db = null;
    let lastSaveTime = 0; // Track when we last saved to prevent reload race conditions

    // DOM Elements
    const setScheduleBtn = document.getElementById('set-schedule-btn');
    const calendarContainer = document.getElementById('schedule-calendar-container');
    const activityStats = document.getElementById('activity-stats');
    const backBtn = document.getElementById('back-to-activities');
    
    const patternModal = document.getElementById('pattern-modal');
    const closePatternModal = document.getElementById('close-pattern-modal');
    const savePatternBtn = document.getElementById('save-pattern-btn');
    const clearPatternBtn = document.getElementById('clear-pattern-btn');
    
    const dateModal = document.getElementById('date-modal');
    const closeDateModal = document.getElementById('close-date-modal');
    const dateModalTitle = document.getElementById('date-modal-title');
    const dateModalInfo = document.getElementById('date-modal-info');
    const markCompletedBtn = document.getElementById('mark-completed-btn');
    const markScheduledBtn = document.getElementById('mark-scheduled-btn');

    // Initialize
    const init = async () => {
        try {
            await waitForAuth();
            await Promise.all([loadActivities(), loadSchedules()]);
            renderActivitySelector();
            renderStats();
            setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    };

    const waitForAuth = () => {
        return new Promise((resolve, reject) => {
            const checkAuth = () => {
                if (window.authManager && window.authManager.currentUser) {
                    userId = window.authManager.currentUser.uid;
                    db = window.authManager.db;
                    resolve();
                } else if (firebase.auth().currentUser) {
                    userId = firebase.auth().currentUser.uid;
                    db = firebase.firestore();
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
            setTimeout(() => reject(new Error('Auth timeout')), 10000);
        });
    };

    const setupEventListeners = () => {
        backBtn.addEventListener('click', () => window.location.href = 'activities.html');

        setScheduleBtn.addEventListener('click', () => openPatternModal());
        
        closeDateModal.addEventListener('click', () => dateModal.classList.add('hidden'));
        markCompletedBtn.addEventListener('click', () => setDateStatus('completed'));
        markScheduledBtn.addEventListener('click', () => setDateStatus('planned'));

        closePatternModal.addEventListener('click', () => patternModal.classList.add('hidden'));
        savePatternBtn.addEventListener('click', () => savePattern());
        clearPatternBtn.addEventListener('click', () => clearPattern());

        dateModal.addEventListener('click', (e) => {
            if (e.target === dateModal) {
                dateModal.classList.add('hidden');
            }
        });

        patternModal.addEventListener('click', (e) => {
            if (e.target === patternModal) {
                patternModal.classList.add('hidden');
            }
        });

        // Click outside activity/subactivity grids to deselect
        document.addEventListener('click', (e) => {
            const activityGrid = document.getElementById('activity-grid');
            const subactivitySection = document.getElementById('subactivity-section');
            const setScheduleBtn = document.getElementById('set-schedule-btn');
            
            // Check if click is on an activity or subactivity card
            if (e.target.closest('.activity-card') || e.target.closest('.subactivity-card')) {
                return; // Don't deselect if clicking on a card
            }
            
            // Check if click is outside all interactive areas
            if (!activityGrid.contains(e.target) && 
                !subactivitySection.contains(e.target) && 
                !setScheduleBtn.contains(e.target) &&
                !e.target.closest('.modal') &&
                !e.target.closest('.modal-content') &&
                !e.target.closest('.calendar-day') &&
                !e.target.closest('.toast') &&
                !e.target.closest('.custom-modal-overlay') &&
                !e.target.closest('.custom-modal') &&
                !e.target.closest('.custom-modal-btn') &&
                !e.target.closest('.status-action-btn') &&
                !e.target.closest('#custom-modal-container') &&
                !e.target.closest('#custom-toast-container') &&
                !e.target.closest('.date-modal-content') &&
                !e.target.closest('.date-status-actions')) {
                // Only deselect if something was selected
                if (state.selectedActivityId || state.selectedSubActivityId) {
                    state.selectedActivityId = null;
                    state.selectedSubActivityId = null;
                    renderActivitySelector();
                    renderSubActivities();
                    renderCalendar();
                    renderStats();
                }
            }
        });

        // Pattern type selector
        document.querySelectorAll('input[name="pattern-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('weekly-options').style.display = e.target.value === 'weekly' ? 'block' : 'none';
                document.getElementById('monthly-options').style.display = e.target.value === 'monthly' ? 'block' : 'none';
                document.getElementById('daily-options').style.display = e.target.value === 'daily' ? 'block' : 'none';
                
                // Show/hide main start date section
                document.getElementById('start-date-section').style.display = e.target.value === 'daily' ? 'none' : 'block';
            });
        });

        // Generate date selector for monthly pattern
        const dateSelector = document.getElementById('date-selector');
        for (let i = 1; i <= 31; i++) {
            const div = document.createElement('div');
            div.className = 'date-option';
            div.textContent = i;
            div.dataset.date = i;
            div.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
            dateSelector.appendChild(div);
        }
    };

    // Data Loading
    const loadActivities = async () => {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                state.activities = data.activities || [];
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    };

    const loadSchedules = async () => {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                state.schedules = data.activitySchedules || {};
                state.skipped = data.activitySkipped || {};
                state.cleared = data.activityCleared || {};
                state.patterns = data.activityPatterns || {};
            }
            
            // Always sync from main calendar to pick up any new completions
            // This respects cleared data - won't re-add cleared dates
            await syncWithMainCalendar();
            
            // Also sync schedule completions back to main calendar
            await syncSchedulesToMainCalendar();
        } catch (error) {
            console.error('Error loading schedules:', error);
        }
    };

    const syncWithMainCalendar = async () => {
        try {
            // Load logs from main calendar
            const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
            const logs = {};
            logsSnapshot.forEach(doc => {
                const logData = doc.data();
                logs[doc.id] = logData.loggedSubActivityIds || [];
            });

            let hasChanges = false;

            // Sync completions for each activity
            state.activities.forEach(activity => {
                if (!state.schedules[activity.id]) {
                    state.schedules[activity.id] = {};
                }

                // Sync main activity
                if (!state.schedules[activity.id].main) {
                    state.schedules[activity.id].main = {};
                }

                // Check each date in logs
                Object.keys(logs).forEach(dateStr => {
                    const loggedIds = logs[dateStr];
                    if (loggedIds.includes(activity.id)) {
                        // Main activity was completed on this date - set to 1 if not already set
                        // Skip if this date was explicitly cleared
                        const isCleared = state.cleared[activity.id]?.main?.[dateStr];
                        if (!state.schedules[activity.id].main[dateStr] && !isCleared) {
                            state.schedules[activity.id].main[dateStr] = 1;
                            hasChanges = true;
                        }
                    }

                    // Check sub-activities
                    if (activity.subActivities) {
                        activity.subActivities.forEach(sub => {
                            if (loggedIds.includes(sub.id)) {
                                if (!state.schedules[activity.id][sub.id]) {
                                    state.schedules[activity.id][sub.id] = {};
                                }
                                // Skip if this date was explicitly cleared
                                const isCleared = state.cleared[activity.id]?.[sub.id]?.[dateStr];
                                if (!state.schedules[activity.id][sub.id][dateStr] && !isCleared) {
                                    state.schedules[activity.id][sub.id][dateStr] = 1;
                                    hasChanges = true;
                                }
                            }
                        });
                    }
                });
            });

            // Save if any new completions were synced
            if (hasChanges) {
                await saveSchedules();
                console.log('Synced previous logs from main calendar');
            }
        } catch (error) {
            console.error('Error syncing with main calendar:', error);
        }
    };

    // Sync all schedule completions TO the main calendar (index page logs)
    const syncSchedulesToMainCalendar = async () => {
        try {
            // Load existing logs from main calendar
            const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
            const existingLogs = {};
            logsSnapshot.forEach(doc => {
                const logData = doc.data();
                existingLogs[doc.id] = logData.loggedSubActivityIds || [];
            });

            // Create mapping of subactivity ID to activity ID
            const subActivityToActivity = {};
            state.activities.forEach(activity => {
                if (activity.subActivities) {
                    activity.subActivities.forEach(sub => {
                        subActivityToActivity[sub.id] = activity.id;
                    });
                }
            });

            // Collect all dates that need updating
            const datesToUpdate = {};

            // Go through all schedule completions
            Object.keys(state.schedules).forEach(activityId => {
                const activitySchedule = state.schedules[activityId];
                
                Object.keys(activitySchedule).forEach(subId => {
                    const subSchedule = activitySchedule[subId];
                    
                    Object.keys(subSchedule).forEach(dateStr => {
                        const count = subSchedule[dateStr];
                        if (count > 0) {
                            // Determine which ID to sync
                            const idToSync = subId !== 'main' ? subId : activityId;
                            
                            // Check if already in main calendar logs
                            const existingForDate = existingLogs[dateStr] || [];
                            if (!existingForDate.includes(idToSync)) {
                                if (!datesToUpdate[dateStr]) {
                                    datesToUpdate[dateStr] = new Set(existingForDate);
                                }
                                datesToUpdate[dateStr].add(idToSync);
                            }
                        }
                    });
                });
            });

            // Update logs for each date that has new completions
            const batch = db.batch();
            let batchCount = 0;

            for (const dateStr of Object.keys(datesToUpdate)) {
                const loggedIds = Array.from(datesToUpdate[dateStr]);
                
                // Create enhanced log structure
                const activitiesGrouped = {};
                loggedIds.forEach(id => {
                    const parentActivityId = subActivityToActivity[id] || id;
                    if (!activitiesGrouped[parentActivityId]) {
                        activitiesGrouped[parentActivityId] = {
                            subActivities: [],
                            loggedAt: firebase.firestore.FieldValue.serverTimestamp()
                        };
                    }
                    if (subActivityToActivity[id]) {
                        activitiesGrouped[parentActivityId].subActivities.push(id);
                    }
                });

                const logRef = db.collection('users').doc(userId).collection('logs').doc(dateStr);
                batch.set(logRef, {
                    loggedSubActivityIds: loggedIds,
                    activities: activitiesGrouped,
                    migrated: true
                });
                batchCount++;
            }

            if (batchCount > 0) {
                await batch.commit();
                console.log(`Synced ${batchCount} dates from schedule to main calendar`);
            }
        } catch (error) {
            console.error('Error syncing schedules to main calendar:', error);
        }
    };

    // Sync a sub-activity completion TO the main calendar (index page logs)
    const syncCompletionToMainCalendar = async (activityId, subActivityId, dateStr, isCompleted) => {
        try {
            // Get the log document for this date
            const logRef = db.collection('users').doc(userId).collection('logs').doc(dateStr);
            const logDoc = await logRef.get();
            
            let loggedIds = [];
            if (logDoc.exists) {
                const data = logDoc.data();
                loggedIds = data.loggedSubActivityIds || [];
            }
            
            // Determine which ID to sync - use subActivityId if it's a real sub-activity, otherwise use activityId
            const idToSync = subActivityId !== 'main' ? subActivityId : activityId;
            
            if (isCompleted) {
                // Add to logs if not already present
                if (!loggedIds.includes(idToSync)) {
                    loggedIds.push(idToSync);
                    
                    // Create enhanced log structure
                    const activitiesGrouped = {};
                    const subActivityToActivity = {};
                    
                    // Create mapping of subactivity ID to activity ID
                    state.activities.forEach(activity => {
                        if (activity.subActivities) {
                            activity.subActivities.forEach(sub => {
                                subActivityToActivity[sub.id] = activity.id;
                            });
                        }
                    });
                    
                    // Group logged subactivities by their parent activity
                    loggedIds.forEach(id => {
                        const parentActivityId = subActivityToActivity[id] || id;
                        if (!activitiesGrouped[parentActivityId]) {
                            activitiesGrouped[parentActivityId] = {
                                subActivities: [],
                                loggedAt: firebase.firestore.FieldValue.serverTimestamp()
                            };
                        }
                        if (subActivityToActivity[id]) {
                            activitiesGrouped[parentActivityId].subActivities.push(id);
                        }
                    });
                    
                    await logRef.set({
                        loggedSubActivityIds: loggedIds,
                        activities: activitiesGrouped,
                        migrated: true
                    });
                    
                    console.log('Synced completion to main calendar:', idToSync, dateStr);
                }
            }
            // Note: We don't remove from main calendar when clearing in schedule - that's a separate decision
        } catch (error) {
            console.error('Error syncing completion to main calendar:', error);
        }
    };

    const saveSchedules = async () => {
        if (!userId) {
            console.error('Cannot save schedules: userId is null');
            return false;
        }
        if (!db) {
            console.error('Cannot save schedules: db is not initialized');
            return false;
        }
        
        const saveTime = Date.now();
        
        // Deep clone the data to ensure we're saving the current state
        const schedulesToSave = JSON.parse(JSON.stringify(state.schedules));
        const skippedToSave = JSON.parse(JSON.stringify(state.skipped));
        const clearedToSave = JSON.parse(JSON.stringify(state.cleared));
        const patternsToSave = JSON.parse(JSON.stringify(state.patterns));
        
        console.log('Saving schedules:', { schedules: schedulesToSave, skipped: skippedToSave });
        
        try {
            await db.collection('users').doc(userId).set({
                activitySchedules: schedulesToSave,
                activitySkipped: skippedToSave,
                activityCleared: clearedToSave,
                activityPatterns: patternsToSave,
                lastUpdated: saveTime,
                lastUpdatedBy: 'schedule_activities_page'
            }, { merge: true });
            
            lastSaveTime = saveTime;
            console.log('Schedules successfully saved to Firebase at', saveTime);
            
            // Update BitHabDataSync lastSyncTime to prevent reload race conditions
            if (window.BitHabDataSync) {
                window.BitHabDataSync.lastSyncTime = saveTime;
            }
            
            return true;
        } catch (error) {
            console.error('Error saving schedules:', error);
            if (window.customDialogs) {
                window.customDialogs.showToast('Failed to save - please try again', 'error', 3000);
            }
            return false;
        }
    };

    // Rendering
    const renderActivitySelector = () => {
        const activityGrid = document.getElementById('activity-grid');
        
        if (state.activities.length === 0) {
            activityGrid.innerHTML = `
                <div class="empty-state-simple">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No Activities Yet</h3>
                    <p>Create activities first to schedule them</p>
                    <button onclick="window.location.href='activities.html'" class="back-btn">
                        Go to Activities
                    </button>
                </div>
            `;
            calendarContainer.innerHTML = '';
            return;
        }

        activityGrid.innerHTML = state.activities.map(activity => {
            const isSelected = state.selectedActivityId === activity.id;
            const hasSubactivities = activity.subActivities && activity.subActivities.length > 0;
            return `
                <div class="activity-card ${isSelected ? 'selected' : ''}" 
                     data-id="${activity.id}"
                     onclick="window.scheduleApp.selectActivity('${activity.id}')">
                    <div class="activity-card-color" style="background: ${activity.color || '#888'}"></div>
                    <div class="activity-card-content">
                        <div class="activity-card-name">${activity.name}</div>
                        ${hasSubactivities ? `<div class="activity-card-meta"><i class="fas fa-sitemap"></i> ${activity.subActivities.length} sub-activities</div>` : ''}
                    </div>
                    ${isSelected ? '<i class="fas fa-check-circle activity-card-check"></i>' : ''}
                </div>
            `;
        }).join('');
        
        renderSubActivities();
        renderCalendar();
        renderStats();
    };

    const renderSubActivities = () => {
        const subActivitySection = document.getElementById('subactivity-section');
        const subActivityGrid = document.getElementById('subactivity-grid');
        
        if (!state.selectedActivityId) {
            subActivitySection.style.display = 'none';
            setScheduleBtn.style.display = 'none';
            return;
        }

        const activity = state.activities.find(a => a.id === state.selectedActivityId);
        
        if (!activity || !activity.subActivities || activity.subActivities.length === 0) {
            subActivitySection.style.display = 'none';
            setScheduleBtn.style.display = 'inline-flex';
            updateScheduleButtonText();
            return;
        }

        // Activity has subactivities - show cards but hide button until subactivity is selected
        subActivitySection.style.display = 'block';
        subActivityGrid.innerHTML = activity.subActivities.map(sub => {
            const isSelected = state.selectedSubActivityId === sub.id;
            return `
                <div class="subactivity-card ${isSelected ? 'selected' : ''}" 
                     data-id="${sub.id}"
                     onclick="window.scheduleApp.selectSubActivity('${sub.id}')">
                    <div class="activity-card-color" style="background: ${sub.color || '#888'}"></div>
                    <div class="activity-card-content">
                        <div class="activity-card-name">${sub.name}</div>
                    </div>
                    ${isSelected ? '<i class="fas fa-check-circle activity-card-check"></i>' : ''}
                </div>
            `;
        }).join('');
        
        // Only show schedule button if a subactivity is selected
        setScheduleBtn.style.display = state.selectedSubActivityId ? 'inline-flex' : 'none';
        updateScheduleButtonText();
    };
    
    const updateScheduleButtonText = () => {
        if (!state.selectedActivityId) return;
        
        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const hasPattern = state.patterns[actId]?.[subId];
        
        setScheduleBtn.innerHTML = hasPattern 
            ? '<i class="fas fa-calendar-edit"></i> Edit Schedule Pattern'
            : '<i class="fas fa-calendar-days"></i> Set Schedule Pattern';
    };

    const renderStats = () => {
        if (!state.selectedActivityId) {
            activityStats.innerHTML = `
                <div class="stat-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <p>Select an activity to view progress</p>
                </div>
            `;
            return;
        }

        const activity = state.activities.find(a => a.id === state.selectedActivityId);
        if (!activity) {
            activityStats.innerHTML = `
                <div class="stat-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <p>Select an activity to view progress</p>
                </div>
            `;
            return;
        }
        
        const activitySchedules = state.schedules[state.selectedActivityId] || {};
        const subActId = state.selectedSubActivityId || 'main';
        const schedule = activitySchedules[subActId] || {};
        
        // Get pattern for date filtering
        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const pattern = state.patterns[actId]?.[subId];
        const startDate = pattern?.startDate ? new Date(pattern.startDate + 'T00:00:00') : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const currentMonthKey = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}`;
        
        // Get skipped data
        const skipped = state.skipped[actId]?.[subId] || {};
        
        // Calculate this month stats
        const scheduledDates = getScheduledDates(currentMonthKey).filter(date => {
            const dateObj = new Date(date + 'T00:00:00');
            return (!startDate || dateObj >= startDate) && dateObj <= today;
        });
        
        // Count completions this month (sum of all completion counts)
        const thisMonthCompletions = Object.keys(schedule).reduce((sum, date) => {
            if (!date.startsWith(currentMonthKey) || !schedule[date] || schedule[date] === 0) return sum;
            const dateObj = new Date(date + 'T00:00:00');
            if ((!startDate || dateObj >= startDate) && dateObj <= today) {
                return sum + Number(schedule[date]);
            }
            return sum;
        }, 0);
        
        // Count skips this month (sum of all skip counts)
        const thisMonthSkips = Object.keys(skipped).reduce((sum, date) => {
            if (!date.startsWith(currentMonthKey) || !skipped[date] || skipped[date] === 0) return sum;
            const dateObj = new Date(date + 'T00:00:00');
            if ((!startDate || dateObj >= startDate) && dateObj <= today) {
                return sum + Number(skipped[date]);
            }
            return sum;
        }, 0);
        
        // This month scheduled includes pattern dates + manual completions + skips
        let thisMonthScheduled = scheduledDates.length;
        const thisMonthDates = new Set(scheduledDates);
        
        // Add manual completions/skips not in pattern
        Object.keys(schedule).forEach(date => {
            if (!date.startsWith(currentMonthKey)) return;
            const dateObj = new Date(date + 'T00:00:00');
            if (dateObj > today) return;
            const count = Number(schedule[date]);
            if (!thisMonthDates.has(date) && count > 0) {
                thisMonthScheduled++;
                thisMonthDates.add(date);
            }
            // Additional completions beyond first
            if (count > 1) {
                thisMonthScheduled += (count - 1);
            }
        });
        
        Object.keys(skipped).forEach(date => {
            if (!date.startsWith(currentMonthKey)) return;
            const dateObj = new Date(date + 'T00:00:00');
            if (dateObj > today) return;
            const count = Number(skipped[date]);
            if (!thisMonthDates.has(date) && count > 0) {
                thisMonthScheduled++;
                thisMonthDates.add(date);
            }
            // Additional skips beyond first
            if (count > 1) {
                thisMonthScheduled += (count - 1);
            }
        });

        // Count unique days recorded this month (days with completions or skips)
        const thisMonthRecordedDates = new Set();
        Object.keys(schedule).forEach(date => {
            if (date.startsWith(currentMonthKey) && schedule[date] > 0) {
                const dateObj = new Date(date + 'T00:00:00');
                if (dateObj <= today) {
                    thisMonthRecordedDates.add(date);
                }
            }
        });
        Object.keys(skipped).forEach(date => {
            if (date.startsWith(currentMonthKey) && skipped[date] > 0) {
                const dateObj = new Date(date + 'T00:00:00');
                if (dateObj <= today) {
                    thisMonthRecordedDates.add(date);
                }
            }
        });
        const thisMonthDaysRecorded = thisMonthRecordedDates.size;

        // Total completions = number of green dots (sum of completion counts)
        const allCompletedCount = Object.keys(schedule).reduce((sum, date) => {
            if (!schedule[date] || schedule[date] === 0) return sum;
            const dateObj = new Date(date + 'T00:00:00');
            if ((!startDate || dateObj >= startDate) && dateObj <= today) {
                return sum + Number(schedule[date]);
            }
            return sum;
        }, 0);
        
        // Total skipped = number of red dots (sum of skip counts)
        const allSkippedCount = Object.keys(skipped).reduce((sum, date) => {
            if (!skipped[date] || skipped[date] === 0) return sum;
            const dateObj = new Date(date + 'T00:00:00');
            if ((!startDate || dateObj >= startDate) && dateObj <= today) {
                return sum + Number(skipped[date]);
            }
            return sum;
        }, 0);
        
        // Total scheduled = only greens + reds (unmarked scheduled days are NOT counted)
        // This way, only dates that have been marked (completed or skipped) are considered for calculation
        const allScheduledDates = allCompletedCount + allSkippedCount;
        
        const completionRate = allScheduledDates > 0 ? Math.round((allCompletedCount / allScheduledDates) * 100) : 0;

        // If no schedule pattern exists, show different information
        if (allScheduledDates === 0) {
            const totalCompletions = Object.keys(schedule).reduce((sum, date) => {
                const count = schedule[date];
                return sum + (count && count !== 0 ? Number(count) : 0);
            }, 0);
            
            activityStats.innerHTML = `
                <div class="stat-placeholder">
                    <i class="fas fa-calendar-times"></i>
                    <p style="margin: 0.5rem 0;">No schedule pattern set</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">Click "Set Schedule Pattern" to create a recurring schedule</p>
                </div>
                ${activity.createdAt ? `
                <div class="stat-row" style="margin-top: 1rem;">
                    <span class="stat-label">
                        <i class="fas fa-calendar-day"></i> Created
                    </span>
                    <span class="stat-value">${new Date(activity.createdAt).toLocaleDateString()}</span>
                </div>
                ` : ''}
                ${totalCompletions > 0 ? `
                <div class="stat-row" ${!activity.createdAt ? 'style="margin-top: 1rem;"' : ''}>
                    <span class="stat-label">
                        <i class="fas fa-check-circle"></i> Manual Completions
                    </span>
                    <span class="stat-value">${totalCompletions}</span>
                </div>
                ` : ''}
            `;
            return;
        }

        activityStats.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">
                    <i class="fas fa-calendar-check"></i> This Month
                </span>
                <span class="stat-value">${thisMonthDaysRecorded} days recorded</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">
                    <i class="fas fa-check-circle"></i> Total Completions
                </span>
                <span class="stat-value">${allCompletedCount}/${allScheduledDates}</span>
            </div>
            
            ${allSkippedCount > 0 ? `
            <div class="stat-row">
                <span class="stat-label">
                    <i class="fas fa-ban"></i> Total Skipped
                </span>
                <span class="stat-value">${allSkippedCount}</span>
            </div>
            ` : ''}
            
            <div class="stat-row">
                <span class="stat-label">
                    <i class="fas fa-calendar-plus"></i> Total Scheduled
                </span>
                <span class="stat-value">${allScheduledDates}</span>
            </div>
            
            <div class="progress-container">
                <div class="progress-label">
                    <span>Completion Rate</span>
                    <span>${completionRate}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${completionRate}%">
                        ${completionRate > 15 ? completionRate + '%' : ''}
                    </div>
                </div>
            </div>
        `;
    };

    const renderCalendar = () => {
        if (!state.selectedActivityId) {
            calendarContainer.innerHTML = `
                <div class="calendar-placeholder">
                    <i class="fas fa-arrow-up"></i>
                    <p>Select an activity above to view and manage its schedule</p>
                </div>
            `;
            return;
        }

        const year = state.currentYear;
        const month = state.currentMonth;
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = `
            <div class="calendar-header">
                <button class="calendar-nav-btn" onclick="window.scheduleApp.changeMonth(-1)">‹</button>
                <h2>${monthName} ${year}</h2>
                <button class="calendar-nav-btn" onclick="window.scheduleApp.changeMonth(1)">›</button>
            </div>
            <div class="calendar-grid">
        `;

        // Weekday headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="calendar-weekday">${day}</div>`;
        });

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const subId = state.selectedSubActivityId || 'main';
            const completionCount = getDateStatus(state.selectedActivityId, subId, dateStr);
            const scheduled = isDateScheduled(dateStr);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const dateObj = new Date(dateStr + 'T00:00:00');
            const isPast = dateObj < today;
            const isPastOrToday = dateObj <= today;

            let classes = 'calendar-day';
            if (completionCount > 0) classes += ' completed';
            else if (scheduled) classes += ' planned';
            if (isToday) classes += ' today';
            if (scheduled && !isPastOrToday) classes += ' future';

            // Check if date is skipped
            const actId = state.selectedActivityId;
            const subId2 = state.selectedSubActivityId || 'main';
            const skipCount = state.skipped[actId]?.[subId2]?.[dateStr] || 0;
            
            if (skipCount > 0) {
                classes += ' skipped';
            }

            let statusIndicator = '';
            if (completionCount > 0 && skipCount > 0) {
                // Show multiple green dots and multiple red dots
                const greenDots = Array(Math.min(completionCount, 3)).fill('<span class="status-indicator dot"></span>').join('');
                const redDots = Array(Math.min(skipCount, 3)).fill('<span class="status-indicator skipped-indicator"></span>').join('');
                statusIndicator = `<span class="status-indicator-group" title="${completionCount} completion${completionCount > 1 ? 's' : ''}, ${skipCount} skipped">
                    ${greenDots}${redDots}
                </span>`;
            } else if (completionCount > 0) {
                // Show multiple green dots (max 3 visible)
                const dots = Array(Math.min(completionCount, 3)).fill('<span class="status-indicator dot"></span>').join('');
                statusIndicator = `<span class="status-indicator-group" title="${completionCount} completion${completionCount > 1 ? 's' : ''}">${dots}</span>`;
            } else if (skipCount > 0) {
                // Show multiple red dots (max 3 visible)
                const dots = Array(Math.min(skipCount, 3)).fill('<span class="status-indicator skipped-indicator"></span>').join('');
                statusIndicator = `<span class="status-indicator-group" title="${skipCount} skipped">${dots}</span>`;
            } else if (scheduled) {
                // Show blue circle for scheduled dates
                statusIndicator = '<span class="status-indicator">○</span>';
            }

            html += `
                <div class="${classes}" 
                     data-date="${dateStr}"
                     onclick="window.scheduleApp.handleDayClick('${dateStr}')">
                    <span class="day-number">${day}</span>
                    ${statusIndicator}
                </div>
            `;
        }

        html += `</div>`;
        calendarContainer.innerHTML = html;
    };

    const getDateStatus = (activityId, subActId, dateStr) => {
        const subId = subActId || 'main';
        return state.schedules[activityId]?.[subId]?.[dateStr] || null;
    };

    const isDateScheduled = (dateStr) => {
        if (!state.selectedActivityId) return false;
        
        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const pattern = state.patterns[actId]?.[subId];
        
        if (!pattern) return false;

        const date = new Date(dateStr + 'T00:00:00');
        const startDate = pattern.startDate ? new Date(pattern.startDate + 'T00:00:00') : null;
        
        // Check if date is before start date
        if (startDate && date < startDate) return false;
        
        if (pattern.type === 'daily') return true;
        
        if (pattern.type === 'weekly') {
            const dayOfWeek = date.getDay();
            return pattern.days && pattern.days.includes(dayOfWeek);
        }
        
        if (pattern.type === 'monthly') {
            const dayOfMonth = date.getDate();
            return pattern.dates && pattern.dates.includes(dayOfMonth);
        }
        
        return false;
    };

    const getScheduledDates = (monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const dates = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (isDateScheduled(dateStr)) {
                dates.push(dateStr);
            }
        }
        
        return dates;
    };

    const getAllScheduledDatesCount = () => {
        if (!state.selectedActivityId) return 0;
        
        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const schedule = state.schedules[actId]?.[subId] || {};
        const pattern = state.patterns[actId]?.[subId];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let totalScheduled = 0;
        const countedDates = new Set();
        
        // Count pattern-based scheduled dates (up to and including today)
        if (pattern && pattern.startDate) {
            const startDate = new Date(pattern.startDate + 'T00:00:00');
            const currentDate = new Date(startDate);
            
            while (currentDate <= today) {
                const dateStr = currentDate.toISOString().split('T')[0];
                if (isDateScheduled(dateStr)) {
                    countedDates.add(dateStr);
                    totalScheduled++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        // Add additional completions beyond the first for each date
        // And add any manually completed dates not in the pattern
        Object.keys(schedule).forEach(dateStr => {
            const dateObj = new Date(dateStr + 'T00:00:00');
            if (dateObj > today) return; // Skip future dates
            
            const count = schedule[dateStr];
            if (count && count > 0) {
                if (!countedDates.has(dateStr)) {
                    // This date wasn't in the pattern, count it as scheduled
                    totalScheduled++;
                    countedDates.add(dateStr);
                }
                
                // Additional completions beyond the first count as additional scheduled
                if (count > 1) {
                    totalScheduled += (count - 1);
                }
            }
        });
        
        // Add skipped dates to the total scheduled count
        const skipped = state.skipped[actId]?.[subId] || {};
        Object.keys(skipped).forEach(dateStr => {
            const dateObj = new Date(dateStr + 'T00:00:00');
            if (dateObj > today) return; // Skip future dates
            
            const skipCount = skipped[dateStr];
            if (skipCount && skipCount > 0) {
                if (!countedDates.has(dateStr)) {
                    // This date wasn't already counted, add it
                    totalScheduled++;
                    countedDates.add(dateStr);
                }
                
                // Each skip beyond the first counts as additional scheduled
                if (skipCount > 1) {
                    totalScheduled += (skipCount - 1);
                }
            }
        });
        
        return totalScheduled;
    };

    const handleDayClick = async (dateStr) => {
        try {
            if (!state.selectedActivityId) {
                if (window.customDialogs) {
                    await window.customDialogs.alert('Please select an activity first.', 'No Activity Selected');
                } else {
                    alert('Please select an activity first.');
                }
                return;
            }

            const activity = state.activities.find(a => a.id === state.selectedActivityId);
            if (!activity) {
                if (window.customDialogs) {
                    await window.customDialogs.alert('Activity not found.', 'Error');
                } else {
                    alert('Activity not found.');
                }
                return;
            }
            
            const subId = state.selectedSubActivityId || 'main';
            const scheduled = isDateScheduled(dateStr);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const clickedDate = new Date(dateStr + 'T00:00:00');
            
            if (clickedDate > today) {
                if (window.customDialogs) {
                    await window.customDialogs.alert('Cannot mark completion for future dates.', 'Future Date');
                } else {
                    alert('Cannot mark completion for future dates.');
                }
                return;
            }

            state.currentDate = dateStr;
        const completionCount = getDateStatus(state.selectedActivityId, subId, dateStr) || 0;
        const formattedDate = formatDateForDisplay(dateStr);

        let title = activity.name;
        if (state.selectedSubActivityId) {
            const subAct = activity.subActivities?.find(s => s.id === state.selectedSubActivityId);
            if (subAct) title += ` - ${subAct.name}`;
        }

        dateModalTitle.textContent = title;
        
        // Check if date is skipped
        const skipCount = state.skipped[state.selectedActivityId]?.[subId]?.[dateStr] || 0;
        
        // Include warning if not scheduled
        let infoText = formattedDate;
        if (completionCount > 0 && skipCount > 0) {
            infoText += ` (${completionCount} completion${completionCount > 1 ? 's' : ''}, ${skipCount} skipped)`;
        } else if (completionCount > 0) {
            infoText += ` (${completionCount} completion${completionCount > 1 ? 's' : ''})`;
        } else if (skipCount > 0) {
            infoText += ` (${skipCount} skipped)`;
        }
        if (!scheduled) {
            infoText += '\n⚠️ Not scheduled - marking will add to schedule';
        }
        dateModalInfo.textContent = infoText;

        // Show appropriate buttons: Mark Completion, Skipped, or Clear All
        if (completionCount > 0 || skipCount > 0) {
            markCompletedBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Completion';
            markCompletedBtn.style.display = 'flex';
            markScheduledBtn.innerHTML = '<i class="fas fa-times-circle"></i> Clear All';
            markScheduledBtn.style.display = 'flex';
            
            // Add skipped button
            let skippedBtn = document.getElementById('mark-skipped-btn');
            if (!skippedBtn) {
                skippedBtn = document.createElement('button');
                skippedBtn.id = 'mark-skipped-btn';
                skippedBtn.className = 'status-action-btn skipped';
                markScheduledBtn.parentElement.insertBefore(skippedBtn, markScheduledBtn);
                skippedBtn.addEventListener('click', () => setDateStatus('skipped'));
            }
            skippedBtn.innerHTML = '<i class="fas fa-ban"></i> Mark Skipped';
            skippedBtn.style.display = 'flex'; // Always show skipped button
        } else {
            markCompletedBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Completion';
            markCompletedBtn.style.display = 'flex';
            markScheduledBtn.style.display = 'none';
            
            // Show skipped option
            let skippedBtn = document.getElementById('mark-skipped-btn');
            if (!skippedBtn) {
                skippedBtn = document.createElement('button');
                skippedBtn.id = 'mark-skipped-btn';
                skippedBtn.className = 'status-action-btn skipped';
                markCompletedBtn.parentElement.appendChild(skippedBtn);
                skippedBtn.addEventListener('click', () => setDateStatus('skipped'));
            }
            skippedBtn.innerHTML = '<i class="fas fa-ban"></i> Mark Skipped';
            skippedBtn.style.display = 'flex';
        }

        dateModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error in handleDayClick:', error);
        if (window.customDialogs) {
            await window.customDialogs.alert('An error occurred. Please try again.', 'Error');
        } else {
            alert('An error occurred: ' + error.message);
        }
    }
    };
    
    const changeMonth = (delta) => {
        state.currentMonth += delta;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        } else if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar();
    };

    const setDateStatus = async (status) => {
        if (!state.selectedActivityId || !state.currentDate) return;

        const activityId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const dateStr = state.currentDate;

        // Initialize nested structure
        if (!state.schedules[activityId]) {
            state.schedules[activityId] = {};
        }
        if (!state.schedules[activityId][subId]) {
            state.schedules[activityId][subId] = {};
        }

        const currentCount = state.schedules[activityId][subId][dateStr] || 0;

        // Initialize skipped structure
        if (!state.skipped[activityId]) {
            state.skipped[activityId] = {};
        }
        if (!state.skipped[activityId][subId]) {
            state.skipped[activityId][subId] = {};
        }
        
        const currentSkipCount = state.skipped[activityId][subId][dateStr] || 0;

        // Set or remove status
        if (status === 'completed') {
            // No confirmation needed - the modal button click is the confirmation
            // Add one more completion (doesn't affect skips)
            state.schedules[activityId][subId][dateStr] = currentCount + 1;
            // Remove from cleared list if it was there
            if (state.cleared[activityId]?.[subId]?.[dateStr]) {
                delete state.cleared[activityId][subId][dateStr];
            }
            console.log('Marked completed:', activityId, subId, dateStr, 'count:', state.schedules[activityId][subId][dateStr]);
            
            // Sync first completion to main calendar
            if (currentCount === 0) {
                await syncCompletionToMainCalendar(activityId, subId, dateStr, true);
            }
        } else if (status === 'skipped') {
            // Add one more skip (doesn't affect completions)
            state.skipped[activityId][subId][dateStr] = currentSkipCount + 1;
            // Remove from cleared list if it was there
            if (state.cleared[activityId]?.[subId]?.[dateStr]) {
                delete state.cleared[activityId][subId][dateStr];
            }
            console.log('Marked skipped:', activityId, subId, dateStr, 'count:', state.skipped[activityId][subId][dateStr]);
        } else if (status === 'planned') {
            // Clear all - remove both completions and skipped status
            const confirmed = await window.customDialogs.confirm(
                `Clear all data for this date?`,
                'Clear All'
            );
            
            if (!confirmed) {
                dateModal.classList.add('hidden');
                return;
            }
            delete state.schedules[activityId][subId][dateStr];
            delete state.skipped[activityId][subId][dateStr];
            
            // Mark this date as explicitly cleared so sync won't re-add it
            if (!state.cleared[activityId]) {
                state.cleared[activityId] = {};
            }
            if (!state.cleared[activityId][subId]) {
                state.cleared[activityId][subId] = {};
            }
            state.cleared[activityId][subId][dateStr] = true;
            console.log('Cleared date:', activityId, subId, dateStr);
        }

        const saved = await saveSchedules();
        console.log('Save result:', saved);
        
        renderCalendar();
        renderStats();
        dateModal.classList.add('hidden');
        
        // Show success toast
        if (status === 'completed') {
            window.customDialogs.showToast('Completion marked!', 'success', 1500);
        } else if (status === 'skipped') {
            window.customDialogs.showToast('Marked as skipped', 'success', 1500);
        } else if (status === 'planned') {
            window.customDialogs.showToast('Date cleared', 'success', 1500);
        }
    };

    const incrementCompletion = async (dateStr) => {
        if (!state.selectedActivityId) return;

        const activityId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        
        // Verify this is a past date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr + 'T00:00:00');
        
        if (targetDate > today) {
            await window.customDialogs.alert('Cannot mark completion for future dates.', 'Future Date');
            return;
        }

        // Initialize nested structure
        if (!state.schedules[activityId]) {
            state.schedules[activityId] = {};
        }
        if (!state.schedules[activityId][subId]) {
            state.schedules[activityId][subId] = {};
        }
        
        const currentCount = state.schedules[activityId][subId][dateStr] || 0;

        // Increment completion count directly (no confirmation for quick +/- buttons)
        state.schedules[activityId][subId][dateStr] = currentCount + 1;
        
        console.log('Incremented completion:', activityId, subId, dateStr, 'count:', state.schedules[activityId][subId][dateStr]);

        // Sync first completion to main calendar
        if (currentCount === 0) {
            await syncCompletionToMainCalendar(activityId, subId, dateStr, true);
        }

        const saved = await saveSchedules();
        if (saved) {
            renderCalendar();
            renderStats();
            // Show quick feedback
            window.customDialogs.showToast('Completion added!', 'success', 1000);
        }
    };

    const decrementCompletion = async (dateStr) => {
        if (!state.selectedActivityId) return;

        const activityId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';

        if (!state.schedules[activityId]?.[subId]?.[dateStr]) return;

        // Decrement completion count
        state.schedules[activityId][subId][dateStr]--;

        // Remove if count reaches 0
        if (state.schedules[activityId][subId][dateStr] <= 0) {
            delete state.schedules[activityId][subId][dateStr];
        }
        
        console.log('Decremented completion:', activityId, subId, dateStr);

        const saved = await saveSchedules();
        if (saved) {
            renderCalendar();
            renderStats();
        }
    };

    // Pattern Management
    const openPatternModal = () => {
        if (!state.selectedActivityId) return;

        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const pattern = state.patterns[actId]?.[subId];

        // Reset pattern modal
        document.querySelectorAll('input[name="pattern-type"]').forEach(radio => radio.checked = false);
        document.querySelectorAll('.day-option input').forEach(cb => cb.checked = false);
        document.querySelectorAll('.date-option').forEach(opt => opt.classList.remove('selected'));

        // Set default start date to today for both inputs
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pattern-start-date').value = today;
        document.getElementById('daily-start-date').value = today;

        // Load existing pattern
        if (pattern) {
            document.querySelector(`input[name="pattern-type"][value="${pattern.type}"]`).checked = true;
            document.getElementById('weekly-options').style.display = pattern.type === 'weekly' ? 'block' : 'none';
            document.getElementById('monthly-options').style.display = pattern.type === 'monthly' ? 'block' : 'none';
            document.getElementById('daily-options').style.display = pattern.type === 'daily' ? 'block' : 'none';
            document.getElementById('start-date-section').style.display = pattern.type === 'daily' ? 'none' : 'block';

            if (pattern.startDate) {
                document.getElementById('pattern-start-date').value = pattern.startDate;
                document.getElementById('daily-start-date').value = pattern.startDate;
            }

            if (pattern.type === 'weekly' && pattern.days) {
                pattern.days.forEach(day => {
                    const checkbox = document.querySelector(`.day-option input[value="${day}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            if (pattern.type === 'monthly' && pattern.dates) {
                pattern.dates.forEach(date => {
                    const option = document.querySelector(`.date-option[data-date="${date}"]`);
                    if (option) option.classList.add('selected');
                });
            }
        } else {
            document.querySelector('input[name="pattern-type"][value="weekly"]').checked = true;
            document.getElementById('weekly-options').style.display = 'block';
            document.getElementById('start-date-section').style.display = 'block';
        }

        patternModal.classList.remove('hidden');
    };

    const savePattern = async () => {
        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';
        const patternType = document.querySelector('input[name="pattern-type"]:checked')?.value;

        if (!patternType) {
            await window.customDialogs.alert('Please select a pattern type', 'Pattern Required');
            return;
        }

        const pattern = { type: patternType };

        // Get start date
        const startDateInput = patternType === 'daily' 
            ? document.getElementById('daily-start-date').value
            : document.getElementById('pattern-start-date').value;
        
        if (!startDateInput) {
            await window.customDialogs.alert('Please select a start date', 'Start Date Required');
            return;
        }
        pattern.startDate = startDateInput;

        if (patternType === 'weekly') {
            const selectedDays = Array.from(document.querySelectorAll('.day-option input:checked'))
                .map(cb => parseInt(cb.value));
            if (selectedDays.length === 0) {
                await window.customDialogs.alert('Please select at least one day', 'Days Required');
                return;
            }
            pattern.days = selectedDays;
        }

        if (patternType === 'monthly') {
            const selectedDates = Array.from(document.querySelectorAll('.date-option.selected'))
                .map(opt => parseInt(opt.dataset.date));
            if (selectedDates.length === 0) {
                await window.customDialogs.alert('Please select at least one date', 'Dates Required');
                return;
            }
            pattern.dates = selectedDates;
        }

        // Initialize nested structure
        if (!state.patterns[actId]) {
            state.patterns[actId] = {};
        }
        state.patterns[actId][subId] = pattern;

        await saveSchedules();
        renderCalendar();
        renderStats();
        patternModal.classList.add('hidden');
    };

    const clearPattern = async () => {
        const confirmed = await window.customDialogs.confirm(
            'This will clear the schedule pattern. Continue?',
            'Clear Pattern'
        );
        
        if (!confirmed) return;

        const actId = state.selectedActivityId;
        const subId = state.selectedSubActivityId || 'main';

        if (state.patterns[actId]?.[subId]) {
            delete state.patterns[actId][subId];
            await saveSchedules();
            renderCalendar();
            renderStats();
            window.customDialogs.showToast('Pattern cleared', 'success', 1500);
        }

        patternModal.classList.add('hidden');
    };
    
    // Selection methods
    const selectActivity = (activityId) => {
        state.selectedActivityId = activityId;
        state.selectedSubActivityId = null;
        renderActivitySelector();
        // renderSubActivities is already called by renderActivitySelector
        renderStats();
    };

    const selectSubActivity = (subActivityId) => {
        state.selectedSubActivityId = subActivityId;
        const activity = state.activities.find(a => a.id === state.selectedActivityId);
        if (activity && activity.subActivities && activity.subActivities.length > 0) {
            setScheduleBtn.style.display = subActivityId ? 'inline-flex' : 'none';
        }
        renderSubActivities();
        renderCalendar();
        renderStats();
    };

    // Public API
    window.scheduleApp = {
        handleDayClick,
        changeMonth,
        incrementCompletion,
        decrementCompletion,
        selectActivity,
        selectSubActivity
    };

    // Utilities
    const formatDateForDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Start the app
    init();
});
