import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const isMoreActive = ['/notes', '/focus', '/themes', '/lists'].includes(location.pathname);

  // Close dropdown on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;

    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [moreOpen]);

  async function handleLogout() {
    try {
      setMoreOpen(false);
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
        <div 
          ref={moreRef}
          className={`bottom-nav-item more-bottom-nav ${isMoreActive ? 'active' : ''} ${moreOpen ? 'open' : ''}`}
          onClick={() => setMoreOpen(prev => !prev)}
          role="button"
          tabIndex={0}
          aria-expanded={moreOpen}
          aria-label="More navigation options"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setMoreOpen(prev => !prev);
            }
          }}
        >
          <i className="fas fa-ellipsis-h bottom-nav-icon"></i>
          <span className="bottom-nav-label">More</span>
          <div className="more-bottom-dropdown" onClick={(e) => e.stopPropagation()}>
            <NavLink to="/notes" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`} onClick={() => setMoreOpen(false)}>
              <i className="fas fa-sticky-note"></i>
              <span>Notes</span>
            </NavLink>
            <NavLink to="/focus" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`} onClick={() => setMoreOpen(false)}>
              <i className="fas fa-clock"></i>
              <span>Focus</span>
            </NavLink>
            <NavLink to="/themes" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`} onClick={() => setMoreOpen(false)}>
              <i className="fas fa-palette"></i>
              <span>Themes</span>
            </NavLink>
            <NavLink to="/lists" className={({ isActive }) => `more-dropdown-item ${isActive ? 'active' : ''}`} onClick={() => setMoreOpen(false)}>
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
