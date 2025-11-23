import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { addChild, deleteChild } from '../../../services/childService';
import InviteFriendsModal from './InviteFriendsModal';
import SharedAccessManager from './SharedAccessManager';

function ChildrenManagement({ children, sharedChildren, onChildrenChange }) {
  const { currentUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAccessManager, setShowAccessManager] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', ageGroup: '2-4' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChild.name.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await addChild(currentUser.uid, newChild);
      setNewChild({ name: '', ageGroup: '2-4' });
      setShowAddForm(false);
      onChildrenChange();
    } catch (err) {
      console.error('Error adding child:', err);
      setError('Failed to add child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm('Are you sure you want to delete this child profile? This will also delete all their progress.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteChild(currentUser.uid, childId);
      onChildrenChange();
    } catch (err) {
      console.error('Error deleting child:', err);
      setError('Failed to delete child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="learner-management">
      <div className="section-header">
        <h2>Manage Children</h2>
        <div className="header-actions">
          <button
            className="primary-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            ➕ Add Child
          </button>
          <button
            className="secondary-btn"
            onClick={() => setShowInviteModal(true)}
          >
            👥 Invite Friends
          </button>
          <button
            className="secondary-btn"
            onClick={() => setShowAccessManager(true)}
          >
            🔑 Manage Sharing
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {/* Add Child Form */}
      {showAddForm && (
        <div className="add-form-card">
          <h3>Add New Child</h3>
          <form onSubmit={handleAddChild}>
            <div className="form-group">
              <label htmlFor="childName">Name:</label>
              <input
                id="childName"
                type="text"
                value={newChild.name}
                onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                placeholder="Enter child's name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ageGroup">Age Group:</label>
              <select
                id="ageGroup"
                value={newChild.ageGroup}
                onChange={(e) => setNewChild({ ...newChild, ageGroup: e.target.value })}
                disabled={loading}
              >
                <option value="2-4">2-4 years</option>
                <option value="4+">4+ years</option>
                <option value="8+">8+ years</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Child'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setNewChild({ name: '', ageGroup: '2-4' });
                  setError('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Children */}
      <div className="learners-section">
        <h3>My Children ({children.length})</h3>
        {children.length === 0 ? (
          <div className="empty-state">
            <p>No children added yet. Click "Add Child" to get started!</p>
          </div>
        ) : (
          <div className="learners-grid">
            {children.map((child) => (
              <div key={child.id} className="learner-card">
                <div className="learner-info">
                  <h4>{child.name}</h4>
                  <p className="age-badge">{child.ageGroup} years</p>
                  <p className="created-date">
                    Added: {child.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div className="learner-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteChild(child.id)}
                    disabled={loading}
                    title="Delete child"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared with Me */}
      {sharedChildren.length > 0 && (
        <div className="learners-section shared-section">
          <h3>Shared with Me ({sharedChildren.length})</h3>
          <div className="learners-grid">
            {sharedChildren.map((child) => (
              <div key={`${child.ownerId}-${child.id}`} className="learner-card shared-card">
                <div className="shared-badge">👥 Shared</div>
                <div className="learner-info">
                  <h4>{child.name}</h4>
                  <p className="age-badge">{child.ageGroup} years</p>
                  <p className="owner-info">
                    Shared by: {child.ownerName || child.ownerEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          children={children}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Shared Access Manager */}
      {showAccessManager && (
        <SharedAccessManager
          children={children}
          onClose={() => setShowAccessManager(false)}
          onAccessChange={onChildrenChange}
        />
      )}
    </div>
  );
}

export default ChildrenManagement;
