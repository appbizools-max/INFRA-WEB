import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCa2l_OuSqRygbCUiFND6hVA6sxwSG4rCE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "infraops360-2c3d9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "infraops360-2c3d9",
  storageBucket: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "infraops360-2c3d9") + ".firebasestorage.app",
  messagingSenderId: "547233108897",
  appId: "1:547233108897:web:4838f3c6cd2aad0272f1e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
