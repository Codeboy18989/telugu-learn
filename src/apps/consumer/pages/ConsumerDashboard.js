import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getChildren, getSharedChildren } from '../../../services/childService';
import ChildrenManagement from '../components/ChildrenManagement';
import ContentManagement from '../../../components/ContentManagement';
import ConsumerLearning from '../components/ConsumerLearning';
import '../../../styles/dashboard.css';
import '../consumer.css';

function ConsumerDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('children');
  const [children, setChildren] = useState([]);
  const [sharedChildren, setSharedChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [ownChildren, shared] = await Promise.all([
        getChildren(currentUser.uid),
        getSharedChildren(currentUser.uid)
      ]);

      setChildren(ownChildren);
      setSharedChildren(shared);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const allChildren = [...children, ...sharedChildren];

  return (
    <div className="consumer-dashboard">
      {/* Simple Header */}
      <header className="consumer-header">
        <div className="header-container">
          <div className="header-left">
            <h1 className="app-title">తెలుగు Learn</h1>
          </div>
          <div className="header-right">
            <button
              className="nav-button"
              onClick={() => navigate('/consumer/invitations')}
              title="View invitations"
            >
              📬 Invitations
            </button>
            <span className="user-email">{currentUser?.email}</span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Simple Navigation */}
      <nav className="consumer-nav">
        <div className="nav-container">
          <button
            className={`nav-tab ${activeTab === 'children' ? 'active' : ''}`}
            onClick={() => setActiveTab('children')}
          >
            <span className="nav-icon">👨‍👩‍👧</span>
            <span>My Children</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            <span className="nav-icon">🎓</span>
            <span>Learn</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <span className="nav-icon">📚</span>
            <span>Content Library</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="consumer-main">
        <div className="content-container">
          {loading && activeTab === 'children' ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your children...</p>
            </div>
          ) : (
            <>
              {activeTab === 'children' && (
                <ChildrenManagement
                  children={children}
                  sharedChildren={sharedChildren}
                  onChildrenChange={loadChildren}
                />
              )}
              {activeTab === 'learn' && (
                <ConsumerLearning children={allChildren} />
              )}
              {activeTab === 'library' && <ContentManagement />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ConsumerDashboard;
