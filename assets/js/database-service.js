// Database Service for BitHab v2.0
// Provides unified interface for all data operations with proper error handling and sync

class DatabaseService {
    constructor() {
        this.db = null;
        this.userId = null;
        this.isInitialized = false;
        this.activitiesCache = [];
    }

    init(userId, db) {
        this.userId = userId;
        this.db = db;
        this.isInitialized = true;
        console.log('DatabaseService initialized for user:', userId);
    }

    setActivitiesCache(activities = []) {
        if (Array.isArray(activities)) {
            this.activitiesCache = activities;
        }
    }

    // Generic save method that handles all data types
    async saveData(dataType, data, source = 'unknown') {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            console.log(`Saving ${dataType} data:`, data);

            const dataToSave = {
                [dataType]: data,
                lastUpdated: Date.now(),
                lastUpdatedBy: source
            };

            // For v2.0, we still use the main user document but with proper structure
            await this.db.collection('users').doc(this.userId).set(dataToSave, { merge: true });

            // Notify data sync system if available
            if (window.BitHabDataSync) {
                window.BitHabDataSync.notifyListeners('data_saved', {
                    [dataType]: data,
                    lastUpdatedBy: source
                });
            }

            console.log(`${dataType} data saved successfully`);
            return true;
        } catch (error) {
            console.error(`Error saving ${dataType} data:`, error);
            throw error;
        }
    }

    // Generic load method
    async loadData(dataType) {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            console.log(`Loading ${dataType} data...`);
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const data = userData[dataType] || [];
                console.log(`Loaded ${dataType} data:`, data.length, 'items');
                return data;
            } else {
                console.log(`No user document found, returning empty ${dataType} array`);
                return [];
            }
        } catch (error) {
            console.error(`Error loading ${dataType} data:`, error);
            throw error;
        }
    }

    // Load all user data at once
    async loadAllData() {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            console.log('Loading all user data...');
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const result = {
                    activities: userData.activities || [],
                    goals: userData.goals || [],
                    reminders: userData.reminders || [],
                    notes: userData.notes || [],
                    themePreferences: userData.themePreferences || {
                        currentTheme: 'oceanic-depths',
                        isDarkMode: true
                    },
                    metadata: userData.metadata || { firstActivityDate: null }
                };
                this.setActivitiesCache(result.activities);
                console.log('All data loaded successfully');
                return result;
            } else {
                console.log('No user document found, returning default data structure');
                this.setActivitiesCache([]);
                return {
                    activities: [],
                    goals: [],
                    reminders: [],
                    notes: [],
                    themePreferences: {
                        currentTheme: 'oceanic-depths',
                        isDarkMode: true
                    },
                    metadata: { firstActivityDate: null }
                };
            }
        } catch (error) {
            console.error('Error loading all data:', error);
            throw error;
        }
    }

    // Save activities with enhanced error handling
    async saveActivities(activities, source = 'unknown') {
        this.setActivitiesCache(activities);
        return this.saveData('activities', activities, source);
    }

    // Save goals with enhanced error handling  
    async saveGoals(goals, source = 'unknown') {
        return this.saveData('goals', goals, source);
    }

    // Save reminders with enhanced error handling
    async saveReminders(reminders, source = 'unknown') {
        return this.saveData('reminders', reminders, source);
    }

    // Save notes with enhanced error handling
    async saveNotes(notes, source = 'unknown') {
        return this.saveData('notes', notes, source);
    }

    // Save logs (special handling for logs subcollection)
    async saveLogs(logs, source = 'unknown') {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            console.log('Saving logs data:', Object.keys(logs).length, 'dates');
            
            const batch = this.db.batch();
            
            // Save each date's logs as a separate document in the logs subcollection
            Object.keys(logs).forEach(dateStr => {
                if (logs[dateStr] && logs[dateStr].length > 0) {
                    const logRef = this.db.collection('users').doc(this.userId).collection('logs').doc(dateStr);
                    
                    // Create enhanced structure while maintaining backward compatibility
                    const enhancedLogData = this.createEnhancedLogStructure(logs[dateStr], this.activitiesCache);
                    
                    batch.set(logRef, {
                        ...enhancedLogData,
                        lastUpdated: Date.now(),
                        lastUpdatedBy: source
                    });
                }
            });
            
            await batch.commit();
            console.log('Logs saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving logs:', error);
            throw error;
        }
    }

    // Load logs from subcollection
    async loadLogs() {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            console.log('Loading logs data...');
            const logsSnapshot = await this.db.collection('users').doc(this.userId).collection('logs').get();
            const logs = {};
            
            logsSnapshot.forEach(doc => {
                // Use backwards-compatible log reading
                if (typeof DatabaseMigration !== 'undefined') {
                    logs[doc.id] = DatabaseMigration.readLogsWithCompatibility(doc.data());
                } else {
                    // Fallback to old format for backwards compatibility
                    const logData = doc.data();
                    logs[doc.id] = logData.loggedSubActivityIds || [];
                }
            });
            
            console.log('Logs loaded:', Object.keys(logs).length, 'dates');
            return logs;
        } catch (error) {
            console.error('Error loading logs:', error);
            throw error;
        }
    }

    // Delete logs for a specific date
    async deleteLogs(dateStr) {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            await this.db.collection('users').doc(this.userId).collection('logs').doc(dateStr).delete();
            console.log('Logs deleted for date:', dateStr);
            return true;
        } catch (error) {
            console.error('Error deleting logs:', error);
            throw error;
        }
    }

    // Save theme preferences specifically
    async saveThemePreferences(themeData, source = 'theme_manager') {
        if (!this.isInitialized) {
            throw new Error('DatabaseService not initialized');
        }

        try {
            console.log('Saving theme preferences:', themeData);
            
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            let themeHistory = [];
            
            // Preserve existing theme history
            if (userDoc.exists && userDoc.data() && userDoc.data().themePreferences) {
                themeHistory = Array.isArray(userDoc.data().themePreferences.themeHistory)
                    ? [...userDoc.data().themePreferences.themeHistory]
                    : [];
            }
            
            // Add new theme change to history
            const timestamp = firebase.firestore.Timestamp.now();
            themeHistory.push({
                theme: themeData.currentTheme || themeData.theme,
                isDarkMode: themeData.isDarkMode !== undefined ? themeData.isDarkMode : themeData.darkMode,
                changedAt: timestamp,
                source: source
            });
            
            // Keep only last 20 theme changes
            themeHistory = themeHistory.slice(-20);
            
            const themePreferences = {
                currentTheme: themeData.currentTheme || themeData.theme,
                isDarkMode: themeData.isDarkMode !== undefined ? themeData.isDarkMode : themeData.darkMode,
                themeHistory: themeHistory,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdatedBy: source
            };

            await this.db.collection('users').doc(this.userId).set({
                themePreferences: themePreferences
            }, { merge: true });

            console.log('Theme preferences saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving theme preferences:', error);
            throw error;
        }
    }

    // Load theme preferences specifically
    async loadThemePreferences() {
        if (!this.isInitialized) {
            console.warn('DatabaseService not initialized, returning defaults');
            return {
                currentTheme: 'oceanic-depths',
                isDarkMode: true,
                themeHistory: []
            };
        }

        try {
            console.log('Loading theme preferences...');
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            
            if (userDoc.exists && userDoc.data() && userDoc.data().themePreferences) {
                const themePrefs = userDoc.data().themePreferences;
                console.log('Theme preferences loaded:', themePrefs);
                return themePrefs;
            } else {
                console.log('No theme preferences found, returning defaults');
                return {
                    currentTheme: 'oceanic-depths',
                    isDarkMode: true,
                    themeHistory: []
                };
            }
        } catch (error) {
            console.error('Error loading theme preferences:', error);
            
            // Return defaults instead of throwing error
            console.log('Returning default theme preferences due to error');
            return {
                currentTheme: 'oceanic-depths',
                isDarkMode: true,
                themeHistory: []
            };
        }
    }

    // Helper method to create enhanced log structure
    createEnhancedLogStructure(subActivityIds, activities = this.activitiesCache) {
        if (!Array.isArray(subActivityIds)) {
            return { loggedSubActivityIds: [] };
        }

        const activitiesGrouped = {};

        // Build lookup for subactivity -> activity
        const subActivityToActivity = new Map();
        if (Array.isArray(activities)) {
            activities.forEach(activity => {
                if (activity && Array.isArray(activity.subActivities)) {
                    activity.subActivities.forEach(sub => {
                        if (sub && sub.id) {
                            subActivityToActivity.set(sub.id, activity.id);
                        }
                    });
                }
            });
        }

        // Group subactivities by parent activity id when available
        subActivityIds.forEach(subActivityId => {
            const activityId = subActivityToActivity.get(subActivityId) || 'legacy';

            if (!activitiesGrouped[activityId]) {
                activitiesGrouped[activityId] = {
                    activityId,
                    subActivities: []
                };
            }
            activitiesGrouped[activityId].subActivities.push(subActivityId);
        });

        return {
            // New enhanced structure
            activities: activitiesGrouped,
            migrated: true,
            migrationDate: new Date().toISOString(),
            // Legacy structure for backward compatibility
            loggedSubActivityIds: subActivityIds
        };
    }
}

// Create global instance
window.DatabaseService = new DatabaseService();