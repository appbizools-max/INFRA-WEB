import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCa2l_OuSqRygbCUiFND6hVA6sxwSG4rCE",
  projectId: "infraops360-2c3d9",
  storageBucket: "infraops360-2c3d9.firebasestorage.app",
  appId: "1:547233108897:web:4838f3c6cd2aad0272f1e0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
