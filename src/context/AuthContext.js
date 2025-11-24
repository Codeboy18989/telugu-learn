import React, { useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  createUserDocument,
  getUserData,
  updateLastLogin,
  USER_ROLES
} from '../services/userService';
import { getOrganization } from '../services/organizationService';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationBranding, setOrganizationBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Signup (B2C consumers only)
  async function signup(email, password, displayName = '') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create user document (first user becomes super admin)
      const userData = await createUserDocument(userId, email, displayName);

      setUserRole(userData.role);
      setOrganizationId(userData.organizationId);

      return userCredential;
    } catch (err) {
      console.error('Error during signup:', err);
      throw err;
    }
  }

  // Login
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (err) {
      console.error('Error during login:', err);
      throw err;
    }
  }

  // Logout
  async function logout() {
    try {
      setUserRole(null);
      setOrganizationId(null);
      setOrganizationBranding(null);
      return signOut(auth);
    } catch (err) {
      console.error('Error during logout:', err);
      throw err;
    }
  }

  // Load user data and organization branding
  async function loadUserData(userId) {
    try {
      const userData = await getUserData(userId);

      if (!userData) {
        console.error('User data not found for:', userId);
        setError(
          new Error(
            'Your account is missing required data. This may happen with older accounts. ' +
            'Please contact support or the administrator to fix your account. ' +
            `User ID: ${userId}`
          )
        );
        setUserRole(null);
        setOrganizationId(null);
        setOrganizationBranding(null);
        // Sign out the user to prevent app errors
        await signOut(auth);
        return;
      }

      setUserRole(userData.role);
      setOrganizationId(userData.organizationId);

      // Update last login
      await updateLastLogin(userId);

      // Load organization branding if user belongs to an organization
      if (userData.organizationId) {
        try {
          const org = await getOrganization(userData.organizationId);
          setOrganizationBranding(org.branding);
        } catch (err) {
          console.error('Error loading organization branding:', err);
          setOrganizationBranding(null);
        }
      } else {
        setOrganizationBranding(null);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setUserRole(null);
      setOrganizationId(null);
      setOrganizationBranding(null);
    }
  }

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async user => {
        setCurrentUser(user);
        if (user) {
          await loadUserData(user.uid);
        } else {
          setUserRole(null);
          setOrganizationId(null);
          setOrganizationBranding(null);
        }
        setLoading(false);
      },
      error => {
        setError(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Role checking helper functions
  const isConsumer = userRole === USER_ROLES.CONSUMER;
  const isTeacher = userRole === USER_ROLES.TEACHER;
  const isSchoolAdmin = userRole === USER_ROLES.SCHOOL_ADMIN;
  const isSuperAdmin = userRole === USER_ROLES.SUPER_ADMIN;
  const isB2BUser = isTeacher || isSchoolAdmin;

  const value = {
    currentUser,
    userRole,
    organizationId,
    organizationBranding,
    signup,
    login,
    logout,
    error,
    // Helper flags
    isConsumer,
    isTeacher,
    isSchoolAdmin,
    isSuperAdmin,
    isB2BUser,
    // Reload user data (useful after profile updates)
    reloadUserData: () => loadUserData(currentUser?.uid)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
