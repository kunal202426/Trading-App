
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBb7X-b5DkF8BgLBxXsJT936FDHTT2Jbck",
  authDomain: "yes-market-34bf6.firebaseapp.com",
  projectId: "yes-market-34bf6",
  storageBucket: "yes-market-34bf6.firebasestorage.app",
  messagingSenderId: "999980379983",
  appId: "1:999980379983:web:75ec808c3d36dcc2395f3a",
  measurementId: "G-4NTV2VGCDX"
};

const app        = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
