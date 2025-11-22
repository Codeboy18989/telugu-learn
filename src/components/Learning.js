import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getContent } from '../services/contentService';
import Flashcard from './Flashcard';
import PronunciationPractice from './PronunciationPractice';
import ReadingGames from './ReadingGames';
import '../styles/learning.css';

export default function Learning() {
  const { currentUser, isSuperAdmin } = useAuth();
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [learningMode, setLearningMode] = useState(null); // 'flashcards', 'pronunciation', or 'games'
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load kids
  useEffect(() => {
    loadKids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Load content when kid is selected
  useEffect(() => {
    if (selectedKid) {
      loadContentForKid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKid]);

  async function loadKids() {
    try {
      setLoading(true);
      const kidsRef = collection(db, 'parents', currentUser.uid, 'kids');
      const q = query(kidsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const kidsList = [];
      snapshot.forEach(doc => {
        kidsList.push({ id: doc.id, ...doc.data() });
      });

      setKids(kidsList);
      setError('');
    } catch (err) {
      setError('Failed to load kids: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadContentForKid() {
    try {
      setLoading(true);
      const contentList = await getContent(
        currentUser.uid,
        selectedKid.ageGroup,
        isSuperAdmin
      );

      if (contentList.length === 0) {
        setError(`No content available for age group ${selectedKid.ageGroup}. Add some content in the Content Library!`);
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

  function handleKidSelect(kid) {
    setSelectedKid(kid);
    setLearningMode(null); // Reset mode when selecting new kid
  }

  function handleBackToKids() {
    setSelectedKid(null);
    setLearningMode(null);
    setContent([]);
    setError('');
  }

  function handleBackToModes() {
    setLearningMode(null);
  }

  // Render Kid Selection
  if (!selectedKid) {
    return (
      <div className="learning-container">
        <div className="learning-header">
          <h2>🎓 Let's Learn Telugu!</h2>
          <p className="learning-subtitle">Select a child to start learning</p>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : kids.length === 0 ? (
          <div className="empty-state">
            <h3>No Kids Added Yet</h3>
            <p>Add your children in the "My Kids" tab to get started!</p>
          </div>
        ) : (
          <div className="kids-grid">
            {kids.map(kid => (
              <div
                key={kid.id}
                className="kid-card-learn"
                onClick={() => handleKidSelect(kid)}
              >
                <div className="kid-avatar">
                  {kid.name.charAt(0).toUpperCase()}
                </div>
                <h3>{kid.name}</h3>
                <p className="kid-age">Age: {kid.ageGroup} years</p>
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
          <button onClick={handleBackToKids} className="back-btn">
            ← Back to Kids
          </button>
          <h2>🎓 Learning with {selectedKid.name}</h2>
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
          selectedKid={selectedKid}
          onBack={handleBackToModes}
        />
      )}

      {learningMode === 'flashcards' && (
        <Flashcard
          content={content}
          kidName={selectedKid.name}
          onBack={handleBackToModes}
        />
      )}

      {learningMode === 'pronunciation' && (
        <PronunciationPractice
          content={content.filter(c => c.audioUrl)} // Only items with audio
          kidName={selectedKid.name}
          onBack={handleBackToModes}
        />
      )}
    </div>
  );
}
