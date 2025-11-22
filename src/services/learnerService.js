// Learner Service - Handles learners with backward compatibility
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Get all learners for a user (checks both old and new paths)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of learners
 */
export async function getLearners(userId) {
  try {
    // Try new path first
    const learnersRef = collection(db, 'users', userId, 'learners');
    const q = query(learnersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // User has been migrated, use new path
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Fallback to old path (not yet migrated)
    const oldKidsRef = collection(db, 'parents', userId, 'kids');
    const oldQ = query(oldKidsRef, orderBy('createdAt', 'desc'));
    const oldSnapshot = await getDocs(oldQ);

    return oldSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _fromOldPath: true  // Flag for migration tracking
    }));

  } catch (error) {
    console.error('Error getting learners:', error);
    throw error;
  }
}

/**
 * Add a new learner (always writes to new path)
 * @param {string} userId - User ID
 * @param {Object} learnerData - Learner data
 * @param {string} userMode - User mode ('family', 'teacher', 'friends')
 * @returns {Promise<string>} New learner ID
 */
export async function addLearner(userId, learnerData, userMode = 'family') {
  try {
    const learnersRef = collection(db, 'users', userId, 'learners');
    const newLearnerRef = doc(learnersRef);

    // Map user mode to learner type
    const learnerType = {
      'family': 'family',
      'teacher': 'student',
      'friends': 'friend'
    }[userMode] || 'family';

    await setDoc(newLearnerRef, {
      ...learnerData,
      type: learnerType,
      createdAt: serverTimestamp()
    });

    return newLearnerRef.id;
  } catch (error) {
    console.error('Error adding learner:', error);
    throw error;
  }
}

/**
 * Delete a learner
 * @param {string} userId - User ID
 * @param {string} learnerId - Learner ID
 */
export async function deleteLearner(userId, learnerId) {
  try {
    const learnerRef = doc(db, 'users', userId, 'learners', learnerId);
    await deleteDoc(learnerRef);
  } catch (error) {
    console.error('Error deleting learner:', error);
    throw error;
  }
}

/**
 * Get user mode from profile
 * @param {string} userId - User ID
 * @returns {Promise<string>} User mode
 */
export async function getUserMode(userId) {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'info');
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data().mode || 'family';
    }

    return 'family';  // Default for unmigrated users
  } catch (error) {
    console.error('Error getting user mode:', error);
    return 'family';
  }
}

/**
 * Set user mode
 * @param {string} userId - User ID
 * @param {string} mode - Mode to set ('family', 'teacher', 'friends')
 */
export async function setUserMode(userId, mode) {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'info');
    await setDoc(profileRef, {
      mode,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user mode:', error);
    throw error;
  }
}

/**
 * Auto-migrate user's kids to learners (called when user adds first learner)
 * @param {string} userId - User ID
 */
export async function autoMigrateIfNeeded(userId) {
  try {
    // Check if already migrated
    const learnersRef = collection(db, 'users', userId, 'learners');
    const snapshot = await getDocs(learnersRef);

    if (!snapshot.empty) {
      // Already migrated
      return;
    }

    // Check for old kids data
    const oldKidsRef = collection(db, 'parents', userId, 'kids');
    const oldSnapshot = await getDocs(oldKidsRef);

    if (oldSnapshot.empty) {
      // No old data to migrate
      return;
    }

    console.log(`Auto-migrating ${oldSnapshot.size} kids to learners for user ${userId}`);

    // Copy each kid to learners
    for (const kidDoc of oldSnapshot.docs) {
      const kidData = kidDoc.data();
      const learnerRef = doc(learnersRef, kidDoc.id);

      await setDoc(learnerRef, {
        ...kidData,
        type: 'family',  // Default to family type
        migratedFrom: 'kids',
        migratedAt: serverTimestamp()
      });
    }

    // Set user profile with family mode
    const profileRef = doc(db, 'users', userId, 'profile', 'info');
    await setDoc(profileRef, {
      mode: 'family',
      migrated: true,
      migratedAt: serverTimestamp()
    }, { merge: true });

    console.log(`✅ Auto-migration complete for user ${userId}`);

  } catch (error) {
    console.error('Error auto-migrating:', error);
    // Don't throw - migration is optional
  }
}
