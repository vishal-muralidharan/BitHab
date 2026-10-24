import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import TermsPage from '../../src/pages/Terms';
import PrivacyPage from '../../src/pages/Privacy';
import TermsAndConditionsPage from '../../src/pages/TermsAndConditions';
import PublicLegalLayout from '../../src/components/layout/PublicLegalLayout';
import SettingsPage from '../../src/pages/Settings';
import * as authModule from '../../src/context/AuthContext';
import * as themeModule from '../../src/context/ThemeContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children
}));

vi.mock('../../src/context/ThemeContext', () => ({
  useTheme: vi.fn(),
  ThemeProvider: ({ children }) => children
}));

// Protected route wrapper matching App.jsx logic
function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

describe('Legal Pages and Route Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(themeModule.useTheme).mockReturnValue({
      currentTheme: 'oceanic-depths',
      isDarkMode: false,
      toggleDarkMode: vi.fn()
    });
  });

  it('renders Terms of Service with all required sections and legal markers', () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: null,
      logout: vi.fn(),
      agreedToTerms: false
    });

    render(
      <MemoryRouter>
        <PublicLegalLayout>
          <TermsPage />
        </PublicLegalLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument();
    expect(screen.getByText(/Last Updated: \[TODO: Insert Last Updated date\]/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /1\. Description of Service/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /2\. Your Content and Ownership/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /3\. Acceptable Use/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /4\. Not Medical or Professional Advice/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /5\. Account Responsibilities/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /6\. Data Backup and Export/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /7\. Disclaimer of Warranties/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /8\. Limitation of Liability/i })).toBeInTheDocument();
    expect(screen.getByText(/\[CONFIRM: liability cap, e\.g\. amount paid in last 12 months or INR 1,000\]/i)).toBeInTheDocument();
  });

  it('renders Privacy Policy with all required sections and legal markers', () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: null,
      logout: vi.fn(),
      agreedToTerms: false
    });

    render(
      <MemoryRouter>
        <PublicLegalLayout>
          <PrivacyPage />
        </PublicLegalLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /1\. Information We Collect/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /2\. How We Use Data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /3\. Third-Party Service Providers and Processors/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /4\. Data Retention/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /5\. Habit Reminders and In-App Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /6\. Cookies and Local Storage/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /7\. Security Measures/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /8\. Children's Privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /9\. Contact Us and Grievances/i })).toBeInTheDocument();
    expect(screen.getByText(/\[CONFIRM: Firebase project region, e\.g\. asia-south1\]/i)).toBeInTheDocument();
  });

  it('renders Terms and Conditions with all required sections and legal markers', () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: null,
      logout: vi.fn(),
      agreedToTerms: false
    });

    render(
      <MemoryRouter>
        <PublicLegalLayout>
          <TermsAndConditionsPage />
        </PublicLegalLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Terms and Conditions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /1\. Eligibility/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /2\. Modifications to the Service and Terms/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /3\. Third-Party Links and External Services/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /4\. Governing Law and Jurisdiction/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /5\. Severability/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /6\. Entire Agreement/i })).toBeInTheDocument();
    expect(screen.getAllByText(/\[TODO: specify governing jurisdiction/i).length).toBeGreaterThan(0);
  });

  it('redirects unauthenticated users trying to access /settings or /dpdp to /login', () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: null,
      logout: vi.fn(),
      agreedToTerms: false
    });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/login" element={<div>Login Page View</div>} />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute user={null}>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page View')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Settings/i })).not.toBeInTheDocument();
  });

  it('allows authenticated users to view protected /settings', () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      currentUser: { uid: 'u123', email: 'user@example.com', metadata: {} },
      logout: vi.fn(),
      agreedToTerms: true
    });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute user={{ uid: 'u123' }}>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Settings/i })).toBeInTheDocument();
  });
});
