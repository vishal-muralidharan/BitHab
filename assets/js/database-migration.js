// Database Migration Manager for BitHab
// Handles migrating existing data to new structure while preserving all current data

class DatabaseMigration {
    constructor() {
        this.db = firebase.firestore();
        this.currentVersion = '1.0.0'; // Original structure
        this.targetVersion = '2.0.0';  // New enhanced structure
    }

    /**
     * Migrate user data from v1.0.0 to v2.0.0
     * - Adds theme preferences
     * - Converts logs structure to support multiple activities per date
     * - Preserves all existing data
     * - Ensures backwards compatibility
     */
    async migrateUserData(userId) {
        console.log(`Starting migration for user ${userId}`);
        
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                console.log('User document does not exist, skipping migration');
                return;
            }

            const userData = userDoc.data();
            
            // Check if already migrated
            if (userData.version === this.targetVersion) {
                console.log('User data already migrated to latest version');
                return;
            }

            // Pre-migration backup
            await this.createMigrationBackup(userId, userData);

            // Step 1: Add theme preferences (with defaults)
            await this.addThemePreferences(userId, userData);

            // Step 2: Migrate logs structure
            await this.migrateLogs(userId);

            // Step 3: Ensure all data collections exist and are properly structured
            await this.ensureDataIntegrity(userId);

            // Step 4: Update version with migration metadata
            await this.db.collection('users').doc(userId).set({
                version: this.targetVersion,
                migrationDate: firebase.firestore.FieldValue.serverTimestamp(),
                migrationFrom: userData.version || this.currentVersion,
                backupCreated: true
            }, { merge: true });

            console.log('Migration completed successfully');

        } catch (error) {
            console.error('Migration failed:', error);
            
            // Check if it's a permissions error
            if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
                console.error('Migration aborted due to Firestore permission issues. No fallback will be used.');
                throw error;
            }
            
            // For other errors, attempt to restore from backup
            try {
                console.log('Attempting to restore from backup...');
                await this.restoreFromBackup(userId);
            } catch (restoreError) {
                console.error('Backup restoration also failed:', restoreError);
            }
            throw error;
        }
    }

    /**
     * Add theme preferences to user document
     */
    async addThemePreferences(userId, userData) {
        console.log('Adding theme preferences...');
        
        const themePreferences = {
            // Current theme from localStorage or default
            currentTheme: this.getCurrentThemeFromStorage() || 'oceanic-depths',
            isDarkMode: this.getDarkModeFromStorage(),
            // Theme history for analytics
            themeHistory: [{
                theme: this.getCurrentThemeFromStorage() || 'oceanic-depths',
                changedAt: firebase.firestore.Timestamp.now()
            }],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdatedBy: 'migration'
        };

        await this.db.collection('users').doc(userId).set({
            themePreferences: themePreferences
        }, { merge: true });

        console.log('Theme preferences added');
    }

    /**
     * Migrate logs from simple array to structured format
     * Enhanced with better backwards compatibility and error handling
     */
    async migrateLogs(userId) {
        console.log('Migrating logs structure...');
        
        // Get all existing logs
        const logsSnapshot = await this.db.collection('users').doc(userId).collection('logs').get();
        
        if (logsSnapshot.empty) {
            console.log('No logs to migrate');
            return;
        }

        // Get activities to map subactivity IDs to activities
        const userDoc = await this.db.collection('users').doc(userId).get();
        const activities = userDoc.data().activities || [];
        
        // Create mapping of subactivity ID to activity ID
        const subActivityToActivity = {};
        activities.forEach(activity => {
            if (activity.subActivities) {
                activity.subActivities.forEach(subActivity => {
                    subActivityToActivity[subActivity.id] = activity.id;
                });
            }
        });

        const batch = this.db.batch();
        let migratedCount = 0;
        let alreadyMigratedCount = 0;

        // Migrate each log document
        logsSnapshot.forEach(doc => {
            const dateStr = doc.id;
            const oldData = doc.data();
            
            // Skip if already migrated
            if (oldData.migrated === true || oldData.activities) {
                console.log(`Log for ${dateStr} already migrated`);
                alreadyMigratedCount++;
                return;
            }
            
            // Convert old format: { loggedSubActivityIds: [id1, id2, id3] }
            // To new format: { activities: { activityId: { subActivities: [id1, id2], loggedAt: timestamp } } }
            
            const newLogData = {
                activities: {},
                migrated: true,
                migrationDate: firebase.firestore.FieldValue.serverTimestamp(),
                // Keep old data for backward compatibility during transition
                legacy: {
                    loggedSubActivityIds: oldData.loggedSubActivityIds || [],
                    originalData: oldData
                }
            };

            // Group subactivities by their parent activity
            if (oldData.loggedSubActivityIds && Array.isArray(oldData.loggedSubActivityIds)) {
                oldData.loggedSubActivityIds.forEach(subActivityId => {
                    const activityId = subActivityToActivity[subActivityId];
                    
                    if (activityId) {
                        if (!newLogData.activities[activityId]) {
                            newLogData.activities[activityId] = {
                                subActivities: [],
                                loggedAt: firebase.firestore.FieldValue.serverTimestamp()
                            };
                        }
                        newLogData.activities[activityId].subActivities.push(subActivityId);
                    } else {
                        // Handle orphaned subactivities (subactivities whose parent was deleted)
                        console.warn(`Orphaned subactivity found: ${subActivityId} on ${dateStr}`);
                        if (!newLogData.activities['_orphaned']) {
                            newLogData.activities['_orphaned'] = {
                                subActivities: [],
                                loggedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                note: 'Orphaned subactivities from deleted activities'
                            };
                        }
                        newLogData.activities['_orphaned'].subActivities.push(subActivityId);
                    }
                });
            }

            // Handle case where there are no logged subactivities but log exists
            if (!oldData.loggedSubActivityIds || oldData.loggedSubActivityIds.length === 0) {
                newLogData.activities = {};
                newLogData.note = 'Empty log entry preserved from v1.0.0';
            }

            const logRef = this.db.collection('users').doc(userId).collection('logs').doc(dateStr);
            batch.set(logRef, newLogData);
            migratedCount++;
        });

        if (migratedCount > 0) {
            await batch.commit();
            console.log(`Logs migration completed: ${migratedCount} logs migrated, ${alreadyMigratedCount} already migrated`);
        } else {
            console.log(`All ${alreadyMigratedCount} logs were already migrated`);
        }
    }

    /**
     * Get current theme from localStorage for migration
     */
    getCurrentThemeFromStorage() {
        try {
            return localStorage.getItem('bithabTheme') || localStorage.getItem('bitHabTheme');
        } catch (e) {
            return null;
        }
    }

    /**
     * Get dark mode preference from localStorage for migration
     */
    getDarkModeFromStorage() {
        try {
            const bithabDarkMode = localStorage.getItem('bithabDarkMode');
            if (bithabDarkMode !== null) {
                return bithabDarkMode === 'true';
            }
            
            const bitHabTheme = localStorage.getItem('bitHabTheme');
            if (bitHabTheme) {
                return bitHabTheme === 'dark';
            }
            
            return true; // Default to dark mode
        } catch (e) {
            return true;
        }
    }

    /**
     * Create a backup before migration
     */
    async createMigrationBackup(userId, userData) {
        console.log('Creating migration backup...');
        
        const backupData = {
            userData: userData,
            backupDate: firebase.firestore.FieldValue.serverTimestamp(),
            version: userData.version || this.currentVersion
        };

        // Backup logs as well
        const logsSnapshot = await this.db.collection('users').doc(userId).collection('logs').get();
        const logs = {};
        logsSnapshot.forEach(doc => {
            logs[doc.id] = doc.data();
        });
        backupData.logs = logs;

        await this.db.collection('users').doc(userId).collection('migration_backups').doc('pre_v2_backup').set(backupData);
        console.log('Backup created successfully');
    }

    /**
     * Restore from backup in case of migration failure
     */
    async restoreFromBackup(userId) {
        console.log('Attempting to restore from backup...');
        
        const backupDoc = await this.db.collection('users').doc(userId).collection('migration_backups').doc('pre_v2_backup').get();
        if (!backupDoc.exists) {
            throw new Error('No backup found for restoration');
        }

        const backupData = backupDoc.data();
        
        // Restore user data
        await this.db.collection('users').doc(userId).set(backupData.userData);
        
        // Restore logs
        const batch = this.db.batch();
        Object.entries(backupData.logs || {}).forEach(([dateStr, logData]) => {
            const logRef = this.db.collection('users').doc(userId).collection('logs').doc(dateStr);
            batch.set(logRef, logData);
        });
        await batch.commit();
        
        console.log('Backup restoration completed');
    }

    /**
     * Ensure all data collections exist and are properly structured
     */
    async ensureDataIntegrity(userId) {
        console.log('Ensuring data integrity...');
        
        const userDoc = await this.db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        // Ensure all required fields exist with proper structure
        const updates = {};
        
        // Ensure activities array exists
        if (!userData.activities || !Array.isArray(userData.activities)) {
            updates.activities = [];
        }
        
        // Ensure goals array exists
        if (!userData.goals || !Array.isArray(userData.goals)) {
            updates.goals = [];
        }
        
        // Ensure reminders array exists
        if (!userData.reminders || !Array.isArray(userData.reminders)) {
            updates.reminders = [];
        }
        
        // Ensure notes array exists
        if (!userData.notes || !Array.isArray(userData.notes)) {
            updates.notes = [];
        }
        
        // Ensure themePreferences exists (should be added by migration, but double-check)
        if (!userData.themePreferences) {
            updates.themePreferences = {
                currentTheme: 'oceanic-depths',
                isDarkMode: true,
                themeHistory: [{
                    theme: 'oceanic-depths',
                    changedAt: firebase.firestore.Timestamp.now()
                }],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdatedBy: 'integrity_check'
            };
        }

        // Apply updates if needed
        if (Object.keys(updates).length > 0) {
            await this.db.collection('users').doc(userId).set(updates, { merge: true });
            console.log('Data integrity ensured, missing fields added');
        } else {
            console.log('Data integrity check passed');
        }
    }
    async rollbackMigration(userId) {
        console.log(`Rolling back migration for user ${userId}`);
        
        try {
            // Get all logs
            const logsSnapshot = await this.db.collection('users').doc(userId).collection('logs').get();
            const batch = this.db.batch();

            // Restore old log format from legacy data
            logsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.migrated && data.legacy) {
                    const logRef = this.db.collection('users').doc(userId).collection('logs').doc(doc.id);
                    batch.set(logRef, {
                        loggedSubActivityIds: data.legacy.loggedSubActivityIds
                    });
                }
            });

            await batch.commit();

            // Remove migration fields from user document
            await this.db.collection('users').doc(userId).update({
                version: firebase.firestore.FieldValue.delete(),
                migrationDate: firebase.firestore.FieldValue.delete(),
                themePreferences: firebase.firestore.FieldValue.delete()
            });

            console.log('Rollback completed');

        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }

    /**
     * Check if user needs migration
     */
    async needsMigration(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) return false;
            
            const userData = userDoc.data();
            return userData.version !== this.targetVersion;
        } catch (error) {
            console.error('Error checking migration status:', error);
            return false;
        }
    }

    /**
     * Get migration status for debugging
     */
    async getMigrationStatus(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return { status: 'no_user', version: null };
            }
            
            const userData = userDoc.data();
            return {
                status: userData.version === this.targetVersion ? 'migrated' : 'needs_migration',
                currentVersion: userData.version || this.currentVersion,
                targetVersion: this.targetVersion,
                migrationDate: userData.migrationDate
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Read logs with backwards compatibility
     * Can read both v1.0.0 and v2.0.0 formats
     */
    static readLogsWithCompatibility(logData) {
        if (!logData) return [];

        // v2.0.0 format
        if (logData.activities) {
            const subActivityIds = [];
            Object.values(logData.activities).forEach(activityLog => {
                if (activityLog.subActivities) {
                    subActivityIds.push(...activityLog.subActivities);
                }
            });
            return subActivityIds;
        }

        // v1.0.0 format (backwards compatibility)
        if (logData.loggedSubActivityIds) {
            return logData.loggedSubActivityIds;
        }

        // Legacy format fallback
        if (logData.legacy && logData.legacy.loggedSubActivityIds) {
            return logData.legacy.loggedSubActivityIds;
        }

        return [];
    }

    /**
     * Write logs in v2.0.0 format while maintaining backwards compatibility
     */
    static writeLogsWithCompatibility(logData, existingLogData = {}) {
        // Ensure new format structure
        const newLogData = {
            activities: logData.activities || {},
            migrated: true,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            // Maintain legacy format for backwards compatibility
            legacy: {
                loggedSubActivityIds: [],
                originalData: existingLogData.legacy?.originalData || existingLogData
            }
        };

        // Generate legacy format from new format for backwards compatibility
        Object.values(newLogData.activities).forEach(activityLog => {
            if (activityLog.subActivities) {
                newLogData.legacy.loggedSubActivityIds.push(...activityLog.subActivities);
            }
        });

        return newLogData;
    }

    /**
     * Force migration check and execution for all users (admin function)
     */
    async forceGlobalMigration() {
        console.log('Starting global migration check...');
        
        const usersSnapshot = await this.db.collection('users').get();
        const migrationPromises = [];

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.version !== this.targetVersion) {
                console.log(`Queuing migration for user: ${doc.id}`);
                migrationPromises.push(this.migrateUserData(doc.id));
            }
        });

        if (migrationPromises.length > 0) {
            console.log(`Migrating ${migrationPromises.length} users...`);
            const results = await Promise.allSettled(migrationPromises);
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            console.log(`Global migration completed: ${successful} successful, ${failed} failed`);
            return { successful, failed, total: migrationPromises.length };
        } else {
            console.log('All users already migrated');
            return { successful: 0, failed: 0, total: 0 };
        }
    }
}

// Export for use in other modules
window.DatabaseMigration = DatabaseMigration;