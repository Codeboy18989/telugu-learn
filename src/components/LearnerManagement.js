import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModeLabels } from '../hooks/useModeLabels';
import { useUserMode } from '../context/UserModeContext';
import {
  getLearners,
  addLearner,
  deleteLearner,
  autoMigrateIfNeeded
} from '../services/learnerService';
import '../styles/kidManagement.css';

const AGE_GROUPS = [
  { value: '2-4', label: 'Age 2-4 years' },
  { value: '4+', label: 'Age 4+ years' },
  { value: '8+', label: 'Age 8+ years' },
];

function LearnerManagement() {
  const { currentUser } = useAuth();
  const labels = useModeLabels();
  const { mode } = useUserMode();
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('2-4');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load learners from Firestore
  useEffect(() => {
    loadLearners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function loadLearners() {
    if (!currentUser) return;

    try {
      setLoading(true);
      const learnersData = await getLearners(currentUser.uid);
      setLearners(learnersData);
    } catch (err) {
      console.error('Error loading learners:', err);
      setError(`Failed to load ${labels.learnerPlural.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  // Add learner
  const handleAddLearner = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError(`Please enter ${labels.learner.toLowerCase()}'s name`);
      return;
    }

    try {
      // Auto-migrate if needed (on first learner add)
      await autoMigrateIfNeeded(currentUser.uid);

      // Add new learner
      await addLearner(currentUser.uid, {
        name: name.trim(),
        ageGroup,
      }, mode);

      setSuccess(`${name} added successfully! 🎉`);
      setName('');
      setAgeGroup('2-4');

      // Reload learners
      await loadLearners();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to add ${labels.learner.toLowerCase()}. Please try again.`);
      console.error('Error adding learner:', err);
    }
  };

  // Delete learner
  const handleDeleteLearner = async (learnerId) => {
    const learner = learners.find(l => l.id === learnerId);
    if (!window.confirm(`Are you sure you want to remove ${learner?.name}?`)) {
      return;
    }

    try {
      await deleteLearner(currentUser.uid, learnerId);
      setSuccess(`${labels.learner} removed successfully`);

      // Reload learners
      await loadLearners();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete ${labels.learner.toLowerCase()}. Please try again.`);
      console.error('Error deleting learner:', err);
    }
  };

  const ageGroupLabel = (group) => {
    return AGE_GROUPS.find((g) => g.value === group)?.label || group;
  };

  return (
    <div className="kid-management">
      <div className="kid-management-content">
        {/* Add Learner Form Section */}
        <div className="add-kid-section">
          <h2>{labels.addLearnerTitle}</h2>
          <form onSubmit={handleAddLearner} className="add-kid-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="learner-name">{labels.learner}'s Name:</label>
                <input
                  id="learner-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age-group">Age Group:</label>
                <select
                  id="age-group"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  {AGE_GROUPS.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-button">
                <button type="submit" className="add-btn">
                  {labels.addLearner}
                </button>
              </div>
            </div>
          </form>

          {/* Messages */}
          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}
        </div>

        {/* Learners List Section */}
        <div className="kids-list-section">
          <h2>{labels.yourLearners}</h2>

          {loading ? (
            <p className="loading">Loading {labels.learnerPlural.toLowerCase()}...</p>
          ) : learners.length === 0 ? (
            <p className="empty-state">
              {labels.emptyState}
            </p>
          ) : (
            <div className="kids-grid">
              {learners.map((learner) => (
                <div key={learner.id} className="kid-card">
                  <div className="kid-card-header">
                    <h3>{learner.name}</h3>
                    <button
                      onClick={() => handleDeleteLearner(learner.id)}
                      className="delete-btn"
                      title={`Delete ${learner.name}`}
                      aria-label={`Delete ${learner.name}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="kid-card-body">
                    <div className="age-badge">
                      <span className="age-label">Age Group:</span>
                      <span className="age-value">{ageGroupLabel(learner.ageGroup)}</span>
                    </div>
                    {learner._fromOldPath && (
                      <div className="migration-badge" title="Migrated from old structure">
                        📦 Migrated
                      </div>
                    )}
                  </div>

                  <div className="kid-card-footer">
                    <p className="created-text">
                      Added {learner.createdAt ? new Date(learner.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearnerManagement;
