import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllLogs,
  exportLogsToCSV,
  ACTIVITY_TYPES
} from '../../../services/activityLogService';
import { getAllOrganizations } from '../../../services/organizationService';
import '../../../styles/dashboard.css';
import '../admin.css';

function ActivityLogsPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    organizationId: '',
    action: '',
    limit: 50
  });

  const loadData = async () => {
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const activityLogs = await getAllLogs(filters);
      setLogs(activityLogs);
    } catch (err) {
      console.error('Error loading activity logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters, loadLogs]);

  const handleExport = async () => {
    try {
      const csv = await exportLogsToCSV(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError('Failed to export logs');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const getOrgName = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || orgId;
  };

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
            <h1>📝 Activity Logs</h1>
          </div>
          <div className="header-actions">
            <button className="primary-btn" onClick={handleExport}>
              📥 Export to CSV
            </button>
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

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-group">
            <label htmlFor="orgFilter">Organization:</label>
            <select
              id="orgFilter"
              value={filters.organizationId}
              onChange={(e) =>
                setFilters({ ...filters, organizationId: e.target.value })
              }
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            <label htmlFor="actionFilter">Action:</label>
            <select
              id="actionFilter"
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
            >
              <option value="">All Actions</option>
              {Object.entries(ACTIVITY_TYPES).map(([key, value]) => (
                <option key={value} value={value}>
                  {key.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <label htmlFor="limitFilter">Limit:</label>
            <select
              id="limitFilter"
              value={filters.limit}
              onChange={(e) =>
                setFilters({ ...filters, limit: parseInt(e.target.value) })
              }
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>

            <button
              className="reset-filters-btn"
              onClick={() =>
                setFilters({ organizationId: '', action: '', limit: 50 })
              }
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="loading-state">
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <h3>No Activity Logs</h3>
            <p>No activity has been recorded yet or no logs match your filters.</p>
          </div>
        ) : (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Organization</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="timestamp-cell">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>{getOrgName(log.organizationId)}</td>
                    <td className="user-cell">{log.userId.substring(0, 8)}...</td>
                    <td>
                      <span className={`role-badge ${log.userRole}`}>
                        {log.userRole}
                      </span>
                    </td>
                    <td>
                      <span className="action-badge">{log.action}</span>
                    </td>
                    <td className="details-cell">
                      {JSON.stringify(log.details).substring(0, 50)}
                      {JSON.stringify(log.details).length > 50 && '...'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              Showing {logs.length} log entries
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ActivityLogsPage;
