import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TermsAgreementModal() {
  const { currentUser, agreedToTerms, acceptTerms } = useAuth();
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only mount when currentUser exists, has not agreed to terms, and is not on auth or public legal routes
  const bypassRoutes = ['/login', '/register', '/terms', '/terms-and-conditions', '/privacy'];
  if (!currentUser || agreedToTerms || bypassRoutes.includes(location.pathname)) {
    return null;
  }

  async function handleAccept() {
    if (!agreed) return;
    try {
      setLoading(true);
      setError('');
      await acceptTerms('2026-10-24');
    } catch (err) {
      console.error('Failed to record terms agreement:', err);
      setError('Failed to record consent. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="terms-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
      <div className="terms-modal-card">
        <h2 id="terms-modal-title" className="terms-modal-title">
          <i className="fas fa-shield-alt" aria-hidden="true"></i>
          <span>Updated Terms & Privacy Policy</span>
        </h2>
        
        <p className="terms-modal-desc">
          We have updated our terms and privacy disclosures in accordance with the Digital Personal Data Protection (DPDP) Act, 2023. Please review our updated policies and confirm your agreement to continue using BitHab.
        </p>

        <div className="terms-modal-links">
          <div className="terms-modal-links-title">Please Review:</div>
          <ul>
            <li>
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-file-contract" aria-hidden="true"></i>
                <span>Terms of Service (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-scale-balanced" aria-hidden="true"></i>
                <span>Terms and Conditions (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                <i className="fas fa-user-shield" aria-hidden="true"></i>
                <span>Privacy Policy (opens in new tab)</span>
              </a>
            </li>
          </ul>
        </div>

        {error && <div className="error-message" style={{ display: 'block', marginBottom: '1rem' }}>{error}</div>}

        <div className="terms-checkbox-group">
          <label className="terms-checkbox-label" htmlFor="modal-terms-checkbox">
            <input 
              type="checkbox" 
              id="modal-terms-checkbox"
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)} 
            />
            <span>
              I agree to the Terms of Service, Terms and Conditions, and Privacy Policy
            </span>
          </label>
        </div>

        <div className="terms-modal-actions">
          <button 
            type="button" 
            className="terms-modal-btn primary"
            id="terms-continue-btn"
            disabled={!agreed || loading}
            onClick={handleAccept}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
