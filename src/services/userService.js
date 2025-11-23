import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// User roles
export const USER_ROLES = {
  CONSUMER: 'consumer',
  TEACHER: 'teacher',
  SCHOOL_ADMIN: 'school_admin',
  SUPER_ADMIN: 'super_admin'
};

/**
 * Check if this is the first user signup (auto super admin)
 */
export const isFirstUser = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking first user:', error);
    return false;
  }
};

/**
 * Create user document after signup
 * First user becomes super admin, subsequent users are consumers
 */
export const createUserDocument = async (userId, email, displayName = '') => {
  try {
    const firstUser = await isFirstUser();
    const role = firstUser ? USER_ROLES.SUPER_ADMIN : USER_ROLES.CONSUMER;

    const userDoc = {
      email,
      displayName,
      role,
      organizationId: null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    // Create consumer profile if this is a consumer
    if (role === USER_ROLES.CONSUMER) {
      await createConsumerProfile(userId);
    }

    return { role, organizationId: null };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

/**
 * Create consumer profile document
 */
const createConsumerProfile = async (userId) => {
  try {
    const profileDoc = {
      phoneNumber: '',
      preferences: {},
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'consumerProfiles', userId), profileDoc);
  } catch (error) {
    console.error('Error creating consumer profile:', error);
    throw error;
  }
};

/**
 * Get user data including role and organization
 */
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userId,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      lastLoginAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

/**
 * Create organization user (teacher or school admin)
 * Only super admin can call this
 */
export const createOrganizationUser = async (userData) => {
  const {
    email,
    displayName,
    role, // 'teacher' or 'school_admin'
    organizationId,
    username,
    temporaryPassword
  } = userData;

  try {
    // Note: Firebase Auth user creation must be handled separately
    // This only creates the Firestore documents

    const userDoc = {
      email,
      displayName,
      role,
      organizationId,
      createdAt: serverTimestamp(),
      lastLoginAt: null
    };

    // Create user document
    // Note: userId should be the Firebase Auth UID
    // This will be handled in the component after Firebase Auth user creation

    return userDoc;
  } catch (error) {
    console.error('Error preparing organization user:', error);
    throw error;
  }
};

/**
 * Get all users (super admin only)
 */
export const getAllUsers = async (filters = {}) => {
  try {
    let usersQuery = collection(db, 'users');

    // Apply filters if provided
    if (filters.role) {
      usersQuery = query(usersQuery, where('role', '==', filters.role));
    }
    if (filters.organizationId) {
      usersQuery = query(usersQuery, where('organizationId', '==', filters.organizationId));
    }

    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Update user role (super admin only)
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Check if user has permission for an action
 */
export const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    [USER_ROLES.SUPER_ADMIN]: 4,
    [USER_ROLES.SCHOOL_ADMIN]: 3,
    [USER_ROLES.TEACHER]: 2,
    [USER_ROLES.CONSUMER]: 1
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
