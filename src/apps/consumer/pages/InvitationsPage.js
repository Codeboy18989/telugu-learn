import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getUserData } from '../../../services/userService';
import {
  getReceivedInvitations,
  acceptInvitation,
  declineInvitation
} from '../../../services/invitationService';
import '../../../styles/dashboard.css';

function InvitationsPage() {
  const { currentUser, logout } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, [currentUser]);

  const loadInvitations = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      const received = await getReceivedInvitations(currentUser.email);
      setInvitations(received);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation) => {
    if (
      !window.confirm(
        `Accept invitation from ${invitation.fromName}? This will allow you to view their children's learning progress.`
      )
    ) {
      return;
    }

    try {
      setProcessingId(invitation.id);
      setError('');
      setSuccess('');

      // Get current user data
      const userData = await getUserData(currentUser.uid);

      await acceptInvitation(invitation.id, currentUser.uid, {
        email: currentUser.email,
        displayName: userData?.displayName || currentUser.email
      });

      setSuccess(`You now have access to ${invitation.fromName}'s children!`);
      loadInvitations();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    if (
      !window.confirm(
        `Decline invitation from ${invitation.fromName}?`
      )
    ) {
      return;
    }

    try {
      setProcessingId(invitation.id);
      setError('');
      setSuccess('');

      await declineInvitation(invitation.id);
      setSuccess('Invitation declined');
      loadInvitations();
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError('Failed to decline invitation');
    } finally {
      setProcessingId(null);
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
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📬 Invitations</h1>
          <div className="header-actions">
            <a href="/consumer/dashboard" className="back-link">
              ← Back to Dashboard
            </a>
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="invitations-container">
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

          <div className="section-header">
            <h2>Pending Invitations</h2>
            <p className="help-text">
              Accept invitations to view and help manage learning for friends'
              and family's children
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="empty-state">
              <h3>No Pending Invitations</h3>
              <p>
                When someone invites you to view their children's learning
                progress, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="invitations-list">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="invitation-card">
                  <div className="invitation-header">
                    <h3>Invitation from {invitation.fromName}</h3>
                    <span className="invitation-date">
                      {invitation.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>

                  <div className="invitation-body">
                    <p className="from-email">
                      <strong>From:</strong> {invitation.fromEmail}
                    </p>

                    {invitation.message && (
                      <div className="invitation-message">
                        <strong>Message:</strong>
                        <p>{invitation.message}</p>
                      </div>
                    )}

                    <p className="children-count">
                      <strong>Children to access:</strong>{' '}
                      {invitation.childrenIds?.length || 0}
                    </p>

                    <p className="expires-info">
                      Expires:{' '}
                      {invitation.expiresAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>

                  <div className="invitation-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAcceptInvitation(invitation)}
                      disabled={processingId === invitation.id}
                    >
                      {processingId === invitation.id
                        ? 'Accepting...'
                        : '✓ Accept'}
                    </button>
                    <button
                      className="decline-btn"
                      onClick={() => handleDeclineInvitation(invitation)}
                      disabled={processingId === invitation.id}
                    >
                      {processingId === invitation.id
                        ? 'Declining...'
                        : '✗ Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default InvitationsPage;
