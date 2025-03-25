import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7W0uQjhuwPt-U4F3G3KDXsxcDoyWQi8U",
  authDomain: "yotto-stones.firebaseapp.com",
  databaseURL: "https://yotto-stones-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yotto-stones",
  storageBucket: "yotto-stones.firebasestorage.app",
  messagingSenderId: "704694256738",
  appId: "1:704694256738:web:e5d1195ee60eb8db16bd3b"
};

// Ensure Firebase is initialized only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage };
