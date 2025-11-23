import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  getSharedAccessList,
  revokeAccess,
  updateSharedChildren
} from '../../../services/childService';

function SharedAccessManager({ children, onClose, onAccessChange }) {
  const { currentUser } = useAuth();
  const [sharedAccessList, setSharedAccessList] = useState([]);
  const [editingAccess, setEditingAccess] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSharedAccessList = useCallback(async () => {
    try {
      setLoading(true);
      const accessList = await getSharedAccessList(currentUser.uid);
      setSharedAccessList(accessList);
    } catch (err) {
      console.error('Error loading shared access list:', err);
      setError('Failed to load shared access list');
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid]);

  useEffect(() => {
    loadSharedAccessList();
  }, [loadSharedAccessList]);

  const handleRevokeAccess = async (partnerId, partnerEmail) => {
    if (
      !window.confirm(
        `Are you sure you want to revoke access for ${partnerEmail}? They will no longer be able to see any of your children's profiles.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await revokeAccess(currentUser.uid, partnerId);
      setSuccess(`Access revoked for ${partnerEmail}`);
      loadSharedAccessList();
      onAccessChange();
    } catch (err) {
      console.error('Error revoking access:', err);
      setError('Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccess = (access) => {
    setEditingAccess(access.id);
    setSelectedChildren(access.childrenIds || []);
    setError('');
    setSuccess('');
  };

  const handleToggleChild = (childId) => {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const handleUpdateAccess = async (partnerId, partnerEmail) => {
    if (selectedChildren.length === 0) {
      setError('Please select at least one child to share');
      return;
    }

    try {
      setLoading(true);
      await updateSharedChildren(currentUser.uid, partnerId, selectedChildren);
      setSuccess(`Updated shared children for ${partnerEmail}`);
      setEditingAccess(null);
      loadSharedAccessList();
      onAccessChange();
    } catch (err) {
      console.error('Error updating shared children:', err);
      setError('Failed to update shared children');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAccess(null);
    setSelectedChildren([]);
    setError('');
  };

  const getChildrenNames = (childrenIds) => {
    return children
      .filter((child) => childrenIds.includes(child.id))
      .map((child) => child.name)
      .join(', ');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔑 Manage Shared Access</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
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

          {loading && !editingAccess ? (
            <div className="loading-state">
              <p>Loading...</p>
            </div>
          ) : sharedAccessList.length === 0 ? (
            <div className="empty-state">
              <p>
                You haven't shared access with anyone yet. Use the "Invite
                Friends" button to invite others and share your children's
                profiles.
              </p>
            </div>
          ) : (
            <div className="shared-access-list">
              <p className="help-text">
                These people have access to view your children's learning
                progress:
              </p>

              {sharedAccessList.map((access) => (
                <div key={access.id} className="access-item">
                  <div className="access-info">
                    <h4>{access.displayName || access.email}</h4>
                    <p className="access-email">{access.email}</p>

                    {editingAccess === access.id ? (
                      // Edit mode
                      <div className="edit-children-section">
                        <label>Select children to share:</label>
                        <div className="children-checklist">
                          {children.map((child) => (
                            <label key={child.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedChildren.includes(child.id)}
                                onChange={() => handleToggleChild(child.id)}
                                disabled={loading}
                              />
                              <span>
                                {child.name} ({child.ageGroup} years)
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="edit-actions">
                          <button
                            className="primary-btn"
                            onClick={() =>
                              handleUpdateAccess(access.id, access.email)
                            }
                            disabled={loading || selectedChildren.length === 0}
                          >
                            {loading ? 'Updating...' : 'Save Changes'}
                          </button>
                          <button
                            className="secondary-btn"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <p className="shared-children">
                          <strong>Shared children:</strong>{' '}
                          {getChildrenNames(access.childrenIds || [])}
                        </p>
                        <p className="access-date">
                          Access granted:{' '}
                          {access.accessGrantedAt
                            ?.toDate()
                            .toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>

                  {editingAccess !== access.id && (
                    <div className="access-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditAccess(access)}
                        disabled={loading}
                        title="Edit shared children"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="revoke-btn"
                        onClick={() => handleRevokeAccess(access.id, access.email)}
                        disabled={loading}
                        title="Revoke access"
                      >
                        🚫 Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SharedAccessManager;
