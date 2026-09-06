import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<div className="main-layout"><h2>Dashboard Placeholder</h2></div>} />
          <Route path="/activities" element={<div>Activities Placeholder</div>} />
          <Route path="/goals" element={<div>Goals Placeholder</div>} />
          <Route path="/notes" element={<div>Notes Placeholder</div>} />
          <Route path="/reminders" element={<div>Reminders Placeholder</div>} />
          <Route path="/focus" element={<div>Focus Placeholder</div>} />
          <Route path="/themes" element={<div>Themes Placeholder</div>} />
          <Route path="/lists" element={<div>Lists Placeholder</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
