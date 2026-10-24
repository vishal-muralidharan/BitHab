import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Page imports
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Goals from './pages/Goals';
import Notes from './pages/Notes';
import Reminders from './pages/Reminders';
import Focus from './pages/Focus';
import Themes from './pages/Themes';
import Lists from './pages/Lists';
import Login from './pages/Login';
import Register from './pages/Register';
import Analytics from './pages/Analytics';
import DeepFocus from './pages/DeepFocus';
import ScheduleActivities from './pages/ScheduleActivities';
import SettingsPage from './pages/Settings';
import DPDPPage from './pages/DPDP';
import PrivacyPage from './pages/Privacy';
import TermsPage from './pages/Terms';
import TermsAndConditionsPage from './pages/TermsAndConditions';
import PublicLegalLayout from './components/layout/PublicLegalLayout';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ActivityProvider } from './context/ActivityContext';
import { GoalProvider } from './context/GoalContext';
import { NoteProvider } from './context/NoteContext';
import { ReminderProvider } from './context/ReminderContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { ListProvider } from './context/ListContext';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary, #ffffff)',
        color: 'var(--text-secondary, #666666)'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <ActivityProvider>
        <GoalProvider>
          <NoteProvider>
            <ReminderProvider>
              <ScheduleProvider>
                <ListProvider>
                  <ThemeProvider>
                    <BrowserRouter>
          <Routes>
            {/* Auth routes without Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public Legal routes with PublicLegalLayout */}
            <Route path="/privacy" element={<PublicLegalLayout><PrivacyPage /></PublicLegalLayout>} />
            <Route path="/terms" element={<PublicLegalLayout><TermsPage /></PublicLegalLayout>} />
            <Route path="/terms-and-conditions" element={<PublicLegalLayout><TermsAndConditionsPage /></PublicLegalLayout>} />
            
            <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/focus" element={<Focus />} />
                  <Route path="/themes" element={<Themes />} />
                  <Route path="/lists" element={<Lists />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/deep-focus" element={<DeepFocus />} />
                  <Route path="/schedule-activities" element={<ScheduleActivities />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/dpdp" element={<DPDPPage />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
                    </BrowserRouter>
                  </ThemeProvider>
                </ListProvider>
              </ScheduleProvider>
            </ReminderProvider>
          </NoteProvider>
        </GoalProvider>
      </ActivityProvider>
    </AuthProvider>
  );
}

export default App;
