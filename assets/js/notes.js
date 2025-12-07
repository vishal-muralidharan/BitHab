// Notes Management - Inline Editing
class NotesManager {
    constructor() {
        this.userId = null;
        this.currentType = 'daily'; // 'daily' or 'general'
        this.notes = [];
        this.draggedCard = null;
        this.init();
    }

    async init() {
        try {
            await window.AuthManager.setupAuth(async (user) => {
                if (user) {
                    this.userId = user.uid;
                    await this.loadNotes();
                    this.setupEventListeners();
                } else {
                    window.location.href = '../pages/login.html';
                }
            });
        } catch (error) {
            console.error('Notes initialization error:', error);
        }
    }

    setupEventListeners() {
        // Type toggle
        document.querySelectorAll('.note-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('.note-type-btn').dataset.type;
                this.switchType(type);
            });
        });

        // Add note button
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addNewNote();
            });
        }

        // Confirmation modal
        const cancelBtn = document.getElementById('cancel-delete-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeConfirmationModal();
            });
        }

        const confirmBtn = document.getElementById('confirm-delete-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmDelete();
            });
        }
    }

    switchType(type) {
        this.currentType = type;
        
        // Update buttons
        document.querySelectorAll('.note-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        this.renderNotes();
    }

    async loadNotes() {
        try {
            // Load from subcollections (daily notes and general notes)
            const dailySnapshot = await firebase.firestore()
                .collection('users')
                .doc(this.userId)
                .collection('notes')
                .get();
            
            const generalSnapshot = await firebase.firestore()
                .collection('users')
                .doc(this.userId)
                .collection('generalNotes')
                .get();
            
            this.notes = [];
            
            // Convert daily notes
            dailySnapshot.forEach(doc => {
                this.notes.push({
                    id: doc.id,
                    type: 'daily',
                    date: doc.id,
                    content: doc.data().note || '',
                    createdAt: doc.data().createdAt || Date.now(),
                    updatedAt: doc.data().createdAt || Date.now()
                });
            });
            
            // Convert general notes
            generalSnapshot.forEach(doc => {
                const data = doc.data();
                this.notes.push({
                    id: doc.id,
                    type: 'general',
                    title: data.title || '',
                    content: data.content || '',
                    createdAt: data.createdAt || Date.now(),
                    updatedAt: data.updatedAt || Date.now()
                });
            });
            
            this.renderNotes();
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
            this.renderNotes();
        }
    }

    async saveNote(note) {
        try {
            if (note.type === 'daily') {
                await firebase.firestore()
                    .collection('users')
                    .doc(this.userId)
                    .collection('notes')
                    .doc(note.date)
                    .set({
                        note: note.content,
                        createdAt: note.createdAt || new Date().toISOString()
                    });
            } else {
                await firebase.firestore()
                    .collection('users')
                    .doc(this.userId)
                    .collection('generalNotes')
                    .doc(note.id)
                    .set({
                        title: note.title,
                        content: note.content,
                        createdAt: note.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    }

    renderNotes() {
        const grid = document.getElementById('notes-grid');
        const emptyState = document.getElementById('empty-state');
        
        const filteredNotes = this.notes.filter(note => note.type === this.currentType);
        
        if (filteredNotes.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            emptyState.querySelector('h3').textContent = 
                this.currentType === 'daily' ? 'No Daily Notes Yet' : 'No General Notes Yet';
            emptyState.querySelector('p').textContent = 
                this.currentType === 'daily' 
                    ? 'Start capturing your daily thoughts and experiences'
                    : 'Create general notes to organize your ideas';
            return;
        }
        
        emptyState.classList.add('hidden');
        grid.innerHTML = filteredNotes.map(note => this.createNoteCard(note)).join('');
        
        // Setup drag and drop
        this.setupDragAndDrop();
    }

    createNoteCard(note) {
        const dateValue = note.date || new Date().toISOString().split('T')[0];
        const titleValue = note.title || '';
        const contentValue = note.content || '';
        
        return `
            <div class="note-card" draggable="true" data-id="${note.id}">
                <div class="note-card-header">
                    <div class="note-metadata">
                        ${this.currentType === 'daily' ? `
                            <input 
                                type="date" 
                                class="note-date-input" 
                                value="${dateValue}"
                                data-id="${note.id}"
                            />
                        ` : `
                            <input 
                                type="text" 
                                class="note-title-input" 
                                placeholder="Note title..."
                                value="${titleValue}"
                                data-id="${note.id}"
                            />
                        `}
                    </div>
                    <button class="delete-note-btn" data-id="${note.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <textarea 
                    class="note-content-input" 
                    placeholder="Write your note..."
                    data-id="${note.id}"
                >${contentValue}</textarea>
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
            
            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
                this.draggedCard = null;
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(e.clientY);
                const grid = document.getElementById('notes-grid');
                
                if (afterElement == null) {
                    grid.appendChild(this.draggedCard);
                } else {
                    grid.insertBefore(this.draggedCard, afterElement);
                }
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                this.updateNoteOrder();
            });
        });

        // Setup input event listeners
        document.querySelectorAll('.note-date-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateNoteField(e.target.dataset.id, 'date', e.target.value);
            });
        });

        document.querySelectorAll('.note-title-input').forEach(input => {
            input.addEventListener('blur', (e) => {
                this.updateNoteField(e.target.dataset.id, 'title', e.target.value);
            });
        });

        document.querySelectorAll('.note-content-input').forEach(textarea => {
            textarea.addEventListener('blur', (e) => {
                this.updateNoteField(e.target.dataset.id, 'content', e.target.value);
            });
        });

        document.querySelectorAll('.delete-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteConfirmation(e.target.dataset.id);
            });
        });
    }

    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('.note-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateNoteOrder() {
        const cards = document.querySelectorAll('.note-card');
        const orderedIds = Array.from(cards).map(card => card.dataset.id);
        
        // Reorder notes array based on DOM order
        const filteredNotes = this.notes.filter(note => note.type === this.currentType);
        const otherNotes = this.notes.filter(note => note.type !== this.currentType);
        
        const reorderedFiltered = orderedIds.map(id => 
            filteredNotes.find(note => note.id === id)
        );
        
        this.notes = [...reorderedFiltered, ...otherNotes];
        // Note: Order is stored in memory, not persisted to Firestore
    }

    async updateNoteField(noteId, field, value) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note[field] = value;
            note.updatedAt = Date.now();
            await this.saveNote(note);
        }
    }

    addNewNote() {
        const newNote = {
            id: this.currentType === 'daily' ? new Date().toISOString().split('T')[0] : Date.now().toString(),
            type: this.currentType,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (this.currentType === 'daily') {
            newNote.date = newNote.id;
        } else {
            newNote.title = '';
        }
        
        this.notes.unshift(newNote);
        this.saveNote(newNote);
        this.renderNotes();
    }

    showDeleteConfirmation(noteId) {
        this.noteToDelete = noteId;
        const modal = document.getElementById('confirmation-modal');
        modal.classList.add('show');
    }

    closeConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        modal.classList.remove('show');
        this.noteToDelete = null;
    }

    async confirmDelete() {
        if (this.noteToDelete) {
            const note = this.notes.find(n => n.id === this.noteToDelete);
            if (note) {
                try {
                    if (note.type === 'daily') {
                        await firebase.firestore()
                            .collection('users')
                            .doc(this.userId)
                            .collection('notes')
                            .doc(note.date)
                            .delete();
                    } else {
                        await firebase.firestore()
                            .collection('users')
                            .doc(this.userId)
                            .collection('generalNotes')
                            .doc(note.id)
                            .delete();
                    }
                    this.notes = this.notes.filter(n => n.id !== this.noteToDelete);
                    this.renderNotes();
                } catch (error) {
                    console.error('Error deleting note:', error);
                }
            }
            this.closeConfirmationModal();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new NotesManager();
});
