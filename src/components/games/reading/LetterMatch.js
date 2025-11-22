// Letter Match Game - Reading Level 1, Game 1
// Match Telugu letter to its transliteration
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GameContainer from '../shared/GameContainer';
import ProgressBar from '../shared/ProgressBar';
import StarRating from '../shared/StarRating';
import {
  getLettersByDifficulty,
  ALL_LETTERS,
  LEVEL_1_CONFIG
} from '../../../utils/gameContent/readingLevel1';
import {
  createGameSession,
  submitAnswer,
  completeGameSession,
  saveGameProgress,
  generateMultipleChoiceOptions
} from '../../../services/gameService';
import './LetterMatch.css';

function LetterMatch() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { kidId, lesson } = useParams();

  const [gameSession, setGameSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameResults, setGameResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update current question when game session changes
  useEffect(() => {
    if (gameSession && !gameSession.completed) {
      const question = gameSession.questions[gameSession.currentQuestionIndex];
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [gameSession]);

  function initializeGame() {
    try {
      // Determine difficulty based on lesson number
      const lessonNum = parseInt(lesson);
      let difficulty = 1;
      if (lessonNum > 4 && lessonNum <= 8) difficulty = 2;
      if (lessonNum > 8) difficulty = 3;

      // Get letters for this difficulty
      const availableLetters = getLettersByDifficulty(difficulty);

      // Generate questions
      const questions = generateQuestions(availableLetters, LEVEL_1_CONFIG.questionsPerLesson);

      // Create game session
      const session = createGameSession(
        kidId,
        'reading',
        1, // Level 1
        lessonNum,
        questions
      );

      setGameSession(session);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing game:', error);
      setLoading(false);
    }
  }

  function generateQuestions(letters, count) {
    const questions = [];
    const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffledLetters.length); i++) {
      const correctLetter = shuffledLetters[i];

      // Generate 4 transliteration options
      const options = generateMultipleChoiceOptions(correctLetter, ALL_LETTERS, 4);

      questions.push({
        id: `q_${i + 1}`,
        type: 'letter-to-transliteration',
        letter: correctLetter.letter,
        correctAnswer: correctLetter.transliteration,
        options: options.map(opt => opt.transliteration),
        letterData: correctLetter
      });
    }

    // If we don't have enough unique letters, repeat some
    while (questions.length < count) {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const options = generateMultipleChoiceOptions(randomLetter, ALL_LETTERS, 4);

      questions.push({
        id: `q_${questions.length + 1}`,
        type: 'letter-to-transliteration',
        letter: randomLetter.letter,
        correctAnswer: randomLetter.transliteration,
        options: options.map(opt => opt.transliteration),
        letterData: randomLetter
      });
    }

    return questions;
  }

  function handleAnswerSelect(answer) {
    if (showFeedback) return; // Prevent re-selection during feedback

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Auto-advance after showing feedback
    setTimeout(() => {
      handleNextQuestion(answer);
    }, 1500);
  }

  function handleNextQuestion(answer) {
    // Submit answer and update game session
    const updatedSession = submitAnswer(gameSession, answer);

    // Check if game is complete
    if (updatedSession.currentQuestionIndex >= updatedSession.questions.length) {
      const completedSession = completeGameSession(updatedSession, LEVEL_1_CONFIG.starsThresholds);
      setGameSession(completedSession);
      setGameResults(completedSession.results);

      // Save progress to Firebase
      saveGameProgress(currentUser.uid, kidId, completedSession);
    } else {
      setGameSession(updatedSession);
    }
  }

  function handleExit() {
    navigate(`/learning/${kidId}`);
  }

  function handlePlayAgain() {
    setGameResults(null);
    initializeGame();
  }

  if (loading) {
    return (
      <GameContainer title="Letter Match">
        <div className="game-loading">Loading game...</div>
      </GameContainer>
    );
  }

  if (!gameSession) {
    return (
      <GameContainer title="Letter Match" onExit={handleExit}>
        <div className="game-error">Failed to load game. Please try again.</div>
      </GameContainer>
    );
  }

  // Show results screen
  if (gameResults) {
    return (
      <GameContainer title="Letter Match" onExit={handleExit}>
        <div className="game-results">
          <div className="results-header">
            <h3>
              {gameResults.passed ? '🎉 Great Job!' : '📚 Keep Practicing!'}
            </h3>
            <StarRating stars={gameResults.stars} size="large" />
          </div>

          <div className="results-stats">
            <div className="stat-item">
              <div className="stat-label">Correct Answers</div>
              <div className="stat-value">{gameResults.correctCount}/{gameResults.totalQuestions}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Accuracy</div>
              <div className="stat-value">{gameResults.percentage}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Time Spent</div>
              <div className="stat-value">{Math.round(gameResults.timeSpent / 1000)}s</div>
            </div>
          </div>

          <div className="results-actions">
            <button onClick={handlePlayAgain} className="play-again-btn">
              Play Again
            </button>
            <button onClick={handleExit} className="continue-btn">
              Continue
            </button>
          </div>
        </div>
      </GameContainer>
    );
  }

  // Show game question (only if currentQuestion is loaded)
  if (!currentQuestion) {
    return (
      <GameContainer title="Letter Match" onExit={handleExit}>
        <div className="game-loading">Loading question...</div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Letter Match" onExit={handleExit}>
      <ProgressBar
        current={gameSession.currentQuestionIndex + 1}
        total={gameSession.questions.length}
      />

      <div className="letter-match-game">
        <div className="question-prompt">
          <p>Select the correct transliteration for:</p>
        </div>

        <div className="telugu-letter-display">
          {currentQuestion.letter}
        </div>

        <div className="options-grid">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showFeedback}
              className={`option-btn ${
                showFeedback && option === currentQuestion.correctAnswer
                  ? 'correct'
                  : showFeedback && option === selectedAnswer && !isCorrect
                  ? 'incorrect'
                  : selectedAnswer === option
                  ? 'selected'
                  : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
            {isCorrect ? (
              <>
                <span className="feedback-icon">✓</span>
                <span className="feedback-text">Correct!</span>
              </>
            ) : (
              <>
                <span className="feedback-icon">✗</span>
                <span className="feedback-text">
                  Correct answer: {currentQuestion.correctAnswer}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </GameContainer>
  );
}

export default LetterMatch;
