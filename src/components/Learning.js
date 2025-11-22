import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModeLabels } from '../hooks/useModeLabels';
import { getLearners } from '../services/learnerService';
import { getContent } from '../services/contentService';
import Flashcard from './Flashcard';
import PronunciationPractice from './PronunciationPractice';
import ReadingGames from './ReadingGames';
import '../styles/learning.css';

export default function Learning() {
  const { currentUser, isSuperAdmin } = useAuth();
  const labels = useModeLabels();
  const [learners, setLearners] = useState([]);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [learningMode, setLearningMode] = useState(null); // 'flashcards', 'pronunciation', or 'games'
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load learners
  useEffect(() => {
    loadLearners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Load content when learner is selected
  useEffect(() => {
    if (selectedLearner) {
      loadContentForLearner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLearner]);

  async function loadLearners() {
    try {
      setLoading(true);
      const learnersList = await getLearners(currentUser.uid);
      setLearners(learnersList);
      setError('');
    } catch (err) {
      setError(`Failed to load ${labels.learnerPlural.toLowerCase()}: ` + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadContentForLearner() {
    try {
      setLoading(true);
      const contentList = await getContent(
        currentUser.uid,
        selectedLearner.ageGroup,
        isSuperAdmin
      );

      if (contentList.length === 0) {
        setError(`No content available for age group ${selectedLearner.ageGroup}. Add some content in the Content Library!`);
      } else {
        setContent(contentList);
        setError('');
      }
    } catch (err) {
      setError('Failed to load content: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLearnerSelect(learner) {
    setSelectedLearner(learner);
    setLearningMode(null); // Reset mode when selecting new learner
  }

  function handleBackToLearners() {
    setSelectedLearner(null);
    setLearningMode(null);
    setContent([]);
    setError('');
  }

  function handleBackToModes() {
    setLearningMode(null);
  }

  // Render Learner Selection
  if (!selectedLearner) {
    return (
      <div className="learning-container">
        <div className="learning-header">
          <h2>🎓 Let's Learn Telugu!</h2>
          <p className="learning-subtitle">{labels.selectLearner}</p>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : learners.length === 0 ? (
          <div className="empty-state">
            <h3>{labels.noLearnersYet}</h3>
            <p>Add {labels.learnerPlural.toLowerCase()} in the "{labels.tab1}" tab to get started!</p>
          </div>
        ) : (
          <div className="kids-grid">
            {learners.map(learner => (
              <div
                key={learner.id}
                className="kid-card-learn"
                onClick={() => handleLearnerSelect(learner)}
              >
                <div className="kid-avatar">
                  {learner.name.charAt(0).toUpperCase()}
                </div>
                <h3>{learner.name}</h3>
                <p className="kid-age">Age: {learner.ageGroup} years</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Mode Selection
  if (!learningMode) {
    return (
      <div className="learning-container">
        <div className="learning-header">
          <button onClick={handleBackToLearners} className="back-btn">
            ← Back to {labels.learnerPlural}
          </button>
          <h2>🎓 {labels.learningWith} {selectedLearner.name}</h2>
          <p className="learning-subtitle">Choose a learning mode</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="mode-selection">
          <div
            className="mode-card"
            onClick={() => setLearningMode('games')}
          >
            <div className="mode-icon">🎮</div>
            <h3>Game-Based Learning</h3>
            <p>Fun games to learn reading & speaking</p>
            <span className="content-count">NEW!</span>
          </div>

          {content.length > 0 && (
            <>
              <div
                className="mode-card"
                onClick={() => setLearningMode('flashcards')}
              >
                <div className="mode-icon">🎴</div>
                <h3>Flashcards</h3>
                <p>Learn Telugu words with flashcards</p>
                <span className="content-count">{content.length} cards</span>
              </div>

              <div
                className="mode-card"
                onClick={() => setLearningMode('pronunciation')}
              >
                <div className="mode-icon">🎤</div>
                <h3>Pronunciation Practice</h3>
                <p>Listen and practice pronunciation</p>
                <span className="content-count">{content.filter(c => c.audioUrl).length} items with audio</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render Learning Mode
  return (
    <div className="learning-container">
      {learningMode === 'games' && (
        <ReadingGames
          selectedKid={selectedLearner}
          onBack={handleBackToModes}
        />
      )}

      {learningMode === 'flashcards' && (
        <Flashcard
          content={content}
          kidName={selectedLearner.name}
          onBack={handleBackToModes}
        />
      )}

      {learningMode === 'pronunciation' && (
        <PronunciationPractice
          content={content.filter(c => c.audioUrl)} // Only items with audio
          kidName={selectedLearner.name}
          onBack={handleBackToModes}
        />
      )}
    </div>
  );
}
