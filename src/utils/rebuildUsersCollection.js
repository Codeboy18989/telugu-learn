/**
 * Utility to rebuild the entire users collection after accidental deletion
 *
 * This script will:
 * 1. Get all Firebase Auth users
 * 2. Determine each user's role from their data in organizations or consumer profiles
 * 3. Recreate their user document in Firestore
 *
 * Usage: Call from System Maintenance page as super admin
 */

import { doc, setDoc, serverTimestamp, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { USER_ROLES } from '../services/userService';

/**
 * Rebuild the entire users collection by scanning Firebase Auth and other collections
 * @param {function} getAuth - Firebase Auth instance
 * @param {function} getAuthUsersList - Function to get all Firebase Auth users (admin SDK needed)
 */
export const rebuildUsersCollection = async (authUsers) => {
  const results = {
    total: 0,
    created: 0,
    skipped: 0,
    errors: [],
    usersByRole: {
      super_admin: 0,
      consumer: 0,
      teacher: 0,
      school_admin: 0
    }
  };

  try {
    // First, we need to identify each user's role
    // 1. Check if user is in any organization's admins subcollection (B2B)
    // 2. Check if user has a consumer profile (B2C)
    // 3. First user we find should be super admin

    const organizations = await getDocs(collection(db, 'organizations'));
    const consumerProfiles = await getDocs(collection(db, 'consumerProfiles'));

    // Build maps of user roles
    const userRoleMap = new Map();
    const userOrgMap = new Map();
    const userDetailsMap = new Map();

    // Scan organizations for B2B users
    for (const orgDoc of organizations.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();

      const adminsSnapshot = await getDocs(
        collection(db, 'organizations', orgId, 'admins')
      );

      for (const adminDoc of adminsSnapshot.docs) {
        const userId = adminDoc.id;
        const adminData = adminDoc.data();

        // Determine role based on organization type
        const role = orgData.type === 'school' ? USER_ROLES.SCHOOL_ADMIN : USER_ROLES.TEACHER;

        userRoleMap.set(userId, role);
        userOrgMap.set(userId, orgId);
        userDetailsMap.set(userId, {
          email: adminData.email,
          displayName: adminData.displayName
        });
      }
    }

    // Scan consumer profiles for B2C users
    for (const profileDoc of consumerProfiles.docs) {
      const userId = profileDoc.id;

      if (!userRoleMap.has(userId)) {
        userRoleMap.set(userId, USER_ROLES.CONSUMER);
        userOrgMap.set(userId, null);
      }
    }

    // Determine super admin (first user in the system)
    // We'll use the earliest createdAt from Firebase Auth
    let superAdminId = null;
    let earliestCreation = null;

    for (const user of authUsers) {
      const createdAt = new Date(user.metadata.creationTime);
      if (!earliestCreation || createdAt < earliestCreation) {
        earliestCreation = createdAt;
        superAdminId = user.uid;
      }

      // Store email and display name from Auth if not in our map
      if (!userDetailsMap.has(user.uid)) {
        userDetailsMap.set(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User'
        });
      }
    }

    // Set super admin role
    if (superAdminId) {
      userRoleMap.set(superAdminId, USER_ROLES.SUPER_ADMIN);
      userOrgMap.set(superAdminId, null);
    }

    // Now recreate user documents for all Firebase Auth users
    for (const user of authUsers) {
      results.total++;

      try {
        const userId = user.uid;

        // Check if user document already exists (shouldn't, but just in case)
        const existingDoc = await getDoc(doc(db, 'users', userId));
        if (existingDoc.exists()) {
          results.skipped++;
          continue;
        }

        // Get role and organization
        const role = userRoleMap.get(userId) || USER_ROLES.CONSUMER;
        const organizationId = userOrgMap.get(userId) || null;
        const details = userDetailsMap.get(userId);

        // Create user document
        const userDoc = {
          email: details?.email || user.email || '',
          displayName: details?.displayName || user.displayName || user.email?.split('@')[0] || 'User',
          role: role,
          organizationId: organizationId,
          createdAt: serverTimestamp(),
          lastLoginAt: null
        };

        await setDoc(doc(db, 'users', userId), userDoc);

        results.created++;
        results.usersByRole[role]++;

        console.log(`✓ Created user document for ${userId} (${role})`);
      } catch (error) {
        console.error(`✗ Error creating user document for ${user.uid}:`, error);
        results.errors.push({
          userId: user.uid,
          email: user.email,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error rebuilding users collection:', error);
    throw error;
  }
};

/**
 * Get all Firebase Auth users (client-side approach)
 * Note: This requires the user to provide Firebase Admin SDK or export Auth users
 */
export const getAuthUsersClientSide = async (auth) => {
  // Unfortunately, Firebase Client SDK doesn't provide a way to list all users
  // This needs to be done via Firebase Admin SDK or Firebase Console

  throw new Error(
    'Cannot list Firebase Auth users from client-side code. ' +
    'You need to either:\n' +
    '1. Export users from Firebase Console (Authentication > Users > Export)\n' +
    '2. Use the manual recovery form to add users one by one'
  );
};

/**
 * Manual recovery: Create a single user document from known information
 */
export const createUserDocumentManual = async (userId, userData) => {
  try {
    const { email, displayName, role, organizationId } = userData;

    // Validate required fields
    if (!email || !role) {
      throw new Error('Email and role are required');
    }

    // Validate role
    const validRoles = Object.values(USER_ROLES);
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check if document already exists
    const existingDoc = await getDoc(doc(db, 'users', userId));
    if (existingDoc.exists()) {
      return { success: false, message: 'User document already exists' };
    }

    // Create user document
    const userDoc = {
      email: email,
      displayName: displayName || email.split('@')[0],
      role: role,
      organizationId: organizationId || null,
      createdAt: serverTimestamp(),
      lastLoginAt: null
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    console.log(`✓ Created user document for ${userId} (${role})`);
    return { success: true, message: 'User document created successfully' };
  } catch (error) {
    console.error('Error creating user document:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auto-recover from known data sources
 * This scans organizations and consumer profiles to recreate user documents
 */
export const autoRecoverUsersCollection = async () => {
  const results = {
    scanned: 0,
    created: 0,
    errors: []
  };

  try {
    // Step 1: Recover B2B users from organizations
    const organizations = await getDocs(collection(db, 'organizations'));

    let firstUserId = null;
    let earliestDate = null;

    for (const orgDoc of organizations.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();

      const adminsSnapshot = await getDocs(
        collection(db, 'organizations', orgId, 'admins')
      );

      for (const adminDoc of adminsSnapshot.docs) {
        results.scanned++;
        const userId = adminDoc.id;
        const adminData = adminDoc.data();

        // Track earliest user for super admin
        const addedAt = adminData.addedAt?.toDate();
        if (!earliestDate || (addedAt && addedAt < earliestDate)) {
          earliestDate = addedAt;
          firstUserId = userId;
        }

        // Determine role based on organization type
        const role = orgData.type === 'school' ? USER_ROLES.SCHOOL_ADMIN : USER_ROLES.TEACHER;

        const result = await createUserDocumentManual(userId, {
          email: adminData.email,
          displayName: adminData.displayName,
          role: role,
          organizationId: orgId
        });

        if (result.success) {
          results.created++;
        } else if (result.error) {
          results.errors.push({ userId, error: result.error });
        }
      }
    }

    // Step 2: Recover B2C consumers from consumer profiles
    const consumerProfiles = await getDocs(collection(db, 'consumerProfiles'));

    for (const profileDoc of consumerProfiles.docs) {
      results.scanned++;
      const userId = profileDoc.id;

      // Check if this user already has a document (might be B2B user)
      const existingDoc = await getDoc(doc(db, 'users', userId));
      if (existingDoc.exists()) {
        continue;
      }

      // Note: We don't have email stored in consumer profiles
      // This is a limitation - users will get placeholder emails
      const result = await createUserDocumentManual(userId, {
        email: `recovered-user-${userId}@placeholder.com`, // User will need to update
        displayName: 'Recovered Consumer',
        role: USER_ROLES.CONSUMER,
        organizationId: null
      });

      if (result.success) {
        results.created++;
      } else if (result.error) {
        results.errors.push({ userId, error: result.error });
      }
    }

    // Step 3: Set first user as super admin
    if (firstUserId) {
      try {
        const userDocRef = doc(db, 'users', firstUserId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          await setDoc(userDocRef, { role: USER_ROLES.SUPER_ADMIN }, { merge: true });
          console.log(`✓ Set ${firstUserId} as super admin`);
        }
      } catch (error) {
        console.error('Error setting super admin:', error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error auto-recovering users:', error);
    throw error;
  }
};
