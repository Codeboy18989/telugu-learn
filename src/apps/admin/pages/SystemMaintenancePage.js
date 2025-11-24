import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fixAllMissingUserDocuments } from '../../../utils/fixMissingUserDocuments';
import { autoRecoverUsersCollection, createUserDocumentManual } from '../../../utils/rebuildUsersCollection';
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
    role: 'consumer',
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

    if (!singleUserData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Validate organization ID for B2B users
    if ((singleUserData.role === 'teacher' || singleUserData.role === 'school_admin') && !singleUserData.organizationId.trim()) {
      setError('Organization ID is required for B2B users (teachers/school admins)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      // Use createUserDocumentManual which handles all user types
      const result = await createUserDocumentManual(singleUserId, singleUserData);

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
          role: 'consumer',
          organizationId: ''
        });
      } else {
        setError(result.error || result.message);
      }
    } catch (err) {
      console.error('Error fixing user document:', err);
      setError('Failed to fix user document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverUsers = async () => {
    if (!window.confirm(
      'IMPORTANT: This will rebuild the entire users collection from organizations and consumer profiles.\n\n' +
      'This should only be used if you accidentally deleted the users collection.\n\n' +
      'Are you sure you want to continue?'
    )) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);

      const recoveryResults = await autoRecoverUsersCollection();

      setResults({
        scanned: recoveryResults.scanned,
        fixed: recoveryResults.created,
        errors: recoveryResults.errors
      });
    } catch (err) {
      console.error('Error recovering users:', err);
      setError('Failed to recover users: ' + err.message);
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

          {/* EMERGENCY: Rebuild Users Collection */}
          <div className="card" style={{ borderColor: '#dc3545', borderWidth: '2px' }}>
            <h2 style={{ color: '#dc3545' }}>🚨 EMERGENCY: Recover Deleted Users Collection</h2>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Use this ONLY if you accidentally deleted the entire users collection!</strong>
            </p>
            <p>
              This tool will scan your organizations and consumer profiles to rebuild the users collection.
              It will:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Scan all organizations for B2B users (teachers/school admins)</li>
              <li>Scan consumer profiles for B2C users</li>
              <li>Recreate user documents with correct roles and organization links</li>
              <li>Set the oldest user as super admin</li>
            </ul>
            <p style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>Note:</strong> Consumer emails may not be fully recovered (they'll get placeholder emails).
              You'll need to manually update them or have users contact support.
            </p>
            <button
              onClick={handleRecoverUsers}
              disabled={loading}
              className="primary-btn"
              style={{ marginTop: '1rem', backgroundColor: '#dc3545' }}
            >
              {loading ? 'Recovering...' : '🚨 Rebuild Users Collection'}
            </button>
          </div>

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
                  <option value="consumer">Consumer (B2C)</option>
                  <option value="teacher">Teacher</option>
                  <option value="school_admin">School Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {(singleUserData.role === 'teacher' || singleUserData.role === 'school_admin') && (
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
                  <small>The organization this user belongs to (required for B2B users)</small>
                </div>
              )}

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
