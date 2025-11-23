import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  createInvitation,
  getSentInvitations,
  cancelInvitation,
  hasExistingInvitation
} from '../../../services/invitationService';

function InviteFriendsModal({ children, onClose }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSentInvitations = useCallback(async () => {
    try {
      const invitations = await getSentInvitations(currentUser.uid);
      setSentInvitations(invitations);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  }, [currentUser.uid]);

  useEffect(() => {
    loadSentInvitations();
  }, [loadSentInvitations]);

  const handleToggleChild = (childId) => {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChildren.length === children.length) {
      setSelectedChildren([]);
    } else {
      setSelectedChildren(children.map((child) => child.id));
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      setError('You cannot invite yourself');
      return;
    }

    if (selectedChildren.length === 0) {
      setError('Please select at least one child to share');
      return;
    }

    try {
      setLoading(true);

      // Check for existing invitation
      const exists = await hasExistingInvitation(currentUser.uid, email);
      if (exists) {
        setError('You already have a pending invitation for this email address');
        setLoading(false);
        return;
      }

      // Create invitation
      await createInvitation(currentUser.uid, {
        fromEmail: currentUser.email,
        fromName: currentUser.displayName || currentUser.email,
        toEmail: email.trim(),
        message: message.trim(),
        childrenIds: selectedChildren
      });

      setSuccess(`Invitation sent to ${email}!`);
      setEmail('');
      setMessage('');
      setSelectedChildren([]);
      loadSentInvitations();
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await cancelInvitation(invitationId, currentUser.uid);
      setSuccess('Invitation cancelled');
      loadSentInvitations();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation');
    }
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
          <h2>👥 Invite Friends & Family</h2>
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

          {/* Send Invitation Form */}
          <div className="invite-form-section">
            <h3>Send New Invitation</h3>
            <form onSubmit={handleSendInvitation}>
              <div className="form-group">
                <label htmlFor="inviteEmail">Email Address:</label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="inviteMessage">Message (optional):</label>
                <textarea
                  id="inviteMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Select Children to Share:</label>
                {children.length === 0 ? (
                  <p className="help-text">
                    You need to add children first before inviting others.
                  </p>
                ) : (
                  <>
                    <div className="select-all-container">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedChildren.length === children.length}
                          onChange={handleSelectAll}
                          disabled={loading}
                        />
                        <span>Select All</span>
                      </label>
                    </div>
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
                  </>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading || children.length === 0}
                >
                  {loading ? 'Sending...' : '📧 Send Invitation'}
                </button>
              </div>
            </form>
          </div>

          {/* Sent Invitations List */}
          <div className="sent-invitations-section">
            <h3>Pending Invitations ({sentInvitations.filter(inv => inv.status === 'pending').length})</h3>
            {sentInvitations.filter(inv => inv.status === 'pending').length === 0 ? (
              <p className="empty-state">No pending invitations</p>
            ) : (
              <div className="invitations-list">
                {sentInvitations
                  .filter(inv => inv.status === 'pending')
                  .map((invitation) => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-info">
                        <p className="invitation-email">
                          <strong>To:</strong> {invitation.toEmail}
                        </p>
                        <p className="invitation-children">
                          <strong>Children:</strong>{' '}
                          {getChildrenNames(invitation.childrenIds)}
                        </p>
                        <p className="invitation-date">
                          Sent:{' '}
                          {invitation.createdAt?.toDate().toLocaleDateString()}
                        </p>
                        {invitation.message && (
                          <p className="invitation-message">
                            <strong>Message:</strong> {invitation.message}
                          </p>
                        )}
                      </div>
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        title="Cancel invitation"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
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

export default InviteFriendsModal;
