// Notes Management - Inline Editing
class NotesManager {
    constructor() {
        this.userId = null;
        this.currentType = 'daily'; // 'daily' or 'general'
        this.currentFilter = 'all'; // 'all' or 'favorites'
        this.notes = [];
        this.draggedCard = null;
        this.isDeleting = false;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for auth to be ready
            const user = await this.waitForAuth();
            if (user && user.uid) {
                this.userId = user.uid;
                console.log('Notes: User authenticated:', this.userId);
                
                // Small delay to ensure auth token propagates
                await new Promise(resolve => setTimeout(resolve, 300));
                
                await this.loadNotes();
                this.setupEventListeners();
                this.isInitialized = true;
            } else {
                console.log('Notes: No user or no uid, redirecting to login');
                window.location.href = '../pages/login.html';
            }
        } catch (error) {
            console.error('Notes initialization error:', error);
            if (!error.message.includes('permission')) {
                window.customDialogs?.showError('Failed to load notes. Please refresh the page.');
            }
        }
    }

    async waitForAuth() {
        return new Promise((resolve) => {
            // First check if user is already authenticated
            const currentUser = firebase.auth().currentUser;
            if (currentUser && currentUser.uid) {
                console.log('Notes: User already authenticated, uid:', currentUser.uid);
                resolve(currentUser);
                return;
            }

            // If not, wait for auth state change
            console.log('Notes: Waiting for auth state...');
            let timeout;
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                clearTimeout(timeout);
                unsubscribe();
                if (user && user.uid) {
                    console.log('Notes: User authenticated via onAuthStateChanged, uid:', user.uid);
                    resolve(user);
                } else {
                    console.warn('Notes: No authenticated user found');
                    resolve(null);
                }
            });

            // Set a timeout in case auth never resolves
            timeout = setTimeout(() => {
                unsubscribe();
                console.warn('Notes: Auth timeout after 5 seconds');
                resolve(null);
            }, 5000);
        });
    }

    async loadNotes() {
        if (!this.userId) {
            console.log('No userId available');
            return;
        }

        try {
            const db = firebase.firestore();
            
            // Load daily notes
            const dailySnapshot = await db.collection('users').doc(this.userId)
                .collection('notes').get();
            
            // Load general notes
            const generalSnapshot = await db.collection('users').doc(this.userId)
                .collection('generalNotes').get();
            
            this.notes = [];
            
            // Process daily notes
            dailySnapshot.forEach(doc => {
                const data = doc.data();
                this.notes.push({
                    id: doc.id,
                    type: 'daily',
                    date: doc.id,
                    content: data.content || data.note || '',
                    favorite: data.favorite || false,
                    order: data.order,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            });
            
            // Process general notes
            generalSnapshot.forEach(doc => {
                const data = doc.data();
                this.notes.push({
                    id: doc.id,
                    type: 'general',
                    title: data.title || 'Untitled',
                    content: data.content || data.note || '',
                    favorite: data.favorite || false,
                    order: data.order,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            });
            
            // Migrate old notes format if needed
            await this.migrateOldNotes();
            
            this.renderNotes();
        } catch (error) {
            console.error('Error loading notes:', error);
            // Permission denied is normal for first-time users with no notes yet
            if (error.code === 'permission-denied' || error.message.includes('permission')) {
                console.log('Permission denied - this may be normal for first-time users with no notes yet');
                this.notes = [];
                this.renderNotes();
            } else {
                throw error;
            }
        }
    }

    async migrateOldNotes() {
        // Check if any notes need migration (missing favorite field)
        const notesToMigrate = this.notes.filter(note => note.favorite === undefined);
        
        if (notesToMigrate.length > 0) {
            console.log(`Migrating ${notesToMigrate.length} notes to current format...`);
            const db = firebase.firestore();
            
            for (const note of notesToMigrate) {
                const collection = note.type === 'daily' ? 'notes' : 'generalNotes';
                try {
                    await db.collection('users').doc(this.userId)
                        .collection(collection).doc(note.id)
                        .update({ favorite: false });
                    note.favorite = false;
                } catch (error) {
                    console.error(`Error migrating note ${note.id}:`, error);
                }
            }
            
            console.log('Migration complete');
        }
    }

    setupEventListeners() {
        // Type toggle buttons
        const dailyBtn = document.getElementById('daily-notes-btn');
        const generalBtn = document.getElementById('general-notes-btn');
        
        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => {
                this.currentType = 'daily';
                dailyBtn.classList.add('active');
                generalBtn.classList.remove('active');
                this.renderNotes();
            });
        }
        
        if (generalBtn) {
            generalBtn.addEventListener('click', () => {
                this.currentType = 'general';
                generalBtn.classList.add('active');
                dailyBtn.classList.remove('active');
                this.renderNotes();
            });
        }
        
        // Filter buttons
        const allBtn = document.getElementById('filter-all-btn');
        const favBtn = document.getElementById('filter-favorites-btn');
        
        if (allBtn) {
            allBtn.addEventListener('click', () => {
                this.currentFilter = 'all';
                allBtn.classList.add('active');
                favBtn.classList.remove('active');
                this.renderNotes();
            });
        }
        
        if (favBtn) {
            favBtn.addEventListener('click', () => {
                this.currentFilter = 'favorites';
                favBtn.classList.add('active');
                allBtn.classList.remove('active');
                this.renderNotes();
            });
        }
        
        // Add note button
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addNewNote());
        }
    }

    renderNotes() {
        const grid = document.getElementById('notes-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!grid || !emptyState) return;
        
        // Filter notes by type and favorite status
        let filtered = this.notes.filter(note => note.type === this.currentType);
        
        if (this.currentFilter === 'favorites') {
            filtered = filtered.filter(note => note.favorite);
        }
        
        // Sort by custom order if available, then by date/title
        filtered.sort((a, b) => {
            // If both have order, use it
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // Otherwise sort by date/title
            if (a.type === 'daily') {
                return b.date.localeCompare(a.date);
            } else {
                return (a.title || '').localeCompare(b.title || '');
            }
        });
        
        if (filtered.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.querySelector('p').textContent = 
                this.currentFilter === 'favorites' 
                    ? 'No favorite notes yet' 
                    : `No ${this.currentType} notes yet`;
        } else {
            grid.style.display = 'block';
            emptyState.style.display = 'none';
            grid.innerHTML = filtered.map(note => this.createNoteCard(note)).join('');
            
            // Setup drag and drop after rendering
            this.setupDragAndDrop();
        }
    }

    createNoteCard(note) {
        const favIcon = note.favorite ? 'fas fa-star' : 'far fa-star';
        const identifier = note.type === 'daily' ? note.date : note.id;
        
        // Format date for better display
        let dateDisplay = '';
        if (note.type === 'daily') {
            const date = new Date(note.date + 'T00:00:00');
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            dateDisplay = date.toLocaleDateString('en-US', options);
        }
        
        return `
            <div class="note-card" data-note-id="${identifier}" data-type="${note.type}" draggable="true">
                <div class="note-header">
                    <div class="note-identifier">
                        ${note.type === 'daily' 
                            ? `<div class="note-date-display" data-note-id="${identifier}" title="Click to change date">
                                <i class="fas fa-calendar-day"></i>
                                <span>${dateDisplay}</span>
                                <input type="date" class="note-date-input" value="${note.date}" data-note-id="${identifier}" style="display: none;">
                               </div>` 
                            : `<input type="text" class="note-title-input" value="${note.title || ''}" placeholder="Note title" data-note-id="${identifier}">`
                        }
                    </div>
                    <div class="note-actions">
                        <button class="favorite-note-btn" data-note-id="${identifier}" title="Toggle favorite">
                            <i class="${favIcon}"></i>
                        </button>
                        <button class="delete-note-btn" data-note-id="${identifier}" title="Delete note">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <textarea class="note-content-input" data-note-id="${identifier}" placeholder="Write your note here">${note.content}</textarea>
            </div>
        `;
    }

    setupDragAndDrop() {
        const cards = document.querySelectorAll('.note-card');
        
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                this.draggedCard = card;
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedCard = null;
                // Remove any drag indicators
                document.querySelectorAll('.drag-indicator').forEach(el => el.remove());
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedCard && this.draggedCard !== card) {
                    // Show indicator
                    this.showDragIndicator(card);
                }
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedCard && this.draggedCard !== card) {
                    this.reorderNotes(this.draggedCard, card);
                }
            });
        });
        
        // Setup inline editing
        this.setupInlineEditing();
    }

    showDragIndicator(targetCard) {
        // Remove existing indicators
        document.querySelectorAll('.drag-indicator').forEach(el => el.remove());
        
        // Add indicator before target
        const indicator = document.createElement('div');
        indicator.className = 'drag-indicator';
        targetCard.parentNode.insertBefore(indicator, targetCard);
    }

    reorderNotes(draggedCard, targetCard) {
        const draggedId = draggedCard.dataset.noteId;
        const targetId = targetCard.dataset.noteId;
        
        const draggedIndex = this.notes.findIndex(n => 
            (n.type === 'daily' ? n.date : n.id) === draggedId
        );
        const targetIndex = this.notes.findIndex(n => 
            (n.type === 'daily' ? n.date : n.id) === targetId
        );
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Reorder in local array
            const [removed] = this.notes.splice(draggedIndex, 1);
            this.notes.splice(targetIndex, 0, removed);
            
            // Save new order to Firestore
            this.saveNoteOrder();
            
            this.renderNotes();
        }
    }
    
    async saveNoteOrder() {
        const db = firebase.firestore();
        const batch = db.batch();
        
        // Update order field for current type's notes
        const filteredNotes = this.notes.filter(n => n.type === this.currentType);
        filteredNotes.forEach((note, index) => {
            const collection = note.type === 'daily' ? 'notes' : 'generalNotes';
            const noteId = note.type === 'daily' ? note.date : note.id;
            const ref = db.collection('users').doc(this.userId)
                .collection(collection).doc(noteId);
            batch.update(ref, { order: index });
        });
        
        try {
            await batch.commit();
            console.log('Note order saved');
        } catch (error) {
            console.error('Error saving note order:', error);
        }
    }

    setupInlineEditing() {
        // Date display click to edit
        document.querySelectorAll('.note-date-display').forEach(display => {
            display.addEventListener('click', (e) => {
                const input = display.querySelector('.note-date-input');
                display.querySelector('i').style.display = 'none';
                display.querySelector('span').style.display = 'none';
                input.style.display = 'block';
                input.focus();
                input.showPicker?.();
            });
        });
        
        // Date inputs for daily notes
        document.querySelectorAll('.note-date-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const oldDate = e.target.defaultValue;
                const newDate = e.target.value;
                const noteId = e.target.dataset.noteId;
                
                if (oldDate !== newDate) {
                    // Check for duplicate dates
                    const existingNote = this.notes.find(n => 
                        n.type === 'daily' && n.date === newDate && n.date !== oldDate
                    );
                    
                    if (existingNote) {
                        window.customDialogs?.alert('A note for this date already exists. Please choose a different date.', 'Duplicate Date', 'warning');
                        e.target.value = oldDate;
                        return;
                    }
                    
                    await this.updateNoteDate(noteId, newDate, oldDate);
                }
            });
            
            input.addEventListener('blur', (e) => {
                const display = e.target.parentElement;
                display.querySelector('i').style.display = 'inline';
                display.querySelector('span').style.display = 'inline';
                e.target.style.display = 'none';
            });
        });
        
        // Title inputs for general notes
        document.querySelectorAll('.note-title-input').forEach(input => {
            input.addEventListener('blur', async (e) => {
                const noteId = e.target.dataset.noteId;
                const newTitle = e.target.value.trim() || 'Untitled';
                await this.updateNoteTitle(noteId, newTitle);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
        
        // Content textareas
        document.querySelectorAll('.note-content-input').forEach(textarea => {
            // Auto-resize
            this.autoResizeTextarea(textarea);
            
            textarea.addEventListener('input', (e) => {
                this.autoResizeTextarea(e.target);
            });
            
            textarea.addEventListener('blur', async (e) => {
                const noteId = e.target.dataset.noteId;
                const content = e.target.value.trim();
                await this.updateNoteContent(noteId, content);
            });
        });
        
        // Favorite buttons
        document.querySelectorAll('.favorite-note-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.noteId;
                await this.toggleFavorite(noteId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-note-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.noteId;
                await this.deleteNote(noteId);
            });
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 300);
        textarea.style.height = newHeight + 'px';
        
        // Show scrollbar only if content exceeds max height
        if (textarea.scrollHeight > 300) {
            textarea.classList.add('has-scroll');
        } else {
            textarea.classList.remove('has-scroll');
        }
    }

    async addNewNote() {
        if (this.currentType === 'daily') {
            // Check if today's note already exists
            const today = new Date().toISOString().split('T')[0];
            const existingNote = this.notes.find(n => n.type === 'daily' && n.date === today);
            
            if (existingNote) {
                window.customDialogs?.alert('A note for today already exists. You can edit the existing note or change its date to create a new one.', 'Duplicate Note', 'info');
                return;
            }
            
            const newNote = {
                id: today,
                type: 'daily',
                date: today,
                content: '',
                favorite: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.saveNote(newNote);
        } else {
            const newNote = {
                id: Date.now().toString(),
                type: 'general',
                title: 'Untitled',
                content: '',
                favorite: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.saveNote(newNote);
        }
    }

    async saveNote(note) {
        try {
            const db = firebase.firestore();
            const collection = note.type === 'daily' ? 'notes' : 'generalNotes';
            
            const noteData = {
                content: note.content,
                favorite: note.favorite,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (note.type === 'general') {
                noteData.title = note.title;
            }
            
            // Check if note exists
            const existingIndex = this.notes.findIndex(n => {
                if (n.type === 'daily') {
                    return n.date === note.id;
                } else {
                    return n.id === note.id;
                }
            });
            
            if (existingIndex === -1) {
                // New note
                noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('users').doc(this.userId)
                    .collection(collection).doc(note.id).set(noteData);
                this.notes.push(note);
            } else {
                // Update existing
                await db.collection('users').doc(this.userId)
                    .collection(collection).doc(note.id).update(noteData);
                Object.assign(this.notes[existingIndex], note);
            }
            
            this.renderNotes();
            // After rendering, scroll to the newly added/updated note card
            const identifier = note.type === 'daily' ? note.date : note.id;
            const attemptScroll = (tries = 0) => {
                const card = document.querySelector(`.note-card[data-note-id="${identifier}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const textarea = card.querySelector('.note-content-input');
                    textarea?.focus();
                } else if (tries < 5) {
                    setTimeout(() => attemptScroll(tries + 1), 100);
                }
            };
            // Kick off with a slight delay to allow DOM to settle
            setTimeout(() => attemptScroll(), 100);
        } catch (error) {
            console.error('Error saving note:', error);
            window.customDialogs?.showError(error);
        }
    }

    async updateNoteDate(noteId, newDate, oldDate) {
        try {
            const note = this.notes.find(n => n.type === 'daily' && n.date === oldDate);
            if (!note) return;
            
            const db = firebase.firestore();
            
            // Get the note data
            const oldDoc = await db.collection('users').doc(this.userId)
                .collection('notes').doc(oldDate).get();
            
            if (oldDoc.exists) {
                const data = oldDoc.data();
                
                // Create new document with new date
                await db.collection('users').doc(this.userId)
                    .collection('notes').doc(newDate).set({
                        ...data,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                
                // Delete old document
                await db.collection('users').doc(this.userId)
                    .collection('notes').doc(oldDate).delete();
                
                // Update local state
                note.date = newDate;
                note.id = newDate;
                
                this.renderNotes();
            }
        } catch (error) {
            console.error('Error updating note date:', error);
            window.customDialogs?.showError('Unable to change the note date. Please try again.');
        }
    }

    async updateNoteTitle(noteId, newTitle) {
        try {
            const note = this.notes.find(n => n.type === 'general' && n.id === noteId);
            if (!note) return;
            
            const db = firebase.firestore();
            await db.collection('users').doc(this.userId)
                .collection('generalNotes').doc(noteId)
                .update({
                    title: newTitle,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            note.title = newTitle;
        } catch (error) {
            console.error('Error updating note title:', error);
            window.customDialogs?.showError('Unable to update the note title. Please try again.');
        }
    }

    async updateNoteContent(noteId, content) {
        try {
            const note = this.notes.find(n => 
                (n.type === 'daily' ? n.date : n.id) === noteId
            );
            if (!note) return;
            
            const db = firebase.firestore();
            const collection = note.type === 'daily' ? 'notes' : 'generalNotes';
            
            await db.collection('users').doc(this.userId)
                .collection(collection).doc(noteId)
                .update({
                    content: content,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            note.content = content;
        } catch (error) {
            console.error('Error updating note content:', error);
            window.customDialogs?.showError('Unable to save your changes. Please try again.');
        }
    }

    async toggleFavorite(noteId) {
        try {
            const note = this.notes.find(n => 
                (n.type === 'daily' ? n.date : n.id) === noteId
            );
            if (!note) return;
            
            const newFavoriteState = !note.favorite;
            const db = firebase.firestore();
            const collection = note.type === 'daily' ? 'notes' : 'generalNotes';
            
            await db.collection('users').doc(this.userId)
                .collection(collection).doc(noteId)
                .update({
                    favorite: newFavoriteState,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            note.favorite = newFavoriteState;
            this.renderNotes();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            window.customDialogs?.showError('Unable to update favorite status. Please try again.');
        }
    }

    async deleteNote(noteId) {
        if (this.isDeleting) return;
        this.isDeleting = true;
        try {
            // Ask for confirmation (fallback to native confirm if custom dialog unavailable)
            let confirmed = true;
            if (window.customDialogs && typeof window.customDialogs.confirm === 'function') {
                confirmed = await window.customDialogs.confirm(
                    'This action cannot be undone. Are you sure you want to delete this note?',
                    'Delete Note'
                );
            } else {
                confirmed = window.confirm('Delete this note? This cannot be undone.');
            }
            if (!confirmed) {
                this.isDeleting = false;
                return;
            }

            const note = this.notes.find(n => 
                (n.type === 'daily' ? n.date : n.id) === noteId
            );
            if (!note) return;
            
            const db = firebase.firestore();
            const collection = note.type === 'daily' ? 'notes' : 'generalNotes';
            
            await db.collection('users').doc(this.userId)
                .collection(collection).doc(noteId).delete();
            
            this.notes = this.notes.filter(n => 
                (n.type === 'daily' ? n.date : n.id) !== noteId
            );
            
            this.renderNotes();
            // Prefer non-blocking toast for success
            if (window.customDialogs && typeof window.customDialogs.showToast === 'function') {
                window.customDialogs.showToast('Note deleted successfully', 'success', 2000);
            } else if (window.customDialogs && typeof window.customDialogs.showSuccess === 'function') {
                window.customDialogs.showSuccess('Note deleted successfully');
                setTimeout(() => { window.customDialogs.closeModal?.(); }, 2000);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            window.customDialogs?.showError('Unable to delete the note. Please try again.');
        } finally {
            this.isDeleting = false;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NotesManager();
    });
} else {
    new NotesManager();
}
