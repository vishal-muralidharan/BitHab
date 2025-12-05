// Global Data Synchronization Manager for BitHab
// Ensures all pages stay in sync when data changes

class BitHabDataSync {
    constructor() {
        this.userId = null;
        this.db = null;
        this.listeners = new Set();
        this.lastSyncTime = 0;
        this.syncInterval = null;
        this.broadcastChannel = null;
        
        if (typeof window.BroadcastChannel !== 'undefined') {
            try {
                this.broadcastChannel = new BroadcastChannel('bithab-sync');
                this.broadcastChannel.onmessage = (event) => {
                    if (!event?.data?.timestamp) {
                        return;
                    }

                    const targetUser = event.data.userId;
                    if (targetUser && this.userId && targetUser !== this.userId) {
                        return;
                    }

                    this.lastSyncTime = Math.max(this.lastSyncTime, event.data.timestamp);
                    this.notifyListeners('channel_updated', event.data);
                };
            } catch (error) {
                console.warn('Failed to initialize BroadcastChannel for BitHab sync:', error);
            }
        } else {
            console.warn('BroadcastChannel API not available; real-time cross-tab sync disabled');
        }
        
        // Listen for focus events to check for updates
        window.addEventListener('focus', () => {
            try {
                this.checkForUpdates();
            } catch (error) {
                console.warn('Focus event error:', error);
            }
        });
    }

    init(userId, db) {
        this.userId = userId;
        this.db = db;
        this.startSyncInterval();
    }

    startSyncInterval() {
        // Clear any existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Check for updates every 30 seconds when page is visible
        this.syncInterval = setInterval(() => {
            try {
                if (!document.hidden) {
                    this.checkForUpdates();
                }
            } catch (error) {
                console.warn('Sync interval error:', error);
            }
        }, 30000);
    }

    async checkForUpdates() {
        if (!this.userId || !this.db) {
            // Not initialized yet, skip update check
            return;
        }
        
        try {
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                const updateTime = data.lastUpdated || 0;
                
                if (updateTime > this.lastSyncTime) {
                    this.lastSyncTime = updateTime;
                    this.notifyListeners('data_updated', data);
                }
            }
        } catch (error) {
            console.warn('Sync check failed:', error);
        }
    }

    async saveData(data, source = 'unknown') {
        if (!this.userId || !this.db) return;
        
        try {
            // Add timestamp and source info
            const dataWithMeta = {
                ...data,
                lastUpdated: Date.now(),
                lastUpdatedBy: source
            };
            
            await this.db.collection('users').doc(this.userId).set(dataWithMeta, { merge: true });
            this.lastSyncTime = dataWithMeta.lastUpdated;
            
            if (this.broadcastChannel) {
                try {
                    this.broadcastChannel.postMessage({
                        timestamp: dataWithMeta.lastUpdated,
                        source,
                        userId: this.userId
                    });
                } catch (error) {
                    console.warn('BroadcastChannel notification failed:', error);
                }
            }
            
            this.notifyListeners('data_saved', dataWithMeta);
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Sync listener error:', error);
            }
        });
    }

    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.close();
            } catch (error) {
                console.warn('Error closing BroadcastChannel:', error);
            }
            this.broadcastChannel = null;
        }
        this.listeners.clear();
    }
}

// Create global instance
window.BitHabDataSync = window.BitHabDataSync || new BitHabDataSync();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitHabDataSync;
}