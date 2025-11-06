// Universal Authentication Manager for BitHab
// Handles authentication state across all pages

class AuthManager {
    constructor() {
        this.user = null;
        this.callbacks = new Set();
        this.initialized = false;
        this.logoutHandlersBound = false;
        this.redirectResultHandled = false;
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        this.boundEnsureLogoutHandlers = this.ensureLogoutHandlers.bind(this);
        this.init();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.boundEnsureLogoutHandlers, { once: true });
        } else {
            this.ensureLogoutHandlers();
        }
    }

    init() {
        // Wait for Firebase to be loaded
        if (typeof firebase === 'undefined') {
            console.error('Firebase not loaded');
            return;
        }

        if (firebase.auth().useDeviceLanguage) {
            firebase.auth().useDeviceLanguage();
        }

        this.captureGoogleRedirectResult();

        firebase.auth().onAuthStateChanged((user) => {
            this.user = user;
            this.initialized = true;
            this.ensureLogoutHandlers();
            
            // Notify all callbacks
            this.callbacks.forEach(callback => {
                try {
                    callback(user);
                } catch (error) {
                    console.error('Auth callback error:', error);
                }
            });

            // Handle page redirects
            this.handlePageRedirects(user);
        });
    }

    ensureLogoutHandlers() {
        if (this.logoutHandlersBound) {
            return;
        }

        if (document.body && document.body.classList.contains('index-page')) {
            return;
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (!logoutBtn) {
            return;
        }

        // Mark to avoid duplicate bindings from page-specific scripts
        if (logoutBtn.dataset.logoutHandler === 'auth-manager') {
            this.logoutHandlersBound = true;
            return;
        }

        logoutBtn.addEventListener('click', this.handleLogoutClick);
        logoutBtn.dataset.logoutHandler = 'auth-manager';
        this.logoutHandlersBound = true;
    }

    handlePageRedirects(user) {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');
        
        if (!user && !isAuthPage) {
            // Not authenticated and not on auth page - redirect to login
            const loginPath = currentPath.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        } else if (user && isAuthPage) {
            // Authenticated but on auth page - redirect to dashboard
            const homePath = currentPath.includes('/pages/') ? '../index.html' : 'index.html';
            window.location.href = homePath;
        }
    }

    // Subscribe to auth state changes
    onAuthStateChange(callback) {
        this.callbacks.add(callback);
        
        // If already initialized, call callback immediately
        if (this.initialized) {
            callback(this.user);
        }
        
        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.user;
    }

    // Sign out
    async signOut() {
        try {
            sessionStorage.removeItem('google_access_token');
            await firebase.auth().signOut();
            const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    async handleLogoutClick(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === 'function') {
                event.stopImmediatePropagation();
            }
        }

        const proceed = () => {
            try {
                const openBottomDropdown = document.querySelector('.more-bottom-nav.open');
                if (openBottomDropdown) {
                    openBottomDropdown.classList.remove('open');
                }
            } catch (error) {
                console.debug('Failed to close bottom nav on logout:', error);
            }

            this.signOut().catch(signOutError => {
                if (window.errorHandler && typeof window.errorHandler.handleFirebaseError === 'function') {
                    window.errorHandler.handleFirebaseError(signOutError);
                } else {
                    console.error('Sign out failed:', signOutError);
                }
            });
        };

        const confirmationMessage = 'Are you sure you want to logout?';

        if (window.BitHabMobileNav && typeof window.BitHabMobileNav.showConfirmation === 'function') {
            window.BitHabMobileNav.showConfirmation(confirmationMessage, proceed);
            return;
        }

        if (window.BitHabUI && typeof window.BitHabUI.showConfirmation === 'function') {
            window.BitHabUI.showConfirmation(confirmationMessage, proceed);
            return;
        }

        if (typeof window.confirm === 'function') {
            if (window.confirm(confirmationMessage)) {
                proceed();
            }
            return;
        }

        proceed();
    }

    // Get user ID
    getUserId() {
        return this.user ? this.user.uid : null;
    }

    // Get user info for Google users
    getUserInfo() {
        if (!this.user) return null;
        
        return {
            uid: this.user.uid,
            email: this.user.email,
            displayName: this.user.displayName,
            photoURL: this.user.photoURL,
            emailVerified: this.user.emailVerified,
            isAnonymous: this.user.isAnonymous,
            providerData: this.user.providerData
        };
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Add additional scopes for future Google integrations
            provider.addScope('https://www.googleapis.com/auth/userinfo.email');
            provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
            if (typeof provider.setCustomParameters === 'function') {
                provider.setCustomParameters({ prompt: 'select_account' });
            }

            const protocol = typeof window !== 'undefined' && window.location ? window.location.protocol : null;
            const supportedProtocols = ['http:', 'https:', 'chrome-extension:'];
            if (!protocol || !supportedProtocols.includes(protocol)) {
                const environmentError = new Error('Google sign-in requires serving this page over http or https.');
                environmentError.code = 'auth/operation-not-supported-in-this-environment';
                throw environmentError;
            }
            
            // Use popup for better UX
            const result = await firebase.auth().signInWithPopup(provider);

            this.storeGoogleCredential(result.credential || firebase.auth.GoogleAuthProvider.credentialFromResult(result));
            
            return {
                user: result.user,
                redirect: false
            };
        } catch (error) {
            if (error.code === 'auth/popup-blocked') {
                try {
                    await firebase.auth().signInWithRedirect(provider);
                    return {
                        user: null,
                        redirect: true
                    };
                } catch (redirectError) {
                    console.error('Google redirect failed:', redirectError);
                    throw redirectError;
                }
            }

            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    // Sign in with email and password (existing method)
    async signInWithEmailAndPassword(email, password) {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    }

    // Create account with email and password (existing method)
    async createUserWithEmailAndPassword(email, password) {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('Email registration error:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email) {
        try {
            const actionCodeSettings = this.getPasswordResetActionCodeSettings();
            if (actionCodeSettings) {
                await firebase.auth().sendPasswordResetEmail(email, actionCodeSettings);
            } else {
                await firebase.auth().sendPasswordResetEmail(email);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
    
    getPasswordResetActionCodeSettings() {
        return null;
    }

    // Get stored Google access token
    getGoogleAccessToken() {
        return sessionStorage.getItem('google_access_token');
    }

    // Check if user signed in with Google
    isGoogleUser() {
        if (!this.user) return false;
        return this.user.providerData.some(provider => provider.providerId === 'google.com');
    }

    // Wait for authentication to be initialized
    waitForAuth() {
        return new Promise((resolve) => {
            if (this.initialized) {
                resolve(this.user);
            } else {
                const unsubscribe = this.onAuthStateChange((user) => {
                    unsubscribe();
                    resolve(user);
                });
            }
        });
    }

    captureGoogleRedirectResult() {
        if (this.redirectResultHandled) {
            return;
        }

        const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol) || '';
        const isSupportedProtocol = ['http:', 'https:', 'chrome-extension:'].includes(protocol);
        const storageEnabled = (() => {
            try {
                const testKey = '__bithab_storage_test__';
                sessionStorage.setItem(testKey, '1');
                sessionStorage.removeItem(testKey);
                return true;
            } catch (error) {
                return false;
            }
        })();

        if (!isSupportedProtocol || !storageEnabled) {
            console.info('Skipping Google redirect result handling due to unsupported environment.', {
                protocol,
                storageEnabled
            });
            return;
        }

        this.redirectResultHandled = true;

        firebase.auth().getRedirectResult()
            .then((result) => {
                if (result && result.user) {
                    this.storeGoogleCredential(result.credential || firebase.auth.GoogleAuthProvider.credentialFromResult(result));
                }
            })
            .catch((error) => {
                if (error && error.code !== 'auth/no-auth-event') {
                    console.error('Google redirect result error:', error);
                }
            });
    }

    storeGoogleCredential(credential) {
        if (!credential || !credential.accessToken) {
            return;
        }

        try {
            sessionStorage.setItem('google_access_token', credential.accessToken);
        } catch (error) {
            console.warn('Unable to store Google access token:', error);
        }
    }
}

// Create global instance
window.authManager = new AuthManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
