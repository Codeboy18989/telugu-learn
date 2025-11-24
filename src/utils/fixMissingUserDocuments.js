/**
 * Utility to fix users who have Firebase Auth accounts but missing Firestore user documents
 * This can happen if users were created before the user document creation code was added
 *
 * Usage:
 * 1. Import this function in a component (e.g., super admin dashboard)
 * 2. Call fixMissingUserDocuments() to scan and fix all users
 * 3. Or call fixSingleUserDocument(userId, userData) for a specific user
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fix a single user's missing document
 * @param {string} userId - Firebase Auth UID
 * @param {object} userData - User data from organization's admins collection
 */
export const fixSingleUserDocument = async (userId, userData) => {
  try {
    // Check if user document already exists
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists()) {
      console.log(`User document already exists for ${userId}`);
      return { success: true, message: 'Document already exists' };
    }

    // If we don't have userData, we need to find it from organizations
    if (!userData) {
      throw new Error('User data not provided and could not be found');
    }

    // Create the missing user document
    const newUserDoc = {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      organizationId: userData.organizationId,
      createdAt: serverTimestamp(),
      lastLoginAt: null
    };

    await setDoc(doc(db, 'users', userId), newUserDoc);

    console.log(`Successfully created user document for ${userId}`);
    return { success: true, message: 'User document created successfully' };
  } catch (error) {
    console.error(`Error fixing user document for ${userId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Scan all organizations and fix missing user documents for their admins/teachers
 */
export const fixAllMissingUserDocuments = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');

    const results = {
      scanned: 0,
      fixed: 0,
      errors: []
    };

    // Get all organizations
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;

      // Get all admins/teachers in this organization
      const adminsSnapshot = await getDocs(
        collection(db, 'organizations', orgId, 'admins')
      );

      for (const adminDoc of adminsSnapshot.docs) {
        results.scanned++;
        const userId = adminDoc.id;
        const adminData = adminDoc.data();

        // Determine role from organization type
        const orgData = orgDoc.data();
        const role = orgData.type === 'school' ? 'school_admin' : 'teacher';

        const userData = {
          email: adminData.email,
          displayName: adminData.displayName,
          role: role,
          organizationId: orgId
        };

        const result = await fixSingleUserDocument(userId, userData);

        if (result.success && result.message === 'User document created successfully') {
          results.fixed++;
        } else if (!result.success) {
          results.errors.push({ userId, error: result.error });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error scanning for missing user documents:', error);
    throw error;
  }
};

/**
 * Quick fix function to call from browser console for a specific user
 * Example: window.fixUserDoc('klarPG8UzwfjmkmXqEOfop0Q6h73', 'orgId')
 */
export const createQuickFix = (userId, organizationId) => {
  return async (role = 'school_admin', email = '', displayName = '') => {
    if (!email) {
      console.error('Email is required');
      return;
    }

    const userData = {
      email,
      displayName: displayName || email.split('@')[0],
      role,
      organizationId
    };

    const result = await fixSingleUserDocument(userId, userData);
    console.log(result);
    return result;
  };
};
