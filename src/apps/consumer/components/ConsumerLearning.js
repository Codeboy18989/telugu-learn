import React, { useState, useEffect } from 'react';
import { getContent } from '../../../services/contentService';
import Flashcard from '../../../components/Flashcard';
import PronunciationPractice from '../../../components/PronunciationPractice';
import ReadingGames from '../../../components/ReadingGames';
import '../../../styles/learning.css';

function ConsumerLearning({ children }) {
  const [selectedChild, setSelectedChild] = useState(null);
  const [learningMode, setLearningMode] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load content when child is selected
  useEffect(() => {
    if (selectedChild) {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild]);

  async function loadContent() {
    try {
      setLoading(true);
      setError('');
      const contentList = await getContent(null, selectedChild.ageGroup, false);

      if (contentList.length === 0) {
        setError(`No content available for age group ${selectedChild.ageGroup}.`);
      } else {
        setContent(contentList);
      }
    } catch (err) {
      setError('Failed to load content: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChildSelect(child) {
    setSelectedChild(child);
    setLearningMode(null);
  }

  function handleBack() {
    setSelectedChild(null);
    setLearningMode(null);
    setContent([]);
  }

  function handleModeSelect(mode) {
    setLearningMode(mode);
  }

  // If no child selected, show child selection
  if (!selectedChild) {
    return (
      <div className="learning-container">
        <h2>Select a Child to Begin Learning</h2>
        {children.length === 0 ? (
          <div className="empty-state">
            <p>No children added yet. Add a child to get started!</p>
          </div>
        ) : (
          <div className="learner-grid">
            {children.map((child) => (
              <button
                key={child.id}
                className="learner-card"
                onClick={() => handleChildSelect(child)}
              >
                <div className="learner-avatar">
                  <span className="learner-initial">
                    {child.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3>{child.name}</h3>
                <p className="learner-age">Age Group: {child.ageGroup}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If child selected but no mode, show mode selection
  if (!learningMode) {
    return (
      <div className="learning-container">
        <button onClick={handleBack} className="back-btn">
          ← Back to Children
        </button>

        <div className="learner-header">
          <div className="learner-info">
            <div className="learner-avatar-large">
              <span className="learner-initial">
                {selectedChild.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2>{selectedChild.name}</h2>
              <p>Age Group: {selectedChild.ageGroup}</p>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <p>Loading learning activities...</p>
          </div>
        ) : content.length === 0 ? (
          <div className="empty-state">
            <p>No content available yet for this age group.</p>
          </div>
        ) : (
          <>
            <h3>Choose a Learning Activity</h3>
            <div className="mode-grid">
              <button
                className="mode-card"
                onClick={() => handleModeSelect('flashcards')}
              >
                <span className="mode-icon">🎴</span>
                <h4>Flashcards</h4>
                <p>Practice letters and words with interactive flashcards</p>
              </button>

              <button
                className="mode-card"
                onClick={() => handleModeSelect('pronunciation')}
              >
                <span className="mode-icon">🎤</span>
                <h4>Pronunciation</h4>
                <p>Learn to pronounce Telugu letters and words correctly</p>
              </button>

              <button
                className="mode-card"
                onClick={() => handleModeSelect('games')}
              >
                <span className="mode-icon">🎮</span>
                <h4>Reading Games</h4>
                <p>Fun games to practice reading skills</p>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Show selected learning mode
  return (
    <div className="learning-container">
      <button
        onClick={() => setLearningMode(null)}
        className="back-btn"
      >
        ← Back to Activities
      </button>

      {learningMode === 'flashcards' && (
        <Flashcard
          learnerId={selectedChild.id}
          content={content}
          learnerName={selectedChild.name}
        />
      )}

      {learningMode === 'pronunciation' && (
        <PronunciationPractice
          learnerId={selectedChild.id}
          content={content}
          learnerName={selectedChild.name}
        />
      )}

      {learningMode === 'games' && (
        <ReadingGames
          learnerId={selectedChild.id}
          ageGroup={selectedChild.ageGroup}
          learnerName={selectedChild.name}
        />
      )}
    </div>
  );
}

export default ConsumerLearning;
