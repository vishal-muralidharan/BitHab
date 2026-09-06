import { Link } from 'react-router-dom';

export default function MobileTopbar() {
  return (
    <div className="mobile-topbar">
      <Link to="/" className="logo-link">
        <h1 className="logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
        </h1>
      </Link>
      <button id="mobile-theme-toggle" className="theme-toggle-btn" aria-label="Toggle dark/light mode">
        <i className="fas fa-moon"></i>
      </button>
    </div>
  );
}
