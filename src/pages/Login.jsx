import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <header className="header">
        <h1 className="logo">
          <img src="/assets/images/logo-transparent-light.png" alt="BitHab Logo" className="logo-light" />
          <img src="/assets/images/logo-transparent-dark.png" alt="BitHab Logo" className="logo-dark" />
        </h1>
        <button id="theme-toggle" className="header-btn theme-toggle-btn" aria-label="Toggle dark/light mode" onClick={toggleDarkMode}>
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </header>
      <div id="auth-container">
        <div className="auth-form-wrapper">
          <h2 className="auth-title">
            <i id="auth-title-icon" className="fas fa-lock icon-prefix" aria-hidden="true"></i>
            <span id="auth-title-text">Login</span>
          </h2>
          {error && <div className="error-message" style={{ display: 'block' }}>{error}</div>}

          <div id="login-view">
            <button id="google-signin-btn" className="google-signin-btn">
                <img src="/assets/images/google-logo.svg" alt="Google" className="google-logo" />
                Continue with Google
            </button>
            
            <div className="auth-divider">
                <span>or</span>
            </div>
            
            <form id="login-form" onSubmit={handleSubmit}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  required 
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required 
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                  <i className="fas fa-lock icon-prefix" aria-hidden="true"></i>
                  <span>Login</span>
                </button>
            </form>
            <p className="auth-helper"><a href="#">Forgot your password?</a></p>
            <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
