// Reading Games - Game-based learning selection for Reading Track
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LEVEL_1_CONFIG } from '../utils/gameContent/readingLevel1';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import StarRating from './games/shared/StarRating';
import '../styles/readingGames.css';

function ReadingGames({ selectedKid, onBack }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKid]);

  async function loadProgress() {
    try {
      setLoading(true);

      // Try new path first (users/learners)
      let progressRef = collection(
        db,
        'users',
        currentUser.uid,
        'learners',
        selectedKid.id,
        'gameProgress'
      );

      let q = query(
        progressRef,
        where('track', '==', 'reading'),
        where('level', '==', 1)
      );

      let snapshot = await getDocs(q);

      // Fallback to old path if new path has no data
      if (snapshot.empty) {
        progressRef = collection(
          db,
          'parents',
          currentUser.uid,
          'kids',
          selectedKid.id,
          'gameProgress'
        );

        q = query(
          progressRef,
          where('track', '==', 'reading'),
          where('level', '==', 1)
        );

        snapshot = await getDocs(q);
      }

      const progressData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }

  function getLessonProgress(lessonNumber) {
    return progress.find(p => p.lesson === lessonNumber);
  }

  function isLessonUnlocked(lessonNumber) {
    // Lesson 1 is always unlocked
    if (lessonNumber === 1) return true;

    // Check if previous lesson is completed
    const previousProgress = getLessonProgress(lessonNumber - 1);
    return previousProgress && previousProgress.completed && previousProgress.stars >= 1;
  }

  function handleLessonClick(lessonNumber) {
    if (!isLessonUnlocked(lessonNumber)) {
      return; // Can't play locked lessons
    }

    // Navigate to Letter Match game
    navigate(`/games/reading/letter-match/${selectedKid.id}/${lessonNumber}`);
  }

  return (
    <div className="reading-games-container">
      <div className="reading-games-header">
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
        <div className="header-info">
          <h2>🔤 Reading Telugu - Level 1</h2>
          <p className="reading-subtitle">{LEVEL_1_CONFIG.name}</p>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading lessons...</p>
      ) : (
        <div className="lessons-grid">
          {[...Array(LEVEL_1_CONFIG.totalLessons)].map((_, index) => {
            const lessonNumber = index + 1;
            const lessonProgress = getLessonProgress(lessonNumber);
            const unlocked = isLessonUnlocked(lessonNumber);

            return (
              <div
                key={lessonNumber}
                className={`lesson-card ${!unlocked ? 'locked' : ''} ${
                  lessonProgress?.completed ? 'completed' : ''
                }`}
                onClick={() => handleLessonClick(lessonNumber)}
              >
                <div className="lesson-number">
                  {unlocked ? lessonNumber : '🔒'}
                </div>

                <div className="lesson-info">
                  <h3>Lesson {lessonNumber}</h3>
                  <p className="lesson-name">Letter Match</p>

                  {lessonProgress && (
                    <div className="lesson-progress">
                      <StarRating stars={lessonProgress.stars || 0} size="small" />
                      <span className="attempts-count">
                        {lessonProgress.attempts} {lessonProgress.attempts === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </div>
                  )}

                  {!lessonProgress && unlocked && (
                    <p className="lesson-status">Not started</p>
                  )}

                  {!unlocked && (
                    <p className="lesson-status">Complete previous lesson</p>
                  )}
                </div>

                {lessonProgress?.completed && (
                  <div className="completion-badge">✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="level-info-box">
        <h3>About This Level</h3>
        <p>{LEVEL_1_CONFIG.description}</p>
        <div className="level-stats">
          <div className="stat">
            <span className="stat-label">Lessons:</span>
            <span className="stat-value">{LEVEL_1_CONFIG.totalLessons}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Questions per lesson:</span>
            <span className="stat-value">{LEVEL_1_CONFIG.questionsPerLesson}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Passing score:</span>
            <span className="stat-value">{LEVEL_1_CONFIG.passingScore * 100}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadingGames;
