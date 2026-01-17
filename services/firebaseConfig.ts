
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBx_xcLimr7FYzg-9IiRTXMKgV87TYxZNg",
  authDomain: "explora-ddc06.firebaseapp.com",
  projectId: "explora-ddc06",
  storageBucket: "explora-ddc06.firebasestorage.app",
  messagingSenderId: "819665739892",
  appId: "1:819665739892:web:34a54925303293b965f121",
  measurementId: "G-9LYG0GK4LD"
};

// Initialize Firebase only if not already initialized
let app: FirebaseApp;
const apps = getApps();
if (apps.length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = apps[0];
}

// Initialize services immediately to ensure they are available
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage, firebaseConfig };