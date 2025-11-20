import React, { useState, useEffect } from 'react';
import '../styles/flashcard.css';

export default function Flashcard({ content, kidName, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = content[currentIndex];

  // Reset when content changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowTranslation(false);
    setIsFlipped(false);
  }, [content]);

  function handleNext() {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
      setIsFlipped(false);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTranslation(false);
      setIsFlipped(false);
    }
  }

  function handleFlip() {
    setIsFlipped(!isFlipped);
    setShowTranslation(!showTranslation);
  }

  function playAudio() {
    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl);
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
      });
    }
  }

  if (!content || content.length === 0) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-header">
          <button onClick={onBack} className="back-btn">
            ← Back
          </button>
        </div>
        <div className="empty-state">
          <h3>No Content Available</h3>
          <p>Add some Telugu words in the Content Library to start learning!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      {/* Header */}
      <div className="flashcard-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Modes
        </button>
        <h2>🎴 Flashcards for {kidName}</h2>
        <div className="progress">
          {currentIndex + 1} / {content.length}
        </div>
      </div>

      {/* Flashcard */}
      <div className="flashcard-wrapper">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="flashcard-front">
            <div className="card-content">
              <div className="telugu-word">{currentCard.teluguText}</div>
              {currentCard.transliteration && (
                <div className="transliteration">{currentCard.transliteration}</div>
              )}
              {currentCard.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="audio-btn-card"
                  title="Play pronunciation"
                >
                  🔊 Play Audio
                </button>
              )}
              <div className="card-hint">
                {currentCard.category === 'phrases' ? '💬 Phrase' : '📝 Word'}
              </div>
              <p className="flip-hint">Tap to see translation</p>
            </div>
          </div>

          <div className="flashcard-back">
            <div className="card-content">
              <div className="english-word">{currentCard.englishTranslation}</div>
              {currentCard.transliteration && (
                <div className="transliteration-small">{currentCard.transliteration}</div>
              )}
              <div className="telugu-word-small">{currentCard.teluguText}</div>
              {currentCard.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="audio-btn-card"
                  title="Play pronunciation"
                >
                  🔊 Play Again
                </button>
              )}
              <p className="flip-hint">Tap to flip back</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flashcard-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="nav-btn"
        >
          ← Previous
        </button>

        <div className="card-info">
          <span className="category-label">
            {currentCard.category.charAt(0).toUpperCase() + currentCard.category.slice(1)}
          </span>
          {currentCard.isPreloaded && (
            <span className="preloaded-label">Pre-loaded</span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === content.length - 1}
          className="nav-btn"
        >
          Next →
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentIndex + 1) / content.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
