document.addEventListener('DOMContentLoaded', () => {
    const state = {
        reminders: [],
        isEditMode: false
    };

    const reminderList = document.getElementById('reminder-list');
    const addReminderBtn = document.getElementById('add-reminder-btn');
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    
    // Edit modal elements
    const editReminderModal = document.getElementById('edit-reminder-modal');
    const editReminderName = document.getElementById('edit-reminder-name');
    const editPickerDate = document.getElementById('edit-picker-date');
    const editPickerTime = document.getElementById('edit-picker-time');
    const saveReminderEditBtn = document.getElementById('save-reminder-edit');
    const cancelReminderEdit = document.getElementById('cancel-reminder-edit');
    const editQuickBtns = document.querySelectorAll('.edit-quick-btn');

    // DateTime picker modal elements
    const datetimePickerModal = document.getElementById('datetime-picker-modal');
    const datetimeModalTitle = document.getElementById('datetime-modal-title');
    const modalReminderText = document.getElementById('modal-reminder-text');
    const pickerDate = document.getElementById('picker-date');
    const pickerTime = document.getElementById('picker-time');
    const confirmDatetimeBtn = document.getElementById('confirm-datetime');
    const cancelDatetimeBtn = document.getElementById('cancel-datetime');
    const quickBtns = document.querySelectorAll('.quick-btn');

    let userId = null;
    let db;
    let confirmationAction = null;
    let currentEditingReminder = null;

    // Show loading immediately
    const showLoading = () => {
        if (reminderList) {
            reminderList.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.7;">Loading reminders...</div>';
        }
    };

    showLoading();

    const showConfirmation = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmationAction = onConfirm;
        confirmationModal.classList.remove('hidden');
    };

    const showAddReminderModal = () => {
        state.isEditMode = false;
        datetimeModalTitle.textContent = 'Add New Reminder';
        confirmDatetimeBtn.textContent = 'Add Reminder';
        modalReminderText.value = '';
        
        // Set default to tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        pickerDate.value = tomorrow.toISOString().split('T')[0];
        pickerTime.value = '09:00';
        
        // Clear quick button selections
        quickBtns.forEach(btn => btn.classList.remove('selected'));
        
        datetimePickerModal.classList.remove('hidden');
    };

    const hideDatetimePicker = () => {
        datetimePickerModal.classList.add('hidden');
        quickBtns.forEach(btn => btn.classList.remove('selected'));
    };

    const registerOverlayDismiss = (modalElement, onDismiss) => {
        if (!modalElement) {
            return;
        }
        modalElement.addEventListener('click', (event) => {
            if (event.target === modalElement) {
                onDismiss();
            }
        });
    };

    const showEditReminderModal = (reminder) => {
        currentEditingReminder = reminder;
        editReminderName.value = reminder.text;
        editPickerDate.value = reminder.date;
        editPickerTime.value = reminder.time;
        
        // Clear quick button selections
        editQuickBtns.forEach(btn => btn.classList.remove('selected'));
        
        editReminderModal.classList.remove('hidden');
    };

    const hideEditReminderModal = () => {
        editReminderModal.classList.add('hidden');
        currentEditingReminder = null;
        editQuickBtns.forEach(btn => btn.classList.remove('selected'));
    };

    registerOverlayDismiss(datetimePickerModal, hideDatetimePicker);
    registerOverlayDismiss(editReminderModal, hideEditReminderModal);

    const saveState = async () => {
        if (!userId) {
            console.warn('Cannot save reminders: userId is null');
            return;
        }
        console.log('Saving reminders:', state.reminders);
        try {
            // Save using direct Firestore update with merge
            await db.collection('users').doc(userId).set({
                reminders: state.reminders,
                lastUpdated: Date.now(),
                lastUpdatedBy: 'reminders_page'
            }, { merge: true });
            
            console.log('Reminders successfully saved to Firebase');
            
            // Notify data sync
            if (window.BitHabDataSync) {
                window.BitHabDataSync.notifyListeners('data_saved', {
                    reminders: state.reminders,
                    lastUpdatedBy: 'reminders_page'
                });
            }
        } catch (error) {
            console.error('Error saving reminders:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Save Reminders Error',
                    message: 'Failed to save reminders to the cloud. Your changes are saved locally.',
                    details: error.message || 'Unknown error occurred while saving to Firebase',
                    type: 'warning'
                });
            }
        }
    };

    const loadData = async () => {
        if (!userId) {
            console.warn('Cannot load reminders: userId is null');
            return;
        }
        console.log('Loading reminders for user:', userId);
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                state.reminders = data.reminders || [];
                console.log('Reminders loaded from Firebase:', state.reminders);
            } else {
                console.warn('User document does not exist, creating empty reminders array');
                state.reminders = [];
            }
            renderReminders();
        } catch (error) {
            console.error('Error loading reminders:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showErrorDialog({
                    title: 'Load Reminders Error',
                    message: 'Failed to load reminders from the cloud. Using local data.',
                    details: error.message || 'Unknown error occurred while loading from Firebase',
                    type: 'warning'
                });
            }
        }
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const formatDateTime = (date, time) => {
        const reminderDate = new Date(`${date}T${time}`);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

        let dateStr;
        if (reminderDay.getTime() === today.getTime()) {
            dateStr = 'Today';
        } else if (reminderDay.getTime() === tomorrow.getTime()) {
            dateStr = 'Tomorrow';
        } else {
            dateStr = reminderDate.toLocaleDateString();
        }

        const timeStr = reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} at ${timeStr}`;
    };

    const isReminderActive = (date, time) => {
        const reminderDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        return reminderDateTime >= now;
    };

    const renderReminders = () => {
        reminderList.innerHTML = '';
        
        if (state.reminders.length === 0) {
            reminderList.innerHTML = '<p style="padding: 0 1rem; opacity: 0.7;">No reminders set. Add one to get started.</p>';
            return;
        }

        // Sort reminders by date and time
        const sortedReminders = [...state.reminders].sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA - dateTimeB;
        });

        sortedReminders.forEach(reminder => {
            const reminderItem = document.createElement('li');
            const isActive = isReminderActive(reminder.date, reminder.time);
            reminderItem.className = `reminder-item ${!isActive ? 'expired' : ''}`;
            reminderItem.dataset.id = reminder.id;

            const formattedDateTime = formatDateTime(reminder.date, reminder.time);
            
            reminderItem.innerHTML = `
                <div class="reminder-content">
                    <span class="reminder-text">${reminder.text}</span>
                    <span class="reminder-datetime">${formattedDateTime}</span>
                </div>
                <div class="reminder-actions">
                    <button class="edit-btn" onclick="editReminder('${reminder.id}')" aria-label="Edit reminder">
                        <i class="fas fa-pen" aria-hidden="true"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteReminder('${reminder.id}')" aria-label="Delete reminder">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            `;
            reminderList.appendChild(reminderItem);
        });
    };

    const addReminder = async () => {
        const text = modalReminderText.value.trim();
        const date = pickerDate.value;
        const time = pickerTime.value;
        
        if (!text) {
            errorHandler.showErrorDialog({
                title: 'Missing Reminder Text',
                message: 'Please enter reminder text',
                type: 'validation'
            });
            return;
        }

        if (!date || !time) {
            errorHandler.showErrorDialog({
                title: 'Missing Date or Time',
                message: 'Please select both date and time',
                type: 'validation'
            });
            return;
        }

        const reminderDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (reminderDateTime <= now) {
            errorHandler.showErrorDialog({
                title: 'Invalid Date/Time',
                message: 'Please select a future date and time',
                type: 'validation'
            });
            return;
        }

        const newReminder = {
            id: generateId(),
            text,
            date,
            time,
            createdAt: new Date().toISOString()
        };

        state.reminders.push(newReminder);
        await saveState();
        renderReminders();
        hideDatetimePicker();
    };

    window.editReminder = (id) => {
        const reminder = state.reminders.find(r => r.id === id);
        if (reminder) {
            showEditReminderModal(reminder);
        }
    };

    window.deleteReminder = (id) => {
        showConfirmation('Are you sure you want to delete this reminder?', async () => {
            state.reminders = state.reminders.filter(r => r.id !== id);
            await saveState();
            renderReminders();
        });
    };

    const saveReminderEdit = async () => {
        if (!currentEditingReminder) return;

        const text = editReminderName.value.trim();
        const date = editPickerDate.value;
        const time = editPickerTime.value;
        
        if (!text) {
            errorHandler.showErrorDialog({
                title: 'Missing Reminder Text',
                message: 'Please enter reminder text',
                type: 'validation'
            });
            return;
        }

        if (!date || !time) {
            errorHandler.showErrorDialog({
                title: 'Missing Date or Time',
                message: 'Please select both date and time',
                type: 'validation'
            });
            return;
        }

        const reminderDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (reminderDateTime <= now) {
            errorHandler.showErrorDialog({
                title: 'Invalid Date/Time',
                message: 'Please select a future date and time',
                type: 'validation'
            });
            return;
        }

        const reminderIndex = state.reminders.findIndex(r => r.id === currentEditingReminder.id);
        if (reminderIndex !== -1) {
            state.reminders[reminderIndex] = {
                ...state.reminders[reminderIndex],
                text,
                date,
                time
            };
            await saveState();
            renderReminders();
            hideEditReminderModal();
        }
    };

    // Remove the setDefaultDateTime function since we don't need it anymore

    // Event listeners
    addReminderBtn.addEventListener('click', showAddReminderModal);
    
    // DateTime picker event listeners
    confirmDatetimeBtn.addEventListener('click', addReminder);
    cancelDatetimeBtn.addEventListener('click', hideDatetimePicker);

    // Edit modal event listeners
    saveReminderEditBtn.addEventListener('click', saveReminderEdit);
    cancelReminderEdit.addEventListener('click', hideEditReminderModal);

    // Quick date button handlers for add modal
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            quickBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const days = parseInt(btn.dataset.days);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            
            // For today, set time to next hour, for others set to 9 AM
            let timeValue = '09:00';
            if (days === 0) {
                const now = new Date();
                const nextHour = now.getHours() + 1;
                timeValue = `${nextHour.toString().padStart(2, '0')}:00`;
            }
            
            pickerDate.value = targetDate.toISOString().split('T')[0];
            pickerTime.value = timeValue;
        });
    });

    // Quick date button handlers for edit modal
    editQuickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editQuickBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const days = parseInt(btn.dataset.days);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            
            // For today, set time to next hour, for others set to 9 AM
            let timeValue = '09:00';
            if (days === 0) {
                const now = new Date();
                const nextHour = now.getHours() + 1;
                timeValue = `${nextHour.toString().padStart(2, '0')}:00`;
            }
            
            editPickerDate.value = targetDate.toISOString().split('T')[0];
            editPickerTime.value = timeValue;
        });
    });

    saveReminderEditBtn.addEventListener('click', saveReminderEdit);
    cancelReminderEdit.addEventListener('click', hideEditReminderModal);

    confirmYes.addEventListener('click', () => {
        if (confirmationAction) {
            confirmationAction();
            confirmationAction = null;
        }
        confirmationModal.classList.add('hidden');
    });

    confirmNo.addEventListener('click', () => {
        confirmationAction = null;
        confirmationModal.classList.add('hidden');
    });

    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', () => {
            showConfirmation('Are you sure you want to logout?', () => {
                firebase.auth().signOut();
            });
        });
    }

    // Use authManager for faster initialization
    authManager.onAuthStateChange(async (user) => {
        if (user) {
            userId = user.uid;
            db = firebase.firestore();
            
            // Initialize DatabaseService
            if (window.DatabaseService) {
                window.DatabaseService.init(userId, db);
            }
            
            // Initialize data sync system
            if (window.BitHabDataSync) {
                window.BitHabDataSync.init(userId, db);
                
                // Add listener for data updates from other pages
                window.BitHabDataSync.addListener((event, data) => {
                    try {
                        if (event === 'data_updated' && data.lastUpdatedBy !== 'reminders_page') {
                            console.log('Data updated from another page, refreshing reminders...');
                            if (data.reminders) {
                                state.reminders = data.reminders;
                                renderReminders();
                            }
                        }
                    } catch (error) {
                        console.warn('Data sync listener error:', error);
                    }
                });
            }
            
            await loadData();
        } else {
            // Auth manager will handle redirect
        }
    });

    // Refresh reminders when window gets focus (e.g., coming back from index page)
    window.addEventListener('focus', async () => {
        if (userId) {
            console.log('Window focused, reloading reminders...');
            try {
                await loadData();
            } catch (error) {
                console.error('Error reloading reminders on focus:', error);
            }
        }
    });
});
