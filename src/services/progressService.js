import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';

/**
 * Track progress for a kid on specific content
 * @param {string} parentId - Parent's user ID
 * @param {string} kidId - Kid's document ID
 * @param {string} contentId - Content document ID
 * @param {boolean} correct - Whether the attempt was correct
 */
export async function trackProgress(parentId, kidId, contentId, correct) {
  try {
    const progressRef = doc(
      db,
      'parents',
      parentId,
      'kids',
      kidId,
      'progress',
      contentId
    );

    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      // Update existing progress
      const updates = {
        attempts: increment(1),
        lastPracticed: serverTimestamp()
      };

      if (correct) {
        updates.correctAttempts = increment(1);
      }

      await updateDoc(progressRef, updates);
    } else {
      // Create new progress record
      await setDoc(progressRef, {
        contentId,
        attempts: 1,
        correctAttempts: correct ? 1 : 0,
        firstPracticed: serverTimestamp(),
        lastPracticed: serverTimestamp(),
        mastered: false
      });
    }

    // Check if content is mastered (3 correct attempts in a row)
    const updatedDoc = await getDoc(progressRef);
    const data = updatedDoc.data();

    if (data && data.correctAttempts >= 3 && !data.mastered) {
      await updateDoc(progressRef, { mastered: true });
    }
  } catch (error) {
    console.error('Error tracking progress:', error);
    throw error;
  }
}

/**
 * Get all progress for a specific kid
 * @param {string} parentId - Parent's user ID
 * @param {string} kidId - Kid's document ID
 * @returns {Promise<Array>} Array of progress objects
 */
export async function getKidProgress(parentId, kidId) {
  try {
    const progressRef = collection(
      db,
      'parents',
      parentId,
      'kids',
      kidId,
      'progress'
    );

    const snapshot = await getDocs(progressRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting kid progress:', error);
    return [];
  }
}

/**
 * Get progress summary for a kid
 * @param {string} parentId - Parent's user ID
 * @param {string} kidId - Kid's document ID
 * @returns {Promise<Object>} Progress summary stats
 */
export async function getProgressSummary(parentId, kidId) {
  try {
    const progress = await getKidProgress(parentId, kidId);

    return {
      totalItems: progress.length,
      masteredItems: progress.filter(p => p.mastered).length,
      totalAttempts: progress.reduce((sum, p) => sum + (p.attempts || 0), 0),
      totalCorrect: progress.reduce((sum, p) => sum + (p.correctAttempts || 0), 0),
      accuracy: progress.length > 0
        ? Math.round(
            (progress.reduce((sum, p) => sum + (p.correctAttempts || 0), 0) /
             progress.reduce((sum, p) => sum + (p.attempts || 0), 0)) * 100
          )
        : 0
    };
  } catch (error) {
    console.error('Error getting progress summary:', error);
    return {
      totalItems: 0,
      masteredItems: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0
    };
  }
}
