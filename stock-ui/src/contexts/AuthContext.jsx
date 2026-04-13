import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);
const SESSION_DURATION = 2 * 60 * 1000; // 2 minutes
const LOGIN_TIMESTAMP_KEY = "loginTimestamp";

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const loginTime = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
        const now = Date.now();

        // Check if session expired
        if (loginTime && (now - parseInt(loginTime)) > SESSION_DURATION) {
          signOut(auth);
          localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
          setUser(null);
        } else {
          setUser(firebaseUser);
          // Set/refresh login timestamp
          if (!loginTime) {
            localStorage.setItem(LOGIN_TIMESTAMP_KEY, now.toString());
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = () => {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
