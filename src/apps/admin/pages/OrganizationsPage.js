import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllOrganizations,
  updateOrganizationStatus,
  ORG_STATUS,
  ORG_TYPES
} from '../../../services/organizationService';
import { getStudentCount } from '../../../services/studentService';
import '../../../styles/dashboard.css';
import '../admin.css';

function OrganizationsPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [orgStats, setOrgStats] = useState({});

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [organizations, filters]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await getAllOrganizations();

      // Load student counts for each org
      const stats = {};
      for (const org of orgs) {
        try {
          const count = await getStudentCount(org.id);
          stats[org.id] = { studentCount: count };
        } catch (err) {
          stats[org.id] = { studentCount: 0 };
        }
      }

      setOrganizations(orgs);
      setOrgStats(stats);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...organizations];

    if (filters.type) {
      filtered = filtered.filter((org) => org.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((org) => org.status === filters.status);
    }

    setFilteredOrgs(filtered);
  };

  const handleStatusChange = async (orgId, newStatus) => {
    const org = organizations.find((o) => o.id === orgId);
    const actionText =
      newStatus === ORG_STATUS.ACTIVE ? 'activate' : 'suspend';

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} "${org?.name}"? ${
          newStatus === ORG_STATUS.SUSPENDED
            ? 'This will prevent all users from accessing this organization.'
            : ''
        }`
      )
    ) {
      return;
    }

    try {
      await updateOrganizationStatus(orgId, newStatus);
      setSuccess(
        `Organization ${
          newStatus === ORG_STATUS.ACTIVE ? 'activated' : 'suspended'
        } successfully`
      );
      loadOrganizations();
    } catch (err) {
      console.error('Error updating organization status:', err);
      setError('Failed to update organization status');
    }
  };

  const handleViewOrganization = (orgId) => {
    // Navigate to organization details (to be implemented)
    navigate(`/admin/organizations/${orgId}`);
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
            <h1>🏢 Organizations Management</h1>
          </div>
          <div className="header-actions">
            <button
              className="primary-btn"
              onClick={() => navigate('/admin/create-organization')}
            >
              ➕ Create Organization
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

        {success && (
          <div className="success-message">
            {success}
            <button onClick={() => setSuccess('')} className="close-btn">
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-group">
            <label htmlFor="typeFilter">Type:</label>
            <select
              id="typeFilter"
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value })
              }
            >
              <option value="">All Types</option>
              <option value={ORG_TYPES.SCHOOL}>Schools</option>
              <option value={ORG_TYPES.INDIVIDUAL_TEACHER}>
                Individual Teachers
              </option>
            </select>

            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Status</option>
              <option value={ORG_STATUS.ACTIVE}>Active</option>
              <option value={ORG_STATUS.SUSPENDED}>Suspended</option>
              <option value={ORG_STATUS.INACTIVE}>Inactive</option>
            </select>

            <button
              className="reset-filters-btn"
              onClick={() => setFilters({ type: '', status: '' })}
            >
              Reset Filters
            </button>
          </div>

          <div className="results-count">
            Showing {filteredOrgs.length} of {organizations.length}{' '}
            organizations
          </div>
        </div>

        {/* Organizations List */}
        {loading ? (
          <div className="loading-state">
            <p>Loading organizations...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="empty-state">
            <h3>No Organizations Found</h3>
            <p>
              {organizations.length === 0
                ? 'Create your first organization to get started.'
                : 'No organizations match your filters.'}
            </p>
            {organizations.length === 0 && (
              <button
                className="primary-btn"
                onClick={() => navigate('/admin/create-organization')}
              >
                Create Organization
              </button>
            )}
          </div>
        ) : (
          <div className="organizations-list">
            {filteredOrgs.map((org) => (
              <div key={org.id} className="organization-card">
                <div className="org-header">
                  <div className="org-main-info">
                    <h3>{org.name}</h3>
                    <div className="org-badges">
                      <span className={`type-badge ${org.type}`}>
                        {org.type === ORG_TYPES.SCHOOL ? '🏫 School' : '👨‍🏫 Teacher'}
                      </span>
                      <span className={`status-badge ${org.status}`}>
                        {org.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="org-body">
                  <div className="org-stats-row">
                    <div className="org-stat">
                      <span className="stat-label">Students:</span>
                      <span className="stat-value">
                        {orgStats[org.id]?.studentCount || 0} /{' '}
                        {org.subscription?.maxStudents || 50}
                      </span>
                    </div>
                    <div className="org-stat">
                      <span className="stat-label">Plan:</span>
                      <span className="stat-value">
                        {org.subscription?.plan || 'trial'}
                      </span>
                    </div>
                    <div className="org-stat">
                      <span className="stat-label">Created:</span>
                      <span className="stat-value">
                        {org.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {org.branding?.appName && (
                    <div className="org-branding-preview">
                      <span className="branding-label">App Name:</span>
                      <span className="branding-value">{org.branding.appName}</span>
                    </div>
                  )}
                </div>

                <div className="org-actions">
                  <button
                    className="view-btn"
                    onClick={() => handleViewOrganization(org.id)}
                  >
                    👁️ View Details
                  </button>
                  {org.status === ORG_STATUS.ACTIVE ? (
                    <button
                      className="suspend-btn"
                      onClick={() =>
                        handleStatusChange(org.id, ORG_STATUS.SUSPENDED)
                      }
                    >
                      ⏸️ Suspend
                    </button>
                  ) : (
                    <button
                      className="activate-btn"
                      onClick={() =>
                        handleStatusChange(org.id, ORG_STATUS.ACTIVE)
                      }
                    >
                      ▶️ Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizationsPage;
