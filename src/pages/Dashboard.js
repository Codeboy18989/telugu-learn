import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/dashboard.css';

function Dashboard() {
  const { logout, userRole, organizationBranding } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
          <h1>
            {organizationBranding?.appName || 'తెలుగు Learn'} - Business Dashboard
          </h1>
          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => navigate('/business/settings')} className="settings-btn" title="Settings">
              ⚙️
            </button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2>Welcome {userRole === 'teacher' ? 'Teacher' : 'School Admin'}!</h2>
          <p style={{ marginTop: '1rem', color: '#666' }}>
            The B2B Business Dashboard is currently under development.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Coming Soon:</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
              <li>📚 Manage Students</li>
              <li>📊 View Reports & Analytics</li>
              <li>🎯 Track Student Progress</li>
              <li>✏️ Create Assignments</li>
              <li>⚙️ Organization Settings</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
