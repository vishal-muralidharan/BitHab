import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function MobileTopbar() {
  const themeContext = useTheme();
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const toggleDarkMode = themeContext?.toggleDarkMode ?? (() => {});
  const navigate = useNavigate();
  const location = useLocation();

  const isFocusPage = location.pathname === '/focus';

  return (
    <div className="mobile-topbar">
      <Link to="/" className="logo-link">
        <h1 className="logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
        </h1>
      </Link>
      <div className="mobile-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {isFocusPage ? (
          <>
            <button 
              className="theme-toggle-btn" 
              id="mobile-analytics-toggle"
              title="Insights" 
              aria-label="Insights (mobile)"
              onClick={() => navigate('/analytics')}
            >
              <i className="fas fa-chart-bar" aria-hidden="true"></i>
            </button>
            <button 
              className="theme-toggle-btn" 
              id="mobile-deep-work-toggle" 
              title="Deep Focus" 
              aria-label="Deep Focus (mobile)"
              onClick={async () => {
                try {
                  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                  }
                } catch (err) {
                  console.warn('Fullscreen entry from Focus page was ignored or denied:', err);
                }
                navigate('/deep-focus');
              }}
            >
              <i className="fas fa-spa" aria-hidden="true"></i>
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/settings" 
              className="theme-toggle-btn" 
              id="mobile-settings-btn" 
              title="Settings" 
              aria-label="Settings (mobile)"
            >
              <i className="fas fa-cog" aria-hidden="true"></i>
            </Link>
            <button id="mobile-theme-toggle" className="theme-toggle-btn" aria-label="Toggle dark/light mode" onClick={toggleDarkMode}>
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
