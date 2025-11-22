import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createInvite,
  getSentInvites,
  cancelInvite,
  generateInviteLink,
  isInviteExpired,
  getInviteStatusBadge
} from '../services/inviteService';
import '../styles/inviteFriends.css';

function InviteFriends({ onClose }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInvites, setShowInvites] = useState(false);

  useEffect(() => {
    loadSentInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function loadSentInvites() {
    try {
      const invites = await getSentInvites(currentUser.uid);
      setSentInvites(invites);
    } catch (err) {
      console.error('Error loading invites:', err);
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const invite = await createInvite(currentUser.uid, {
        email: email.trim(),
        message: message.trim() || 'Join me in learning Telugu together!'
      });

      setSuccess(`✅ Invite sent to ${email}!`);
      setEmail('');
      setMessage('');

      // Reload invites
      await loadSentInvites();

      // Show the invite link for sharing
      const link = generateInviteLink(invite.id);
      navigator.clipboard.writeText(link);

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error sending invite:', err);
      setError('Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelInvite(inviteId) {
    if (!window.confirm('Are you sure you want to cancel this invite?')) {
      return;
    }

    try {
      await cancelInvite(currentUser.uid, inviteId);
      setSuccess('Invite canceled successfully');
      await loadSentInvites();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error canceling invite:', err);
      setError('Failed to cancel invite');
      setTimeout(() => setError(''), 3000);
    }
  }

  function copyInviteLink(inviteId) {
    const link = generateInviteLink(inviteId);
    navigator.clipboard.writeText(link);
    setSuccess('✅ Invite link copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  }

  function getStatusLabel(invite) {
    if (isInviteExpired(invite) && invite.status === 'pending') {
      return 'expired';
    }
    return invite.status;
  }

  return (
    <div className="invite-friends-modal">
      <div className="invite-friends-container">
        <div className="invite-header">
          <h2>👥 Invite Friends to Learn Together</h2>
          <button onClick={onClose} className="close-btn" title="Close">
            ✕
          </button>
        </div>

        <div className="invite-content">
          {/* Send Invite Form */}
          <div className="send-invite-section">
            <h3>Send an Invitation</h3>
            <p className="section-description">
              Invite your friends via email to learn Telugu together!
            </p>

            <form onSubmit={handleSendInvite} className="invite-form">
              <div className="form-group">
                <label htmlFor="friend-email">Friend's Email Address</label>
                <input
                  id="friend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="invite-message">Personal Message (Optional)</label>
                <textarea
                  id="invite-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  rows="3"
                  disabled={loading}
                  maxLength="200"
                />
                <span className="char-count">{message.length}/200</span>
              </div>

              {error && <div className="message error-message">{error}</div>}
              {success && <div className="message success-message">{success}</div>}

              <button type="submit" className="send-invite-btn" disabled={loading}>
                {loading ? 'Sending...' : '📧 Send Invite'}
              </button>
            </form>
          </div>

          {/* Sent Invites */}
          <div className="sent-invites-section">
            <div className="section-header">
              <h3>Sent Invites ({sentInvites.length})</h3>
              <button
                onClick={() => setShowInvites(!showInvites)}
                className="toggle-btn"
              >
                {showInvites ? '▼' : '▶'} {showInvites ? 'Hide' : 'Show'}
              </button>
            </div>

            {showInvites && (
              <div className="invites-list">
                {sentInvites.length === 0 ? (
                  <p className="empty-state">No invites sent yet. Send your first invite above!</p>
                ) : (
                  <div className="invites-grid">
                    {sentInvites.map(invite => (
                      <div key={invite.id} className="invite-card">
                        <div className="invite-card-header">
                          <span className="invite-email">{invite.email}</span>
                          <span className={`status-badge ${getInviteStatusBadge(getStatusLabel(invite))}`}>
                            {getStatusLabel(invite)}
                          </span>
                        </div>

                        <div className="invite-card-body">
                          {invite.message && (
                            <p className="invite-message">"{invite.message}"</p>
                          )}
                          <p className="invite-date">
                            Sent {invite.createdAt?.toLocaleDateString()}
                          </p>
                        </div>

                        <div className="invite-card-actions">
                          {invite.status === 'pending' && !isInviteExpired(invite) && (
                            <>
                              <button
                                onClick={() => copyInviteLink(invite.id)}
                                className="copy-link-btn"
                                title="Copy invite link"
                              >
                                🔗 Copy Link
                              </button>
                              <button
                                onClick={() => handleCancelInvite(invite.id)}
                                className="cancel-invite-btn"
                                title="Cancel invite"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteFriends;
