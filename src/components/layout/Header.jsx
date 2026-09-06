import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo-link">
        <h1 className="logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
        </h1>
      </Link>
      <nav className="header-nav">
        <Link to="/activities" className="nav-item">Activities</Link>
        <Link to="/goals" className="nav-item">Goals</Link>
        <Link to="/notes" className="nav-item">Notes</Link>
        <Link to="/reminders" className="nav-item">Reminders</Link>
        <Link to="/focus" className="nav-item">Focus</Link>
        <div className="more-dropdown">
          <button className="more-btn nav-item" aria-label="More options">More</button>
          <div className="more-dropdown-content">
            <Link to="/themes">Themes</Link>
            <Link to="/lists">Lists</Link>
          </div>
        </div>
      </nav>
      <div className="header-actions">
        <button id="theme-toggle" className="header-btn theme-toggle-btn" aria-label="Toggle dark/light mode">
          <i className="fas fa-moon"></i>
        </button>
        <button id="logout-btn" className="header-btn" aria-label="Logout">Logout</button>
      </div>
    </header>
  );
}
