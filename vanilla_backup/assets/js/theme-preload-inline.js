// Inline Theme Preload - Apply theme instantly before page renders
(function() {
    'use strict';
    
    try {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.add('theme-loading');
            if (document.body) {
                document.body.classList.add('theme-loading');
            }
        }
        const STORAGE_KEY = 'bithab-theme-preferences';
        let theme = 'oceanic-depths';
        let isDark = true;

        // Attempt to read cached preferences from localStorage first
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const cached = window.localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && typeof parsed === 'object') {
                        if (parsed.currentTheme && typeof parsed.currentTheme === 'string') {
                            theme = parsed.currentTheme;
                        }
                        if (typeof parsed.isDarkMode === 'boolean') {
                            isDark = parsed.isDarkMode;
                        }
                    }
                }
            }
        } catch (storageError) {
            console.warn('Theme preload: unable to access localStorage', storageError);
        }

        // Allow inline overrides when present (e.g., server rendered hints)
        if (window.__BIT_HAB_THEME__ && typeof window.__BIT_HAB_THEME__ === 'object') {
            const hint = window.__BIT_HAB_THEME__;
            if (hint.currentTheme && typeof hint.currentTheme === 'string') {
                theme = hint.currentTheme;
            }
            if (typeof hint.isDarkMode === 'boolean') {
                isDark = hint.isDarkMode;
            }
        }
        
        // Theme color definitions with unique backgrounds and text colors
        const darkModes = {
            'oceanic-depths': { 
                primary: '#58A6FF', secondary: '#1F6FEB', bg: '#0A0E14', surface: '#131920', 
                text: '#B8D4F1', textSec: '#7A99B8', border: '#2D3845' 
            },
            'evergreen-forest': { 
                primary: '#4AC26B', secondary: '#2DA44E', bg: '#0C140E', surface: '#141F17', 
                text: '#B8E6C5', textSec: '#7AB88F', border: '#2D453A' 
            },
            'cyberpunk-neon': { 
                primary: '#B083F0', secondary: '#8957E5', bg: '#0E0A14', surface: '#1A1320', 
                text: '#E0D4F7', textSec: '#A68FD1', border: '#3D2D55' 
            },
            'monochrome-minimalist': { 
                primary: '#A0A0A0', secondary: '#6E7681', bg: '#0F0F0F', surface: '#1A1A1A', 
                text: '#D4D4D4', textSec: '#9A9A9A', border: '#3D3D3D' 
            },
            'sunrise-coral': { 
                primary: '#F78166', secondary: '#DA3633', bg: '#140A0A', surface: '#1F1313', 
                text: '#F7D4CC', textSec: '#D1918A', border: '#552D2D' 
            },
            'cherry-blossom': { 
                primary: '#FF6B9D', secondary: '#E91E63', bg: '#140A0F', surface: '#1F1318', 
                text: '#FFD6E8', textSec: '#E89BBB', border: '#4D2D3D' 
            }
        };
        
        const lightModes = {
            'oceanic-depths': { 
                primary: '#0969DA', secondary: '#218BFF', bg: '#F0F6FC', surface: '#E6F0FA', 
                text: '#0D3A5F', textSec: '#4E7BA3', border: '#C5D9ED' 
            },
            'evergreen-forest': { 
                primary: '#1A7F37', secondary: '#2DA44E', bg: '#F0FAF3', surface: '#E6F5EA', 
                text: '#0F4C23', textSec: '#3D8555', border: '#C5E8D1' 
            },
            'cyberpunk-neon': { 
                primary: '#8250DF', secondary: '#A371F7', bg: '#F8F4FC', surface: '#F0E8FA', 
                text: '#3B1E6B', textSec: '#6D47A1', border: '#DBC9F0' 
            },
            'monochrome-minimalist': { 
                primary: '#6E7681', secondary: '#8B949E', bg: '#FAFAFA', surface: '#F0F0F0', 
                text: '#2B2B2B', textSec: '#5A5A5A', border: '#D4D4D4' 
            },
            'sunrise-coral': { 
                primary: '#CF222E', secondary: '#F78166', bg: '#FDF5F4', surface: '#FAEBE8', 
                text: '#6B1418', textSec: '#A14249', border: '#F0C9C9' 
            },
            'cherry-blossom': { 
                primary: '#D81B60', secondary: '#F06292', bg: '#FFF0F5', surface: '#FFE4EE', 
                text: '#6B1437', textSec: '#9C4D6B', border: '#FFCCE0' 
            }
        };
        
        if (!darkModes[theme]) {
            theme = 'oceanic-depths';
        }
        
        const palette = (isDark ? darkModes : lightModes)[theme] || darkModes['oceanic-depths'];
        if (!palette) return; // No palette found
        
        const root = document.documentElement;
        const hexToRgbString = (color) => {
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
        };
        const entries = [
            ['--primary-color', palette.primary],
            ['--secondary-color', palette.secondary],
            ['--background-color', palette.bg],
            ['--surface-color', palette.surface],
            ['--accent-color', palette.primary],
            ['--text-primary', palette.text],
            ['--text-secondary', palette.textSec],
            ['--border-color', palette.border]
        ];
        entries.forEach(([prop, value]) => root.style.setProperty(prop, value));

        const accentRgb = hexToRgbString(palette.primary);
        if (accentRgb) {
            root.style.setProperty('--accent-primary-rgb', accentRgb);
        }

        const htmlClasses = root.classList;
        htmlClasses.remove('dark', 'light-mode');
        htmlClasses.add(isDark ? 'dark' : 'light-mode');
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-theme-mode', isDark ? 'dark' : 'light');

        const syncBodyClass = () => {
            if (!document.body) return;
            document.body.classList.remove('dark', 'light-mode');
            document.body.classList.add(isDark ? 'dark' : 'light-mode');
        };

        if (document.body) {
            syncBodyClass();
        } else {
            document.addEventListener('DOMContentLoaded', syncBodyClass, { once: true });
        }
        
    } catch (error) {
        console.error('Theme preload error:', error);
    }
})();