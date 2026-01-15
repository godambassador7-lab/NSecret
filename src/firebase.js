import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeWiqpdNm8Mjca7CL3FeTOngRM7UHF1rc",
  authDomain: "nsecret.firebaseapp.com",
  projectId: "nsecret",
  storageBucket: "nsecret.firebasestorage.app",
  messagingSenderId: "1065900715498",
  appId: "1:1065900715498:web:e48c5971332bf7b849d693",
  measurementId: "G-DJKNXRCK63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    let message = 'An error occurred during sign in.';
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    } else if (error.code === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    }
    return { user: null, error: message };
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    let message = 'An error occurred during sign up.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    }
    return { user: null, error: message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    let message = 'An error occurred.';
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    }
    return { success: false, error: message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Firestore functions
export const createUserDocument = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user document with initial game state
    const initialGameState = {
      rank: 0,
      integrity: 0,
      discipline: 0,
      courage: 0,
      humility: 0,
      consistency: 0,
      currentAct: null,
      completedToday: false,
      lastCompletedDate: null,
      narrativeState: 'encouraging',
      totalActs: 0,
      unseenActs: 0,
      history: [],
      completedMissions: [],
      missionInProgress: null
    };

    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      gameState: initialGameState,
      settings: {
        soundEnabled: false,
        dailyReminder: false,
        darkMode: false
      }
    });
  } else {
    // Update last login
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  }
};

export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { data: userSnap.data(), error: null };
    }
    return { data: null, error: 'User not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateUserGameState = async (userId, gameState) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      gameState: gameState,
      lastUpdated: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserSettings = async (userId, settings) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      settings: settings
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export { auth, db, onAuthStateChanged };
