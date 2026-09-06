import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const THEMES = {
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

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

const STORAGE_KEY = 'bithab-theme-preferences';

function hexToRgbString(color) {
    if (typeof color !== 'string') return null;
    const trimmed = color.trim();
    const match = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.exec(trimmed);
    if (!match) return null;
    let hex = match[1];
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const value = parseInt(hex, 16);
    if (Number.isNaN(value)) return null;
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `${r}, ${g}, ${b}`;
}

export function ThemeProvider({ children }) {
    const { currentUser } = useAuth();
    
    // Default fallback
    const [currentTheme, setCurrentTheme] = useState('oceanic-depths');
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Initial Load from LocalStorage
    useEffect(() => {
        try {
            const cached = window.localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.currentTheme && THEMES[parsed.currentTheme]) {
                    setCurrentTheme(parsed.currentTheme);
                }
                if (typeof parsed.isDarkMode === 'boolean') {
                    setIsDarkMode(parsed.isDarkMode);
                }
            }
        } catch (e) {
            console.error('Failed to load theme from local cache', e);
        }
    }, []);

    // Firebase Sync
    useEffect(() => {
        if (!currentUser) return;

        async function syncThemeFromDb() {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const snapshot = await getDoc(userRef);
                if (snapshot.exists() && snapshot.data().themePreferences) {
                    const prefs = snapshot.data().themePreferences;
                    if (prefs.currentTheme) setCurrentTheme(prefs.currentTheme);
                    if (prefs.isDarkMode !== undefined) setIsDarkMode(prefs.isDarkMode);
                }
            } catch (e) {
                console.error('Failed to load theme from Firestore', e);
            }
        }

        syncThemeFromDb();
    }, [currentUser]);

    // Apply CSS whenever theme changes
    useEffect(() => {
        const theme = THEMES[currentTheme];
        if (!theme) return;
        
        const mode = isDarkMode ? theme.darkMode : theme.lightMode;
        const root = document.documentElement;

        Object.entries(mode).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        const accentColor = mode['--accent-color'] || mode['--primary-color'];
        const accentRgb = hexToRgbString(accentColor);
        if (accentRgb) {
            root.style.setProperty('--accent-primary-rgb', accentRgb);
        }

        root.setAttribute('data-theme', currentTheme);
        root.setAttribute('data-theme-mode', isDarkMode ? 'dark' : 'light');
        root.classList.remove('dark', 'light-mode');
        root.classList.add(isDarkMode ? 'dark' : 'light-mode');
        
        document.body.classList.remove('dark', 'light-mode');
        document.body.classList.add(isDarkMode ? 'dark' : 'light-mode');

        // Persist locally
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            currentTheme,
            isDarkMode,
            updatedAt: Date.now()
        }));

        // Sync back to Firebase if logged in
        if (currentUser) {
            const userRef = doc(db, 'users', currentUser.uid);
            setDoc(userRef, {
                themePreferences: {
                    currentTheme,
                    isDarkMode,
                    lastUpdated: serverTimestamp()
                }
            }, { merge: true }).catch(err => console.error("Failed to save theme", err));
        }
    }, [currentTheme, isDarkMode, currentUser]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);
    
    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme, isDarkMode, toggleDarkMode, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}
