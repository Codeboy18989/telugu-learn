import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getChildren, getSharedChildren } from '../../../services/childService';
import ChildrenManagement from '../components/ChildrenManagement';
import ContentManagement from '../../../components/ContentManagement';
import Learning from '../../../components/Learning';
import '../../../styles/dashboard.css';
import '../consumer.css';

function ConsumerDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
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

  const tabs = [
    { label: '👨‍👩‍👧 My Children', icon: '👨‍👩‍👧' },
    { label: '📚 Content Library', icon: '📚' },
    { label: '🎓 Learn', icon: '🎓' }
  ];

  const allChildren = [...children, ...sharedChildren];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏠 Family Learning Dashboard</h1>
          <div className="header-actions">
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-btn ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {loading && activeTab === 0 ? (
          <div className="loading-state">
            <p>Loading children...</p>
          </div>
        ) : (
          <>
            {activeTab === 0 && (
              <ChildrenManagement
                children={children}
                sharedChildren={sharedChildren}
                onChildrenChange={loadChildren}
              />
            )}
            {activeTab === 1 && <ContentManagement />}
            {activeTab === 2 && (
              <Learning
                learners={allChildren}
                learnerType="child"
                parentId={currentUser?.uid}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ConsumerDashboard;
