import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  resetPassword,
  getUserData,
  updateUserGameState,
  updateUserSettings
} from './firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user data from Firestore
        const { data, error } = await getUserData(firebaseUser.uid);
        if (data) {
          setUserData(data);
        } else if (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const result = await signInWithEmail(email, password);
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const signup = async (email, password) => {
    setAuthError(null);
    const result = await signUpWithEmail(email, password);
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const logout = async () => {
    const result = await logOut();
    if (result.success) {
      setUserData(null);
    }
    return result;
  };

  const forgotPassword = async (email) => {
    setAuthError(null);
    const result = await resetPassword(email);
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const saveGameState = async (gameState) => {
    if (user) {
      await updateUserGameState(user.uid, gameState);
      setUserData(prev => ({ ...prev, gameState }));
    }
  };

  const saveSettings = async (settings) => {
    if (user) {
      await updateUserSettings(user.uid, settings);
      setUserData(prev => ({ ...prev, settings }));
    }
  };

  const refreshUserData = async () => {
    if (user) {
      const { data } = await getUserData(user.uid);
      if (data) {
        setUserData(data);
      }
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    userData,
    loading,
    authError,
    login,
    signup,
    loginWithGoogle,
    logout,
    forgotPassword,
    saveGameState,
    saveSettings,
    refreshUserData,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
