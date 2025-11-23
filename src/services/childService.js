import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Add a child profile (B2C consumers only)
 */
export const addChild = async (userId, childData) => {
  try {
    const childRef = doc(collection(db, 'consumerProfiles', userId, 'children'));

    const child = {
      name: childData.name,
      ageGroup: childData.ageGroup,
      createdAt: serverTimestamp()
    };

    await setDoc(childRef, child);

    return {
      id: childRef.id,
      ...child
    };
  } catch (error) {
    console.error('Error adding child:', error);
    throw error;
  }
};

/**
 * Get all children for a consumer
 */
export const getChildren = async (userId) => {
  try {
    const childrenRef = collection(db, 'consumerProfiles', userId, 'children');
    const snapshot = await getDocs(childrenRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting children:', error);
    throw error;
  }
};

/**
 * Get children that are shared with the current user
 */
export const getSharedChildren = async (userId) => {
  try {
    const accessRef = collection(db, 'consumerProfiles', userId, 'accessToChildren');
    const snapshot = await getDocs(accessRef);

    const sharedChildren = [];

    for (const accessDoc of snapshot.docs) {
      const accessData = accessDoc.data();
      const ownerId = accessDoc.id;

      // Get the actual children from the owner's profile
      for (const childId of accessData.childrenIds || []) {
        try {
          const childDoc = await getDoc(
            doc(db, 'consumerProfiles', ownerId, 'children', childId)
          );

          if (childDoc.exists()) {
            sharedChildren.push({
              id: childDoc.id,
              ownerId,
              ownerName: accessData.ownerName,
              ownerEmail: accessData.ownerEmail,
              ...childDoc.data(),
              isShared: true
            });
          }
        } catch (error) {
          console.error(`Error fetching child ${childId}:`, error);
        }
      }
    }

    return sharedChildren;
  } catch (error) {
    console.error('Error getting shared children:', error);
    throw error;
  }
};

/**
 * Get a specific child's data
 */
export const getChild = async (userId, childId) => {
  try {
    const childDoc = await getDoc(
      doc(db, 'consumerProfiles', userId, 'children', childId)
    );

    if (!childDoc.exists()) {
      throw new Error('Child not found');
    }

    return {
      id: childDoc.id,
      ...childDoc.data()
    };
  } catch (error) {
    console.error('Error getting child:', error);
    throw error;
  }
};

/**
 * Update child information
 */
export const updateChild = async (userId, childId, updates) => {
  try {
    const childRef = doc(db, 'consumerProfiles', userId, 'children', childId);
    await updateDoc(childRef, updates);
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
};

/**
 * Delete a child profile and all associated data
 */
export const deleteChild = async (userId, childId) => {
  try {
    const batch = writeBatch(db);

    // Delete child document
    const childRef = doc(db, 'consumerProfiles', userId, 'children', childId);
    batch.delete(childRef);

    // Delete game progress
    const gameProgressRef = collection(
      db,
      'consumerProfiles',
      userId,
      'children',
      childId,
      'gameProgress'
    );
    const gameProgressSnapshot = await getDocs(gameProgressRef);
    gameProgressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete stats
    const statsStreakRef = doc(
      db,
      'consumerProfiles',
      userId,
      'children',
      childId,
      'stats',
      'streak'
    );
    batch.delete(statsStreakRef);

    // Delete progress
    const progressRef = collection(
      db,
      'consumerProfiles',
      userId,
      'children',
      childId,
      'progress'
    );
    const progressSnapshot = await getDocs(progressRef);
    progressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting child:', error);
    throw error;
  }
};

/**
 * Grant access to children for another adult
 */
export const grantAccess = async (ownerId, partnerId, partnerData, childrenIds) => {
  try {
    // Add to owner's sharedAccess collection
    const sharedAccessRef = doc(
      db,
      'consumerProfiles',
      ownerId,
      'sharedAccess',
      partnerId
    );

    await setDoc(sharedAccessRef, {
      email: partnerData.email,
      displayName: partnerData.displayName,
      childrenIds: childrenIds,
      accessGrantedAt: serverTimestamp(),
      status: 'active'
    });

    // Add to partner's accessToChildren collection
    const accessToChildrenRef = doc(
      db,
      'consumerProfiles',
      partnerId,
      'accessToChildren',
      ownerId
    );

    await setDoc(accessToChildrenRef, {
      ownerEmail: partnerData.ownerEmail,
      ownerName: partnerData.ownerName,
      childrenIds: childrenIds,
      grantedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error granting access:', error);
    throw error;
  }
};

/**
 * Revoke access from a partner
 */
export const revokeAccess = async (ownerId, partnerId) => {
  try {
    const batch = writeBatch(db);

    // Remove from owner's sharedAccess
    const sharedAccessRef = doc(
      db,
      'consumerProfiles',
      ownerId,
      'sharedAccess',
      partnerId
    );
    batch.delete(sharedAccessRef);

    // Remove from partner's accessToChildren
    const accessToChildrenRef = doc(
      db,
      'consumerProfiles',
      partnerId,
      'accessToChildren',
      ownerId
    );
    batch.delete(accessToChildrenRef);

    await batch.commit();
  } catch (error) {
    console.error('Error revoking access:', error);
    throw error;
  }
};

/**
 * Get list of adults who have access to my children
 */
export const getSharedAccessList = async (userId) => {
  try {
    const sharedAccessRef = collection(db, 'consumerProfiles', userId, 'sharedAccess');
    const snapshot = await getDocs(sharedAccessRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting shared access list:', error);
    throw error;
  }
};

/**
 * Check if user has access to a specific child
 */
export const hasAccessToChild = async (userId, ownerId, childId) => {
  try {
    // Check if user is the owner
    if (userId === ownerId) {
      return true;
    }

    // Check if user has been granted access
    const accessDoc = await getDoc(
      doc(db, 'consumerProfiles', ownerId, 'sharedAccess', userId)
    );

    if (!accessDoc.exists()) {
      return false;
    }

    const accessData = accessDoc.data();
    return (
      accessData.status === 'active' &&
      accessData.childrenIds.includes(childId)
    );
  } catch (error) {
    console.error('Error checking child access:', error);
    return false;
  }
};

/**
 * Update shared children list (add/remove children from existing access)
 */
export const updateSharedChildren = async (ownerId, partnerId, childrenIds) => {
  try {
    const batch = writeBatch(db);

    // Update owner's sharedAccess
    const sharedAccessRef = doc(
      db,
      'consumerProfiles',
      ownerId,
      'sharedAccess',
      partnerId
    );
    batch.update(sharedAccessRef, {
      childrenIds: childrenIds
    });

    // Update partner's accessToChildren
    const accessToChildrenRef = doc(
      db,
      'consumerProfiles',
      partnerId,
      'accessToChildren',
      ownerId
    );
    batch.update(accessToChildrenRef, {
      childrenIds: childrenIds
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating shared children:', error);
    throw error;
  }
};
