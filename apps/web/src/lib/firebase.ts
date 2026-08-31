import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // Placeholders for minimum config if not provided in env
  storageBucket: import.meta.env.VITE_FIREBASE_PROJECT_ID + ".firebasestorage.app",
  messagingSenderId: "547233108897",
  appId: "1:547233108897:web:4838f3c6cd2aad0272f1e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
