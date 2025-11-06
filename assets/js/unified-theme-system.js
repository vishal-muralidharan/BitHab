// Unified Theme System for BitHab
// Single file to handle all theme-related functionality
// Includes preload, management, and database persistence

class UnifiedThemeSystem {
    constructor() {
    this.currentTheme = 'oceanic-depths';
    this.isDarkMode = true;
    this.isInitialized = false;
    this.storageKey = 'bithab-theme-preferences';
        
        // Theme definitions - Each theme has unique backgrounds and text colors
        this.themes = {
            'oceanic-depths': {
                name: 'Oceanic Depths',
                darkMode: {
                    '--primary-color': '#58A6FF',
                    '--secondary-color': '#1F6FEB',
                    '--background-color': '#0A0E14',
                    '--surface-color': '#131920',
                    '--accent-color': '#58A6FF',
                    '--text-primary': '#B8D4F1',
                    '--text-secondary': '#7A99B8',
                    '--border-color': '#2D3845'
                },
                lightMode: {
                    '--primary-color': '#0969DA',
                    '--secondary-color': '#218BFF',
                    '--background-color': '#F0F6FC',
                    '--surface-color': '#E6F0FA',
                    '--accent-color': '#0969DA',
                    '--text-primary': '#0D3A5F',
                    '--text-secondary': '#4E7BA3',
                    '--border-color': '#C5D9ED'
                }
            },
            'evergreen-forest': {
                name: 'Evergreen Forest',
                darkMode: {
                    '--primary-color': '#4AC26B',
                    '--secondary-color': '#2DA44E',
                    '--background-color': '#0C140E',
                    '--surface-color': '#141F17',
                    '--accent-color': '#4AC26B',
                    '--text-primary': '#B8E6C5',
                    '--text-secondary': '#7AB88F',
                    '--border-color': '#2D453A'
                },
                lightMode: {
                    '--primary-color': '#1A7F37',
                    '--secondary-color': '#2DA44E',
                    '--background-color': '#F0FAF3',
                    '--surface-color': '#E6F5EA',
                    '--accent-color': '#1A7F37',
                    '--text-primary': '#0F4C23',
                    '--text-secondary': '#3D8555',
                    '--border-color': '#C5E8D1'
                }
            },
            'cyberpunk-neon': {
                name: 'Cyberpunk Neon',
                darkMode: {
                    '--primary-color': '#B083F0',
                    '--secondary-color': '#8957E5',
                    '--background-color': '#0E0A14',
                    '--surface-color': '#1A1320',
                    '--accent-color': '#B083F0',
                    '--text-primary': '#E0D4F7',
                    '--text-secondary': '#A68FD1',
                    '--border-color': '#3D2D55'
                },
                lightMode: {
                    '--primary-color': '#8250DF',
                    '--secondary-color': '#A371F7',
                    '--background-color': '#F8F4FC',
                    '--surface-color': '#F0E8FA',
                    '--accent-color': '#8250DF',
                    '--text-primary': '#3B1E6B',
                    '--text-secondary': '#6D47A1',
                    '--border-color': '#DBC9F0'
                }
            },
            'monochrome-minimalist': {
                name: 'Monochrome',
                darkMode: {
                    '--primary-color': '#A0A0A0',
                    '--secondary-color': '#6E7681',
                    '--background-color': '#0F0F0F',
                    '--surface-color': '#1A1A1A',
                    '--accent-color': '#A0A0A0',
                    '--text-primary': '#D4D4D4',
                    '--text-secondary': '#9A9A9A',
                    '--border-color': '#3D3D3D'
                },
                lightMode: {
                    '--primary-color': '#6E7681',
                    '--secondary-color': '#8B949E',
                    '--background-color': '#FAFAFA',
                    '--surface-color': '#F0F0F0',
                    '--accent-color': '#6E7681',
                    '--text-primary': '#2B2B2B',
                    '--text-secondary': '#5A5A5A',
                    '--border-color': '#D4D4D4'
                }
            },
            'sunrise-coral': {
                name: 'Sunrise Coral',
                darkMode: {
                    '--primary-color': '#F78166',
                    '--secondary-color': '#DA3633',
                    '--background-color': '#140A0A',
                    '--surface-color': '#1F1313',
                    '--accent-color': '#F78166',
                    '--text-primary': '#F7D4CC',
                    '--text-secondary': '#D1918A',
                    '--border-color': '#552D2D'
                },
                lightMode: {
                    '--primary-color': '#CF222E',
                    '--secondary-color': '#F78166',
                    '--background-color': '#FDF5F4',
                    '--surface-color': '#FAEBE8',
                    '--accent-color': '#CF222E',
                    '--text-primary': '#6B1418',
                    '--text-secondary': '#A14249',
                    '--border-color': '#F0C9C9'
                }
            },
            'cherry-blossom': {
                name: 'Cherry Blossom',
                darkMode: {
                    '--primary-color': '#FF6B9D',
                    '--secondary-color': '#E91E63',
                    '--background-color': '#140A0F',
                    '--surface-color': '#1F1318',
                    '--accent-color': '#FF6B9D',
                    '--text-primary': '#FFD6E8',
                    '--text-secondary': '#E89BBB',
                    '--border-color': '#4D2D3D'
                },
                lightMode: {
                    '--primary-color': '#D81B60',
                    '--secondary-color': '#F06292',
                    '--background-color': '#FFF0F5',
                    '--surface-color': '#FFE4EE',
                    '--accent-color': '#D81B60',
                    '--text-primary': '#6B1437',
                    '--text-secondary': '#9C4D6B',
                    '--border-color': '#FFCCE0'
                }
            }
        };

        this.loadFromLocalCache();
    }

    hexToRgbString(color) {
        if (typeof color !== 'string') {
            return null;
        }

        const trimmed = color.trim();
        const match = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.exec(trimmed);
        if (!match) {
            return null;
        }

        let hex = match[1];
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        const value = parseInt(hex, 16);
        if (Number.isNaN(value)) {
            return null;
        }

        const r = (value >> 16) & 255;
        const g = (value >> 8) & 255;
        const b = value & 255;
        return `${r}, ${g}, ${b}`;
    }

    loadFromLocalCache() {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                return;
            }

            const cached = window.localStorage.getItem(this.storageKey);
            if (!cached) return;

            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object') {
                if (parsed.currentTheme && this.themes[parsed.currentTheme]) {
                    this.currentTheme = parsed.currentTheme;
                }
                if (typeof parsed.isDarkMode === 'boolean') {
                    this.isDarkMode = parsed.isDarkMode;
                }
            }
        } catch (error) {
            console.warn('UnifiedThemeSystem: failed to load cached theme', error);
        }
    }

    saveToLocalCache() {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                return;
            }

            const payload = {
                currentTheme: this.currentTheme,
                isDarkMode: this.isDarkMode,
                updatedAt: Date.now()
            };
            window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch (error) {
            console.warn('UnifiedThemeSystem: failed to cache theme', error);
        }
    }

    getActiveUser() {
        if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
            return null;
        }
        try {
            return firebase.auth().currentUser;
        } catch (error) {
            console.warn('UnifiedThemeSystem: failed to read auth user:', error);
            return null;
        }
    }

    async waitForDatabaseService(timeoutMs = 2000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (window.DatabaseService?.isInitialized) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
    }

    // Check if this is the focus page
    isFocusPage() {
        return window.location.pathname.includes('focus.html') || document.body.classList.contains('focus-mode');
    }

    // Initialize the theme system
    async init() {
        console.log('UnifiedThemeSystem: Initializing...');
        try {
            this.applyTheme();
            this.updateThemeDisplay();
            this.updateThemeToggleIcons();

            // Set up event listeners
            this.setupEventListeners();

            // Sync with database in background (don't wait for it)
            this.syncWithDatabase().catch(err => console.error('Database sync failed:', err));
        } finally {
            this.isInitialized = true;
            this.removeLoadingState();
            console.log('UnifiedThemeSystem: Initialization complete. Current:', this.currentTheme, 'Dark:', this.isDarkMode);
        }
    }

    // Apply the current theme
    applyTheme() {
        const theme = this.themes[this.currentTheme];
        if (!theme) {
            console.warn('Theme not found:', this.currentTheme, 'Available themes:', Object.keys(this.themes));
            return;
        }

        const mode = this.isDarkMode ? theme.darkMode : theme.lightMode;
        const root = document.documentElement;

        // Apply CSS custom properties
        Object.entries(mode).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        const accentColor = mode['--accent-color'] || mode['--primary-color'];
        const accentRgb = this.hexToRgbString(accentColor);
        if (accentRgb) {
            root.style.setProperty('--accent-primary-rgb', accentRgb);
        }

        root.setAttribute('data-theme', this.currentTheme);
        root.setAttribute('data-theme-mode', this.isDarkMode ? 'dark' : 'light');

        const htmlClasses = root.classList;
        htmlClasses.remove('dark', 'light-mode');
        htmlClasses.add(this.isDarkMode ? 'dark' : 'light-mode');

        // Update body class
        const applyBodyClass = () => {
            if (!document.body) return;
            document.body.classList.remove('dark', 'light-mode');
            document.body.classList.add(this.isDarkMode ? 'dark' : 'light-mode');
        };

        if (document.body) {
            applyBodyClass();
        } else {
            document.addEventListener('DOMContentLoaded', applyBodyClass, { once: true });
        }

        this.saveToLocalCache();

        console.log('Applied theme:', this.currentTheme, 'Dark mode:', this.isDarkMode, 'Properties:', Object.keys(mode));
    }

    // Set a new theme
    async setTheme(themeKey) {
        if (!this.themes[themeKey]) {
            console.error('Theme not found:', themeKey);
            return;
        }

        this.currentTheme = themeKey;
        this.applyTheme();
        this.updateThemeDisplay();
        
        // Save to database (don't wait for it)
        this.saveToDatabase().catch(err => console.error('Failed to save theme to database:', err));
        
        console.log('Theme changed to:', themeKey);
    }

    // Toggle dark/light mode
    async toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.updateThemeToggleIcons();
        
        // Save to database (don't wait for it)
        this.saveToDatabase().catch(err => console.error('Failed to save dark mode to database:', err));
        
        console.log('Dark mode toggled to:', this.isDarkMode);
    }

    // Update theme display on themes page
    updateThemeDisplay() {
        const themeDisplay = document.getElementById('current-theme-display');
        if (themeDisplay) {
            const theme = this.themes[this.currentTheme];
            themeDisplay.innerHTML = `
                <div class="current-theme-name">${theme.name}</div>
            `;
        }

        // Update active theme card
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const activeCard = document.querySelector(`[data-theme="${this.currentTheme}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
    }

    // Update dark/light mode toggle icons
    updateThemeToggleIcons() {
        const toggleButtons = document.querySelectorAll('#theme-toggle-sidebar, #theme-toggle, #mobile-theme-toggle');
        toggleButtons.forEach(btn => {
            if (btn) {
                const icon = btn.querySelector('i') || btn;
                if (this.isDarkMode) {
                    icon.className = 'fas fa-sun';
                    btn.setAttribute('title', 'Switch to Light Mode');
                } else {
                    icon.className = 'fas fa-moon';
                    btn.setAttribute('title', 'Switch to Dark Mode');
                }
            }
        });
    }

    removeLoadingState() {
        if (typeof document === 'undefined') {
            return;
        }
        document.documentElement.classList.remove('theme-loading');
        if (document.body) {
            document.body.classList.remove('theme-loading');
        }
    }

    // Sync with Firebase database
    async syncWithDatabase() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                return new Promise((resolve) => {
                    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                        if (user) {
                            console.log('Syncing theme with database for user:', user.uid);
                            try {
                                await this.waitForDatabaseService(1500);
                                // First, try to load from database
                                const loaded = await this.loadFromDatabase();
                                if (loaded) {
                                    // Database had a theme, use it
                                    this.applyTheme();
                                    this.updateThemeDisplay();
                                    this.updateThemeToggleIcons();
                                    console.log('Theme loaded from database successfully');
                                } else {
                                    // No theme in database, save current theme
                                    await this.saveToDatabase();
                                    console.log('Current theme saved to database');
                                }
                            } catch (error) {
                                console.error('Database sync error:', error);
                            }
                            resolve(true);
                        } else {
                            console.log('No user authenticated; using default theme values');
                            resolve(false);
                        }
                        unsubscribe(); // Clean up listener
                    });
                });
            }
        } catch (error) {
            console.error('Error syncing with database:', error);
            return false;
        }
    }

    // Load theme from Firebase database
    async loadFromDatabase() {
        try {
            if (window.DatabaseService?.isInitialized) {
                const preferences = await window.DatabaseService.loadThemePreferences();
                if (preferences) {
                    this.currentTheme = preferences.currentTheme || preferences.theme || this.currentTheme;
                    this.isDarkMode = preferences.isDarkMode !== undefined ? preferences.isDarkMode :
                        (preferences.darkMode !== undefined ? preferences.darkMode : this.isDarkMode);
                    this.saveToLocalCache();
                    console.log('Loaded theme from DatabaseService:', preferences);
                    return true;
                }
            }

            const user = this.getActiveUser();
            if (user && typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data() && userDoc.data().themePreferences) {
                    const prefs = userDoc.data().themePreferences;
                    this.currentTheme = prefs.currentTheme || prefs.theme || this.currentTheme;
                    this.isDarkMode = prefs.isDarkMode !== undefined ? prefs.isDarkMode : this.isDarkMode;
                    this.saveToLocalCache();
                    console.log('Loaded theme directly from Firestore:', prefs);
                    return true;
                }
            } else {
                console.log('UnifiedThemeSystem: Firestore not available or user not authenticated; using default theme');
            }
        } catch (error) {
            console.error('Error loading theme from database:', error);
            // Continue with defaults
        }
        return false;
    }

    // Save theme to Firebase database
    async saveToDatabase() {
        try {
            const user = this.getActiveUser();
            if (!user) {
                console.log('UnifiedThemeSystem: no authenticated user; skipping theme persistence');
                return;
            }

            if (window.DatabaseService?.isInitialized) {
                await window.DatabaseService.saveThemePreferences({
                    theme: this.currentTheme,
                    darkMode: this.isDarkMode,
                    timestamp: new Date().toISOString()
                }, 'unified_theme_system');
                console.log('Theme saved via DatabaseService');
                return;
            }

            if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
                const userRef = firebase.firestore().collection('users').doc(user.uid);
                const snapshot = await userRef.get();
                let themeHistory = [];
                if (snapshot.exists && snapshot.data()?.themePreferences?.themeHistory) {
                    const existingHistory = snapshot.data().themePreferences.themeHistory;
                    if (Array.isArray(existingHistory)) {
                        themeHistory = existingHistory.slice(-19);
                    }
                }

                const changedAt = (firebase.firestore?.FieldValue && typeof firebase.firestore.FieldValue.serverTimestamp === 'function')
                    ? firebase.firestore.FieldValue.serverTimestamp()
                    : new Date().toISOString();

                themeHistory.push({
                    theme: this.currentTheme,
                    isDarkMode: this.isDarkMode,
                    changedAt,
                    source: 'unified_theme_system'
                });

                await userRef.set({
                    themePreferences: {
                        currentTheme: this.currentTheme,
                        isDarkMode: this.isDarkMode,
                        themeHistory,
                        lastUpdated: (firebase.firestore?.FieldValue && typeof firebase.firestore.FieldValue.serverTimestamp === 'function')
                            ? firebase.firestore.FieldValue.serverTimestamp()
                            : new Date().toISOString(),
                        lastUpdatedBy: 'unified_theme_system'
                    }
                }, { merge: true });
                console.log('Theme saved directly to Firestore (fallback)');
            } else {
                console.log('UnifiedThemeSystem: Firestore not available; theme changes are only applied locally');
            }
        } catch (error) {
            console.error('Error saving theme to database:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Theme Sync Error',
                    message: 'We could not save your theme changes to the cloud. Please try again in a moment.',
                    details: error.message || error.toString(),
                    type: 'error'
                });
            }
            throw error;
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Theme selection buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-select-btn') || e.target.closest('.theme-select-btn')) {
                const button = e.target.classList.contains('theme-select-btn') ? e.target : e.target.closest('.theme-select-btn');
                const themeKey = button.dataset.theme;
                if (themeKey) {
                    this.setTheme(themeKey);
                }
            }
        });

        // Dark/Light mode toggle buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'theme-toggle-sidebar' || e.target.id === 'theme-toggle' || 
                e.target.closest('#theme-toggle-sidebar') || e.target.closest('#theme-toggle')) {
                e.preventDefault();
                this.toggleDarkMode();
            }
        });
    }
}

// Create global instance
const ThemeSystem = new UnifiedThemeSystem();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeSystem.init());
} else {
    ThemeSystem.init();
}

// Export for global access
window.ThemeSystem = ThemeSystem;
window.themeSystem = ThemeSystem; // Also export as lowercase for compatibility