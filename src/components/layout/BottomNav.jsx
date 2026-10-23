import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMoreActive = ['/notes', '/focus', '/themes', '/lists'].includes(location.pathname);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-home bottom-nav-icon"></i>
          <span className="bottom-nav-label">Home</span>
        </NavLink>
        <NavLink to="/activities" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-chart-line bottom-nav-icon"></i>
          <span className="bottom-nav-label">Activities</span>
        </NavLink>
        <NavLink to="/goals" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-bullseye bottom-nav-icon"></i>
          <span className="bottom-nav-label">Goals</span>
        </NavLink>
        <NavLink to="/reminders" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-bell bottom-nav-icon"></i>
          <span className="bottom-nav-label">Reminders</span>
        </NavLink>
        <div className={`bottom-nav-item more-bottom-nav ${isMoreActive ? 'active' : ''}`}>
          <i className="fas fa-ellipsis-h bottom-nav-icon"></i>
          <span className="bottom-nav-label">More</span>
          <div className="more-bottom-dropdown">
            <NavLink to="/notes" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`}>
              <i className="fas fa-sticky-note"></i>
              <span>Notes</span>
            </NavLink>
            <NavLink to="/focus" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`}>
              <i className="fas fa-clock"></i>
              <span>Focus</span>
            </NavLink>
            <NavLink to="/themes" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`}>
              <i className="fas fa-palette"></i>
              <span>Themes</span>
            </NavLink>
            <NavLink to="/lists" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`}>
              <i className="fas fa-list"></i>
              <span>Lists</span>
            </NavLink>
            <button className="more-dropdown-item logout-item" id="logout-bottom-nav" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
