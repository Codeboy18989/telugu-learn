// UserModeContext - Manages user mode (family, teacher, friends)
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { getUserMode, setUserMode as saveUserMode } from '../services/learnerService';

const UserModeContext = createContext();

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error('useUserMode must be used within UserModeProvider');
  }
  return context;
}

export function UserModeProvider({ children }) {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState('family'); // 'family' | 'teacher' | 'friends'
  const [loading, setLoading] = useState(true);

  // Load user mode from Firebase
  useEffect(() => {
    async function loadUserMode() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userMode = await getUserMode(currentUser.uid);
        setMode(userMode);
      } catch (error) {
        console.error('Error loading user mode:', error);
        setMode('family'); // Default fallback
      } finally {
        setLoading(false);
      }
    }

    loadUserMode();
  }, [currentUser]);

  // Update mode in Firebase
  async function updateMode(newMode) {
    if (!currentUser) return;

    try {
      await saveUserMode(currentUser.uid, newMode);
      setMode(newMode);
    } catch (error) {
      console.error('Error updating mode:', error);
      throw error;
    }
  }

  const value = {
    mode,
    setMode: updateMode,
    loading,
    isFamily: mode === 'family',
    isTeacher: mode === 'teacher',
    isFriends: mode === 'friends'
  };

  return (
    <UserModeContext.Provider value={value}>
      {children}
    </UserModeContext.Provider>
  );
}
