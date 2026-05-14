import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyPlansPage from './pages/MyPlansPage';
import CreatePlanPage from './pages/CreatePlanPage';
import DiscoverPage from './pages/DiscoverPage';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/my-plans" element={<MyPlansPage />} />
          <Route path="/create-plan" element={<CreatePlanPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
