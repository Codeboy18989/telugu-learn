import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/settings.css';

function Settings() {
  const navigate = useNavigate();
  const { currentUser, userRole, logout, isConsumer, isSuperAdmin, isB2BUser } = useAuth();
  const [message, setMessage] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
      setMessage('❌ Failed to logout. Please try again.');
    }
  };

  const getRoleName = () => {
    if (isConsumer) return 'Consumer';
    if (isSuperAdmin) return 'Super Admin';
    if (isB2BUser) return userRole === 'teacher' ? 'Teacher' : 'School Admin';
    return 'User';
  };

  const getDashboardPath = () => {
    if (isConsumer) return '/consumer/dashboard';
    if (isSuperAdmin) return '/admin/dashboard';
    if (isB2BUser) return '/business/dashboard';
    return '/';
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={() => navigate(getDashboardPath())} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1>⚙️ Settings</h1>
        </div>

        <div className="settings-content">
          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <section className="settings-section">
            <h2>Account Information</h2>
            <div className="info-card">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{currentUser?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className="info-value">{getRoleName()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">User ID:</span>
                <span className="info-value code">{currentUser?.uid}</span>
              </div>
            </div>
          </section>

          {isConsumer && (
            <section className="settings-section">
              <h2>Consumer Features</h2>
              <div className="info-card">
                <p>Manage your children's learning profiles, invite friends and family, and track progress.</p>
                <button
                  className="primary-btn"
                  onClick={() => navigate('/consumer/dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>
            </section>
          )}

          {isSuperAdmin && (
            <section className="settings-section">
              <h2>Admin Features</h2>
              <div className="info-card">
                <p>Manage organizations, view analytics, and access system maintenance tools.</p>
                <div className="button-group">
                  <button
                    className="primary-btn"
                    onClick={() => navigate('/admin/organizations')}
                  >
                    Manage Organizations
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => navigate('/admin/maintenance')}
                  >
                    System Maintenance
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="settings-section danger-zone">
            <h2>Account Actions</h2>
            <div className="info-card">
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
