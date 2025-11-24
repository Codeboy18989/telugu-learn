import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fixAllMissingUserDocuments, fixSingleUserDocument } from '../../../utils/fixMissingUserDocuments';
import '../../../styles/dashboard.css';
import '../admin.css';

function SystemMaintenancePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [singleUserId, setSingleUserId] = useState('');
  const [singleUserData, setSingleUserData] = useState({
    email: '',
    displayName: '',
    role: 'school_admin',
    organizationId: ''
  });

  const handleFixAllUsers = async () => {
    if (!window.confirm(
      'This will scan all organizations and create missing user documents for B2B users. Continue?'
    )) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      const scanResults = await fixAllMissingUserDocuments();
      setResults(scanResults);
    } catch (err) {
      console.error('Error fixing user documents:', err);
      setError('Failed to fix user documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixSingleUser = async (e) => {
    e.preventDefault();

    if (!singleUserId.trim()) {
      setError('User ID is required');
      return;
    }

    if (!singleUserData.email.trim() || !singleUserData.organizationId.trim()) {
      setError('Email and Organization ID are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      const result = await fixSingleUserDocument(singleUserId, singleUserData);

      if (result.success) {
        setResults({
          scanned: 1,
          fixed: result.message === 'User document created successfully' ? 1 : 0,
          errors: []
        });
        // Clear form
        setSingleUserId('');
        setSingleUserData({
          email: '',
          displayName: '',
          role: 'school_admin',
          organizationId: ''
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fixing user document:', err);
      setError('Failed to fix user document: ' + err.message);
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

  return (
    <div className="dashboard-container admin-dashboard">
      {/* Header */}
      <header className="dashboard-header admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🔧 System Maintenance</h1>
          </div>
          <div className="header-actions">
            <button
              className="secondary-btn"
              onClick={() => navigate('/admin/dashboard')}
            >
              ← Back to Dashboard
            </button>
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="maintenance-container">
          <div className="alert-warning">
            <strong>⚠️ Warning:</strong> These tools are for fixing data inconsistencies.
            Use with caution and only when necessary.
          </div>

          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError('')} className="close-btn">
                ×
              </button>
            </div>
          )}

          {results && (
            <div className="success-message">
              <h3>✓ Maintenance Complete</h3>
              <p>Scanned: {results.scanned} users</p>
              <p>Fixed: {results.fixed} missing documents</p>
              {results.errors.length > 0 && (
                <div>
                  <p>Errors: {results.errors.length}</p>
                  <ul>
                    {results.errors.map((err, idx) => (
                      <li key={idx}>
                        User {err.userId}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Fix All Users */}
          <div className="card">
            <h2>Fix All Missing User Documents</h2>
            <p>
              Scans all organizations and creates missing user documents for B2B users
              (teachers and school admins). This fixes the "User data not found" error.
            </p>
            <button
              onClick={handleFixAllUsers}
              disabled={loading}
              className="primary-btn"
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Scanning...' : 'Scan & Fix All Users'}
            </button>
          </div>

          {/* Fix Single User */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2>Fix Single User Document</h2>
            <p>Manually create a user document for a specific user.</p>

            <form onSubmit={handleFixSingleUser} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>User ID (Firebase Auth UID)</label>
                <input
                  type="text"
                  value={singleUserId}
                  onChange={(e) => setSingleUserId(e.target.value)}
                  placeholder="e.g., klarPG8UzwfjmkmXqEOfop0Q6h73"
                  required
                />
                <small>The user ID from the error message</small>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={singleUserData.email}
                  onChange={(e) =>
                    setSingleUserData({ ...singleUserData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={singleUserData.displayName}
                  onChange={(e) =>
                    setSingleUserData({ ...singleUserData, displayName: e.target.value })
                  }
                  placeholder="John Doe"
                />
                <small>Optional - will use email if not provided</small>
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={singleUserData.role}
                  onChange={(e) =>
                    setSingleUserData({ ...singleUserData, role: e.target.value })
                  }
                  required
                >
                  <option value="teacher">Teacher</option>
                  <option value="school_admin">School Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Organization ID</label>
                <input
                  type="text"
                  value={singleUserData.organizationId}
                  onChange={(e) =>
                    setSingleUserData({
                      ...singleUserData,
                      organizationId: e.target.value
                    })
                  }
                  placeholder="Organization ID from Firestore"
                  required
                />
                <small>The organization this user belongs to</small>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-btn"
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Fixing...' : 'Fix User Document'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SystemMaintenancePage;
