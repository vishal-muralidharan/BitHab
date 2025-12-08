// Custom Dialog System for BitHab
class CustomDialogs {
    constructor() {
        this.activeModal = null;
        this.init();
    }

    init() {
        // Create modal container
        if (!document.getElementById('custom-modal-container')) {
            const container = document.createElement('div');
            container.id = 'custom-modal-container';
            document.body.appendChild(container);
        }
    }

    // Confirm dialog (replaces window.confirm)
    confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this.closeModal();
            
            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            modal.innerHTML = `
                <div class="custom-modal">
                    <div class="custom-modal-header">
                        <h3 class="custom-modal-title">${this.escapeHtml(title)}</h3>
                    </div>
                    <div class="custom-modal-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="custom-modal-footer">
                        <button class="custom-modal-btn custom-modal-btn-secondary" data-action="cancel">
                            Cancel
                        </button>
                        <button class="custom-modal-btn custom-modal-btn-primary" data-action="confirm">
                            Confirm
                        </button>
                    </div>
                </div>
            `;

            const container = document.getElementById('custom-modal-container');
            container.appendChild(modal);
            this.activeModal = modal;

            // Add animation
            setTimeout(() => modal.classList.add('show'), 10);

            // Handle button clicks
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('custom-modal-overlay')) {
                    this.closeModal();
                    resolve(false);
                }
                
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    this.closeModal();
                    resolve(true);
                } else if (action === 'cancel') {
                    this.closeModal();
                    resolve(false);
                }
            });

            // Handle escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                    resolve(false);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        });
    }

    // Alert dialog (replaces window.alert)
    alert(message, title = 'Notice', type = 'info') {
        return new Promise((resolve) => {
            this.closeModal();
            
            const iconMap = {
                success: 'fa-circle-check',
                error: 'fa-circle-exclamation',
                warning: 'fa-triangle-exclamation',
                info: 'fa-circle-info'
            };

            const icon = iconMap[type] || iconMap.info;
            
            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            modal.innerHTML = `
                <div class="custom-modal custom-modal-${type}">
                    <div class="custom-modal-header">
                        <i class="fas ${icon} custom-modal-icon"></i>
                        <h3 class="custom-modal-title">${this.escapeHtml(title)}</h3>
                    </div>
                    <div class="custom-modal-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="custom-modal-footer">
                        <button class="custom-modal-btn custom-modal-btn-primary" data-action="ok">
                            OK
                        </button>
                    </div>
                </div>
            `;

            const container = document.getElementById('custom-modal-container');
            container.appendChild(modal);
            this.activeModal = modal;

            setTimeout(() => modal.classList.add('show'), 10);

            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('custom-modal-overlay') || e.target.dataset.action === 'ok') {
                    this.closeModal();
                    resolve(true);
                }
            });

            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                    resolve(true);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        });
    }

    // Show error with human-readable messages
    showError(error) {
        let message = 'An unexpected error occurred';
        let title = 'Error';

        if (typeof error === 'string') {
            message = error;
        } else if (error && typeof error === 'object') {
            // Extract human-readable error message
            message = this.getHumanReadableError(error);
        }

        return this.alert(message, title, 'error');
    }

    // Show success message
    showSuccess(message, title = 'Success') {
        return this.alert(message, title, 'success');
    }

    // Convert error codes to human-readable messages
    getHumanReadableError(error) {
        // Handle null or undefined
        if (!error) {
            return 'An unexpected error occurred. Please try again';
        }

        // Handle string errors
        if (typeof error === 'string') {
            return error;
        }

        const errorMap = {
            // Firebase Auth Errors
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'Username not found. Please check your email or create a new account',
            'auth/wrong-password': 'Password doesn\'t match. Please try again or reset your password',
            'auth/invalid-login-credentials': 'Invalid email or password. Please check your credentials and try again',
            'auth/email-already-in-use': 'This email is already registered',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your internet connection',
            'auth/invalid-credential': 'Invalid credentials. Please check your email and password',
            'auth/popup-blocked': 'Popup was blocked. Please enable popups for this site',
            'auth/popup-closed-by-user': 'Sign-in was cancelled',
            'auth/unauthorized-domain': 'This domain is not authorized. Please contact support',
            
            // Firestore Errors
            'permission-denied': 'You don\'t have permission to perform this action',
            'not-found': 'The requested item was not found',
            'already-exists': 'This item already exists',
            'failed-precondition': 'Operation failed. Please try again',
            'unavailable': 'Service temporarily unavailable. Please try again',
            
            // Custom Errors
            'duplicate-note': 'A note for this date already exists',
            'invalid-date': 'Please select a valid date',
            'empty-content': 'Please enter some content',
        };

        // Check for error code first
        if (error.code && errorMap[error.code]) {
            return errorMap[error.code];
        }

        // Try to extract a clean message
        if (error.message) {
            let msg = error.message;
            
            // Remove technical prefixes and patterns
            msg = msg
                .replace(/^FirebaseError:\s*/i, '')
                .replace(/^Error:\s*/i, '')
                .replace(/\s*\([^)]*\)\s*$/g, '')  // Remove trailing parentheses content
                .replace(/Firebase:\s*/gi, '')
                .trim();
            
            // If message still looks technical, try to make it friendlier
            if (msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.toLowerCase().includes('invalid')) {
                return 'Invalid email or password. Please check your credentials and try again';
            }
            
            // Capitalize first letter
            if (msg.length > 0) {
                msg = msg.charAt(0).toUpperCase() + msg.slice(1);
                return msg;
            }
        }

        return 'An unexpected error occurred. Please try again';
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('show');
            setTimeout(() => {
                this.activeModal?.remove();
                this.activeModal = null;
            }, 300);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize global instance
window.customDialogs = new CustomDialogs();
