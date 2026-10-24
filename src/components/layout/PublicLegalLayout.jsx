import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LegalFooter from './LegalFooter';

export default function PublicLegalLayout({ children }) {
  const { currentUser } = useAuth();
  const themeContext = useTheme();
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const toggleDarkMode = themeContext?.toggleDarkMode ?? (() => {});

  const homePath = currentUser ? '/' : '/login';

  return (
    <div className="public-legal-layout">
      <header className="public-legal-header">
        <Link to={homePath} className="logo-link" aria-label="BitHab Home">
          <h1 className="logo">
            <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
            <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
          </h1>
        </Link>

        <div className="public-legal-actions">
          {currentUser ? (
            <Link to="/" className="legal-nav-btn" aria-label="Back to App">
              <i className="fas fa-arrow-left" aria-hidden="true"></i>
              <span>Back to App</span>
            </Link>
          ) : (
            <Link to="/login" className="legal-nav-btn" aria-label="Log in to BitHab">
              <span>Login</span>
            </Link>
          )}

          <button 
            id="theme-toggle" 
            className="header-btn theme-toggle-btn" 
            aria-label="Toggle dark/light mode" 
            onClick={toggleDarkMode}
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <main className="legal-content-wrapper">
        {children}
      </main>

      <LegalFooter />
    </div>
  );
}
