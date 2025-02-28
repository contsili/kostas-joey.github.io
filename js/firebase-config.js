// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD1nnM8PbImTnRPdr6O2Nkcsm_6k22XHBo",
  authDomain: "foosball-elo-53e01.firebaseapp.com",
  projectId: "foosball-elo-53e01",
  storageBucket: "foosball-elo-53e01.firebasestorage.app",
  messagingSenderId: "520975826180",
  appId: "1:520975826180:web:58daa9f0fc6327a0036451"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update };
