// Game Service - Manages game state and logic
import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

/**
 * Generate multiple choice options for a letter matching question
 * @param {Object} correctLetter - The correct letter object
 * @param {Array} allLetters - All available letters
 * @param {number} optionCount - Number of options to generate (default 4)
 * @returns {Array} Shuffled array of options
 */
export function generateMultipleChoiceOptions(correctLetter, allLetters, optionCount = 4) {
  const options = [correctLetter];
  const availableLetters = allLetters.filter(l => l.id !== correctLetter.id);

  // Try to get similar letters first (harder challenge)
  const similarLetters = availableLetters.filter(l => {
    const diff = Math.abs(l.difficulty - correctLetter.difficulty);
    return diff <= 1; // Within 1 difficulty level
  });

  // Add options, preferring similar letters
  while (options.length < optionCount && similarLetters.length > 0) {
    const randomIndex = Math.floor(Math.random() * similarLetters.length);
    const selectedLetter = similarLetters.splice(randomIndex, 1)[0];
    options.push(selectedLetter);
  }

  // Fill remaining with any letters
  while (options.length < optionCount && availableLetters.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableLetters.length);
    const selectedLetter = availableLetters.splice(randomIndex, 1)[0];
    options.push(selectedLetter);
  }

  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Initialize a new game session
 * @param {string} kidId - Kid's ID
 * @param {string} track - 'reading' or 'speaking'
 * @param {number} level - Level number
 * @param {number} lesson - Lesson number
 * @param {Array} questions - Array of question objects
 * @returns {Object} Game session data
 */
export function createGameSession(kidId, track, level, lesson, questions) {
  return {
    kidId,
    track,
    level,
    lesson,
    questions,
    currentQuestionIndex: 0,
    answers: [],
    correctCount: 0,
    startTime: Date.now(),
    endTime: null,
    completed: false
  };
}

/**
 * Submit an answer for the current question
 * @param {Object} gameSession - Current game session
 * @param {string} answerId - Selected answer ID
 * @returns {Object} Updated game session with result
 */
export function submitAnswer(gameSession, answerId) {
  const currentQuestion = gameSession.questions[gameSession.currentQuestionIndex];
  const isCorrect = answerId === currentQuestion.correctAnswer;

  const answerRecord = {
    questionId: currentQuestion.id,
    selectedAnswer: answerId,
    correctAnswer: currentQuestion.correctAnswer,
    isCorrect,
    timestamp: Date.now()
  };

  return {
    ...gameSession,
    answers: [...gameSession.answers, answerRecord],
    correctCount: gameSession.correctCount + (isCorrect ? 1 : 0),
    currentQuestionIndex: gameSession.currentQuestionIndex + 1
  };
}

/**
 * Calculate stars based on score percentage
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalQuestions - Total number of questions
 * @param {Object} thresholds - Star thresholds config
 * @returns {number} Stars earned (0-3)
 */
export function calculateStars(correctCount, totalQuestions, thresholds = { 3: 0.9, 2: 0.75, 1: 0.6 }) {
  const percentage = correctCount / totalQuestions;

  if (percentage >= thresholds[3]) return 3;
  if (percentage >= thresholds[2]) return 2;
  if (percentage >= thresholds[1]) return 1;
  return 0;
}

/**
 * Complete a game session
 * @param {Object} gameSession - Current game session
 * @param {Object} starsConfig - Star thresholds
 * @returns {Object} Completed game session with results
 */
export function completeGameSession(gameSession, starsConfig) {
  const totalQuestions = gameSession.questions.length;
  const correctCount = gameSession.correctCount;
  const stars = calculateStars(correctCount, totalQuestions, starsConfig);
  const percentage = (correctCount / totalQuestions) * 100;
  const timeSpent = Date.now() - gameSession.startTime;

  return {
    ...gameSession,
    completed: true,
    endTime: Date.now(),
    results: {
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      percentage: percentage.toFixed(1),
      stars,
      timeSpent,
      passed: stars >= 1
    }
  };
}

/**
 * Save game progress to Firestore
 * @param {string} parentId - Parent's user ID
 * @param {string} kidId - Kid's ID
 * @param {Object} gameSession - Completed game session
 */
export async function saveGameProgress(parentId, kidId, gameSession) {
  try {
    const { track, level, lesson, results } = gameSession;

    // Create unique progress document ID
    const progressId = `${track}_L${level}_lesson${lesson}`;
    const progressRef = doc(db, 'parents', parentId, 'kids', kidId, 'gameProgress', progressId);

    // Check if progress already exists
    const existingProgress = await getDoc(progressRef);

    if (existingProgress.exists()) {
      // Update existing progress (keep best score)
      const existing = existingProgress.data();
      const shouldUpdate = results.stars > (existing.stars || 0);

      await updateDoc(progressRef, {
        attempts: increment(1),
        lastPlayed: serverTimestamp(),
        ...(shouldUpdate ? {
          stars: results.stars,
          percentage: results.percentage,
          correctCount: results.correctCount,
          timeSpent: results.timeSpent
        } : {})
      });
    } else {
      // Create new progress document
      await setDoc(progressRef, {
        track,
        level,
        lesson,
        stars: results.stars,
        percentage: results.percentage,
        correctCount: results.correctCount,
        totalQuestions: results.totalQuestions,
        timeSpent: results.timeSpent,
        attempts: 1,
        completed: results.passed,
        firstPlayed: serverTimestamp(),
        lastPlayed: serverTimestamp()
      });
    }

    // Update daily streak
    await updateDailyStreak(parentId, kidId);

    return true;
  } catch (error) {
    console.error('Error saving game progress:', error);
    throw error;
  }
}

/**
 * Update daily streak for a kid
 * @param {string} parentId - Parent's user ID
 * @param {string} kidId - Kid's ID
 */
async function updateDailyStreak(parentId, kidId) {
  try {
    const streakRef = doc(db, 'parents', parentId, 'kids', kidId, 'stats', 'streak');
    const streakDoc = await getDoc(streakRef);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (streakDoc.exists()) {
      const data = streakDoc.data();
      const lastActive = data.lastActiveDate;

      if (lastActive === today) {
        // Already played today, no change
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = data.currentStreak || 0;
      if (lastActive === yesterdayStr) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      await updateDoc(streakRef, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, data.longestStreak || 0),
        lastActiveDate: today,
        totalDays: increment(1)
      });
    } else {
      // First time playing
      await setDoc(streakRef, {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        totalDays: 1
      });
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

/**
 * Get kid's game progress for a specific track and level
 * @param {string} parentId - Parent's user ID
 * @param {string} kidId - Kid's ID
 * @param {string} track - 'reading' or 'speaking'
 * @param {number} level - Level number
 * @returns {Array} Array of lesson progress objects
 */
export async function getLevelProgress(parentId, kidId, track, level) {
  try {
    const progressCollection = collection(db, 'parents', parentId, 'kids', kidId, 'gameProgress');
    const q = query(
      progressCollection,
      where('track', '==', track),
      where('level', '==', level)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting level progress:', error);
    return [];
  }
}

/**
 * Check if a lesson is unlocked
 * @param {Array} progressData - Kid's progress data
 * @param {number} lesson - Lesson number to check
 * @returns {boolean} True if unlocked
 */
export function isLessonUnlocked(progressData, lesson) {
  // Lesson 1 is always unlocked
  if (lesson === 1) return true;

  // Check if previous lesson is completed
  const previousLesson = progressData.find(p => p.lesson === lesson - 1);
  return previousLesson && previousLesson.completed && previousLesson.stars >= 1;
}

/**
 * Calculate overall progress for a track
 * @param {Array} progressData - Kid's progress data
 * @param {number} totalLessons - Total lessons in track
 * @returns {Object} Progress statistics
 */
export function calculateTrackProgress(progressData, totalLessons) {
  const completedLessons = progressData.filter(p => p.completed).length;
  const totalStars = progressData.reduce((sum, p) => sum + (p.stars || 0), 0);
  const maxStars = totalLessons * 3;
  const percentage = (completedLessons / totalLessons) * 100;

  return {
    completedLessons,
    totalLessons,
    totalStars,
    maxStars,
    percentage: percentage.toFixed(1),
    isComplete: completedLessons === totalLessons
  };
}
