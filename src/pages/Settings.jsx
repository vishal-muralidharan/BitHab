import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteUserAccount } from '../api/user';
import ConfirmModal from '../components/common/ConfirmModal';

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const themeContext = useTheme();
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const toggleDarkMode = themeContext?.toggleDarkMode ?? (() => {});
  const navigate = useNavigate();

  const [isSignOutModalOpen, setSignOutModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss transient toast alerts
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Determine user primary sign-in provider and metadata
  const providerId = currentUser?.providerData?.[0]?.providerId;
  const signInMethod = providerId === 'google.com' ? 'Google' : 'Email & Password';
  const displayName = currentUser?.displayName || currentUser?.email || 'User';
  const userId = currentUser?.uid || 'N/A';
  const createdDate = currentUser?.metadata?.creationTime 
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'N/A';

  async function handleSignOutConfirm() {
    setSignOutModalOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
      setToast({ message: 'Failed to sign out. Please try again.', type: 'error' });
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE' || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteUserAccount();
      setToast({ message: 'Account deleted successfully.', type: 'success' });
      
      // Clear client state and redirect
      try {
        window.localStorage.removeItem('bithab_theme_prefs');
      } catch (e) {
        console.warn('Could not clear local theme preferences', e);
      }

      setDeleteModalOpen(false);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Account deletion error:', err);
      setToast({
        message: err.message || 'Failed to delete account. Please try again.',
        type: 'error'
      });
      setIsDeleting(false);
    }
  }

  function openDeleteModal() {
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">
          <i className="fas fa-cog" aria-hidden="true"></i>
          <span>Settings</span>
        </h1>
        <p className="settings-subtitle">Manage your account credentials, visual preferences, and personal data rights.</p>
      </header>

      {/* 1. Account Section */}
      <section className="settings-section" aria-labelledby="settings-account-title">
        <h2 id="settings-account-title" className="settings-section-title">
          <i className="fas fa-user-circle" aria-hidden="true"></i>
          <span>Account</span>
        </h2>
        
        <div className="settings-info-grid">
          <div className="settings-info-item">
            <div className="settings-info-label">Display Name</div>
            <div className="settings-info-val" id="settings-display-name">{displayName}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">Email Address</div>
            <div className="settings-info-val" id="settings-email">{currentUser?.email || 'N/A'}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">User ID</div>
            <div className="settings-info-val" id="settings-uid" style={{ fontSize: '0.85rem' }}>{userId}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">Created Date</div>
            <div className="settings-info-val" id="settings-created-date">{createdDate}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">Sign-in Method</div>
            <div className="settings-info-val">{signInMethod}</div>
          </div>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary" 
          id="settings-signout-btn"
          onClick={() => setSignOutModalOpen(true)}
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem', 
            borderRadius: 'var(--radius)', 
            border: '1px solid var(--border-color)', 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)', 
            cursor: 'pointer', 
            fontWeight: 500, 
            minHeight: '44px' 
          }}
        >
          <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
          <span>Sign Out</span>
        </button>
      </section>

      {/* 2. Appearance Section */}
      <section className="settings-section" aria-labelledby="settings-appearance-title">
        <h2 id="settings-appearance-title" className="settings-section-title">
          <i className="fas fa-palette" aria-hidden="true"></i>
          <span>Appearance</span>
        </h2>
        
        <div className="settings-link-row">
          <Link to="/themes" className="settings-card-link" id="settings-theme-gallery-link">
            <span>Theme Gallery</span>
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
          <button 
            type="button" 
            className="settings-card-link" 
            id="settings-mode-toggle-btn"
            onClick={toggleDarkMode}
          >
            <span>Mode: <strong>{isDarkMode ? 'Dark' : 'Light'}</strong></span>
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
          </button>
        </div>
      </section>

      {/* 3. Legal & Privacy Section */}
      <section className="settings-section" aria-labelledby="settings-legal-title">
        <h2 id="settings-legal-title" className="settings-section-title">
          <i className="fas fa-shield-halved" aria-hidden="true"></i>
          <span>Legal & Privacy</span>
        </h2>
        
        <div className="settings-link-row">
          <Link to="/dpdp" className="settings-card-link" id="settings-dpdp-link">
            <span>Manage My Data (DPDP)</span>
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
          <Link to="/privacy" className="settings-card-link" id="settings-privacy-link">
            <span>Privacy Policy</span>
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
          <Link to="/terms" className="settings-card-link" id="settings-terms-link">
            <span>Terms of Service</span>
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
          <Link to="/terms-and-conditions" className="settings-card-link" id="settings-terms-conditions-link">
            <span>Terms and Conditions</span>
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
      </section>

      {/* 4. Contact / Support Section */}
      <section className="settings-section" aria-labelledby="settings-contact-title">
        <h2 id="settings-contact-title" className="settings-section-title">
          <i className="fas fa-envelope" aria-hidden="true"></i>
          <span>Contact & Support</span>
        </h2>
        
        <p className="settings-contact-text">
          Have questions, technical inquiries, or feedback regarding BitHab? Reach out directly to our support team:
        </p>
        <p>
          <a href="mailto:[TODO: verify support email]" className="settings-contact-link" id="settings-support-email-link">
            [TODO: verify support email]
          </a>
        </p>
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>BitHab Web Application • Version 1.0.0</span>
        </div>
      </section>

      {/* 5. Danger Zone */}
      <section className="settings-section danger-zone" aria-labelledby="settings-danger-title">
        <h2 id="settings-danger-title" className="settings-section-title">
          <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
          <span>Danger Zone</span>
        </h2>

        <div className="danger-warning-box">
          <div className="danger-warning-title">
            <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
            <span>Warning: Irreversible Action</span>
          </div>
          <p className="danger-warning-text">
            Deleting your account will permanently and irreversibly erase all personal data from BitHab's servers. All activities, goals, reminders, notes, custom lists, and focus history will be wiped immediately.
          </p>
        </div>

        <button 
          type="button" 
          className="danger-delete-btn"
          id="delete-account-btn"
          onClick={openDeleteModal}
        >
          <i className="fas fa-trash-alt" aria-hidden="true" style={{ marginRight: '0.5rem' }}></i>
          <span>Delete Account</span>
        </button>
      </section>

      {/* Confirm Sign Out Modal */}
      <ConfirmModal 
        isOpen={isSignOutModalOpen}
        title="Sign out?"
        message="You'll need to sign in again to continue."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setSignOutModalOpen(false)}
        isDanger={false}
      />

      {/* Confirm Delete Account Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Permanently Delete Account?"
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete My Account'}
        cancelLabel="Keep Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
          }
        }}
        isDanger={true}
        confirmDisabled={deleteConfirmText !== 'DELETE' || isDeleting}
      >
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            This action cannot be undone. All your activities, logs, reminders, goals, notes, and productivity sessions will be permanently erased.
          </p>
          <label 
            htmlFor="delete-confirm-input" 
            className="danger-confirm-prompt"
            style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}
          >
            Please type <strong style={{ color: 'var(--error-color)', fontFamily: 'monospace' }}>DELETE</strong> to confirm:
          </label>
          <input 
            type="text" 
            id="delete-confirm-input"
            className="danger-confirm-input"
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            disabled={isDeleting}
            autoComplete="off"
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
        </div>
      </ConfirmModal>

      {/* Transient Toast Alerts */}
      {toast && (
        <div className={`settings-toast ${toast.type}`} role="alert">
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} aria-hidden="true"></i>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
