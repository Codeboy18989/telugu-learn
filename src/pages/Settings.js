import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserMode } from '../context/UserModeContext';
import { useAuth } from '../context/AuthContext';
import '../styles/settings.css';

const MODE_INFO = {
  family: {
    title: 'Family Mode',
    icon: '👨‍👩‍👧',
    description: 'Perfect for parents teaching Telugu to their children or family members learning together.',
    features: [
      'Add family members of any age',
      'Track individual progress for each family member',
      'Age-appropriate content for 2-4, 4+, and 8+ years',
      'Family learning dashboard'
    ]
  },
  teacher: {
    title: 'Teacher Mode',
    icon: '👨‍🏫',
    description: 'Designed for educators teaching Telugu to students in a classroom or tutoring environment.',
    features: [
      'Manage multiple students',
      'Track student progress and performance',
      'Classroom-style interface',
      'Student reports and analytics'
    ]
  },
  friends: {
    title: 'Friends Mode',
    icon: '👥',
    description: 'Learn Telugu together with friends in a social, collaborative environment.',
    features: [
      'Invite friends via email or link',
      'Learn together and share progress',
      'Social learning experience',
      'Group challenges (coming soon)'
    ]
  }
};

function Settings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mode, setMode } = useUserMode();
  const [selectedMode, setSelectedMode] = useState(mode);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSaveMode() {
    if (selectedMode === mode) {
      setMessage('Mode is already set to ' + MODE_INFO[selectedMode].title);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setSaving(true);
      await setMode(selectedMode);
      setMessage(`✅ Switched to ${MODE_INFO[selectedMode].title} successfully!`);
      setTimeout(() => {
        setMessage('');
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error changing mode:', error);
      setMessage('❌ Failed to change mode. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate('/dashboard');
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={handleCancel} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1>⚙️ Settings</h1>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h2>Learning Mode</h2>
            <p className="section-description">
              Choose how you want to use తెలుగు Learn. You can change this anytime.
            </p>

            <div className="mode-cards">
              {Object.entries(MODE_INFO).map(([modeKey, info]) => (
                <div
                  key={modeKey}
                  className={`mode-option-card ${selectedMode === modeKey ? 'selected' : ''} ${mode === modeKey ? 'current' : ''}`}
                  onClick={() => setSelectedMode(modeKey)}
                >
                  <div className="mode-option-header">
                    <div className="mode-option-icon">{info.icon}</div>
                    <div className="mode-option-title">
                      <h3>{info.title}</h3>
                      {mode === modeKey && <span className="current-badge">Current</span>}
                    </div>
                    <div className="mode-option-radio">
                      <input
                        type="radio"
                        name="mode"
                        value={modeKey}
                        checked={selectedMode === modeKey}
                        onChange={() => setSelectedMode(modeKey)}
                      />
                    </div>
                  </div>

                  <p className="mode-option-description">{info.description}</p>

                  <ul className="mode-option-features">
                    {info.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {message && (
              <div className={`settings-message ${message.includes('❌') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="settings-actions">
              <button
                onClick={handleCancel}
                className="cancel-btn"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMode}
                className="save-btn"
                disabled={saving || selectedMode === mode}
              >
                {saving ? 'Saving...' : selectedMode === mode ? 'Current Mode' : 'Save Changes'}
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h2>Account Information</h2>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{currentUser?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Current Mode:</span>
                <span className="info-value">{MODE_INFO[mode].title} {MODE_INFO[mode].icon}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
