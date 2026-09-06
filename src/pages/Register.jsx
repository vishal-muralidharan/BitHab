import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
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
            <i className="fas fa-user icon-prefix" aria-hidden="true"></i>
            <span>Register</span>
          </h2>
          {error && <div className="error-message" style={{ display: 'block' }}>{error}</div>}

          <button id="google-signin-btn" className="google-signin-btn">
              <img src="/assets/images/google-logo.svg" alt="Google" className="google-logo" />
              Continue with Google
          </button>
          
          <div className="auth-divider">
              <span>or</span>
          </div>
          
          <form id="register-form" onSubmit={handleSubmit}>
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
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Confirm Password" 
                required 
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                <i className="fas fa-user icon-prefix" aria-hidden="true"></i>
                <span>Register</span>
              </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}
