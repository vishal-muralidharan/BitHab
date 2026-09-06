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

import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes without Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
