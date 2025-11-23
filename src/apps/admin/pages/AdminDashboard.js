import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getPlatformStats } from '../../../services/analyticsService';
import { getRecentActivity } from '../../../services/activityLogService';
import { useNavigate } from 'react-router-dom';
import '../../../styles/dashboard.css';
import '../admin.css';

function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [platformStats, activity] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(10)
      ]);

      setStats(platformStats);
      setRecentActivity(activity);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-container admin-dashboard">
      {/* Header */}
      <header className="dashboard-header admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🔐 Super Admin Portal</h1>
            <span className="admin-badge">SUPER ADMIN</span>
          </div>
          <div className="header-actions">
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-card primary"
          onClick={() => navigate('/admin/create-organization')}
        >
          <span className="action-icon">🏢</span>
          <span className="action-label">Create Organization</span>
        </button>
        <button
          className="action-card"
          onClick={() => navigate('/admin/organizations')}
        >
          <span className="action-icon">📋</span>
          <span className="action-label">Manage Organizations</span>
        </button>
        <button
          className="action-card"
          onClick={() => navigate('/admin/analytics')}
        >
          <span className="action-icon">📊</span>
          <span className="action-label">Analytics</span>
        </button>
        <button
          className="action-card"
          onClick={() => navigate('/admin/activity-logs')}
        >
          <span className="action-icon">📝</span>
          <span className="action-label">Activity Logs</span>
        </button>
        <button
          className="action-card"
          onClick={() => navigate('/admin/content')}
        >
          <span className="action-icon">📚</span>
          <span className="action-label">Content Management</span>
        </button>
      </div>

      <main className="dashboard-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading platform statistics...</p>
          </div>
        ) : (
          <>
            {/* Platform Statistics */}
            <section className="stats-section">
              <h2>Platform Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <p className="stat-label">Total Users</p>
                    <p className="stat-value">{stats?.users.totalUsers || 0}</p>
                    <p className="stat-detail">
                      {stats?.users.totalConsumers || 0} Consumers |{' '}
                      {(stats?.users.totalTeachers || 0) +
                        (stats?.users.totalSchoolAdmins || 0)}{' '}
                      B2B
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-info">
                    <p className="stat-label">Organizations</p>
                    <p className="stat-value">
                      {stats?.organizations.totalOrganizations || 0}
                    </p>
                    <p className="stat-detail">
                      {stats?.organizations.activeOrganizations || 0} Active
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-info">
                    <p className="stat-label">Total Learners</p>
                    <p className="stat-value">
                      {stats?.learners.totalLearners || 0}
                    </p>
                    <p className="stat-detail">
                      {stats?.learners.totalChildren || 0} Children |{' '}
                      {stats?.learners.totalStudents || 0} Students
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <p className="stat-label">Content Items</p>
                    <p className="stat-value">
                      {stats?.activity.totalContentCreated || 0}
                    </p>
                    <p className="stat-detail">Telugu learning content</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Organization Breakdown */}
            <section className="breakdown-section">
              <h2>Organization Breakdown</h2>
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <div className="breakdown-header">
                    <span className="breakdown-icon">🏫</span>
                    <span className="breakdown-label">Schools</span>
                  </div>
                  <div className="breakdown-value">
                    {stats?.organizations.totalSchools || 0}
                  </div>
                </div>

                <div className="breakdown-card">
                  <div className="breakdown-header">
                    <span className="breakdown-icon">👨‍🏫</span>
                    <span className="breakdown-label">Individual Teachers</span>
                  </div>
                  <div className="breakdown-value">
                    {stats?.organizations.totalIndividualTeachers || 0}
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="activity-section">
              <div className="section-header">
                <h2>Recent Activity</h2>
                <button
                  className="view-all-btn"
                  onClick={() => navigate('/admin/activity-logs')}
                >
                  View All →
                </button>
              </div>

              {recentActivity.length === 0 ? (
                <div className="empty-state">
                  <p>No recent activity to display</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="activity-info">
                        <p className="activity-action">
                          <strong>{formatAction(activity.action)}</strong>
                        </p>
                        <p className="activity-details">
                          {activity.userRole} in organization{' '}
                          {activity.organizationId}
                        </p>
                      </div>
                      <div className="activity-time">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// Helper function to get activity icon
function getActivityIcon(action) {
  const icons = {
    login: '🔐',
    logout: '🚪',
    add_student: '➕',
    delete_student: '🗑️',
    update_student: '✏️',
    complete_lesson: '✅',
    create_content: '📝',
    delete_content: '🗑️',
    update_settings: '⚙️',
    generate_report: '📄',
    update_branding: '🎨'
  };
  return icons[action] || '📌';
}

// Helper function to format action names
function formatAction(action) {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default AdminDashboard;
