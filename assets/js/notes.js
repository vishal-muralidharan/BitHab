// Notes page functionality
class NotesManager {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.state = {
            dailyNotes: {},
            generalNotes: {},
            currentType: 'daily',
            currentFilter: 'all',
            generalFilter: 'all'
        };
        this.editingNoteId = null;
        this.editingNoteType = null;
        this.cache = new Map(); // Add caching for faster access
        this.saveTimeout = null; // Debounce saves
        this.init();
    }

    init() {
        // Show loading immediately
        this.showLoading();
        
        // Wait for DOM to be ready before setting up auth listener
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupAuth();
            });
        } else {
            this.setupAuth();
        }
    }

    showLoading() {
        const notesList = document.getElementById('notes-list');
        if (notesList) {
            notesList.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.7;">Loading notes...</div>';
        }
    }

    setupAuth() {
        authManager.onAuthStateChange(user => {
            if (user) {
                // Initialize DatabaseService
                if (window.DatabaseService) {
                    window.DatabaseService.init(user.uid, this.db);
                    console.log('DatabaseService initialized for notes');
                }
                
                this.loadAllNotesOptimized();
                this.setupEventListeners();
            } else {
                // Auth manager will handle redirect
            }
        });
    }

    setupEventListeners() {
        // Note type toggle
        document.querySelectorAll('.note-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchNoteType(e.target.dataset.type);
            });
        });

        // Filter buttons for daily notes
        document.querySelectorAll('.notes-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Filter buttons for general notes
        document.querySelectorAll('.general-notes-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setGeneralFilter(e.target.dataset.filter);
            });
        });

        // Add new note buttons
        const addDailyBtn = document.getElementById('add-new-note-btn');
        if (addDailyBtn) {
            addDailyBtn.addEventListener('click', () => {
                this.openAddNoteModal('daily');
            });
        }

        const addGeneralBtn = document.getElementById('add-new-general-note-btn');
        if (addGeneralBtn) {
            addGeneralBtn.addEventListener('click', () => {
                this.openAddNoteModal('general');
            });
        }

        // Date shortcuts
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('date-shortcut')) {
                const days = parseInt(e.target.dataset.days);
                const date = new Date();
                date.setDate(date.getDate() + days);
                const dateStr = date.toISOString().split('T')[0];
                document.getElementById('edit-note-date').value = dateStr;
                if (this.editingNoteType === 'daily') {
                    this.updateDailyNoteFormState(dateStr);
                }
            }
        });

        // Edit modal events
        const closeModalBtn = document.getElementById('close-edit-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const saveBtn = document.getElementById('save-note-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveNote();
            });
        }

        const deleteBtn = document.getElementById('delete-note-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.confirmDeleteNote();
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('edit-note-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'edit-note-modal') {
                    this.closeEditModal();
                }
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn-sidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.auth.signOut().then(() => {
                    window.location.href = '../pages/login.html';
                });
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!document.getElementById('edit-note-modal').classList.contains('hidden')) {
                    this.saveNote();
                }
            }
        });

        // Auto-save with debouncing for text areas
        const textArea = document.getElementById('edit-note-text');
        if (textArea) {
            textArea.addEventListener('input', () => {
                this.autoResizeTextarea();
                // Only auto-save if editing existing note
                if (this.editingNoteId || this.editingNoteType === 'daily') {
                    this.debouncedSave(() => {
                        this.autoSaveNote();
                    }, 2000); // Auto-save after 2 seconds of no typing
                }
            });
            // Ensure height matches pre-filled content
            this.autoResizeTextarea();
        }

        const titleField = document.getElementById('general-note-title');
        if (titleField) {
            titleField.addEventListener('input', () => {
                if (this.editingNoteId) {
                    this.debouncedSave(() => {
                        this.autoSaveNote();
                    }, 2000);
                }
            });
        }

        const dateField = document.getElementById('edit-note-date');
        if (dateField) {
            dateField.addEventListener('change', () => {
                if (this.editingNoteType === 'daily' && dateField.value) {
                    this.updateDailyNoteFormState(dateField.value);
                }
            });
        }
        
        // Window focus refresh with cache optimization
        window.addEventListener('focus', () => {
            this.refreshNotesOnFocus();
        });

        // Cleanup cache every 10 minutes
        setInterval(() => {
            this.cleanupCache();
        }, 600000);

        // Preload common data in background after initial load
        setTimeout(() => {
            this.preloadBackgroundData();
        }, 3000);
        
        // Setup note event delegation for better performance
        this.setupNoteEventDelegation();
    }

    setupNoteEventDelegation() {
        // Remove any existing listeners to prevent duplicates
        const dailyNotesList = document.getElementById('notes-list');
        const generalNotesList = document.getElementById('general-notes-list');
        
        // Use event delegation for daily notes
        if (dailyNotesList) {
            // Remove existing delegated listener if any
            if (this.handleDailyNoteClick) {
                dailyNotesList.removeEventListener('click', this.handleDailyNoteClick);
            }
            // Add new delegated listener
            this.handleDailyNoteClick = (e) => {
                const editBtn = e.target.closest('.edit-note-btn');
                const noteCard = e.target.closest('.note-card');
                
                if (editBtn) {
                    e.stopPropagation();
                    this.openEditModal(editBtn.dataset.date, 'daily');
                } else if (noteCard) {
                    const cardEditBtn = noteCard.querySelector('.edit-note-btn');
                    if (cardEditBtn) {
                        this.openEditModal(cardEditBtn.dataset.date, 'daily');
                    }
                }
            };
            dailyNotesList.addEventListener('click', this.handleDailyNoteClick);
        }
        
        // Use event delegation for general notes
        if (generalNotesList) {
            // Remove existing delegated listener if any
            if (this.handleGeneralNoteClick) {
                generalNotesList.removeEventListener('click', this.handleGeneralNoteClick);
            }
            // Add new delegated listener
            this.handleGeneralNoteClick = (e) => {
                const editBtn = e.target.closest('.edit-general-note-btn');
                const noteCard = e.target.closest('.general-note-card');
                
                if (editBtn) {
                    e.stopPropagation();
                    this.openEditModal(editBtn.dataset.id, 'general');
                } else if (noteCard) {
                    const cardEditBtn = noteCard.querySelector('.edit-general-note-btn');
                    if (cardEditBtn) {
                        this.openEditModal(cardEditBtn.dataset.id, 'general');
                    }
                }
            };
            generalNotesList.addEventListener('click', this.handleGeneralNoteClick);
        }
    }

    switchNoteType(type) {
        this.state.currentType = type;
        
        // Update active button
        document.querySelectorAll('.note-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Show/hide sections
        if (type === 'daily') {
            document.getElementById('daily-notes-section').classList.remove('hidden');
            document.getElementById('general-notes-section').classList.add('hidden');
        } else {
            document.getElementById('daily-notes-section').classList.add('hidden');
            document.getElementById('general-notes-section').classList.remove('hidden');
        }

        this.renderNotes();
    }

    async loadAllNotesOptimized() {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            // Check cache first
            const cacheKey = `notes_${user.uid}`;
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                this.state.dailyNotes = cachedData.daily;
                this.state.generalNotes = cachedData.general;
                this.renderNotes();
                this.updateStats();
                // Load fresh data in background
                this.loadFreshData(user.uid);
                return;
            }

            this.showLoading(true);
            
            // Load daily notes ordered by date (doc id is YYYY-MM-DD)
            const [dailyNotesSnapshot, allGeneralNotesSnapshot] = await Promise.all([
                this.db.collection('users')
                    .doc(user.uid)
                    .collection('notes')
                    .get(),
                this.db.collection('users')
                    .doc(user.uid)
                    .collection('generalNotes')
                    .get()
            ]);
            
            // Process all daily notes
            this.state.dailyNotes = {};
            dailyNotesSnapshot.forEach(doc => {
                this.state.dailyNotes[doc.id] = doc.data().note;
            });

            // Process general notes
            this.state.generalNotes = {};
            allGeneralNotesSnapshot.forEach(doc => {
                this.state.generalNotes[doc.id] = {
                    ...doc.data(),
                    id: doc.id
                };
            });

            // Cache the data
            this.cache.set(cacheKey, {
                daily: { ...this.state.dailyNotes },
                general: { ...this.state.generalNotes },
                timestamp: Date.now()
            });

            this.renderNotes();
            this.updateStats();
            this.showLoading(false);

        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Load Notes Error',
                message: 'Failed to load notes. Please refresh the page.',
                details: error.message || 'Unknown error occurred while loading notes',
                type: 'error'
            });
            this.showLoading(false);
        }
    }

    async loadFreshData(userId) {
        // Silently refresh cache in background
        try {
            const [dailyNotesSnapshot, generalNotesSnapshot] = await Promise.all([
                this.db.collection('users')
                    .doc(userId)
                    .collection('notes')
                    .get(),
                this.db.collection('users')
                    .doc(userId)
                    .collection('generalNotes')
                    .get()
            ]);
            
            // Update cache
            const freshData = { daily: {}, general: {}, timestamp: Date.now() };
            dailyNotesSnapshot.forEach(doc => {
                freshData.daily[doc.id] = doc.data().note;
            });
            generalNotesSnapshot.forEach(doc => {
                freshData.general[doc.id] = { ...doc.data(), id: doc.id };
            });
            
            this.cache.set(`notes_${userId}`, freshData);
            
            // Update state if data changed
            if (JSON.stringify(this.state.dailyNotes) !== JSON.stringify(freshData.daily) ||
                JSON.stringify(this.state.generalNotes) !== JSON.stringify(freshData.general)) {
                this.state.dailyNotes = freshData.daily;
                this.state.generalNotes = freshData.general;
                this.renderNotes();
                this.updateStats();
            }
        } catch (error) {
            console.error('Error refreshing notes:', error);
        }
    }

    async loadDailyNotes() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            const snapshot = await this.db.collection('users').doc(user.uid).collection('notes').get();
            const dailyNotes = {};
            snapshot.forEach(doc => {
                dailyNotes[doc.id] = doc.data().note;
            });

            this.state.dailyNotes = dailyNotes;

            const cacheKey = `notes_${user.uid}`;
            const cachedData = this.cache.get(cacheKey) || { daily: {}, general: { ...this.state.generalNotes } };
            cachedData.daily = { ...dailyNotes };
            cachedData.timestamp = Date.now();
            this.cache.set(cacheKey, cachedData);
        } catch (error) {
            console.error('Failed to reload daily notes:', error);
            throw error;
        }
    }

    async loadGeneralNotes() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            const snapshot = await this.db.collection('users').doc(user.uid).collection('generalNotes').get();
            const generalNotes = {};
            snapshot.forEach(doc => {
                generalNotes[doc.id] = { ...doc.data(), id: doc.id };
            });

            this.state.generalNotes = generalNotes;

            const cacheKey = `notes_${user.uid}`;
            const cachedData = this.cache.get(cacheKey) || { daily: { ...this.state.dailyNotes }, general: {} };
            cachedData.general = { ...generalNotes };
            cachedData.timestamp = Date.now();
            this.cache.set(cacheKey, cachedData);
        } catch (error) {
            console.error('Failed to reload general notes:', error);
            throw error;
        }
    }

    async refreshNotesInBackground() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            await this.loadFreshData(user.uid);
        } catch (error) {
            console.error('Background refresh failed:', error);
        }
    }

    async loadAllNotes() {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            this.showLoading(true);
            
            // Load both collections in parallel for better performance
            const [dailyNotesSnapshot, generalNotesSnapshot] = await Promise.all([
                this.db.collection('users').doc(user.uid).collection('notes').get(),
                this.db.collection('users').doc(user.uid).collection('generalNotes').get()
            ]);
            
            // Process daily notes
            this.state.dailyNotes = {};
            dailyNotesSnapshot.forEach(doc => {
                this.state.dailyNotes[doc.id] = doc.data().note;
            });

            // Process general notes
            this.state.generalNotes = {};
            generalNotesSnapshot.forEach(doc => {
                this.state.generalNotes[doc.id] = doc.data();
            });

            this.updateStats();
            this.renderNotes();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading notes:', error);
            this.showLoading(false);
            // Use global error handler
            if (window.errorHandler) {
                errorHandler.handleFirebaseError(error, 'Failed to load notes. Please refresh the page.');
            } else {
                this.showErrorMessage('Failed to load notes. Please refresh the page.');
            }
        }
    }

    updateStats() {
        const dailyNotes = Object.values(this.state.dailyNotes);
        const generalNotes = Object.values(this.state.generalNotes);
        const totalNotes = dailyNotes.length;
        
        // Calculate notes from current month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const thisMonthNotes = Object.keys(this.state.dailyNotes).filter(dateStr => {
            const noteDate = new Date(dateStr);
            return noteDate.getFullYear() === currentYear && noteDate.getMonth() === currentMonth;
        }).length;

        document.getElementById('total-notes').textContent = totalNotes;
        document.getElementById('recent-notes').textContent = thisMonthNotes;
        document.getElementById('general-notes-count').textContent = generalNotes.length;
    }

    setFilter(filter) {
        this.state.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.notes-filter .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderNotes();
    }

    setGeneralFilter(filter) {
        this.state.generalFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.general-notes-filter .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderNotes();
    }

    renderNotes() {
        if (this.state.currentType === 'daily') {
            this.renderDailyNotes();
        } else {
            this.renderGeneralNotes();
        }
    }

    renderDailyNotes() {
        const notesList = document.getElementById('notes-list');
        const emptyState = document.getElementById('empty-state');
        
        if (!notesList) {
            console.error('Notes list element not found');
            return;
        }
        
        const filteredNotes = this.getFilteredDailyNotes();
        
        if (filteredNotes.length === 0) {
            notesList.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
                notesList.appendChild(emptyState);
            }
            return;
        }

        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        // Sort notes by date (newest first)
        filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Create notes HTML
        const notesHTML = filteredNotes.map(note => this.createDailyNoteCard(note)).join('');
        notesList.innerHTML = notesHTML;
        
        // Add empty state back to DOM if it exists
        if (emptyState && emptyState.parentNode !== notesList) {
            notesList.appendChild(emptyState);
        }

        // Use event delegation instead of adding individual listeners
        this.setupNoteEventDelegation();
    }

    renderGeneralNotes() {
        const notesList = document.getElementById('general-notes-list');
        const emptyState = document.getElementById('general-empty-state');
        
        if (!notesList) {
            console.error('General notes list element not found');
            return;
        }
        
        const filteredNotes = this.getFilteredGeneralNotes();
        
        if (filteredNotes.length === 0) {
            notesList.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
                notesList.appendChild(emptyState);
            }
            return;
        }

        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        // Sort notes by creation date (newest first)
        filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Create notes HTML
        const notesHTML = filteredNotes.map(note => this.createGeneralNoteCard(note)).join('');
        notesList.innerHTML = notesHTML;
        
        // Add empty state back to DOM if it exists
        if (emptyState && emptyState.parentNode !== notesList) {
            notesList.appendChild(emptyState);
        }

        // Use event delegation instead of adding individual listeners
        this.setupNoteEventDelegation();
    }

    getFilteredDailyNotes() {
        const notes = Object.entries(this.state.dailyNotes);
        const now = new Date();
        
        return notes.map(([date, text]) => ({ date, text })).filter(note => {
            if (this.state.currentFilter === 'all') return true;
            
            const noteDate = new Date(note.date);
            const daysDiff = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24));
            
            if (this.state.currentFilter === 'recent') {
                return daysDiff <= 30;
            } else if (this.state.currentFilter === 'older') {
                return daysDiff > 30;
            }
            
            return true;
        });
    }

    getFilteredGeneralNotes() {
        const notes = Object.entries(this.state.generalNotes);
        const now = new Date();
        
        return notes.map(([id, data]) => ({ id, ...data })).filter(note => {
            if (this.state.generalFilter === 'all') return true;
            
            const noteDate = new Date(note.createdAt);
            const daysDiff = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24));
            
            if (this.state.generalFilter === 'recent') {
                return daysDiff <= 30;
            }
            
            return true;
        });
    }

    createDailyNoteCard(note) {
        const formattedDate = this.formatDate(note.date);
        const preview = note.text.length > 120 ? note.text.substring(0, 120) + '...' : note.text;
        
        return `
            <div class="note-card">
                <div class="note-header">
                    <div class="note-date">
                        📅 ${formattedDate}
                    </div>
                    <div class="note-actions">
                        <button class="note-action-btn edit-note-btn" data-date="${note.date}" title="Edit note">
                            <i class="fas fa-pen" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">
                    <p class="note-text">${this.escapeHtml(preview)}</p>
                </div>
            </div>
        `;
    }

    createGeneralNoteCard(note) {
        const title = note.title || 'Untitled Note';
        const preview = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;
        
        return `
            <div class="general-note-card">
                <div class="general-note-header">
                    <h3 class="general-note-title">${this.escapeHtml(title)}</h3>
                    <div class="note-actions">
                        <button class="note-action-btn edit-general-note-btn" data-id="${note.id}" title="Edit note">
                            <i class="fas fa-pen" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div class="general-note-content">
                    <p class="general-note-text">${this.escapeHtml(preview)}</p>
                </div>
            </div>
        `;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getRelativeDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateDailyNoteFormState(dateStr) {
        const noteContent = this.state.dailyNotes[dateStr] || '';
        const noteTextarea = document.getElementById('edit-note-text');
        const modalElement = document.getElementById('edit-note-modal');
        const deleteBtn = document.getElementById('delete-note-btn');
        const titleEl = document.getElementById('edit-modal-title');
        const dateEl = document.getElementById('edit-modal-date');

        if (noteTextarea) {
            noteTextarea.value = noteContent;
            this.autoResizeTextarea();
        }

        if (noteContent) {
            this.editingNoteId = dateStr;
            if (modalElement) {
                modalElement.classList.add('editing-existing-note');
            }
            if (deleteBtn) {
                deleteBtn.classList.remove('hidden');
            }
            if (titleEl) {
                titleEl.textContent = 'Edit Daily Note';
            }
            if (dateEl) {
                dateEl.textContent = this.formatDate(dateStr);
            }
        } else {
            this.editingNoteId = null;
            if (modalElement) {
                modalElement.classList.remove('editing-existing-note');
            }
            if (deleteBtn) {
                deleteBtn.classList.add('hidden');
            }
            if (titleEl) {
                titleEl.textContent = 'Add Daily Note';
            }
            if (dateEl) {
                dateEl.textContent = this.formatDate(dateStr);
            }
        }
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('edit-note-text');
        if (!textarea) return;

        if (!textarea.dataset.baseHeight) {
            const computed = parseFloat(window.getComputedStyle(textarea).minHeight);
            const fallback = textarea.clientHeight || 120;
            textarea.dataset.baseHeight = String(computed || fallback);
        }

        const baseHeight = Number(textarea.dataset.baseHeight) || 120;
        const computedMax = parseFloat(window.getComputedStyle(textarea).maxHeight);
        const maxHeight = Number.isFinite(computedMax) && computedMax > 0 ? computedMax : 320;

        textarea.style.height = `${baseHeight}px`;
        const scrollHeight = textarea.scrollHeight;

        if (scrollHeight <= baseHeight + 16) {
            textarea.style.height = `${baseHeight}px`;
            textarea.style.overflowY = 'hidden';
            return;
        }

        if (scrollHeight <= maxHeight) {
            textarea.style.height = `${scrollHeight}px`;
            textarea.style.overflowY = 'hidden';
            return;
        }

        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
    }

    openAddNoteModal(type) {
        this.editingNoteId = null;
        this.editingNoteType = type;
        const modal = document.getElementById('edit-note-modal');
        const deleteBtn = document.getElementById('delete-note-btn');
        const titleEl = document.getElementById('edit-modal-title');
        
        if (type === 'daily') {
            document.getElementById('daily-note-fields').classList.remove('hidden');
            document.getElementById('general-note-fields').classList.add('hidden');

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            document.getElementById('edit-note-date').value = todayStr;
            this.updateDailyNoteFormState(todayStr);
        } else {
            document.getElementById('daily-note-fields').classList.add('hidden');
            document.getElementById('general-note-fields').classList.remove('hidden');

            document.getElementById('general-note-title').value = '';
            document.getElementById('edit-note-text').value = '';
            this.autoResizeTextarea();
            if (modal) {
                modal.classList.remove('editing-existing-note');
            }
            if (deleteBtn) {
                deleteBtn.classList.add('hidden');
            }
            if (titleEl) {
                titleEl.textContent = 'Add General Note';
            }
            const dateEl = document.getElementById('edit-modal-date');
            if (dateEl) {
                dateEl.textContent = '';
            }
        }
        
        // Show modal with animation
        modal.classList.remove('hidden');
        
        // Trigger animation after a brief delay
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.style.transform = 'scale(1)';
        }, 10);
        
        // Focus appropriate field
        setTimeout(() => {
            if (type === 'general') {
                document.getElementById('general-note-title').focus();
            } else {
                document.getElementById('edit-note-text').focus();
            }
        }, 150);
    }

    openEditModal(id, type) {
        this.editingNoteId = id;
        this.editingNoteType = type;
        
        if (type === 'daily') {
            document.getElementById('daily-note-fields').classList.remove('hidden');
            document.getElementById('general-note-fields').classList.add('hidden');
            
            document.getElementById('edit-note-date').value = id;
            this.updateDailyNoteFormState(id);
        } else {
            document.getElementById('daily-note-fields').classList.add('hidden');
            document.getElementById('general-note-fields').classList.remove('hidden');
            
            const note = this.state.generalNotes[id];
            document.getElementById('general-note-title').value = note.title || '';
            document.getElementById('edit-note-text').value = note.content || '';
            this.autoResizeTextarea();
            document.getElementById('edit-modal-title').textContent = 'Edit General Note';
            const dateEl = document.getElementById('edit-modal-date');
            if (dateEl) {
                dateEl.textContent = '';
            }
            
            // Remove the class for general notes
            document.getElementById('edit-note-modal').classList.remove('editing-existing-note');
        }
        
        // Show delete button for existing notes
        document.getElementById('delete-note-btn').classList.remove('hidden');
        
        // Show modal with animation
        const modal = document.getElementById('edit-note-modal');
        modal.classList.remove('hidden');
        
        // Trigger animation after a brief delay
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.style.transform = 'scale(1)';
        }, 10);
        
        // Focus text area
        setTimeout(() => {
            document.getElementById('edit-note-text').focus();
        }, 150);
    }

    closeEditModal() {
        const modal = document.getElementById('edit-note-modal');
        
        // Animate out
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modal.style.transform = 'scale(0.95)';
        
        // Hide modal after animation
        setTimeout(() => {
            modal.classList.add('hidden');
            this.editingNoteId = null;
            this.editingNoteType = null;
        }, 300);
    }

    // Debounced save for better performance
    debouncedSave(callback, delay = 1000) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(callback, delay);
    }

    async saveNote() {
        const noteText = document.getElementById('edit-note-text').value.trim();
        
        if (!noteText) {
            errorHandler.showErrorDialog({
                title: 'Missing Note Content',
                message: 'Please enter some content for the note.',
                type: 'validation'
            });
            return;
        }
        
        try {
            this.showLoading(true);
            
            const user = this.auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            if (this.editingNoteType === 'daily') {
                const dateStr = document.getElementById('edit-note-date').value;
                if (!dateStr) {
                    errorHandler.showErrorDialog({
                        title: 'Missing Date',
                        message: 'Please select a date.',
                        type: 'validation'
                    });
                    return;
                }

                // Optimistic update for faster UI response
                this.state.dailyNotes[dateStr] = noteText;
                this.renderNotes();
                this.updateStats();

                // Save to Firebase in background
                await this.db.collection('users').doc(user.uid).collection('notes').doc(dateStr).set({
                    note: noteText,
                    createdAt: new Date().toISOString()
                });

                // Update cache
                const cacheKey = `notes_${user.uid}`;
                if (this.cache.has(cacheKey)) {
                    const cachedData = this.cache.get(cacheKey);
                    cachedData.daily[dateStr] = noteText;
                    this.cache.set(cacheKey, cachedData);
                }
            } else {
                let title = document.getElementById('general-note-title').value.trim();
                
                // Auto-generate title if not provided
                if (!title) {
                    title = this.generateNoteTitle(noteText);
                }
                
                if (this.editingNoteId) {
                    const updatedNote = {
                        title: title,
                        content: noteText,
                        updatedAt: new Date().toISOString(),
                        id: this.editingNoteId
                    };

                    // Optimistic update
                    this.state.generalNotes[this.editingNoteId] = updatedNote;
                    this.renderNotes();
                    this.updateStats();

                    // Update existing general note
                    await this.db.collection('users').doc(user.uid).collection('generalNotes').doc(this.editingNoteId).update({
                        title: title,
                        content: noteText,
                        updatedAt: new Date().toISOString()
                    });

                    // Update cache
                    const cacheKey = `notes_${user.uid}`;
                    if (this.cache.has(cacheKey)) {
                        const cachedData = this.cache.get(cacheKey);
                        cachedData.general[this.editingNoteId] = updatedNote;
                        this.cache.set(cacheKey, cachedData);
                    }
                } else {
                    // Create new general note
                    const noteRef = this.db.collection('users').doc(user.uid).collection('generalNotes').doc();
                    const newNote = {
                        title: title,
                        content: noteText,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        id: noteRef.id
                    };

                    // Optimistic update
                    this.state.generalNotes[noteRef.id] = newNote;
                    this.renderNotes();
                    this.updateStats();

                    // Save to Firebase in background
                    await noteRef.set(newNote);

                    // Update cache
                    const cacheKey = `notes_${user.uid}`;
                    if (this.cache.has(cacheKey)) {
                        const cachedData = this.cache.get(cacheKey);
                        cachedData.general[noteRef.id] = newNote;
                        this.cache.set(cacheKey, cachedData);
                    }
                }
            }

            this.closeEditModal();
            console.log('Note saved successfully with optimistic updates');
        } catch (error) {
            errorHandler.showErrorDialog({
                title: 'Save Note Error',
                message: 'Failed to save note. Changes may be lost.',
                details: error.message || 'Unknown error occurred while saving note',
                type: 'error'
            });
            
            // Revert optimistic updates on error
            if (this.editingNoteType === 'daily') {
                await this.loadDailyNotes();
            } else {
                await this.loadGeneralNotes();
            }
            this.renderNotes();
            this.updateStats();
        } finally {
            this.showLoading(false);
        }
    }

    async autoSaveNote() {
        // Silent auto-save without UI feedback
        const noteText = document.getElementById('edit-note-text').value.trim();
        
        if (!noteText) return; // Don't save empty notes
        
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            if (this.editingNoteType === 'daily') {
                const dateStr = document.getElementById('edit-note-date').value;
                if (!dateStr) return;

                // Update local state
                this.state.dailyNotes[dateStr] = noteText;

                // Save to Firebase
                await this.db.collection('users').doc(user.uid).collection('notes').doc(dateStr).set({
                    note: noteText,
                    createdAt: new Date().toISOString()
                });

                // Update cache
                const cacheKey = `notes_${user.uid}`;
                if (this.cache.has(cacheKey)) {
                    const cachedData = this.cache.get(cacheKey);
                    cachedData.daily[dateStr] = noteText;
                    this.cache.set(cacheKey, cachedData);
                }
            } else if (this.editingNoteId) {
                let title = document.getElementById('general-note-title').value.trim();
                
                if (!title) {
                    title = this.generateNoteTitle(noteText);
                }

                const updatedNote = {
                    title: title,
                    content: noteText,
                    updatedAt: new Date().toISOString(),
                    id: this.editingNoteId
                };

                // Update local state
                this.state.generalNotes[this.editingNoteId] = updatedNote;

                // Save to Firebase
                await this.db.collection('users').doc(user.uid).collection('generalNotes').doc(this.editingNoteId).update({
                    title: title,
                    content: noteText,
                    updatedAt: new Date().toISOString()
                });

                // Update cache
                const cacheKey = `notes_${user.uid}`;
                if (this.cache.has(cacheKey)) {
                    const cachedData = this.cache.get(cacheKey);
                    cachedData.general[this.editingNoteId] = updatedNote;
                    this.cache.set(cacheKey, cachedData);
                }
            }

            console.log('Auto-save completed silently');
        } catch (error) {
            console.error('Auto-save failed:', error);
            // Don't show error to user for auto-save failures
        }
    }

    cleanupCache() {
        // Remove cache entries older than 30 minutes
        const maxAge = 30 * 60 * 1000; // 30 minutes
        const now = Date.now();
        
        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp && (now - value.timestamp) > maxAge) {
                this.cache.delete(key);
                console.log('Cleaned up cache entry:', key);
            }
        }
    }

    async preloadBackgroundData() {
        // Preload recent notes in background for faster access
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            // Load last 10 general notes in background
            const recentGeneralNotes = await this.db.collection('users')
                .doc(user.uid)
                .collection('generalNotes')
                .orderBy('updatedAt', 'desc')
                .limit(10)
                .get();

            // Update cache silently
            const cacheKey = `notes_${user.uid}`;
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                recentGeneralNotes.forEach(doc => {
                    if (!cachedData.general[doc.id]) {
                        cachedData.general[doc.id] = { id: doc.id, ...doc.data() };
                    }
                });
                cachedData.timestamp = Date.now();
                this.cache.set(cacheKey, cachedData);
            }

            console.log('Background data preload completed');
        } catch (error) {
            console.error('Background preload failed:', error);
        }
    }

    async refreshNotesOnFocus() {
        // Only refresh if user has been away for more than 30 seconds
        const lastRefresh = this.lastRefreshTime || 0;
        const now = Date.now();
        
        if (now - lastRefresh > 30000) { // 30 seconds
            this.lastRefreshTime = now;
            await this.refreshNotesInBackground();
        }
    }

    generateNoteTitle(content) {
        // Extract first line as title, or first 30 characters
        const firstLine = content.split('\n')[0].trim();
        if (firstLine.length > 0) {
            return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
        }
        
        // If no good first line, use first 30 characters
        const preview = content.substring(0, 30).trim();
        return preview + (content.length > 30 ? '...' : '');
    }

    confirmDeleteNote() {
        const modal = document.getElementById('confirmation-modal');
        const message = document.getElementById('confirmation-message');
        
        if (this.editingNoteType === 'daily') {
            message.textContent = `Are you sure you want to delete the note for ${this.formatDate(this.editingNoteId)}?`;
        } else {
            const noteTitle = this.state.generalNotes[this.editingNoteId]?.title || 'this note';
            message.textContent = `Are you sure you want to delete "${noteTitle}"?`;
        }
        
        modal.classList.remove('hidden');

        const handleConfirm = async () => {
            try {
                this.showLoading(true);
                
                const user = this.auth.currentUser;
                if (!user) throw new Error('User not authenticated');

                if (this.editingNoteType === 'daily') {
                    await this.db.collection('users').doc(user.uid).collection('notes').doc(this.editingNoteId).delete();
                    delete this.state.dailyNotes[this.editingNoteId];
                } else {
                    await this.db.collection('users').doc(user.uid).collection('generalNotes').doc(this.editingNoteId).delete();
                    delete this.state.generalNotes[this.editingNoteId];
                }

                this.updateStats();
                this.renderNotes();
                this.closeEditModal();
                modal.classList.add('hidden');
                this.showLoading(false);
                
            } catch (error) {
                errorHandler.showErrorDialog({
                    title: 'Delete Note Error',
                    message: 'Error deleting note. Please try again.',
                    details: error.message || 'Unknown error occurred while deleting note',
                    type: 'error'
                });
                this.showLoading(false);
            }
            
            // Clean up event listeners
            document.getElementById('confirm-yes').removeEventListener('click', handleConfirm);
            document.getElementById('confirm-no').removeEventListener('click', handleCancel);
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            document.getElementById('confirm-yes').removeEventListener('click', handleConfirm);
            document.getElementById('confirm-no').removeEventListener('click', handleCancel);
        };

        document.getElementById('confirm-yes').addEventListener('click', handleConfirm);
        document.getElementById('confirm-no').addEventListener('click', handleCancel);
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.classList.remove('hidden');
            } else {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

    showErrorMessage(message) {
        // Create or update error message element
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                z-index: 1001;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement && errorElement.parentNode) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }
}

// Initialize the notes manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NotesManager();
});
