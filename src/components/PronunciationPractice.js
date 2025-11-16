import React, { useState, useEffect } from 'react';
import '../styles/pronunciationPractice.css';

export default function PronunciationPractice({ content, kidName, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [markedCorrect, setMarkedCorrect] = useState([]);

  const currentItem = content[currentIndex];

  // Reset when content changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setMarkedCorrect([]);
  }, [content]);

  function playAudio() {
    if (currentItem?.audioUrl) {
      const audio = new Audio(currentItem.audioUrl);
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
      });
    }
  }

  function handleNext() {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  }

  function handleMarkCorrect() {
    if (!markedCorrect.includes(currentIndex)) {
      setMarkedCorrect([...markedCorrect, currentIndex]);
    }
    // Auto advance to next
    setTimeout(() => {
      if (currentIndex < content.length - 1) {
        handleNext();
      }
    }, 500);
  }

  function handleReveal() {
    setShowAnswer(true);
  }

  if (!content || content.length === 0) {
    return (
      <div className="pronunciation-container">
        <div className="pronunciation-header">
          <button onClick={onBack} className="back-btn">
            ← Back
          </button>
        </div>
        <div className="empty-state">
          <h3>No Audio Content Available</h3>
          <p>Add audio recordings to your content in the Content Library to practice pronunciation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pronunciation-container">
      {/* Header */}
      <div className="pronunciation-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Modes
        </button>
        <h2>🎤 Pronunciation Practice for {kidName}</h2>
        <div className="progress">
          {currentIndex + 1} / {content.length}
        </div>
      </div>

      {/* Practice Card */}
      <div className="practice-card">
        <div className="practice-content">
          {/* Audio Player */}
          <div className="audio-section">
            <button onClick={playAudio} className="play-audio-btn">
              🔊 Play Audio
            </button>
            <p className="audio-instruction">
              Listen carefully and try to repeat the pronunciation
            </p>
          </div>

          {/* Reveal Section */}
          <div className="reveal-section">
            {!showAnswer ? (
              <button onClick={handleReveal} className="reveal-btn">
                👁️ Show Answer
              </button>
            ) : (
              <div className="answer-display">
                <div className="telugu-text-practice">
                  {currentItem.teluguText}
                </div>
                <div className="english-text-practice">
                  {currentItem.englishTranslation}
                </div>
                <div className="category-badge-practice">
                  {currentItem.category}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          {showAnswer && (
            <div className="feedback-section">
              <p className="feedback-instruction">
                Did {kidName} pronounce it correctly?
              </p>
              <div className="feedback-buttons">
                <button
                  onClick={handleMarkCorrect}
                  className="correct-btn"
                >
                  ✅ Yes, Correct!
                </button>
                <button
                  onClick={playAudio}
                  className="replay-btn"
                >
                  🔄 Try Again
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {markedCorrect.includes(currentIndex) && (
            <div className="success-indicator">
              🎉 Great job, {kidName}!
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="pronunciation-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="nav-btn"
        >
          ← Previous
        </button>

        <div className="score-display">
          Correct: {markedCorrect.length} / {content.length}
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

      {/* Completion Message */}
      {currentIndex === content.length - 1 && markedCorrect.length === content.length && (
        <div className="completion-message">
          <h3>🎊 Excellent Work!</h3>
          <p>{kidName} completed all {content.length} pronunciation exercises!</p>
        </div>
      )}
    </div>
  );
}
