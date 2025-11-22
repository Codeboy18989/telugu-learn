import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useModeLabels } from '../hooks/useModeLabels';
import LearnerManagement from '../components/LearnerManagement';
import ContentManagement from '../components/ContentManagement';
import Learning from '../components/Learning';
import '../styles/dashboard.css';

function Dashboard() {
  const { logout, isSuperAdmin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const labels = useModeLabels();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('learners');

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{labels.dashboardTitle} {isSuperAdmin && <span className="admin-badge">SUPER ADMIN</span>}</h1>
          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'learners' ? 'active' : ''}`}
          onClick={() => setActiveTab('learners')}
        >
          {labels.tab1}
        </button>
        <button
          className={`nav-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          {labels.tab2}
        </button>
        <button
          className={`nav-tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          {labels.tab3}
        </button>
      </nav>

      <main>
        {activeTab === 'learners' && <LearnerManagement />}
        {activeTab === 'content' && <ContentManagement />}
        {activeTab === 'learn' && <Learning />}
      </main>
    </div>
  );
}

export default Dashboard;
