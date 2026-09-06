import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function MobileTopbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="mobile-topbar">
      <Link to="/" className="logo-link">
        <h1 className="logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
        </h1>
      </Link>
      <button id="mobile-theme-toggle" className="theme-toggle-btn" aria-label="Toggle dark/light mode" onClick={toggleDarkMode}>
        <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>
    </div>
  );
}
