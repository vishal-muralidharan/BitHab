import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
        <Link to="/" className="bottom-nav-item">
          <i className="fas fa-home bottom-nav-icon"></i>
          <span className="bottom-nav-label">Home</span>
        </Link>
        <Link to="/activities" className="bottom-nav-item">
          <i className="fas fa-chart-line bottom-nav-icon"></i>
          <span className="bottom-nav-label">Activities</span>
        </Link>
        <Link to="/goals" className="bottom-nav-item">
          <i className="fas fa-bullseye bottom-nav-icon"></i>
          <span className="bottom-nav-label">Goals</span>
        </Link>
        <Link to="/reminders" className="bottom-nav-item">
          <i className="fas fa-bell bottom-nav-icon"></i>
          <span className="bottom-nav-label">Reminders</span>
        </Link>
        <div className="bottom-nav-item more-bottom-nav">
          <i className="fas fa-ellipsis-h bottom-nav-icon"></i>
          <span className="bottom-nav-label">More</span>
          <div className="more-bottom-dropdown">
            <Link to="/notes" className="more-dropdown-item">
              <i className="fas fa-sticky-note"></i>
              <span>Notes</span>
            </Link>
            <Link to="/focus" className="more-dropdown-item">
              <i className="fas fa-clock"></i>
              <span>Focus</span>
            </Link>
            <Link to="/themes" className="more-dropdown-item">
              <i className="fas fa-palette"></i>
              <span>Themes</span>
            </Link>
            <Link to="/lists" className="more-dropdown-item">
              <i className="fas fa-list"></i>
              <span>Lists</span>
            </Link>
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
