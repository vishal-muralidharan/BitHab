// Universal Error Handler for BitHab
// Provides consistent error handling across all pages

class ErrorHandler {
    constructor() {
        this.errorContainer = null;
        this.dialogOverlay = null;
        this.dialogElements = null;
        this.escapeHandler = null;
        this.currentRetryAction = null;
        this.init();
    }

    init() {
        // Create error container if it doesn't exist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createErrorContainer());
        } else {
            this.createErrorContainer();
        }

        // Handle uncaught errors
        window.addEventListener('error', (e) => {
            console.error('Uncaught error:', e.error);
            console.error('Error details:', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error ? e.error.stack : 'No stack trace'
            });
            
            // Only show error dialog for critical errors, not minor ones
            if (e.message && (
                e.message.includes('Firebase') ||
                e.message.includes('Cannot read property') ||
                e.message.includes('is not defined') ||
                e.message.includes('Network')
            )) {
                this.showError('An unexpected error occurred. Please refresh the page.');
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            console.error('Promise rejection details:', {
                reason: e.reason,
                stack: e.reason ? e.reason.stack : 'No stack trace'
            });
            
            // Only show error dialog for critical promise rejections
            const reason = e.reason ? e.reason.toString() : '';
            if (reason.includes('Firebase') || reason.includes('Network') || reason.includes('Auth')) {
                this.showError('An unexpected error occurred. Please refresh the page.');
            }
        });
    }

    createErrorContainer() {
        // Check if error container already exists
        this.errorContainer = document.getElementById('global-error-container');
        
        if (!this.errorContainer) {
            this.errorContainer = document.createElement('div');
            this.errorContainer.id = 'global-error-container';
            this.errorContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(this.errorContainer);
        }

        // Ensure error dialog modal exists
        this.createErrorDialog();
    }

    createErrorDialog() {
        if (this.dialogOverlay) {
            return this.dialogOverlay;
        }

        const overlay = document.createElement('div');
        overlay.id = 'error-dialog-overlay';
        overlay.className = 'error-dialog-overlay hidden';
        overlay.innerHTML = `
            <div class="error-dialog-backdrop"></div>
            <div class="error-dialog-content" role="dialog" aria-modal="true" aria-labelledby="error-dialog-title">
                <div class="error-dialog-header">
                    <span class="error-dialog-icon">⚠️</span>
                    <h3 id="error-dialog-title">Error</h3>
                </div>
                <div class="error-dialog-body">
                    <p id="error-dialog-message">An error occurred</p>
                    <button id="error-dialog-toggle" type="button" class="error-dialog-toggle hidden">Show Details</button>
                    <pre id="error-dialog-technical" class="error-details hidden"></pre>
                </div>
                <div class="error-dialog-actions">
                    <button id="error-dialog-retry" class="btn-primary hidden">Try Again</button>
                    <button id="error-dialog-ok" class="btn-secondary">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.dialogOverlay = overlay;
        this.dialogElements = {
            overlay,
            content: overlay.querySelector('.error-dialog-content'),
            icon: overlay.querySelector('.error-dialog-icon'),
            title: overlay.querySelector('#error-dialog-title'),
            message: overlay.querySelector('#error-dialog-message'),
            detailsToggle: overlay.querySelector('#error-dialog-toggle'),
            technical: overlay.querySelector('#error-dialog-technical'),
            retry: overlay.querySelector('#error-dialog-retry'),
            ok: overlay.querySelector('#error-dialog-ok')
        };

        this.setupErrorDialogEvents();
        this.addErrorDialogStyles();
        return overlay;
    }

    addErrorDialogStyles() {
        if (document.getElementById('error-dialog-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'error-dialog-styles';
        styles.textContent = `
            .error-dialog-overlay {
                position: fixed;
                inset: 0;
                background: rgba(10, 12, 16, 0.65);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease;
            }

            .error-dialog-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }

            .error-dialog-overlay.hidden {
                display: none;
            }

            .error-dialog-backdrop {
                position: absolute;
                inset: 0;
            }

            .error-dialog-content {
                max-width: 500px;
                width: min(90vw, 500px);
                background: var(--bg-secondary, #fff);
                border-radius: var(--radius, 12px);
                border-left: 4px solid #e74c3c;
                position: relative;
                padding: 1.5rem;
                box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
                transform: translateY(24px);
                transition: transform 0.2s ease;
            }

            .error-dialog-overlay.show .error-dialog-content {
                transform: translateY(0);
            }
            
            .error-dialog-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .error-dialog-icon {
                font-size: 1.5rem;
            }
            
            .error-dialog-header h3 {
                margin: 0;
                color: #e74c3c;
                font-size: 1.1rem;
            }
            
            .error-dialog-body {
                margin-bottom: 1.5rem;
            }
            
            .error-dialog-body p {
                margin: 0 0 1rem 0;
                line-height: 1.5;
                color: var(--text-primary);
            }
            
            .error-details {
                margin-top: 1rem;
                border: 1px solid var(--border-color);
                border-radius: var(--radius);
                overflow: hidden;
            }

            .error-details.hidden {
                display: none;
            }
            
            .error-dialog-toggle {
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
                padding: 0.5rem 0.75rem;
                background: var(--bg-primary);
                color: var(--text-secondary);
                border: none;
                cursor: pointer;
                font-size: 0.85rem;
                transition: background 0.2s ease;
            }
            
            .error-dialog-toggle:hover {
                background: var(--bg-hover);
            }

            .error-dialog-toggle.hidden {
                display: none;
            }
            
            .error-details pre {
                margin: 0;
                padding: 0.75rem;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.8rem;
                white-space: pre-wrap;
                word-break: break-word;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .error-dialog-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: flex-end;
            }
            
            .error-dialog-actions button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: var(--radius);
                cursor: pointer;
                font-size: 0.9rem;
                transition: all var(--transition);
            }
            
            .error-dialog-actions .btn-primary {
                background: var(--accent-primary);
                color: white;
            }
            
            .error-dialog-actions .btn-primary:hover {
                background: var(--accent-secondary);
            }
            
            .error-dialog-actions .btn-secondary {
                background: var(--bg-primary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .error-dialog-actions .btn-secondary:hover {
                background: var(--bg-hover);
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupErrorDialogEvents() {
        if (!this.dialogElements || this.dialogElements.eventsBound) {
            return;
        }

    const { overlay, ok, retry, detailsToggle, technical } = this.dialogElements;

        ok?.addEventListener('click', () => this.hideErrorDialog());

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('error-dialog-backdrop')) {
                this.hideErrorDialog();
            }
        });

        retry?.addEventListener('click', () => {
            if (typeof this.currentRetryAction === 'function') {
                const action = this.currentRetryAction;
                this.hideErrorDialog();
                action();
            }
        });

        detailsToggle?.addEventListener('click', () => {
            if (!technical) return;
            const isHidden = technical.classList.contains('hidden');
            technical.classList.toggle('hidden');
            detailsToggle.textContent = isHidden ? 'Hide Details' : 'Show Details';
        });

        this.dialogElements.eventsBound = true;
    }

    showError(message, type = 'error', duration = 5000) {
        if (!this.errorContainer) {
            this.createErrorContainer();
        }

        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            max-width: 100%;
            word-wrap: break-word;
        `;
        
        errorElement.textContent = message;
        
        // Click to dismiss
        errorElement.addEventListener('click', () => {
            this.hideError(errorElement);
        });
        
        this.errorContainer.appendChild(errorElement);
        
        // Animate in
        requestAnimationFrame(() => {
            errorElement.style.transform = 'translateX(0)';
        });
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideError(errorElement);
            }, duration);
        }
        
        return errorElement;
    }

    showSuccess(message, duration = 4000) {
        return this.showError(message, 'success', duration);
    }

    hideError(errorElement) {
        if (errorElement && errorElement.parentNode) {
            errorElement.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
    }

    // Firebase error code to user-friendly message mapping
    getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-login-credentials':
                return 'An internal error occurred. Please try again later.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password must be at least 8 characters and include uppercase, lowercase, and number characters.';
            case 'auth/operation-not-allowed':
                return 'Email registration is currently disabled.';
            case 'auth/operation-not-supported-in-this-environment':
                return 'This sign-in method is not supported here. Please open BitHab using http or https and ensure cookies are enabled.';
            case 'auth/web-storage-unsupported':
                return 'Browser storage is disabled. Enable cookies or local storage and try again.';
            case 'auth/unauthorized-domain':
                return 'This domain is not authorized for sign-in. Please contact support.';
            case 'auth/invalid-action-code':
                return 'The reset code is invalid or has already been used. Request a new code and try again.';
            case 'auth/expired-action-code':
                return 'The reset code has expired. Request a new code and try again.';
            case 'permission-denied':
                return 'You do not have permission to perform this action.';
            case 'not-found':
                return 'The requested data was not found.';
            case 'already-exists':
                return 'The data already exists.';
            case 'failed-precondition':
                return 'The operation failed due to a precondition.';
            case 'aborted':
                return 'The operation was aborted.';
            case 'out-of-range':
                return 'The operation was outside the valid range.';
            case 'unimplemented':
                return 'This operation is not implemented.';
            case 'internal':
                return 'An internal error occurred.';
            case 'unavailable':
                return 'The service is currently unavailable.';
            case 'data-loss':
                return 'Data loss occurred.';
            case 'unauthenticated':
                return 'You must be logged in to perform this action.';
            default:
                return error.message || 'An unexpected error occurred.';
        }
    }

    // Handle Firebase errors specifically
    handleFirebaseError(error, customMessage = null) {
        const message = customMessage || this.getFirebaseErrorMessage(error);
        console.error('Firebase error:', error);
        this.showError(message);
    }

    // Handle network errors
    handleNetworkError() {
        this.showError('Network error. Please check your connection and try again.');
    }

    // Show error dialog
    showErrorDialog(options = {}) {
        try {
            const {
                title = 'Error',
                message = 'An unexpected error occurred.',
                details = '',
                type = 'error',
                onRetry = null,
                retryLabel = 'Try Again',
                autoClose = null
            } = options;

            const overlay = this.createErrorDialog();
            const {
                title: titleEl,
                message: messageEl,
                detailsToggle,
                technical,
                retry,
                ok,
                content,
                icon
            } = this.dialogElements || {};

            if (!overlay || !content) {
                console.error('Error dialog overlay missing');
                return null;
            }

            titleEl.textContent = title;
            messageEl.textContent = message;

            if (details && technical) {
                technical.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
                technical.classList.remove('hidden');
                detailsToggle?.classList.remove('hidden');
                if (detailsToggle) {
                    detailsToggle.textContent = 'Hide Details';
                }
            } else {
                if (technical) {
                    technical.textContent = '';
                    technical.classList.add('hidden');
                }
                detailsToggle?.classList.add('hidden');
                if (detailsToggle) {
                    detailsToggle.textContent = 'Show Details';
                }
            }

            if (retry) {
                if (typeof onRetry === 'function') {
                    retry.classList.remove('hidden');
                    retry.textContent = retryLabel;
                } else {
                    retry.classList.add('hidden');
                }
            }
            this.currentRetryAction = typeof onRetry === 'function' ? onRetry : null;

            const typeStyles = {
                success: { icon: '✅', color: '#10b981' },
                warning: { icon: '⚠️', color: '#f59e0b' },
                info: { icon: 'ℹ️', color: '#3b82f6' },
                error: { icon: '⚠️', color: '#e74c3c' }
            };
            const activeStyle = typeStyles[type] || typeStyles.error;

            if (icon) {
                icon.textContent = activeStyle.icon;
            }
            if (content) {
                content.dataset.dialogType = type;
                content.style.borderLeftColor = activeStyle.color;
            }
            if (titleEl) {
                titleEl.style.color = activeStyle.color;
            }

            overlay.classList.remove('hidden');
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });

            if (!this.escapeHandler) {
                this.escapeHandler = (event) => {
                    if (event.key === 'Escape') {
                        this.hideErrorDialog();
                    }
                };
                document.addEventListener('keydown', this.escapeHandler);
            }

            if (typeof autoClose === 'number' && autoClose > 0) {
                setTimeout(() => {
                    if (overlay.classList.contains('show')) {
                        this.hideErrorDialog();
                    }
                }, autoClose);
            }

            // Ensure primary action receives focus for accessibility
            (this.currentRetryAction ? retry : ok)?.focus({ preventScroll: true });

            return overlay;
        } catch (error) {
            console.error('Error displaying dialog:', error);
            alert(options?.message || 'An error occurred');
            return null;
        }
    }

    // Hide error dialog
    hideErrorDialog() {
        if (!this.dialogOverlay) {
            return;
        }

        this.dialogOverlay.classList.remove('show');
        setTimeout(() => {
            if (this.dialogOverlay) {
                this.dialogOverlay.classList.add('hidden');
            }
        }, 200);

        this.currentRetryAction = null;

        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }
}

// Create global instance
window.errorHandler = new ErrorHandler();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
