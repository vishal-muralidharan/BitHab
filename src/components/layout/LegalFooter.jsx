import { Link } from 'react-router-dom';

/**
 * Reusable LegalFooter component providing subtle, standardized copyright and links to legal pages.
 */
export default function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="legal-footer">
      <p>© {currentYear} BitHab. All rights reserved.</p>
      <div className="legal-footer-links">
        <Link to="/terms" className="legal-footer-link" id="footer-terms-link">Terms of Service</Link>
        <Link to="/privacy" className="legal-footer-link" id="footer-privacy-link">Privacy Policy</Link>
      </div>
    </footer>
  );
}
