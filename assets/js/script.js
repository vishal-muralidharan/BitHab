// BitHab - A Habit Tracking Application
// © 2025, All Rights Reserved.

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        activities: [],
        goals: [],
        reminders: [],
        logs: {},
        notes: {}, // Add notes storage
        metadata: {
            firstActivityDate: null // Track first ever activity date
        },
        ui: {
            currentDate: new Date(),
            selectedActivityId: null,
            selectedDate: null, // Track selected date for highlighting
            expandedActivities: new Set(),
            isNotesExpanded: false,
            notesUserOverride: null,
        },
        // Add theme preferences
        themePreferences: {
            currentTheme: 'oceanic-depths',
            isDarkMode: true,
            themeHistory: []
        }
    };

    // DOM Elements
    const activityList = document.getElementById('activity-list');
    const addActivityInput = document.getElementById('add-activity-input');
    const goalList = document.getElementById('goal-list');
    const remindersPreview = document.getElementById('reminders-preview');
    const notesPreview = document.getElementById('notes-preview');
    const addGoalInput = document.getElementById('add-goal-input');
    const calendarView = document.querySelector('.calendar-view');
    const loggingModal = document.getElementById('logging-modal');
    const loadingIndicator = document.getElementById('loading-indicator');
    const authContainer = document.getElementById('auth-container');
    const mainLayout = document.querySelector('.main-layout');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const logoutBtnBottomNav = document.getElementById('logout-bottom-nav');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const addGoalBtn = document.getElementById('add-goal-btn');

    // Year/Month Picker Modal Elements
    const yearMonthPickerModal = document.getElementById('year-month-picker-modal');
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const activitySelect = document.getElementById('activity-select');
    const applyYearMonth = document.getElementById('apply-year-month');
    const cancelYearMonth = document.getElementById('cancel-year-month');

    let userId = null;
    let confirmationAction = null;

    // Handle more dropdown (top nav)
    const moreDropdown = document.querySelector('.more-dropdown');
    const moreBtn = document.querySelector('.more-btn');
    
    // Handle more dropdown (bottom nav)
    const moreBottomDropdown = document.querySelector('.more-bottom-dropdown');
    const moreBottomBtn = document.querySelector('.more-bottom-nav');
    
    console.log('More dropdown elements:', { moreDropdown, moreBtn, moreBottomDropdown, moreBottomBtn });
    
    // Top navigation dropdown
    if (moreBtn && moreDropdown) {
        console.log('Setting up More dropdown event listeners');
        moreBtn.addEventListener('click', (e) => {
            console.log('More button clicked');
            e.stopPropagation();
            moreDropdown.classList.toggle('active');
            console.log('Dropdown active state:', moreDropdown.classList.contains('active'));
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!moreDropdown.contains(e.target)) {
                moreDropdown.classList.remove('active');
            }
        });
    } else {
        console.warn('More dropdown elements not found');
    }
    
    const showConfirmation = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmationAction = onConfirm;
        confirmationModal.classList.remove('hidden');
    };

    window.BitHabUI = window.BitHabUI || {};
    window.BitHabUI.showConfirmation = showConfirmation;
    
    // Load logs with backward compatibility
    const loadLogs = async () => {
        const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
        state.logs = {}; // Reset logs before loading
        
        logsSnapshot.forEach(doc => {
            const data = doc.data();
            const dateStr = doc.id;
            
            // Use DatabaseMigration utility for backwards-compatible reading
            if (typeof DatabaseMigration !== 'undefined') {
                state.logs[dateStr] = DatabaseMigration.readLogsWithCompatibility(data);
            } else {
                // Fallback logic for backwards compatibility
                if (data.migrated && data.activities) {
                    // New structure: { activities: { activityId: { subActivities: [...], loggedAt: timestamp } } }
                    // Convert to legacy format for compatibility
                    const legacySubActivityIds = [];
                    Object.values(data.activities).forEach(activityData => {
                        if (activityData.subActivities) {
                            legacySubActivityIds.push(...activityData.subActivities);
                        }
                    });
                    state.logs[dateStr] = legacySubActivityIds;
                } else {
                    // Legacy structure: { loggedSubActivityIds: [...] }
                    state.logs[dateStr] = data.loggedSubActivityIds || [];
                }
            }
        });
    };

    // Apply user's saved theme
    const applyUserTheme = (themePreferences) => {
        try {
            console.log('Applying theme from Firebase to UI:', themePreferences);
            
            if (typeof window.BitHabThemeManager !== 'undefined') {
                // Set the color theme first
                window.BitHabThemeManager.currentTheme = themePreferences.currentTheme || 'oceanic-depths';
                
                // Apply dark/light mode
                if (themePreferences.isDarkMode) {
                    document.body.classList.add('dark');
                    document.documentElement.classList.add('dark');
                } else {
                    document.body.classList.remove('dark');
                    document.documentElement.classList.remove('dark');
                }
                
                // Apply the color theme
                window.BitHabThemeManager.applyColorTheme();
                window.BitHabThemeManager.updateThemeIcons();
                
                // Update UI controls to match loaded theme
                const themeSelector = document.getElementById('themeSelector');
                if (themeSelector) {
                    themeSelector.value = themePreferences.currentTheme || 'oceanic-depths';
                }
                
                const darkModeToggle = document.getElementById('darkModeToggle');
                if (darkModeToggle) {
                    darkModeToggle.checked = themePreferences.isDarkMode || false;
                }
            } else {
                console.warn('Theme manager not available, setting basic theme');
                // Fallback: just apply dark mode
                if (themePreferences.isDarkMode) {
                    document.body.classList.add('dark');
                    document.documentElement.classList.add('dark');
                } else {
                    document.body.classList.remove('dark');
                    document.documentElement.classList.remove('dark');
                }
            }
            
            console.log('Successfully applied theme from Firebase:', themePreferences);
        } catch (error) {
            console.error('Error applying user theme:', error);
        }
    };

    // Save theme preferences to database
    const saveThemePreferences = async (newTheme, newDarkMode) => {
        if (!userId) return;
        
        try {
            const history = Array.isArray(state.themePreferences.themeHistory)
                ? [...state.themePreferences.themeHistory]
                : [];

            history.push({
                theme: newTheme || state.themePreferences.currentTheme,
                isDarkMode: newDarkMode !== undefined ? newDarkMode : state.themePreferences.isDarkMode,
                changedAt: firebase.firestore.Timestamp.now()
            });

            const themePreferences = {
                currentTheme: newTheme || state.themePreferences.currentTheme,
                isDarkMode: newDarkMode !== undefined ? newDarkMode : state.themePreferences.isDarkMode,
                themeHistory: history.slice(-20),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdatedBy: 'dashboard'
            };

            await db.collection('users').doc(userId).set({
                themePreferences
            }, { merge: true });

            state.themePreferences = {
                ...themePreferences,
                themeHistory: themePreferences.themeHistory
            };
            console.log('Theme preferences saved to database:', themePreferences);
            return true;

        } catch (error) {
            console.error('Error saving theme preferences:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Theme Save Failed',
                    message: 'We could not save your theme preferences to the cloud. Your previous theme is still active.',
                    details: error.message || error.toString(),
                    type: 'error'
                });
            }
            return false;
        }
    };

    // Make saveThemePreferences globally available
    window.saveThemePreferences = saveThemePreferences;

    // --- Firebase State Management ---
    const saveState = async () => {
        if (!userId) {
            console.warn('Cannot save state: userId is null');
            return;
        }
        try {
            const uiStateToSave = {
                selectedActivityId: state.ui.selectedActivityId,
            };
            
            console.log('Saving all data to Firebase:', {
                activities: state.activities.length,
                goals: state.goals.length,
                reminders: state.reminders.length
            });
            
            // Use DatabaseService for v2.0 compatibility
            if (window.DatabaseService && window.DatabaseService.isInitialized) {
                window.DatabaseService.setActivitiesCache(state.activities);
                // Save all data at once to avoid race conditions
                const allData = {
                    ui: uiStateToSave,
                    metadata: state.metadata,
                    activities: state.activities,
                    goals: state.goals,
                    reminders: state.reminders,
                    lastUpdated: Date.now(),
                    lastUpdatedBy: 'index_page'
                };
                await db.collection('users').doc(userId).set(allData, { merge: true });
                console.log('✅ All data saved successfully via DatabaseService');
                
                // Notify data sync
                if (window.BitHabDataSync) {
                    window.BitHabDataSync.notifyListeners('data_saved', allData);
                }
            } else if (window.BitHabDataSync) {
                // Fallback to data sync
                const dataToSave = { 
                    ui: uiStateToSave,
                    metadata: state.metadata,
                    activities: state.activities,
                    goals: state.goals,
                    reminders: state.reminders
                };
                await window.BitHabDataSync.saveData(dataToSave, 'index_page');
                console.log('✅ Data saved via BitHabDataSync');
            } else {
                // Direct save fallback
                await db.collection('users').doc(userId).set({
                    ui: uiStateToSave,
                    metadata: state.metadata,
                    activities: state.activities,
                    goals: state.goals,
                    reminders: state.reminders,
                    lastUpdated: Date.now(),
                    lastUpdatedBy: 'index_page'
                }, { merge: true });
                console.log('✅ Data saved directly to Firebase');
            }
        } catch (e) {
            console.error("❌ Error saving state to Firebase:", e);
            // Show error to user
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Save Error',
                    message: 'Failed to save your data. Please check your internet connection.',
                    details: e.message,
                    type: 'error'
                });
            }
        }
    };

    // Quick notification function for user feedback
    const showQuickNotification = (message) => {
        // Remove any existing notification
        const existingNotification = document.querySelector('.quick-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'quick-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--accent-primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.9rem;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            transition: transform 0.3s ease;
            min-width: 120px;
            text-align: center;
            border: none;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Auto-remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    };

    // Function to refresh activities from Firebase
    const refreshActivitiesFromFirebase = async () => {
        if (!userId) return;
        try {
            console.log('Refreshing activities from Firebase...');
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data.activities) {
                    const oldCount = state.activities.length;
                    const oldSubActivityCount = state.activities.reduce((count, act) => 
                        count + (act.subActivities ? act.subActivities.length : 0), 0);
                    
                    state.activities = data.activities;
                    if (window.DatabaseService && window.DatabaseService.isInitialized) {
                        window.DatabaseService.setActivitiesCache(state.activities);
                    }
                    
                    const newCount = state.activities.length;
                    const newSubActivityCount = state.activities.reduce((count, act) => 
                        count + (act.subActivities ? act.subActivities.length : 0), 0);
                    
                    console.log(`Activities refreshed: ${oldCount} -> ${newCount} activities, ${oldSubActivityCount} -> ${newSubActivityCount} subactivities`);
                    
                    // Force a re-render of activities if they changed
                    if (oldCount !== newCount || oldSubActivityCount !== newSubActivityCount) {
                        renderActivities();
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing activities:', error);
        }
    };

    const saveLogs = async () => {
        if (!userId) return;
        try {
            if (window.DatabaseService && window.DatabaseService.isInitialized) {
                window.DatabaseService.setActivitiesCache(state.activities);
            }
            // Track first activity date
            const allDates = Object.keys(state.logs).filter(dateStr => 
                state.logs[dateStr] && state.logs[dateStr].length > 0
            );
            
            if (allDates.length > 0) {
                const earliestDate = allDates.sort()[0];
                if (!state.metadata.firstActivityDate || earliestDate < state.metadata.firstActivityDate) {
                    state.metadata.firstActivityDate = earliestDate;
                }
            }
            
            // Use DatabaseService for v2.0 compatibility
            if (window.DatabaseService && window.DatabaseService.isInitialized) {
                await window.DatabaseService.saveLogs(state.logs, 'index_page');
                await window.DatabaseService.saveData('metadata', state.metadata, 'index_page');
                console.log('Logs and metadata saved via DatabaseService');
            } else {
                // Fallback to direct Firebase save
                const batch = db.batch();
                
                // Save each date's logs as a separate document in the logs subcollection
                Object.keys(state.logs).forEach(dateStr => {
                    const logRef = db.collection('users').doc(userId).collection('logs').doc(dateStr);
                    
                    // Create enhanced structure while maintaining backward compatibility
                    const enhancedLogData = createEnhancedLogStructure(state.logs[dateStr]);
                    
                    batch.set(logRef, enhancedLogData);
                });
                
                // Save metadata with first activity date
                const userRef = db.collection('users').doc(userId);
                batch.set(userRef, { metadata: state.metadata }, { merge: true });
                
                await batch.commit();
                console.log('Logs and metadata saved directly to Firebase');
            }
        } catch (e) {
            console.error("Error saving logs to Firebase:", e);
        }
    };

    // Create enhanced log structure from legacy subactivity array
    const createEnhancedLogStructure = (subActivityIds) => {
        if (!subActivityIds || !Array.isArray(subActivityIds)) {
            return { 
                loggedSubActivityIds: [],
                activities: {},
                migrated: true
            };
        }

        // Group subactivities by their parent activity
        const activitiesGrouped = {};
        const subActivityToActivity = {};
        
        // Create mapping of subactivity ID to activity ID
        state.activities.forEach(activity => {
            if (activity.subActivities) {
                activity.subActivities.forEach(subActivity => {
                    subActivityToActivity[subActivity.id] = activity.id;
                });
            }
        });

        // Group logged subactivities by their parent activity
        subActivityIds.forEach(subActivityId => {
            const activityId = subActivityToActivity[subActivityId];
            
            if (activityId) {
                if (!activitiesGrouped[activityId]) {
                    activitiesGrouped[activityId] = {
                        subActivities: [],
                        loggedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                }
                activitiesGrouped[activityId].subActivities.push(subActivityId);
            }
        });

        return {
            // New enhanced structure
            activities: activitiesGrouped,
            migrated: true,
            migrationDate: firebase.firestore.FieldValue.serverTimestamp(),
            // Legacy structure for backward compatibility
            loggedSubActivityIds: subActivityIds
        };
    };

    const deleteLogsFromFirebase = async (dateStr) => {
        if (!userId || !dateStr) return;
        try {
            await db.collection('users').doc(userId).collection('logs').doc(dateStr).delete();
        } catch (e) {
            console.error("Error deleting logs from Firebase:", e);
        }
    };

    const saveNotes = async (dateStr, note, skipRender = false) => {
        if (!userId || !dateStr) return;
        try {
            if (note && note.trim()) {
                // Save note if it has content
                await db.collection('users').doc(userId).collection('notes').doc(dateStr).set({ note: note.trim() });
                state.notes[dateStr] = note.trim();
            } else {
                // Delete note if it's empty
                await db.collection('users').doc(userId).collection('notes').doc(dateStr).delete();
                delete state.notes[dateStr];
            }
            // Only re-render if not called from autosave to preserve focus
            if (!skipRender) {
                renderNotes();
            }
        } catch (e) {
            console.error("Error saving note to Firebase:", e);
        }
    };

    // Function to refresh data when updates come from other pages
    const refreshDataFromSync = async (data) => {
        try {
            console.log('Refreshing data from sync event:', data);
            
            // Use DatabaseService to get fresh data if available
            if (window.DatabaseService && window.DatabaseService.isInitialized) {
                const freshData = await window.DatabaseService.loadAllData();
                state.activities = freshData.activities;
                state.goals = freshData.goals;
                state.reminders = freshData.reminders;
                state.metadata = freshData.metadata;
                console.log('Fresh data loaded via DatabaseService');
            } else {
                // Fallback to using sync data
                if (data.activities) state.activities = data.activities;
                if (data.goals) state.goals = data.goals;
                if (data.reminders) state.reminders = data.reminders;
                if (data.metadata) state.metadata = data.metadata;
            }
            
            if (data.ui) {
                state.ui.selectedActivityId = data.ui.selectedActivityId || state.ui.selectedActivityId;
            }
            
            // Re-render all components only if they exist
            if (typeof renderActivities === 'function') renderActivities();
            if (typeof renderGoals === 'function') renderGoals();
            if (typeof renderReminders === 'function') renderReminders();
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof renderCalendar === 'function') renderCalendar();
            
            console.log('UI components refreshed');
        } catch (error) {
            console.warn('Error refreshing data from sync:', error);
        }
    };

    // Create/Update user profile for Google users
    const initializeUserProfile = async (user) => {
        if (!user) return;
        
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const isNewUser = !userDoc.exists;
            const userData = userDoc.exists ? userDoc.data() : {};
            
            // Check if this is a Google user
            const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
            
            // Prepare user profile data
            const userProfile = {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...(userData.profile || {}) // Preserve existing profile data
            };
            
            // Add Google-specific data if user signed in with Google
            if (isGoogleUser) {
                userProfile.displayName = user.displayName;
                userProfile.photoURL = user.photoURL;
                userProfile.provider = 'google';
                userProfile.googleProfile = {
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };
            } else {
                userProfile.provider = 'email';
            }
            
            // Set default data structure for new users
            const defaultUserData = {
                profile: userProfile,
                activities: [],
                goals: [],
                reminders: [],
                notes: [],
                metadata: {
                    firstActivityDate: null,
                    accountCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                themePreferences: {
                    currentTheme: 'oceanic-depths',
                    isDarkMode: true,
                    themeHistory: [{
                        theme: 'oceanic-depths',
                        isDarkMode: true,
                        changedAt: firebase.firestore.Timestamp.now()
                    }],
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdatedBy: 'bootstrap'
                }
            };
            
            if (isNewUser) {
                // Create new user document with default structure
                await db.collection('users').doc(user.uid).set(defaultUserData);
                console.log('Created new user profile:', userProfile);
                
                // Show welcome message for new Google users
                if (isGoogleUser && typeof errorHandler !== 'undefined') {
                    setTimeout(() => {
                        errorHandler.showErrorDialog({
                            title: '🎉 Welcome to BitHab!',
                            message: `Hi ${user.displayName || user.email}! Your account has been created successfully. Start building better habits today!`,
                            type: 'success',
                            autoClose: 5000
                        });
                    }, 1000);
                }
            } else {
                // Update existing user profile
                await db.collection('users').doc(user.uid).set({
                    profile: userProfile
                }, { merge: true });
                console.log('Updated user profile:', userProfile);
            }
            
            return userProfile;
        } catch (error) {
            console.error('Error initializing user profile:', error);
            throw error;
        }
    };

    const loadState = async () => {
        if (!userId) return;
        try {
            // Check if migration is needed with proper error handling
            try {
                if (typeof DatabaseMigration !== 'undefined') {
                    const migration = new DatabaseMigration();
                    const migrationStatus = await migration.getMigrationStatus(userId);
                    
                    if (migrationStatus.status === 'needs_migration') {
                        console.log('Migration needed, starting automatic migration...');
                        
                        // Show a non-blocking notification about migration
                        if (typeof errorHandler !== 'undefined') {
                            errorHandler.showErrorDialog({
                                title: 'Database Update',
                                message: 'Your data is being updated to the latest format. This may take a moment...',
                                type: 'info',
                                autoClose: 3000
                            });
                        }
                        
                        await migration.migrateUserData(userId);
                        console.log('Automatic migration completed successfully');
                        
                        // Show success notification
                        if (typeof errorHandler !== 'undefined') {
                            errorHandler.showErrorDialog({
                                title: 'Update Complete',
                                message: 'Your data has been successfully updated! You can now log multiple activities per day and your theme preferences will be saved.',
                                type: 'success',
                                autoClose: 5000
                            });
                        }
                    } else if (migrationStatus.status === 'migrated') {
                        console.log('User data already migrated to latest version');
                    } else {
                        console.log('Migration status:', migrationStatus);
                    }
                } else {
                    console.warn('DatabaseMigration class not available, skipping migration');
                }
            } catch (migrationError) {
                console.error('Migration failed:', migrationError);
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showErrorDialog({
                        title: 'Migration Failed',
                        message: 'We could not upgrade your data because of a permissions issue. Please contact support to resolve this.',
                        details: migrationError.message || 'Missing or insufficient Firestore permissions prevented the migration.',
                        type: 'error'
                    });
                }
                throw migrationError;
            }

            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                state.activities = data.activities || [];
                if (window.DatabaseService && window.DatabaseService.isInitialized) {
                    window.DatabaseService.setActivitiesCache(state.activities);
                }
                state.goals = data.goals || [];
                state.reminders = data.reminders || [];
                state.metadata = data.metadata || { firstActivityDate: null };
                
                console.log('Data loaded from Firebase:', {
                    activities: state.activities.length,
                    goals: state.goals.length,
                    reminders: state.reminders.length,
                    remindersSample: state.reminders.slice(0, 2)
                });
                
                // Load theme preferences
                if (data.themePreferences) {
                    state.themePreferences = data.themePreferences;
                    // Apply the saved theme from database after DOM paints
                    setTimeout(() => {
                        applyUserTheme(data.themePreferences);
                    }, 100);
                    console.log('Loaded theme preferences from database:', data.themePreferences);
                } else {
                    // Set default theme preferences if none exist
                    state.themePreferences = {
                        currentTheme: 'oceanic-depths',
                        isDarkMode: true
                    };
                    // Apply default theme
                    setTimeout(() => {
                        applyUserTheme(state.themePreferences);
                    }, 100);
                    console.log('Using default theme preferences');
                }
                
                if (data.ui) {
                    state.ui.selectedActivityId = data.ui.selectedActivityId || null;
                    // Always start with current date (today's month)
                    state.ui.currentDate = new Date();
                }
            }

            // Select the first activity by default if none is selected
            if (!state.ui.selectedActivityId && state.activities.length > 0) {
                state.ui.selectedActivityId = state.activities[0].id;
            }

            // Load logs separately as they are in a sub-collection
            await loadLogs();

            // Load notes separately as they are in a sub-collection
            const notesSnapshot = await db.collection('users').doc(userId).collection('notes').get();
            state.notes = {}; // Reset notes before loading
            notesSnapshot.forEach(doc => {
                state.notes[doc.id] = doc.data().note;
            });

        } catch (e) {
            console.error('Failed to load user data:', e);
            errorHandler.showErrorDialog({
                title: 'Load Data Error',
                message: 'Failed to load some data from the cloud. Please try refreshing.',
                details: e.message || 'Unknown error occurred while loading from Firebase',
                type: 'warning'
            });
        }
        
    };

    // --- Streak Calculation Functions ---
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

    // --- UI Rendering ---
    // Scroll navigation helper
    const addScrollNavigation = (container, listElement) => {
        // Remove existing navigation buttons
        container.querySelectorAll('.scroll-nav-button').forEach(button => button.remove());
        
        const checkScrollable = () => {
            const isScrollable = listElement.scrollHeight > listElement.clientHeight;
            
            if (isScrollable) {
                // Add up button
                const upButton = document.createElement('div');
                upButton.className = 'scroll-nav-button up';
                upButton.innerHTML = '↑';
                upButton.onclick = () => {
                    listElement.scrollBy({ top: -80, behavior: 'smooth' });
                };
                container.appendChild(upButton);
                
                // Add down button
                const downButton = document.createElement('div');
                downButton.className = 'scroll-nav-button down';
                downButton.innerHTML = '↓';
                downButton.onclick = () => {
                    listElement.scrollBy({ top: 80, behavior: 'smooth' });
                };
                container.appendChild(downButton);
                
                // Update button visibility based on scroll position
                const updateButtons = () => {
                    const atTop = listElement.scrollTop <= 5;
                    const atBottom = listElement.scrollTop >= listElement.scrollHeight - listElement.clientHeight - 5;
                    
                    upButton.classList.toggle('visible', !atTop);
                    downButton.classList.toggle('visible', !atBottom);
                };
                
                listElement.addEventListener('scroll', updateButtons);
                updateButtons(); // Initial check
            }
        };
        
        // Check after a brief delay to ensure content is rendered
        setTimeout(checkScrollable, 100);
    };

    const renderActivities = (isLoading = false) => {
        if (isLoading) {
            activityList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Loading activities...</p>';
            return;
        }

        activityList.classList.remove('inline-logging-active');
        activityList.removeAttribute('data-inline-logging');
        const activitiesComponentEl = activityList.closest('.activities-component');
        if (activitiesComponentEl) {
            activitiesComponentEl.classList.remove('inline-logging-open');
        }

        activityList.innerHTML = '';
        if (state.activities.length === 0) {
            // Keep the empty state concise and consistent across the UI
            activityList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">No activities yet.</p>';
            return;
        }

        // Check if list is expanded
        const isExpanded = activityList.classList.contains('expanded');
        // Show 3 activities when collapsed, all activities when expanded
        const activitiesToShow = isExpanded ? state.activities : state.activities.slice(0, 3);
        
        activitiesToShow.forEach(activity => {
            const isSelected = state.ui.selectedActivityId === activity.id;
            
            const activityItem = document.createElement('li');
            activityItem.className = `activity-item ${isSelected ? 'selected' : ''}`;
            activityItem.dataset.id = activity.id;
            
            // Simple display without last logged info
            activityItem.innerHTML = `
                <div class="activity-main">
                    <span>${activity.name}</span>
                </div>
            `;
            activityItem.addEventListener('click', () => {
                state.ui.selectedActivityId = activity.id;
                renderActivities();
            });
            activityList.appendChild(activityItem);
        });

        // Show/hide the show all button based on number of activities
        const showAllBtn = document.getElementById('activities-show-all');
        if (showAllBtn) {
            if (state.activities.length > 3) {
                showAllBtn.style.display = 'flex';
            } else {
                showAllBtn.style.display = 'none';
            }
            showAllBtn.setAttribute('aria-expanded', activityList.classList.contains('expanded') ? 'true' : 'false');
        }
        
        // Add scroll navigation if content overflows
        const activitiesComponentForNav = document.querySelector('.activities-component');
        if (activitiesComponentForNav) {
            // Disabled scroll navigation arrows - user requested to remove
            // addScrollNavigation(activitiesComponentForNav, activityList);
        }
    };

    // Expose renderActivities globally for index.html
    window.renderActivities = renderActivities;

    const renderGoals = (isLoading = false) => {
        if (!goalList) {
            console.warn('goalList element not found - check if DOM is ready');
            return;
        }
        
        if (isLoading) {
            goalList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Loading goals...</p>';
            return;
        }
        
        console.log('Rendering goals:', state.goals.length, 'total goals');
        goalList.innerHTML = '';
        
        // Render goals with most recently added first
        if (state.goals.length > 0) {
            // Sort goals by creation date (most recent first) if available, otherwise by order
            const sortedGoals = state.goals.slice().sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return 0; // Keep original order if no creation date
            });
            
            // Check if list is expanded
            const isExpanded = goalList.classList.contains('expanded');
            // Show 4 goals when collapsed, all goals when expanded
            const goalsToShow = isExpanded ? sortedGoals : sortedGoals.slice(0, 4);
            
            goalsToShow.forEach(goal => {
                const goalItem = document.createElement('li');
                
                // Determine goal state class
                let stateClass = '';
                if (goal.completed) {
                    stateClass = 'completed';
                } else if (goal.status === 'in-progress' || goal.progress > 0) {
                    stateClass = 'in-progress';
                } else {
                    stateClass = 'pending';
                }
                
                goalItem.className = `goal-item ${stateClass}`;
                goalItem.dataset.id = goal.id;
                goalItem.innerHTML = `
                    <span>${goal.name}</span>
                `;
                goalList.appendChild(goalItem);
            });

            // Show/hide the show all button based on number of goals
            const showAllBtn = document.getElementById('goals-show-all');
            if (showAllBtn) {
                if (state.goals.length > 4) {
                    showAllBtn.style.display = 'flex';
                } else {
                    showAllBtn.style.display = 'none';
                }
                showAllBtn.setAttribute('aria-expanded', goalList.classList.contains('expanded') ? 'true' : 'false');
            }
        } else {
            goalList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">No goals yet.</p>';
            // Hide show all button when no goals
            const showAllBtn = document.getElementById('goals-show-all');
            if (showAllBtn) {
                showAllBtn.style.display = 'none';
                showAllBtn.setAttribute('aria-expanded', 'false');
            }
        }
        
        // Add scroll navigation if content overflows
        const goalsComponent = document.querySelector('.goals-component');
        if (goalsComponent) {
            // Disabled scroll navigation arrows - user requested to remove
            // addScrollNavigation(goalsComponent, goalList);
        }
        
        console.log('Goals rendered successfully');
    };

    // Expose renderGoals globally for index.html
    window.renderGoals = renderGoals;

    const renderReminders = (isLoading = false) => {
        if (!remindersPreview) {
            console.warn('remindersPreview element not found - check if DOM is ready');
            return; // Only render if reminders preview element exists
        }
        
        if (isLoading) {
            // Use the same compact loading style as activities for consistency
            remindersPreview.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Loading reminders...</p>';
            return;
        }
        
        console.log('Rendering reminders:', state.reminders.length, 'total reminders');
        
        const now = new Date();
        const allReminders = (state.reminders || []).sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA - dateTimeB;
        });
        
        console.log('Sorted reminders:', { count: allReminders.length, sample: allReminders.slice(0, 2) });

        // Helper function to check if reminder is expired
        const isReminderExpired = (date, time) => {
            const reminderDateTime = new Date(`${date}T${time}`);
            return reminderDateTime < now;
        };

        // Helper function to format reminder date/time
        const formatReminderDateTime = (date, time) => {
            const reminderDate = new Date(`${date}T${time}`);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

            let dateStr;
            if (reminderDay.getTime() === today.getTime()) {
                dateStr = 'Today';
            } else if (reminderDay.getTime() === tomorrow.getTime()) {
                dateStr = 'Tomorrow';
            } else {
                dateStr = reminderDate.toLocaleDateString();
            }

            const timeStr = reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} at ${timeStr}`;
        };

        remindersPreview.innerHTML = '';

        if (allReminders.length === 0) {
            // Consistent concise empty state for reminders
            remindersPreview.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">No reminders set.</p>';
            console.log('Rendered empty reminders message');
            return;
        }

        // Filter to get future reminders
        const futureReminders = allReminders.filter(reminder => {
            const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
            return reminderDateTime >= now;
        });

        // Get past reminders (most recent first)
        const pastReminders = allReminders.filter(reminder => {
            const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
            return reminderDateTime < now;
        }).reverse(); // Most recent first

        // Check if list is expanded
        const isExpanded = remindersPreview.classList.contains('expanded');
        
        let remindersToShow;
        if (isExpanded) {
            // Show all reminders when expanded
            remindersToShow = allReminders;
        } else {
            // Show 2 reminders when collapsed
            // Start with future reminders (up to 2)
            remindersToShow = futureReminders.slice(0, 2);
            
            // If we have fewer than 2 future reminders, fill with recent past ones
            if (remindersToShow.length < 2 && pastReminders.length > 0) {
                const neededCount = 2 - remindersToShow.length;
                remindersToShow.push(...pastReminders.slice(0, neededCount));
            }
        }

        // If no reminders at all, show appropriate message
        if (remindersToShow.length === 0) {
            remindersPreview.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">No reminders set.</p>';
            return;
        }

        remindersToShow.forEach(reminder => {
            const isExpired = isReminderExpired(reminder.date, reminder.time);
            const reminderItem = document.createElement('div');
            reminderItem.className = `reminder-preview-item ${isExpired ? 'expired' : ''}`;
            reminderItem.onclick = () => window.location.href = 'pages/reminders.html';
            
            reminderItem.innerHTML = `
                <div class="reminder-preview-title">${reminder.text}</div>
                <div class="reminder-preview-time">${formatReminderDateTime(reminder.date, reminder.time)}</div>
                ${reminder.description ? `<div class="reminder-preview-description">${reminder.description}</div>` : ''}
            `;
            remindersPreview.appendChild(reminderItem);
        });

        // If there are more than 2 reminders, show the show all button
        const showAllBtn = document.getElementById('reminders-show-all');
        if (showAllBtn) {
            if (allReminders.length > 2) {
                showAllBtn.style.display = 'flex';
            } else {
                showAllBtn.style.display = 'none';
            }
            showAllBtn.setAttribute('aria-expanded', remindersPreview.classList.contains('expanded') ? 'true' : 'false');
        }
        
        console.log('Reminders rendered successfully');
    };

    // Expose renderReminders globally for index.html
    window.renderReminders = renderReminders;

    // Function to save any pending notes before navigation
    const savePendingNotes = () => {
        const notesEditor = document.querySelector('.notes-editor');
        if (notesEditor) {
            // Get the date that the notes editor is currently showing
            let dateStr;
            if (state.ui.selectedDate) {
                dateStr = state.ui.selectedDate;
            } else {
                const currentDate = new Date();
                dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            }
            const noteContent = notesEditor.value.trim();
            
            // Save immediately without waiting for debounce
            if (noteContent !== (state.notes[dateStr] || '')) {
                saveNotes(dateStr, noteContent, true);
            }
        }
    };

    const renderNotes = (isLoading = false) => {
        if (!notesPreview) return;

        if (notesPreview.__homeNotesResizeListener) {
            window.removeEventListener('resize', notesPreview.__homeNotesResizeListener);
            notesPreview.__homeNotesResizeListener = null;
        }

        if (isLoading) {
            notesPreview.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">Loading notes...</p>';
            return;
        }

        const notesShowAllBtn = document.getElementById('notes-show-all');
        const collapsedMaxHeight = 220;
        const minTextareaHeight = 140;
        let lastNeedsExpand = false;

        const applyExpandedState = (expanded, { updateButton = true } = {}) => {
            state.ui.isNotesExpanded = expanded;
            notesPreview.classList.toggle('expanded', expanded);
            if (notesShowAllBtn) {
                if (updateButton) {
                    notesShowAllBtn.classList.toggle('expanded', expanded);
                }
                notesShowAllBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                notesShowAllBtn.setAttribute('aria-label', expanded ? 'Collapse notes' : 'Expand notes');
                notesShowAllBtn.setAttribute('title', expanded ? 'Collapse notes' : 'Expand notes');
            }
        };

        const initialExpanded = state.ui.notesUserOverride !== null
            ? state.ui.notesUserOverride
            : state.ui.isNotesExpanded;
        applyExpandedState(Boolean(initialExpanded), {
            updateButton: state.ui.notesUserOverride !== null || Boolean(state.ui.isNotesExpanded)
        });

        let dateStr;
        if (state.ui.selectedDate) {
            dateStr = state.ui.selectedDate;
        } else {
            const currentDate = new Date();
            dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        }

        const existingNote = (state.notes[dateStr] || '').trim();
        notesPreview.innerHTML = '';

        const formatDateForNotes = (ds) => {
            const [year, month, day] = ds.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();

            if (isToday) {
                return 'Today';
            }

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

        const dateHeader = document.createElement('div');
        dateHeader.className = 'notes-date-header';
        dateHeader.innerHTML = `📝 Notes for ${formatDateForNotes(dateStr)}:`;
        notesPreview.appendChild(dateHeader);

        const editorContainer = document.createElement('div');
        editorContainer.className = 'notes-editor-container home-notes-editor-container';

        const textarea = document.createElement('textarea');
        textarea.className = 'notes-editor home-notes-editor';
        textarea.placeholder = 'Write your note for this day...';
        textarea.value = existingNote;
        textarea.dataset.date = dateStr;
        editorContainer.appendChild(textarea);
        notesPreview.appendChild(editorContainer);

        const footer = document.createElement('div');
        footer.className = 'home-notes-footer';

        const status = document.createElement('span');
        status.className = 'home-notes-status';
        footer.appendChild(status);

        notesPreview.appendChild(footer);

        const computeFullHeight = () => {
            textarea.style.height = 'auto';
            return Math.max(textarea.scrollHeight, minTextareaHeight);
        };

        const updateTextareaHeight = () => {
            requestAnimationFrame(() => {
                textarea.style.height = 'auto';
                const fullHeight = Math.max(textarea.scrollHeight, minTextareaHeight);
                const targetHeight = state.ui.isNotesExpanded
                    ? fullHeight
                    : Math.min(fullHeight, collapsedMaxHeight);
                textarea.style.height = `${targetHeight}px`;
            });
        };

        const updateExpandButtonVisibility = () => {
            if (!notesShowAllBtn) return;
            const showButton = lastNeedsExpand || state.ui.isNotesExpanded;
            notesShowAllBtn.style.display = showButton ? 'flex' : 'none';
            notesShowAllBtn.setAttribute('aria-hidden', showButton ? 'false' : 'true');
            notesShowAllBtn.setAttribute('aria-label', state.ui.isNotesExpanded ? 'Collapse notes' : 'Expand notes');
            notesShowAllBtn.setAttribute('title', state.ui.isNotesExpanded ? 'Collapse notes' : 'Expand notes');
            notesShowAllBtn.disabled = !showButton;
        };

        const syncExpansionForContent = () => {
            const fullHeight = computeFullHeight();
            const needsExpand = fullHeight > collapsedMaxHeight + 8;
            const hadOverride = state.ui.notesUserOverride !== null;
            const previousExpanded = state.ui.isNotesExpanded;

            let targetExpanded = hadOverride
                ? state.ui.notesUserOverride
                : previousExpanded;

            if (!needsExpand) {
                targetExpanded = false;
                state.ui.notesUserOverride = null;
            }

            const shouldUpdateButton = hadOverride || previousExpanded !== targetExpanded;

            applyExpandedState(targetExpanded, {
                updateButton: shouldUpdateButton
            });
            lastNeedsExpand = needsExpand;
            return { fullHeight, needsExpand };
        };

        const refreshNotesLayout = () => {
            syncExpansionForContent();
            updateExpandButtonVisibility();
            updateTextareaHeight();
        };

        let savedValue = existingNote;
        let debounceTimer = null;
        let isSaving = false;
        let retryRequested = false;

        const normalise = (value) => value.trim();

        const applySavedMessage = () => {
            if (savedValue) {
                status.textContent = 'Saved';
                status.dataset.state = 'saved';
            } else {
                status.textContent = 'No note yet';
                status.dataset.state = 'empty';
            }
        };

        const scheduleSave = () => {
            refreshNotesLayout();
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            const currentValue = normalise(textarea.value);
            if (currentValue === savedValue) {
                applySavedMessage();
                return;
            }

            status.textContent = 'Saving...';
            status.dataset.state = 'pending';
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                attemptSave();
            }, 900);
        };

        const attemptSave = async () => {
            const currentValue = textarea.value;
            const normalisedValue = normalise(currentValue);

            if (normalisedValue === savedValue && !retryRequested) {
                applySavedMessage();
                refreshNotesLayout();
                return;
            }

            if (isSaving) {
                retryRequested = true;
                return;
            }

            isSaving = true;
            retryRequested = false;
            status.textContent = 'Saving...';
            status.dataset.state = 'saving';

            try {
                await saveNotes(dateStr, currentValue, true);
                savedValue = normalisedValue;
                applySavedMessage();
            } catch (error) {
                console.error('Failed to save note:', error);
                status.textContent = 'Could not save - retrying';
                status.dataset.state = 'error';
                retryRequested = true;
            } finally {
                isSaving = false;
                refreshNotesLayout();
                if (retryRequested) {
                    retryRequested = false;
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    debounceTimer = setTimeout(() => {
                        debounceTimer = null;
                        attemptSave();
                    }, 1200);
                }
            }
        };

        textarea.addEventListener('input', () => {
            scheduleSave();
        });
        textarea.addEventListener('blur', () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
            attemptSave();
        });

        applySavedMessage();
        refreshNotesLayout();

        const handleResponsiveResize = () => {
            refreshNotesLayout();
        };
        notesPreview.__homeNotesResizeListener = handleResponsiveResize;
        window.addEventListener('resize', handleResponsiveResize);

        notesPreview.__homeNotesResize = updateTextareaHeight;
        notesPreview.__homeNotesToggleVisibility = updateExpandButtonVisibility;
        notesPreview.__homeNotesSyncExpansion = refreshNotesLayout;
        notesPreview.__homeNotesRefresh = refreshNotesLayout;
    };

    const getDotsForDate = (activity, dateStr) => {
        if (!activity) return '';
        const loggedIds = new Set(state.logs[dateStr] || []);
        
        if (activity.subActivities && activity.subActivities.length > 0) {
            return activity.subActivities
                .filter(sub => loggedIds.has(sub.id))
                .map(sub => `<span class="calendar-dot" style="background-color: ${sub.color};"></span>`)
                .join('');
        } else if (loggedIds.has(activity.id)) {
            return `<span class="calendar-dot" style="background-color: var(--text-primary);"></span>`;
        }
        
        return '';
    };

    const getDotsForDateAllActivities = (dateStr) => {
        const loggedIds = new Set(state.logs[dateStr] || []);
        console.log('Getting dots for date:', dateStr, 'Logged IDs:', Array.from(loggedIds));
        if (loggedIds.size === 0) return '';
        
        // Group logged subactivities by their parent activity
        const activityColors = new Map();
        const usedColors = new Set();
        
        state.activities.forEach(activity => {
            if (activity.subActivities) {
                activity.subActivities.forEach(subActivity => {
                    if (loggedIds.has(subActivity.id)) {
                        if (!activityColors.has(activity.id)) {
                            // Use the first subactivity's color, or generate one
                            let color = subActivity.color;
                            if (!color || usedColors.has(color)) {
                                // Generate a unique color for this activity
                                color = generateActivityColor(activity.id);
                            }
                            activityColors.set(activity.id, color);
                            usedColors.add(color);
                        }
                    }
                });
            } else if (loggedIds.has(activity.id)) {
                // Handle legacy activity IDs
                if (!activityColors.has(activity.id)) {
                    activityColors.set(activity.id, 'var(--accent-primary)');
                }
            }
        });
        
        // Create dots for each activity that has logged subactivities
        return Array.from(activityColors.values())
            .map(color => `<span class="calendar-dot" style="background-color: ${color};"></span>`)
            .join('');
    };

    // Generate a consistent color for an activity based on its ID
    const generateActivityColor = (activityId) => {
        const colors = [
            'var(--accent-primary)',
            'var(--success-color)',
            'var(--warning-color)',
            '#8B5CF6', // Purple
            '#10B981', // Emerald
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#3B82F6', // Blue
            '#F97316', // Orange
            '#84CC16'  // Lime
        ];
        
        // Use activity ID to generate a consistent color index
        let hash = 0;
        for (let i = 0; i < activityId.length; i++) {
            hash = ((hash << 5) - hash + activityId.charCodeAt(i)) & 0xffffffff;
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Year/Month Picker Functions
    const populateYearSelect = () => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 10; // 10 years back
        const endYear = currentYear + 5;   // 5 years forward
        
        yearSelect.innerHTML = '';
        for (let year = startYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    };

    const populateActivitySelect = () => {
        activitySelect.innerHTML = '<option value="">All Activities</option>';
        
        state.activities.forEach(activity => {
            const option = document.createElement('option');
            option.value = activity.id;
            option.textContent = activity.name;
            activitySelect.appendChild(option);
        });
    };

    const showYearMonthPicker = () => {
        const currentDate = state.ui.currentDate;
        
        populateYearSelect();
        populateActivitySelect();
        
        // Set current values
        yearSelect.value = currentDate.getFullYear();
        monthSelect.value = currentDate.getMonth();
        activitySelect.value = state.ui.selectedActivityId || '';
        
        yearMonthPickerModal.classList.remove('hidden');
    };

    const hideYearMonthPicker = () => {
        yearMonthPickerModal.classList.add('hidden');
    };

    const applyYearMonthSelection = () => {
        const selectedYear = parseInt(yearSelect.value);
        const selectedMonth = parseInt(monthSelect.value);
        const selectedActivityId = activitySelect.value;
        
        savePendingNotes(); // Save any pending notes before navigation
        
        // Update the current date
        state.ui.currentDate = new Date(selectedYear, selectedMonth, 1);
        
        // Update selected activity if one was chosen
        if (selectedActivityId) {
            state.ui.selectedActivityId = selectedActivityId;
        }
        
        // Save state and re-render calendar
        saveState();
        renderCalendar();
        renderActivities(); // Update activities to show selected one
        renderNotes(); // Update notes for the new date
        hideYearMonthPicker();
    };

    // Helper function to get the last log date for an activity
    const getLastLogDate = (activityId) => {
        let lastDate = null;
        
        // Find all dates where this activity was logged
        for (const [dateStr, loggedActivities] of Object.entries(state.logs)) {
            if (loggedActivities.includes(activityId)) {
                const logDate = new Date(dateStr);
                if (!lastDate || logDate > lastDate) {
                    lastDate = logDate;
                }
            }
        }
        
        if (!lastDate) return null;
        
        // Format the date nicely
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === today.toDateString()) {
            return 'today';
        } else if (lastDate.toDateString() === yesterday.toDateString()) {
            return 'yesterday';
        } else {
            return lastDate.toLocaleDateString();
        }
    };

    // Activity Selection Modal Functions
    const showActivitySelectionModal = async (dateStr) => {
        // Show loading state first
        const activitySelectionModal = document.getElementById('activity-selection-modal');
        const activitySelectionList = activitySelectionModal.querySelector('.activity-selection-list');
        
        // Clear and show loading
        activitySelectionList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">⟳</div>
                <div>Loading activities...</div>
            </div>
        `;
        
        // Show modal immediately with loading state
        activitySelectionModal.classList.remove('hidden');
        
        // Refresh activities from Firebase to ensure we have the latest data
        await refreshActivitiesFromFirebase();
        
        // Clear previous content
        activitySelectionList.innerHTML = '';
        
        // Add title
        const title = document.createElement('h3');
        title.textContent = `${new Date(dateStr).toLocaleDateString()}`;
        title.style.cssText = 'margin: 0 0 1.5rem 0; color: var(--text-primary); text-align: center;';
        activitySelectionList.appendChild(title);
        
        // Get currently logged subactivities for this date
        const loggedSubActivities = state.logs[dateStr] || [];
        
        // Add activities with their subactivities as pills
        state.activities.forEach(activity => {
            const activityContainer = document.createElement('div');
            activityContainer.className = 'activity-container';
            activityContainer.style.cssText = 'margin-bottom: 2rem;';
            
            // Activity header
            const activityHeader = document.createElement('div');
            activityHeader.className = 'activity-header';
            activityHeader.style.cssText = `
                text-align: center; 
                margin-bottom: 1rem; 
                font-size: 1.1em; 
                font-weight: 600; 
                color: var(--text-primary);
            `;
            activityHeader.innerHTML = `Activity: <span style="color: var(--accent-primary);">${activity.name}</span>`;
            activityContainer.appendChild(activityHeader);
            
            // Pills container
            const pillsContainer = document.createElement('div');
            pillsContainer.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: center;
                align-items: center;
            `;
            
            // Subactivities as pills
            pillsContainer.innerHTML = ''; // Clear previous content
            pillsContainer.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
                justify-content: center;
            `;
            
            if (activity.subActivities && activity.subActivities.length > 0) {
                activity.subActivities.forEach(subActivity => {
                    const pill = document.createElement('div');
                    pill.className = 'sub-activity-pill';
                    pill.dataset.subActivityId = subActivity.id;
                    pill.dataset.activityId = activity.id;
                    pill.dataset.dateStr = dateStr;
                    
                    const isLogged = loggedSubActivities.includes(subActivity.id);
                    
                    pill.style.cssText = `
                        padding: 0.6rem 1.2rem;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 0.9rem;
                        transition: all 0.2s ease;
                        border: 2px solid var(--border-color);
                        ${isLogged 
                            ? `background: var(--accent-primary); color: white; border-color: var(--accent-primary);` 
                            : `background: var(--bg-primary); color: var(--text-primary); border-color: var(--border-color);`
                        }
                    `;
                    
                    pill.textContent = subActivity.name;
                    pillsContainer.appendChild(pill);
                });
            } else {
                // For activities without subactivities, show the activity itself as a pill
                const pill = document.createElement('div');
                pill.className = 'activity-pill';
                pill.dataset.activityId = activity.id;
                pill.dataset.dateStr = dateStr;
                
                const isLogged = loggedSubActivities.includes(activity.id);
                
                pill.style.cssText = `
                    padding: 0.6rem 1.2rem;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    border: 2px solid var(--border-color);
                    ${isLogged 
                        ? `background: var(--accent-primary); color: white; border-color: var(--accent-primary);` 
                        : `background: var(--bg-primary); color: var(--text-primary); border-color: var(--border-color);`
                    }
                `;
                
                pill.textContent = activity.name;
                pillsContainer.appendChild(pill);
            }
            
            activityContainer.appendChild(pillsContainer);
            
            activitySelectionList.appendChild(activityContainer);
        });
        
        // Add refresh button
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '⟳ Refresh Activities';
        refreshButton.style.cssText = `
            width: 100%;
            padding: 0.75rem;
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 1rem;
            transition: background-color 0.2s ease;
        `;
        refreshButton.addEventListener('click', async () => {
            refreshButton.textContent = '⟳ Refreshing...';
            refreshButton.disabled = true;
            await refreshActivitiesFromFirebase();
            await showActivitySelectionModal(dateStr); // Reload the modal
        });
        activitySelectionList.appendChild(refreshButton);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Done';
        closeButton.style.cssText = `
            width: 100%;
            padding: 0.75rem;
            background: var(--accent-primary);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
        `;
        closeButton.addEventListener('click', hideActivitySelectionModal);
        activitySelectionList.appendChild(closeButton);
        
        activitySelectionModal.classList.remove('hidden');
    };

    const hideActivitySelectionModal = () => {
        const activitySelectionModal = document.getElementById('activity-selection-modal');
        activitySelectionModal.classList.add('hidden');
    };

    const handleActivitySelection = async (activityId, dateStr) => {
        const activity = state.activities.find(a => a.id === activityId);
        if (!activity) return;

        // Initialize logs for this date if needed
        if (!state.logs[dateStr]) {
            state.logs[dateStr] = [];
        }
        
        const isAlreadyLogged = state.logs[dateStr].includes(activity.id);
        
        if (isAlreadyLogged) {
            // Remove (de-log) the activity
            state.logs[dateStr] = state.logs[dateStr].filter(id => id !== activity.id);
            
            // If no activities logged for this date, delete the entry
            if (state.logs[dateStr].length === 0) {
                delete state.logs[dateStr];
                await deleteLogsFromFirebase(dateStr);
            } else {
                await saveLogs();
            }
        } else {
            // Add (log) the activity
            state.logs[dateStr].push(activity.id);
            await saveLogs();
        }
        
        // Close the activity selection modal
        hideActivitySelectionModal();
        
        // Update displays
        renderCalendar();
        renderActivities();
        
        // If activity has no subactivities, show notes modal
        if (!activity.subActivities || activity.subActivities.length === 0) {
            openNotesOnlyModal(dateStr, activity);
        } else {
            // For activities with subactivities, show the full modal
            openLoggingModal(dateStr);
        }
    };

    const handleSubActivitySelection = async (subActivityId, activityId, dateStr) => {
        const activity = state.activities.find(a => a.id === activityId);
        if (!activity) return;
        
        const subActivity = activity.subActivities?.find(sa => sa.id === subActivityId);
        if (!subActivity) return;

        // Initialize logs for this date if needed
        if (!state.logs[dateStr]) {
            state.logs[dateStr] = [];
        }
        
        const isAlreadyLogged = state.logs[dateStr].includes(subActivityId);
        
        if (isAlreadyLogged) {
            // Remove (de-log) the subactivity
            state.logs[dateStr] = state.logs[dateStr].filter(id => id !== subActivityId);
            
            // If no subactivities logged for this date, delete the entry
            if (state.logs[dateStr].length === 0) {
                delete state.logs[dateStr];
                await deleteLogsFromFirebase(dateStr);
            } else {
                await saveLogs();
            }
        } else {
            // Add (log) the subactivity
            state.logs[dateStr].push(subActivityId);
            await saveLogs();
            
            // Show quick feedback that it was saved
            showQuickNotification(`${subActivity.name} logged!`);
        }
        
        // Update the modal display to reflect changes
        await showActivitySelectionModal(dateStr);
        
        // Update other displays
        renderCalendar();
        renderActivities();
    };

    const renderCalendar = (isLoading = false) => {
        if (isLoading) {
            // Use compact, left-aligned loading indicator to match other components
            calendarView.innerHTML = '<div style="padding: 0 1rem; opacity: 0.7;">Loading calendar...</div>';
            return;
        }

        // Show calendar regardless of selected activity - we'll use activity selection modal for date clicks
        const date = state.ui.currentDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = date.toLocaleString('default', { month: 'long' });

        // Create calendar title based on whether an activity is selected
        const activityId = state.ui.selectedActivityId;
        const activity = state.activities.find(a => a.id === activityId);

        // A single grid for headers and days ensures alignment.
        calendarView.innerHTML = `
            <div class="calendar-header">
                <button id="prev-month" class="calendar-nav-btn">‹</button>
                <div class="calendar-title-container">
                    <h2 class="calendar-title" id="calendar-title" title="Click to change month/year/activity">${monthName} ${year}</h2>
                    ${activity ? `<h3 class="current-activity-title">${activity.name}</h3>` : ''}
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
        const prevMonthLastDate = new Date(year, month, 0);
        const prevMonthDays = prevMonthLastDate.getDate();

        let gridHTML = '';

        // Add weekday headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            gridHTML += `<div class="weekday">${day}</div>`;
        });

        // Days from previous month
        for (let i = firstDay; i > 0; i--) {
            const day = prevMonthDays - i + 1;
            const dateStr = `${prevMonthLastDate.getFullYear()}-${String(prevMonthLastDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dots = activity ? getDotsForDate(activity, dateStr) : getDotsForDateAllActivities(dateStr);
            gridHTML += `
                <div class="calendar-day other-month" data-date="${dateStr}">
                    <span class="calendar-date-num">${day}</span>
                    ${dots ? `<div class="calendar-dots">${dots}</div>` : ''}
                </div>`;
        }

        // Days from current month
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            let dayClasses = 'calendar-day';
            const isToday = dateStr === todayStr;
            if (isToday) dayClasses += ' today';
            if (dateStr === state.ui.selectedDate) dayClasses += ' selected';
            
            // Get dots for activities logged on this date
            const dots = activity ? getDotsForDate(activity, dateStr) : getDotsForDateAllActivities(dateStr);
            
            gridHTML += `
                <div class="${dayClasses}" data-date="${dateStr}">
                    <span class="calendar-date-num">${day}</span>
                    ${dots ? `<div class="calendar-dots">${dots}</div>` : ''}
                </div>`;
        }

        // Days from next month
        const totalCells = 42; // 6 rows * 7 days
        const renderedCells = firstDay + daysInMonth;
        const remainingCells = totalCells - renderedCells;
        const nextMonthFirstDate = new Date(year, month + 1, 1);

        for (let i = 1; i <= remainingCells; i++) {
            const day = i;
            const dateStr = `${nextMonthFirstDate.getFullYear()}-${String(nextMonthFirstDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dots = activity ? getDotsForDate(activity, dateStr) : getDotsForDateAllActivities(dateStr);
            gridHTML += `
                <div class="calendar-day other-month" data-date="${dateStr}">
                    <span class="calendar-date-num">${day}</span>
                    ${dots ? `<div class="calendar-dots">${dots}</div>` : ''}
                </div>`;
        }
        
        calendarGrid.innerHTML = gridHTML;
    };

    const openNotesOnlyModal = (dateStr, activity) => {
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

        // Check if activity is currently logged for this date
        const isLogged = state.logs[dateStr] && state.logs[dateStr].includes(activity.id);
        const statusMessage = isLogged 
            ? `✅ <strong>${activity.name}</strong> is logged for this day!`
            : `❌ <strong>${activity.name}</strong> was removed from this day.`;

        // Display notes as read-only
        const notesContent = state.notes[dateStr] 
            ? `<div class="notes-display">${state.notes[dateStr]}</div>`
            : `<div class="notes-display no-notes">No notes for this day.</div>`;

        loggingModal.innerHTML = `
            <div class="modal-content">
                <span class="close" role="button" aria-label="Close modal">
                    <i class="fas fa-xmark" aria-hidden="true"></i>
                </span>
                <h3>${formatDateForModal(dateStr)}</h3>
                <p>${statusMessage}</p>
                <div class="notes-section">
                    <label>📝 Notes for this day:</label>
                    ${notesContent}
                </div>
            </div>
        `;

        loggingModal.classList.remove('hidden');
        loggingModal.dataset.date = dateStr;
    };

    const optimizePillLayout = () => {
        const pillsContainers = document.querySelectorAll('.pills-container');
        
        pillsContainers.forEach(container => {
            const pills = Array.from(container.querySelectorAll('.pill'));
            if (pills.length === 0) return;
            
            // Get container width
            const containerWidth = container.offsetWidth;
            const gap = 0.3 * 16; // 0.3rem in pixels (assuming 16px root font size)
            
            let currentRowWidth = 0;
            let currentRowPills = [];
            const rows = [];
            
            // Group pills into rows based on available width
            pills.forEach(pill => {
                const pillRect = pill.getBoundingClientRect();
                const pillWidth = pillRect.width || pill.offsetWidth;
                
                if (currentRowWidth + pillWidth + gap <= containerWidth || currentRowPills.length === 0) {
                    currentRowPills.push(pill);
                    currentRowWidth += pillWidth + gap;
                } else {
                    rows.push([...currentRowPills]);
                    currentRowPills = [pill];
                    currentRowWidth = pillWidth + gap;
                }
            });
            
            if (currentRowPills.length > 0) {
                rows.push(currentRowPills);
            }
            
            // Optimize each row to fill available space
            rows.forEach(rowPills => {
                if (rowPills.length === 1) return; // Single pill doesn't need optimization
                
                const totalGaps = (rowPills.length - 1) * gap;
                const availableWidth = containerWidth - totalGaps;
                const totalCurrentWidth = rowPills.reduce((sum, pill) => {
                    const rect = pill.getBoundingClientRect();
                    return sum + (rect.width || pill.offsetWidth);
                }, 0);
                
                if (totalCurrentWidth < availableWidth * 0.85) { // If using less than 85% of width
                    const scale = Math.min(1.2, availableWidth / totalCurrentWidth * 0.95);
                    rowPills.forEach(pill => {
                        const currentPadding = parseFloat(getComputedStyle(pill).paddingLeft);
                        const newPadding = Math.max(currentPadding * scale, currentPadding);
                        pill.style.paddingLeft = `${newPadding}px`;
                        pill.style.paddingRight = `${newPadding}px`;
                    });
                }
            });
        });
    };

    const showInlineActivityLogging = (dateStr) => {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        // Format date for display
        const formatDateForInline = (ds) => {
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

        // Get currently logged activities for this date
        const loggedIds = new Set(state.logs[dateStr] || []);
        
        // Create pills for all activities and subactivities
        let activitiesHTML = '';
        state.activities.forEach(activity => {
            if (activity.subActivities && activity.subActivities.length > 0) {
                activitiesHTML += `<div class="activity-group">
                    <h4 class="activity-group-title">${activity.name}</h4>
                    <div class="pills-container">`;
                
                activity.subActivities.forEach(subActivity => {
                    const isSelected = loggedIds.has(subActivity.id);
                    activitiesHTML += `
                        <div class="pill ${isSelected ? 'selected' : ''}" 
                             data-id="${subActivity.id}" 
                             data-date="${dateStr}"
                             data-color="${subActivity.color}"
                             style="${isSelected ? `background: ${subActivity.color}22; border-color: ${subActivity.color}; color: ${subActivity.color};` : `border-color: ${subActivity.color}44;`}">
                            ${subActivity.name}
                        </div>`;
                });
                
                activitiesHTML += `</div></div>`;
            } else {
                // Legacy activities without subactivities
                const isSelected = loggedIds.has(activity.id);
                const activityColor = 'var(--accent-primary)';
                activitiesHTML += `
                    <div class="pill ${isSelected ? 'selected' : ''}" 
                         data-id="${activity.id}" 
                         data-date="${dateStr}"
                         data-color="${activityColor}"
                         style="${isSelected ? `background: ${activityColor}22; border-color: ${activityColor}; color: ${activityColor};` : `border-color: ${activityColor}44;`}">
                        ${activity.name}
                    </div>`;
            }
        });

        // Replace the activities section with inline logging interface (without close button)
        activityList.innerHTML = `
            <div class="inline-logging-interface">
                <div class="inline-logging-header">
                    <h3>${formatDateForInline(dateStr)}</h3>
                </div>
                <div class="inline-activities-container">
                    ${activitiesHTML}
                </div>
            </div>
        `;

        activityList.classList.remove('expanded');
        activityList.classList.add('inline-logging-active');
        activityList.dataset.inlineLogging = dateStr;
        const inlineActivitiesComponent = activityList.closest('.activities-component');
        if (inlineActivitiesComponent) {
            inlineActivitiesComponent.classList.add('inline-logging-open');
        }
        activityList.scrollTop = 0;

        // Add event listeners for the inline interface
        activityList.addEventListener('click', handleInlineLoggingActions);
        
        // Optimize pill layout to minimize free space
        setTimeout(() => {
            optimizePillLayout();
            
            // Set up resize observer for dynamic adjustment
            const inlineContainer = document.querySelector('.inline-activities-container');
            if (inlineContainer && window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(() => {
                    optimizePillLayout();
                });
                resizeObserver.observe(inlineContainer);
            }
        }, 100); // Small delay to ensure DOM is fully rendered
    };

    const handleInlineLoggingActions = async (e) => {
        const target = e.target;
        
        // Handle pill clicks
        const pill = target.closest('.pill');
        if (pill) {
            const activityId = pill.dataset.id;
            const dateStr = pill.dataset.date;
            const pillColor = pill.dataset.color;
            
            // Toggle pill selection
            pill.classList.toggle('selected');
            
            // Update pill styling based on selection and color
            if (pill.classList.contains('selected')) {
                pill.style.background = `${pillColor}22`;
                pill.style.borderColor = pillColor;
                pill.style.color = pillColor;
            } else {
                pill.style.background = 'var(--bg-primary)';
                pill.style.borderColor = `${pillColor}44`;
                pill.style.color = 'var(--text-primary)';
            }
            
            // Update logs
            const loggedIds = new Set(state.logs[dateStr] || []);
            if (pill.classList.contains('selected')) {
                loggedIds.add(activityId);
            } else {
                loggedIds.delete(activityId);
            }

            // Save to state and database
            console.log('Updating logs for date:', dateStr, 'Activity ID:', activityId);
            console.log('Current loggedIds:', Array.from(loggedIds));
            
            if (loggedIds.size === 0) {
                delete state.logs[dateStr];
                console.log('Deleting logs for date:', dateStr);
                await deleteLogsFromFirebase(dateStr);
                showQuickNotification('Activity unlogged');
            } else {
                state.logs[dateStr] = Array.from(loggedIds);
                console.log('Saving logs for date:', dateStr, 'with activities:', state.logs[dateStr]);
                await saveLogs();
                showQuickNotification('Activity logged');
            }

            // Persist updated state to Firestore
            await saveState();
            
            console.log('Rendering calendar after log update');
            renderCalendar(); // Update calendar dots
        }
    };

    const openLoggingModal = (dateStr) => {
        const activityId = state.ui.selectedActivityId;
        const activity = state.activities.find(a => a.id === activityId);
        if (!activity) {
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

        // Create pills section only if there are sub-activities
        let pillsSection = '';
        if (activity.subActivities && activity.subActivities.length > 0) {
            const loggedIds = new Set(state.logs[dateStr] || []);
            pillsSection = `
                <div id="pill-container">
                    ${activity.subActivities.map(sub => {
                        const isSelected = loggedIds.has(sub.id);
                        return `<div class="pill ${isSelected ? 'selected' : ''}" data-id="${sub.id}" style="--pill-color: ${sub.color}">
                            ${sub.name}
                        </div>`;
                    }).join('')}
                </div>
            `;
        } else {
            // For activities without sub-activities, show main activity as a pill
            const isLogged = state.logs[dateStr] && state.logs[dateStr].includes(activity.id);
            pillsSection = `
                <div id="pill-container">
                    <div class="pill ${isLogged ? 'selected' : ''}" data-id="${activity.id}" style="--pill-color: var(--accent-primary)">
                        ${activity.name}
                    </div>
                </div>
            `;
        }

        // Display notes as read-only
        const notesContent = state.notes[dateStr] 
            ? `<div class="notes-display">${state.notes[dateStr]}</div>`
            : `<div class="notes-display no-notes">No notes for this day. <a href="pages/notes.html">Add notes here</a>.</div>`;

        loggingModal.innerHTML = `
            <div class="modal-content">
                <span class="close" role="button" aria-label="Close modal">
                    <i class="fas fa-xmark" aria-hidden="true"></i>
                </span>
                <h3>${formatDateForModal(dateStr)}</h3>
                <p>Activity: <strong>${activity.name}</strong></p>
                ${pillsSection}
                <div class="notes-section">
                    <label>📝 Notes for this day:</label>
                    ${notesContent}
                </div>
            </div>
            </div>
        `;

        // Set initial pill selections for sub-activities
        if (activity.subActivities && activity.subActivities.length > 0) {
            const loggedIds = new Set(state.logs[dateStr] || []);
            loggingModal.querySelectorAll('.pill').forEach(pill => {
                if (loggedIds.has(pill.dataset.id)) {
                    pill.classList.add('selected');
                }
            });
        }

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
            state.ui.selectedActivityId = activityId;
            saveState();
            renderActivities();
            if (calendarView) {
                renderCalendar();
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
                goal.completed = !goal.completed;
                db.collection('users').doc(userId).set({ goals: state.goals }, { merge: true });
                renderGoals();
                renderReminders();
            }
        }
    };

    const handleCalendarActions = async (e) => {
        const target = e.target;
        
        // Handle calendar title click for year/month picker
        if (target.id === 'calendar-title' || target.closest('#calendar-title')) {
            showYearMonthPicker();
            return;
        }
        
        const navButton = target.closest('.calendar-nav-btn');
        if (navButton) {
            const direction = navButton.id === 'prev-month' ? -1 : 1;
            savePendingNotes(); // Save any pending notes before navigation
            state.ui.currentDate.setMonth(state.ui.currentDate.getMonth() + direction);
            saveState(); // Save the new month
            renderCalendar();
            renderNotes(); // Update notes for the new month
            return;
        }

        // Handle date clicks - look for any element with data-date
        const dayElement = target.closest('[data-date]');
        if (dayElement && dayElement.classList.contains('calendar-day')) {
            const dateStr = dayElement.dataset.date;
            
            // Don't handle clicks on other-month dates
            if (dayElement.classList.contains('other-month')) {
                return;
            }
            
            console.log('Calendar date clicked:', dateStr);
            
            if (!dateStr) {
                console.error('No date string found');
                return;
            }
            
            const clickedDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            clickedDate.setHours(0, 0, 0, 0);
            
            // Set the selected date
            state.ui.selectedDate = dateStr;
            console.log('Setting selected date to:', state.ui.selectedDate);
            
            // Save state
            await saveState();
            
            // Re-render everything
            renderCalendar();
            renderNotes();
            
            // Check if future date for reminder suggestion
            if (clickedDate > today) {
                if (confirm('This is a future date. Would you like to set a reminder instead?')) {
                    window.location.href = 'pages/reminders.html';
                }
                return;
            }
            
            // Show inline activity logging for past/present dates
            showInlineActivityLogging(dateStr);
            return;
        }
    };

    const handleModalActions = async (e) => {
        const target = e.target;
        const dateStr = loggingModal.dataset.date;

        // Close button or clicking outside the modal content
        const closeTrigger = target.closest('.close');
        if (closeTrigger || target.id === 'logging-modal') {
            loggingModal.classList.add('hidden');
            renderCalendar();
            renderActivities();
            return;
        }

        const pill = target.closest('.pill');
        if (pill) {
            // Toggle pill selection and autosave
            pill.classList.toggle('selected');
            
            // Auto-save the current selections
            const loggedIds = new Set();
            loggingModal.querySelectorAll('.pill.selected').forEach(selectedPill => {
                loggedIds.add(selectedPill.dataset.id);
            });

            if (loggedIds.size === 0) {
                delete state.logs[dateStr];
                await deleteLogsFromFirebase(dateStr);
                showLoadingIndicator('Activity unlogged', false);
            } else {
                state.logs[dateStr] = Array.from(loggedIds);
                await saveLogs();
                showLoadingIndicator('Activity logged', false);
            }
            
            // Update calendar display immediately
            renderCalendar();
            renderActivities();
            
            // Auto-close modal after subactivity selection for better UX
            // Give time to show the selection and save feedback, then close
            setTimeout(() => {
                loggingModal.classList.add('hidden');
            }, 1200);
        }
    };

    // --- Utility Functions ---
    const showLoadingIndicator = (message, isError = false) => {
        loadingIndicator.textContent = message;
        loadingIndicator.style.backgroundColor = isError ? '#e53935' : 'var(--accent-primary)';
        loadingIndicator.classList.remove('hidden');
        setTimeout(() => loadingIndicator.classList.add('hidden'), 1500);
    };

    // --- Initial Setup ---
    const initApp = async () => {
        try {
            // Render initial loading states
            renderActivities(true);
            renderGoals(true);
            renderReminders(true);
            renderNotes(true);
            renderCalendar(true);

            // Load user data - this may include migration
            await loadState();

            // Validate and fix state after loading
            if (!state.ui.selectedActivityId && state.activities.length > 0) {
                state.ui.selectedActivityId = state.activities[0].id;
            }
            if (state.ui.selectedActivityId && !state.activities.find(a => a.id === state.ui.selectedActivityId)) {
                state.ui.selectedActivityId = state.activities.length > 0 ? state.activities[0].id : null;
            }
        } catch (error) {
            console.error('Error during app initialization:', error);
            errorHandler.showErrorDialog({
                title: 'Initialization Error',
                message: 'The app had trouble starting up but will continue to work.',
                details: error.message || 'Unknown initialization error',
                type: 'warning'
            });
        } finally {
            // Always render the UI, even if loadState failed
            console.log('Final state before rendering:', { 
                activities: state.activities.length, 
                goals: state.goals.length, 
                reminders: state.reminders.length,
                notes: state.notes.length 
            });
            renderActivities();
            renderGoals();
            renderReminders();
            renderNotes();
            renderCalendar();

            // Show main layout after everything is ready
            const mainLayoutElement = document.querySelector('.main-layout');
            if (mainLayoutElement) {
                mainLayoutElement.classList.remove('hidden');
            }
            if(logoutBtn) logoutBtn.classList.remove('hidden');
            if(logoutBtnSidebar) logoutBtnSidebar.classList.remove('hidden');
            if(logoutBtnBottomNav) logoutBtnBottomNav.classList.remove('hidden');
            
            // Log final state for debugging
            console.log('App initialized. Activities:', state.activities.length, 'Logs:', Object.keys(state.logs).length);
        }
    }

    // Only handle logout and auth state for main app
    const setupAuth = () => {
        const handleLogout = () => {
            const openBottomDropdown = document.querySelector('.more-bottom-nav.open');
            if (openBottomDropdown) {
                openBottomDropdown.classList.remove('open');
            }

            showConfirmation('Are you sure you want to logout?', () => {
                authManager.signOut();
            });
        };

    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if(logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', handleLogout);

        authManager.onAuthStateChange(async user => {
            try {
                if (user) {
                    userId = user.uid;
                    db = firebase.firestore();
                    
                    // Initialize user profile (including Google users)
                    await initializeUserProfile(user);
                    
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
                                if (event === 'data_updated' && data.lastUpdatedBy !== 'index_page') {
                                    console.log('Data updated from another page, refreshing...', data);
                                    refreshDataFromSync(data);
                                    // Force refresh activities for modal if needed
                                    refreshActivitiesFromFirebase();
                                }
                            } catch (error) {
                                console.warn('Data sync listener error:', error);
                            }
                        });
                    }
                    
                    initApp();
                    
                    // Add focus listener to refresh activities when page regains focus
                    window.addEventListener('focus', () => {
                        // Small delay to ensure other operations complete first
                        setTimeout(async () => {
                            await refreshActivitiesFromFirebase();
                            // Also refresh all other data
                            if (window.DatabaseService && window.DatabaseService.isInitialized) {
                                try {
                                    const freshData = await window.DatabaseService.loadAllData();
                                    state.activities = freshData.activities;
                                    state.goals = freshData.goals;
                                    state.reminders = freshData.reminders;
                                    state.metadata = freshData.metadata;
                                    
                                    // Re-render components
                                    renderActivities();
                                    renderGoals();
                                    renderReminders();
                                    renderCalendar();
                                    
                                    console.log('All data refreshed on focus');
                                } catch (error) {
                                    console.error('Error refreshing data on focus:', error);
                                }
                            }
                        }, 500);
                    });
                    
                    // Add periodic refresh every 30 seconds when page is visible
                    setInterval(async () => {
                        if (!document.hidden && window.DatabaseService && window.DatabaseService.isInitialized) {
                            try {
                                const freshData = await window.DatabaseService.loadAllData();
                                
                                // Only update if data actually changed
                                const activitiesChanged = JSON.stringify(state.activities) !== JSON.stringify(freshData.activities);
                                const goalsChanged = JSON.stringify(state.goals) !== JSON.stringify(freshData.goals);
                                const remindersChanged = JSON.stringify(state.reminders) !== JSON.stringify(freshData.reminders);
                                
                                if (activitiesChanged || goalsChanged || remindersChanged) {
                                    state.activities = freshData.activities;
                                    state.goals = freshData.goals;
                                    state.reminders = freshData.reminders;
                                    state.metadata = freshData.metadata;
                                    
                                    // Re-render only changed components
                                    if (activitiesChanged) renderActivities();
                                    if (goalsChanged) renderGoals();
                                    if (remindersChanged) renderReminders();
                                    
                                    console.log('Data updated via periodic refresh');
                                }
                            } catch (error) {
                                console.warn('Periodic refresh failed:', error);
                            }
                        }
                    }, 30000); // 30 seconds
                } else {
                    userId = null;
                    // Cleanup data sync
                    if (window.BitHabDataSync) {
                        window.BitHabDataSync.destroy();
                    }
                    // Auth manager will handle redirects
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                // Fallback: show main layout for debugging
                const mainLayoutElement = document.querySelector('.main-layout');
                if (mainLayoutElement) {
                    mainLayoutElement.classList.remove('hidden');
                    console.log('Showed main layout due to auth error');
                }
            }
        });
    };

    const init = () => {
        // Add fallback timer to show layout if auth takes too long
        setTimeout(() => {
            const mainLayoutElement = document.querySelector('.main-layout');
            if (mainLayoutElement && mainLayoutElement.classList.contains('hidden')) {
                console.log('Auth taking too long, showing layout anyway');
                mainLayoutElement.classList.remove('hidden');
                // Render with empty data
                renderActivities();
                renderGoals();
                renderReminders();
                renderNotes();
                renderCalendar();
            }
        }, 3000); // 3 second fallback
        
        setupAuth();
        populateYearSelect(); // Initialize year options for picker

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

        const addGoal = async () => {
            const name = addGoalInput.value.trim();
            if (name) {
                const newGoal = { id: `goal_${Date.now()}`, name, completed: false };
                state.goals.push(newGoal);
                addGoalInput.value = '';
                await db.collection('users').doc(userId).set({ goals: state.goals }, { merge: true });
                renderGoals();
                renderReminders();
            }
        };

        activityList.addEventListener('click', handleActivityActions);
        goalList.addEventListener('click', handleGoalActions);
        calendarView.addEventListener('click', handleCalendarActions);
        loggingModal.addEventListener('click', handleModalActions);

        // Global click handler to deselect date when clicking outside calendar/activities/notes
        document.addEventListener('click', (e) => {
            // Don't deselect if there's no selected date
            if (!state.ui.selectedDate) return;
            
            // Check if click is on a modal or modal content
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            const yearMonthPicker = document.getElementById('year-month-picker-modal');
            const activitySelectionModal = document.getElementById('activity-selection-modal');
            
            // If there are open modals, don't deselect
            if (modals.length > 0 || 
                (yearMonthPicker && !yearMonthPicker.classList.contains('hidden')) ||
                (activitySelectionModal && !activitySelectionModal.classList.contains('hidden'))) {
                return;
            }
            
            // Check if click is on calendar, activities, notes, inline logging, or goals/reminders
            const isClickOnRelevantArea = (
                e.target.closest('.calendar-view') ||
                e.target.closest('.activities-component') ||
                e.target.closest('.notes-component') ||
                e.target.closest('.goals-component') ||
                e.target.closest('.reminders-component') ||
                e.target.closest('.inline-logging-interface')
            );
            
            // If click is outside relevant areas and inline logging is active, deselect
            if (!isClickOnRelevantArea && document.querySelector('.inline-logging-interface')) {
                console.log('Deselecting date due to outside click');
                state.ui.selectedDate = null;
                saveState();
                renderActivities(); // Restore normal activities view
                renderCalendar(); // Update calendar to remove selection
                renderNotes(); // Update notes to show today's notes
            }
        });

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

        const animateHeightChange = (element, mutate, options = {}) => {
            if (typeof mutate !== 'function') {
                return;
            }

            if (!element) {
                mutate();
                return;
            }

            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                mutate();
                return;
            }

            const component = options.component || element.closest('.activities-component, .notes-component, .goals-component, .reminders-component');
            const duration = typeof options.duration === 'number' ? options.duration : 350;
            const easing = options.easing || 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            const elementStart = element.offsetHeight;
            const componentStart = component ? component.offsetHeight : 0;

            mutate();

            requestAnimationFrame(() => {
                const computeTargetHeight = (node, desired) => {
                    let targetHeight = Math.max(desired, 0);
                    if (!node) {
                        return targetHeight;
                    }

                    const computedMax = window.getComputedStyle(node).maxHeight;
                    if (computedMax && computedMax !== 'none') {
                        const numericMax = parseFloat(computedMax);
                        if (!Number.isNaN(numericMax) && numericMax > 0) {
                            targetHeight = Math.min(targetHeight, numericMax);
                        }
                    }
                    return targetHeight;
                };

                const elementBorder = Math.max(element.offsetHeight - element.clientHeight, 0);
                const elementDesired = element.scrollHeight + elementBorder;
                const elementTarget = computeTargetHeight(element, elementDesired);

                let componentTarget = 0;
                if (component) {
                    const componentBorder = Math.max(component.offsetHeight - component.clientHeight, 0);
                    const componentDesired = component.scrollHeight + componentBorder;
                    componentTarget = computeTargetHeight(component, componentDesired);
                }

                const shouldAnimateElement = Math.abs(elementTarget - elementStart) > 1;
                const shouldAnimateComponent = component ? Math.abs(componentTarget - componentStart) > 1 : false;

                if (!shouldAnimateElement && !shouldAnimateComponent) {
                    if (component) {
                        component.classList.remove('expanding');
                    }
                    return;
                }

                let activeAnimations = 0;

                const runAnimation = (node, start, end) => {
                    if (!node || Math.abs(end - start) <= 1) {
                        return;
                    }

                    if (typeof node.__bithabHeightCleanup === 'function') {
                        node.__bithabHeightCleanup();
                    }

                    const cssProp = 'max-height';
                    const previousOverflow = node.style.overflow;
                    const previousTransition = node.style.transition;

                    activeAnimations += 1;

                    node.style.overflow = 'hidden';
                    node.style.transition = `${cssProp} ${duration}ms ${easing}`;
                    node.style.maxHeight = `${Math.max(start, 0)}px`;

                    function cleanup() {
                        node.removeEventListener('transitionend', handleEnd);
                        node.removeEventListener('transitioncancel', handleEnd);
                        node.style.transition = previousTransition;
                        node.style.maxHeight = '';
                        node.style.overflow = previousOverflow;
                        activeAnimations -= 1;
                        node.__bithabHeightCleanup = undefined;
                        if (activeAnimations === 0 && component) {
                            component.classList.remove('expanding');
                        }
                    }

                    function handleEnd(evt) {
                        if (evt.target !== node || evt.propertyName !== cssProp) {
                            return;
                        }
                        cleanup();
                    }

                    node.__bithabHeightCleanup = cleanup;

                    node.addEventListener('transitionend', handleEnd);
                    node.addEventListener('transitioncancel', handleEnd);

                    requestAnimationFrame(() => {
                        node.style.maxHeight = `${Math.max(end, 0)}px`;
                    });
                };

                if (component && (shouldAnimateElement || shouldAnimateComponent)) {
                    component.classList.add('expanding');
                }

                runAnimation(element, elementStart, elementTarget);
                if (component) {
                    runAnimation(component, componentStart, componentTarget);
                }

                if (activeAnimations === 0 && component) {
                    component.classList.remove('expanding');
                }
            });
        };

        // Show All Button Event Listeners
        const activitiesShowAllBtn = document.getElementById('activities-show-all');
        const goalsShowAllBtn = document.getElementById('goals-show-all');
        const remindersShowAllBtn = document.getElementById('reminders-show-all');
        const notesShowAllBtn = document.getElementById('notes-show-all');

        if (activitiesShowAllBtn) {
            activitiesShowAllBtn.setAttribute('aria-controls', 'activity-list');
            activitiesShowAllBtn.setAttribute('aria-expanded', activityList && activityList.classList.contains('expanded') ? 'true' : 'false');
            activitiesShowAllBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation to activities page
                const activityListEl = document.querySelector('.activity-list');
                if (activityListEl) {
                    const willExpand = !activityListEl.classList.contains('expanded');
                    const componentEl = activityListEl.closest('.activities-component');

                    animateHeightChange(activityListEl, () => {
                        activityListEl.classList.toggle('expanded', willExpand);
                        renderActivities();
                        activitiesShowAllBtn.classList.toggle('expanded', willExpand);
                        activitiesShowAllBtn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
                    }, { component: componentEl });
                }
            });
        }

        if (goalsShowAllBtn) {
            goalsShowAllBtn.setAttribute('aria-controls', 'goal-list');
            goalsShowAllBtn.setAttribute('aria-expanded', goalList && goalList.classList.contains('expanded') ? 'true' : 'false');
            goalsShowAllBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation to goals page
                const goalListEl = document.querySelector('.goal-list');
                if (goalListEl) {
                    const willExpand = !goalListEl.classList.contains('expanded');
                    const componentEl = goalListEl.closest('.goals-component');

                    animateHeightChange(goalListEl, () => {
                        goalListEl.classList.toggle('expanded', willExpand);
                        renderGoals();
                        goalsShowAllBtn.classList.toggle('expanded', willExpand);
                        goalsShowAllBtn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
                    }, { component: componentEl });
                }
            });
        }

        if (remindersShowAllBtn) {
            remindersShowAllBtn.setAttribute('aria-controls', 'reminders-preview');
            remindersShowAllBtn.setAttribute('aria-expanded', remindersPreview && remindersPreview.classList.contains('expanded') ? 'true' : 'false');
            remindersShowAllBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation to reminders page
                const remindersPreviewEl = document.querySelector('.reminders-preview');
                if (remindersPreviewEl) {
                    const willExpand = !remindersPreviewEl.classList.contains('expanded');
                    const componentEl = remindersPreviewEl.closest('.reminders-component');

                    animateHeightChange(remindersPreviewEl, () => {
                        remindersPreviewEl.classList.toggle('expanded', willExpand);
                        renderReminders();
                        remindersShowAllBtn.classList.toggle('expanded', willExpand);
                        remindersShowAllBtn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
                    }, { component: componentEl });
                }
            });
        }

        if (notesShowAllBtn && notesPreview) {
            notesShowAllBtn.setAttribute('aria-controls', 'notes-preview');
            const isExpanded = notesPreview.classList.contains('expanded');
            notesShowAllBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            notesShowAllBtn.setAttribute('aria-label', isExpanded ? 'Collapse notes' : 'Expand notes');
            notesShowAllBtn.setAttribute('title', isExpanded ? 'Collapse notes' : 'Expand notes');
            notesShowAllBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation to notes page
                const willExpand = !state.ui.isNotesExpanded;
                state.ui.isNotesExpanded = willExpand;
                state.ui.notesUserOverride = willExpand;
                const componentEl = notesPreview.closest('.notes-component');

                animateHeightChange(notesPreview, () => {
                    notesPreview.classList.toggle('expanded', willExpand);
                    notesShowAllBtn.classList.toggle('expanded', willExpand);
                    notesShowAllBtn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
                    notesShowAllBtn.setAttribute('aria-label', willExpand ? 'Collapse notes' : 'Expand notes');
                    notesShowAllBtn.setAttribute('title', willExpand ? 'Collapse notes' : 'Expand notes');

                    if (typeof notesPreview.__homeNotesSyncExpansion === 'function') {
                        notesPreview.__homeNotesSyncExpansion();
                    } else {
                        if (typeof notesPreview.__homeNotesResize === 'function') {
                            notesPreview.__homeNotesResize();
                        }
                        if (typeof notesPreview.__homeNotesToggleVisibility === 'function') {
                            notesPreview.__homeNotesToggleVisibility();
                        }
                    }
                }, { component: componentEl });
            });
        }

        // Year/Month Picker Event Listeners
        applyYearMonth.addEventListener('click', applyYearMonthSelection);
        cancelYearMonth.addEventListener('click', hideYearMonthPicker);
        
        // Close modal when clicking outside
        yearMonthPickerModal.addEventListener('click', (e) => {
            if (e.target === yearMonthPickerModal) {
                hideYearMonthPicker();
            }
        });

        // Activity Selection Modal Event Listeners
        const activitySelectionModal = document.getElementById('activity-selection-modal');
        const cancelActivitySelection = document.getElementById('cancel-activity-selection');
        
        cancelActivitySelection.addEventListener('click', hideActivitySelectionModal);
        
        // Handle activity selection clicks
        activitySelectionModal.addEventListener('click', (e) => {
            if (e.target === activitySelectionModal) {
                hideActivitySelectionModal();
                return;
            }
            
            // Handle subactivity pill clicks
            const subActivityPill = e.target.closest('.sub-activity-pill');
            if (subActivityPill) {
                const subActivityId = subActivityPill.dataset.subActivityId;
                const activityId = subActivityPill.dataset.activityId;
                const dateStr = subActivityPill.dataset.dateStr;
                handleSubActivitySelection(subActivityId, activityId, dateStr);
                return;
            }
            
            // Handle activity pill clicks
            const activityPill = e.target.closest('.activity-pill');
            if (activityPill) {
                const activityId = activityPill.dataset.activityId;
                const dateStr = activityPill.dataset.dateStr;
                handleActivitySelection(activityId, dateStr);
                return;
            }
            
            // Legacy support for old list-style selection
            const subActivityItem = e.target.closest('.sub-activity-selection-item');
            if (subActivityItem) {
                const subActivityId = subActivityItem.dataset.subActivityId;
                const activityId = subActivityItem.dataset.activityId;
                const dateStr = subActivityItem.dataset.dateStr;
                handleSubActivitySelection(subActivityId, activityId, dateStr);
            }
            
            const activityItem = e.target.closest('.activity-selection-item');
            if (activityItem) {
                const activityId = activityItem.dataset.activityId;
                const dateStr = activityItem.dataset.dateStr;
                handleActivitySelection(activityId, dateStr);
            }
        });
    };

    // Refresh data when window gets focus (e.g., coming back from other pages)
    window.addEventListener('focus', async () => {
        if (userId) {
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    state.goals = data.goals || [];
                    state.reminders = data.reminders || [];
                    state.activities = data.activities || [];
                    console.log('Data refreshed on focus:', {
                        goals: state.goals.length,
                        reminders: state.reminders.length,
                        activities: state.activities.length
                    });
                    renderActivities();
                    renderGoals();
                    renderReminders();
                }
            } catch (error) {
                console.error('Error refreshing data on focus:', error);
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showErrorDialog({
                        title: 'Refresh Data Error',
                        message: 'Failed to refresh data. Some information may not be up to date.',
                        details: error.message || 'Unknown error occurred while refreshing',
                        type: 'warning'
                    });
                }
            }
        }
    });

    init();

    // Global error handlers to prevent uncaught errors from breaking the app
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message && 
            (event.error.message.includes('Missing or insufficient permissions') ||
             event.error.message.includes('permission-denied'))) {
            console.log('Suppressed Firebase permission error:', event.error.message);
            event.preventDefault();
            return false;
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('Missing or insufficient permissions') ||
             event.reason.code === 'permission-denied')) {
            console.log('Suppressed Firebase permission rejection:', event.reason.message);
            event.preventDefault();
            return false;
        }
    });
});
