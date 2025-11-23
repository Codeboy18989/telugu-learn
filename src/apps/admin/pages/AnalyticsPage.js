import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getPlatformStats,
  getGrowthStats,
  getTopOrganizations
} from '../../../services/analyticsService';
import '../../../styles/dashboard.css';
import '../admin.css';

function AnalyticsPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState(null);
  const [growthStats, setGrowthStats] = useState(null);
  const [topOrgs, setTopOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState(30);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, growth, top] = await Promise.all([
        getPlatformStats(),
        getGrowthStats(timeframe),
        getTopOrganizations('totalStudents', 10)
      ]);

      setPlatformStats(stats);
      setGrowthStats(growth);
      setTopOrgs(top);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, loadAnalytics]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="dashboard-container admin-dashboard">
      {/* Header */}
      <header className="dashboard-header admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>📊 Platform Analytics</h1>
          </div>
          <div className="header-actions">
            <button
              className="secondary-btn"
              onClick={() => navigate('/admin/dashboard')}
            >
              ← Dashboard
            </button>
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

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
            <p>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Platform Overview */}
            <section className="analytics-section">
              <h2>Platform Overview</h2>
              <div className="stats-grid large">
                <div className="stat-card highlight">
                  <div className="stat-icon large">👥</div>
                  <div className="stat-info">
                    <p className="stat-value large">
                      {platformStats?.users.totalUsers || 0}
                    </p>
                    <p className="stat-label">Total Users</p>
                    <div className="stat-breakdown">
                      <span>
                        {platformStats?.users.totalConsumers || 0} Consumers
                      </span>
                      <span>
                        {(platformStats?.users.totalTeachers || 0) +
                          (platformStats?.users.totalSchoolAdmins || 0)}{' '}
                        B2B Users
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stat-card highlight">
                  <div className="stat-icon large">🏢</div>
                  <div className="stat-info">
                    <p className="stat-value large">
                      {platformStats?.organizations.totalOrganizations || 0}
                    </p>
                    <p className="stat-label">Organizations</p>
                    <div className="stat-breakdown">
                      <span>
                        {platformStats?.organizations.totalSchools || 0} Schools
                      </span>
                      <span>
                        {platformStats?.organizations.totalIndividualTeachers || 0}{' '}
                        Teachers
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stat-card highlight">
                  <div className="stat-icon large">🎓</div>
                  <div className="stat-info">
                    <p className="stat-value large">
                      {platformStats?.learners.totalLearners || 0}
                    </p>
                    <p className="stat-label">Total Learners</p>
                    <div className="stat-breakdown">
                      <span>
                        {platformStats?.learners.totalChildren || 0} Children (B2C)
                      </span>
                      <span>
                        {platformStats?.learners.totalStudents || 0} Students (B2B)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Growth Metrics */}
            <section className="analytics-section">
              <div className="section-header">
                <h2>Growth Metrics</h2>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  className="timeframe-selector"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>

              <div className="growth-grid">
                <div className="growth-card">
                  <div className="growth-header">
                    <span className="growth-icon">👥</span>
                    <span className="growth-label">New Consumers</span>
                  </div>
                  <div className="growth-value">
                    {growthStats?.newConsumers || 0}
                  </div>
                  <div className="growth-period">{growthStats?.period}</div>
                </div>

                <div className="growth-card">
                  <div className="growth-header">
                    <span className="growth-icon">👨‍🏫</span>
                    <span className="growth-label">New Teachers</span>
                  </div>
                  <div className="growth-value">
                    {growthStats?.newTeachers || 0}
                  </div>
                  <div className="growth-period">{growthStats?.period}</div>
                </div>

                <div className="growth-card">
                  <div className="growth-header">
                    <span className="growth-icon">🏢</span>
                    <span className="growth-label">New Organizations</span>
                  </div>
                  <div className="growth-value">
                    {growthStats?.newOrganizations || 0}
                  </div>
                  <div className="growth-period">{growthStats?.period}</div>
                </div>

                <div className="growth-card highlight">
                  <div className="growth-header">
                    <span className="growth-icon">📈</span>
                    <span className="growth-label">Total New Users</span>
                  </div>
                  <div className="growth-value">
                    {growthStats?.totalNewUsers || 0}
                  </div>
                  <div className="growth-period">{growthStats?.period}</div>
                </div>
              </div>
            </section>

            {/* Top Organizations */}
            <section className="analytics-section">
              <h2>Top 10 Organizations by Student Count</h2>

              {topOrgs.length === 0 ? (
                <div className="empty-state">
                  <p>No organizations yet</p>
                </div>
              ) : (
                <div className="top-orgs-list">
                  {topOrgs.map((org, index) => (
                    <div key={org.id} className="top-org-item">
                      <div className="org-rank">#{index + 1}</div>
                      <div className="org-info">
                        <h4>{org.name}</h4>
                        <span className="org-type">
                          {org.type === 'school' ? '🏫 School' : '👨‍🏫 Teacher'}
                        </span>
                      </div>
                      <div className="org-metrics">
                        <div className="metric">
                          <span className="metric-value">
                            {org.totalStudents || 0}
                          </span>
                          <span className="metric-label">Students</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">
                            {org.activeStudents || 0}
                          </span>
                          <span className="metric-label">Active</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">
                            {org.totalLessons || 0}
                          </span>
                          <span className="metric-label">Lessons</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* User Distribution */}
            <section className="analytics-section">
              <h2>User Distribution</h2>
              <div className="distribution-grid">
                <div className="distribution-card">
                  <h3>B2C (Consumers)</h3>
                  <div className="distribution-bar">
                    <div
                      className="distribution-fill consumer"
                      style={{
                        width: `${
                          platformStats?.users.totalUsers > 0
                            ? (platformStats.users.totalConsumers /
                                platformStats.users.totalUsers) *
                              100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                  <div className="distribution-stats">
                    <span className="count">
                      {platformStats?.users.totalConsumers || 0}
                    </span>
                    <span className="percentage">
                      {platformStats?.users.totalUsers > 0
                        ? Math.round(
                            (platformStats.users.totalConsumers /
                              platformStats.users.totalUsers) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                <div className="distribution-card">
                  <h3>B2B (Teachers & Schools)</h3>
                  <div className="distribution-bar">
                    <div
                      className="distribution-fill business"
                      style={{
                        width: `${
                          platformStats?.users.totalUsers > 0
                            ? ((platformStats.users.totalTeachers +
                                platformStats.users.totalSchoolAdmins) /
                                platformStats.users.totalUsers) *
                              100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                  <div className="distribution-stats">
                    <span className="count">
                      {(platformStats?.users.totalTeachers || 0) +
                        (platformStats?.users.totalSchoolAdmins || 0)}
                    </span>
                    <span className="percentage">
                      {platformStats?.users.totalUsers > 0
                        ? Math.round(
                            ((platformStats.users.totalTeachers +
                              platformStats.users.totalSchoolAdmins) /
                              platformStats.users.totalUsers) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AnalyticsPage;
