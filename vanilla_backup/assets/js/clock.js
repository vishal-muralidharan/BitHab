class Clock {
    constructor() {
        this.isRunning = false;
        this.clockInterval = null;
        this.settings = {
            clockStyle: 'digital', // digital, analog, hybrid
            timeFormat: '12', // 12 or 24
            theme: 'default',
            background: 'gradient',
            showDate: true,
            showSeconds: true,
            showMotivation: false,
            breathingAnimation: false,
            clockSize: 1
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupClock();
        this.setupEventListeners();
        this.generateAnalogClockMarkers();
        this.start();
    }

    loadSettings() {
        const saved = localStorage.getItem('focusClockSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }

    saveSettings() {
        localStorage.setItem('focusClockSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        const focusMode = document.querySelector('.focus-mode');
        const clockContainer = document.getElementById('clock-container');
        
        // Apply theme
        focusMode.setAttribute('data-theme', this.settings.theme);
        focusMode.setAttribute('data-background', this.settings.background);
        
        // Apply clock style
        this.setClockStyle(this.settings.clockStyle);
        
        // Apply clock size
        clockContainer.style.transform = `scale(${this.settings.clockSize})`;
        
        // Apply display options
        this.toggleDate(this.settings.showDate);
        this.toggleSeconds(this.settings.showSeconds);
        this.toggleMotivation(this.settings.showMotivation);
        this.toggleBreathing(this.settings.breathingAnimation);
        
        // Update customization panel
        this.updateCustomizationPanel();
    }

    updateCustomizationPanel() {
        // Update radio buttons
        document.querySelector(`input[name="clockStyle"][value="${this.settings.clockStyle}"]`).checked = true;
        document.querySelector(`input[name="timeFormat"][value="${this.settings.timeFormat}"]`).checked = true;
        document.querySelector(`input[name="background"][value="${this.settings.background}"]`).checked = true;
        
        // Update theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.settings.theme);
        });
        
        // Update checkboxes
        document.getElementById('show-date').checked = this.settings.showDate;
        document.getElementById('show-seconds').checked = this.settings.showSeconds;
        document.getElementById('show-motivation').checked = this.settings.showMotivation;
        document.getElementById('breathing-animation').checked = this.settings.breathingAnimation;
        
        // Update slider
        document.getElementById('clock-size').value = this.settings.clockSize;
        document.querySelector('.slider-value').textContent = `${Math.round(this.settings.clockSize * 100)}%`;
    }

    setupClock() {
        this.updateTime();
        this.updateDate();
    }

    setupEventListeners() {
        // Clock style change - check if elements exist
        const clockStyleInputs = document.querySelectorAll('input[name="clockStyle"]');
        if (clockStyleInputs.length > 0) {
            clockStyleInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.settings.clockStyle = e.target.value;
                    this.setClockStyle(e.target.value);
                    this.saveSettings();
                });
            });
        }

        // Time format change
        const timeFormatInputs = document.querySelectorAll('input[name="timeFormat"]');
        if (timeFormatInputs.length > 0) {
            timeFormatInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.settings.timeFormat = e.target.value;
                    this.saveSettings();
                });
            });
        }

        // Background change
        const backgroundInputs = document.querySelectorAll('input[name="background"]');
        if (backgroundInputs.length > 0) {
            backgroundInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.settings.background = e.target.value;
                    const focusMode = document.querySelector('.focus-mode');
                    if (focusMode) {
                        focusMode.setAttribute('data-background', e.target.value);
                    }
                    this.saveSettings();
                });
            });
        }

        // Theme selection
        const themeOptions = document.querySelectorAll('.theme-option');
        if (themeOptions.length > 0) {
            themeOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const theme = e.currentTarget.dataset.theme;
                    this.settings.theme = theme;
                    
                    // Update UI
                    themeOptions.forEach(opt => opt.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    const focusMode = document.querySelector('.focus-mode');
                    if (focusMode) {
                        focusMode.setAttribute('data-theme', theme);
                    }
                    
                    this.saveSettings();
                });
            });
        }

        // Display options
        const showDateElement = document.getElementById('show-date');
        if (showDateElement) {
            showDateElement.addEventListener('change', (e) => {
                this.settings.showDate = e.target.checked;
                this.toggleDate(e.target.checked);
                this.saveSettings();
            });
        }

        const showSecondsElement = document.getElementById('show-seconds');
        if (showSecondsElement) {
            showSecondsElement.addEventListener('change', (e) => {
                this.settings.showSeconds = e.target.checked;
                this.toggleSeconds(e.target.checked);
                this.saveSettings();
            });
        }

        const showMotivationElement = document.getElementById('show-motivation');
        if (showMotivationElement) {
            showMotivationElement.addEventListener('change', (e) => {
                this.settings.showMotivation = e.target.checked;
                this.toggleMotivation(e.target.checked);
                this.saveSettings();
            });
        }

        const breathingAnimationElement = document.getElementById('breathing-animation');
        if (breathingAnimationElement) {
            breathingAnimationElement.addEventListener('change', (e) => {
                this.settings.breathingAnimation = e.target.checked;
                this.toggleBreathing(e.target.checked);
                this.saveSettings();
            });
        }

        // Clock size slider
        const clockSizeElement = document.getElementById('clock-size');
        if (clockSizeElement) {
            clockSizeElement.addEventListener('input', (e) => {
                this.settings.clockSize = parseFloat(e.target.value);
                const clockContainer = document.getElementById('clock-container');
                if (clockContainer) {
                    clockContainer.style.transform = `scale(${this.settings.clockSize})`;
                }
                const sliderValue = document.querySelector('.slider-value');
                if (sliderValue) {
                    sliderValue.textContent = `${Math.round(this.settings.clockSize * 100)}%`;
                }
                this.saveSettings();
            });
        }

        // Reset settings
        const resetSettingsElement = document.getElementById('reset-settings');
        if (resetSettingsElement) {
            resetSettingsElement.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }

        // Fullscreen toggle
        const fullscreenToggleElement = document.getElementById('fullscreen-toggle');
        if (fullscreenToggleElement) {
            fullscreenToggleElement.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
            if (e.key === 'Escape' && document.fullscreenElement) {
                document.exitFullscreen();
            }
        });
    }

    generateAnalogClockMarkers() {
        const markersGroup = document.querySelector('.hour-markers');
        if (!markersGroup) return;

        // Clear existing markers
        markersGroup.innerHTML = '';

        // Generate 12 hour markers
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) - 90; // Start from 12 o'clock
            const radian = (angle * Math.PI) / 180;
            
            // Major hour markers
            const x1 = 100 + Math.cos(radian) * 85;
            const y1 = 100 + Math.sin(radian) * 85;
            const x2 = 100 + Math.cos(radian) * 75;
            const y2 = 100 + Math.sin(radian) * 75;
            
            const hourMarker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hourMarker.setAttribute('x1', x1);
            hourMarker.setAttribute('y1', y1);
            hourMarker.setAttribute('x2', x2);
            hourMarker.setAttribute('y2', y2);
            hourMarker.classList.add('hour-marker');
            markersGroup.appendChild(hourMarker);
        }

        // Generate minute markers
        for (let i = 0; i < 60; i++) {
            if (i % 5 !== 0) { // Skip positions where hour markers are
                const angle = (i * 6) - 90; // 6 degrees per minute
                const radian = (angle * Math.PI) / 180;
                
                const x1 = 100 + Math.cos(radian) * 85;
                const y1 = 100 + Math.sin(radian) * 85;
                const x2 = 100 + Math.cos(radian) * 80;
                const y2 = 100 + Math.sin(radian) * 80;
                
                const minuteMarker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                minuteMarker.setAttribute('x1', x1);
                minuteMarker.setAttribute('y1', y1);
                minuteMarker.setAttribute('x2', x2);
                minuteMarker.setAttribute('y2', y2);
                minuteMarker.classList.add('minute-marker');
                markersGroup.appendChild(minuteMarker);
            }
        }
    }

    updateTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Update digital clock
        this.updateDigitalClock(hours, minutes, seconds);
        
        // Update analog clock
        this.updateAnalogClock(hours, minutes, seconds);
    }

    updateDigitalClock(hours, minutes, seconds) {
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const ampmElement = document.getElementById('ampm');

        let displayHours = hours;
        let ampm = '';

        if (this.settings.timeFormat === '12') {
            ampm = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours % 12;
            displayHours = displayHours ? displayHours : 12; // 0 should be 12
        }

        if (hoursElement) hoursElement.textContent = displayHours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (ampmElement) ampmElement.textContent = ampm;
    }

    updateAnalogClock(hours, minutes, seconds) {
        const hourHand = document.getElementById('hour-hand');
        const minuteHand = document.getElementById('minute-hand');

        if (!hourHand || !minuteHand) return;

        // Calculate angles (subtract 90 to start from 12 o'clock)
        const hourAngle = ((hours % 12) * 30) + (minutes * 0.5) - 90;
        const minuteAngle = (minutes * 6) - 90;

        // Apply rotations
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }

    updateDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('en-US', options);
        
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    setClockStyle(style) {
        const digitalClock = document.getElementById('digital-clock');
        const analogClock = document.getElementById('analog-clock');
        const clockContainer = document.getElementById('clock-container');

        // Remove existing style classes
        clockContainer.classList.remove('hybrid');
        digitalClock.classList.remove('hidden');
        analogClock.classList.remove('hidden');

        switch (style) {
            case 'digital':
                analogClock.classList.add('hidden');
                break;
            case 'analog':
                digitalClock.classList.add('hidden');
                break;
            case 'hybrid':
                clockContainer.classList.add('hybrid');
                break;
        }
    }

    toggleDate(show) {
        const dateElement = document.getElementById('date-display');
        if (dateElement) {
            dateElement.style.display = show ? 'block' : 'none';
        }
    }

    toggleSeconds(show) {
        const secondsElement = document.getElementById('seconds');
        const separators = document.querySelectorAll('.separator');
        
        if (secondsElement) {
            secondsElement.style.display = show ? 'inline' : 'none';
        }
        
        // Hide the last separator if seconds are hidden
        if (separators.length >= 2) {
            separators[1].style.display = show ? 'inline' : 'none';
        }
    }

    toggleMotivation(show) {
        const motivationElement = document.getElementById('motivation-overlay');
        if (motivationElement) {
            motivationElement.style.display = show ? 'block' : 'none';
        }
    }

    toggleBreathing(enabled) {
        const clockContainer = document.getElementById('clock-container');
        if (clockContainer) {
            clockContainer.classList.toggle('breathing', enabled);
        }
    }

    toggleFullscreen() {
        const focusMode = document.querySelector('.focus-mode');
        
        if (!document.fullscreenElement) {
            focusMode.requestFullscreen().then(() => {
                focusMode.classList.add('fullscreen');
            }).catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                focusMode.classList.remove('fullscreen');
            });
        }
    }

    resetToDefaults() {
        this.settings = {
            clockStyle: 'digital',
            timeFormat: '12',
            theme: 'default',
            background: 'gradient',
            showDate: true,
            showSeconds: true,
            showMotivation: false,
            breathingAnimation: false,
            clockSize: 1
        };
        
        this.applySettings();
        this.saveSettings();
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateTime();
        this.clockInterval = setInterval(() => {
            this.updateTime();
        }, 1000);

        // Update date every minute
        this.dateInterval = setInterval(() => {
            this.updateDate();
        }, 60000);
    }

    stop() {
        this.isRunning = false;
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        if (this.dateInterval) {
            clearInterval(this.dateInterval);
            this.dateInterval = null;
        }
    }

    destroy() {
        this.stop();
    }
}

// Initialize clock when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.focusClock = new Clock();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Clock;
}
