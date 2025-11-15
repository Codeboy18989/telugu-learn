import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace these with your Firebase project credentials
// Get these from: Firebase Console > Project Settings > Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyCYWaYrbEw406SNgiMFZpm_U84MrKEfW1w",
  authDomain: "telugu-learn-19045.firebaseapp.com",
  projectId: "telugu-learn-19045",
  storageBucket: "telugu-learn-19045.firebasestorage.app",
  messagingSenderId: "840591236278",
  appId: "1:840591236278:web:45451910b969709c5bda17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
