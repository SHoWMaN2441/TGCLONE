import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAfG-draAN10d8o-p2fB89Gkux191R57xQ",
  authDomain: "davron-b9001.firebaseapp.com",
  projectId: "davron-b9001",
  storageBucket: "davron-b9001.firebasestorage.app",
  messagingSenderId: "250452134364",
  appId: "1:250452134364:web:406e04466921a6badda719",
  databaseUrl: "https://davron-b9001-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const database = getDatabase(app);
