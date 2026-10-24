import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  const { logout } = useAuth();
  const themeContext = useTheme();
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const toggleDarkMode = themeContext?.toggleDarkMode ?? (() => {});
  const navigate = useNavigate();
  const location = useLocation();
  const isMoreActive = location.pathname === '/themes' || location.pathname === '/lists';

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <header className="header">
      <Link to="/" className="logo-link">
        <h1 className="logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
        </h1>
      </Link>
      <nav className="header-nav">
        <NavLink to="/activities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Activities</NavLink>
        <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Goals</NavLink>
        <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Notes</NavLink>
        <NavLink to="/reminders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Reminders</NavLink>
        <NavLink to="/focus" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Focus</NavLink>
        <div className="more-dropdown">
          <button className={`more-btn nav-item ${isMoreActive ? 'active' : ''}`} aria-label="More options">More</button>
          <div className="more-dropdown-content">
            <NavLink to="/themes" className={({ isActive }) => isActive ? 'active' : ''}>Themes</NavLink>
            <NavLink to="/lists" className={({ isActive }) => isActive ? 'active' : ''}>Lists</NavLink>
          </div>
        </div>
      </nav>
      <div className="header-actions">
        {location.pathname === '/focus' && (
          <>
            <button 
              className="header-btn theme-toggle-btn" 
              id="analytics-toggle"
              title="Analytics" 
              aria-label="View analytics"
              onClick={() => navigate('/analytics')}
            >
              <i className="fas fa-chart-bar" aria-hidden="true"></i>
            </button>
            <button 
              className="header-btn theme-toggle-btn" 
              id="deep-work-toggle" 
              title="Deep Focus" 
              aria-label="Toggle deep focus mode"
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
        )}
        <button id="theme-toggle" className="header-btn theme-toggle-btn" aria-label="Toggle dark/light mode" onClick={toggleDarkMode}>
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <button id="logout-btn" className="header-btn" aria-label="Logout" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
