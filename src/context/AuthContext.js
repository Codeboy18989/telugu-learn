import React, { useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Signup
  async function signup(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create parent document in Firestore
    await setDoc(doc(db, 'parents', userCredential.user.uid), {
      email: email,
      isSuperAdmin: false,
      createdAt: new Date()
    });
    return userCredential;
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Check if user is super admin
  async function checkSuperAdmin(userId) {
    try {
      const parentDoc = await getDoc(doc(db, 'parents', userId));
      if (parentDoc.exists()) {
        return parentDoc.data().isSuperAdmin || false;
      }
      return false;
    } catch (err) {
      console.error('Error checking super admin status:', err);
      return false;
    }
  }

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        const isAdmin = await checkSuperAdmin(user.uid);
        setIsSuperAdmin(isAdmin);
      } else {
        setIsSuperAdmin(false);
      }
      setLoading(false);
    }, error => {
      setError(error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isSuperAdmin,
    signup,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
