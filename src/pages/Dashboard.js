import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KidManagement from '../components/KidManagement';
import ContentManagement from '../components/ContentManagement';
import Learning from '../components/Learning';
import '../styles/dashboard.css';

function Dashboard() {
  const { logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('kids');

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
          <h1>తెలుగు Learn {isSuperAdmin && <span className="admin-badge">SUPER ADMIN</span>}</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'kids' ? 'active' : ''}`}
          onClick={() => setActiveTab('kids')}
        >
          👶 My Kids
        </button>
        <button
          className={`nav-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📚 Content Library
        </button>
        <button
          className={`nav-tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          🎓 Learn
        </button>
      </nav>

      <main>
        {activeTab === 'kids' && <KidManagement />}
        {activeTab === 'content' && <ContentManagement />}
        {activeTab === 'learn' && <Learning />}
      </main>
    </div>
  );
}

export default Dashboard;
