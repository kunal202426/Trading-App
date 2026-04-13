import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);
const SESSION_DURATION = 2 * 60 * 1000; // 2 minutes
const LOGIN_TIMESTAMP_KEY = "loginTimestamp";

export function markLoginSession() {
  try {
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
  } catch {}
}

export function clearLoginSession() {
  try {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const loginTimeRaw = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
        const loginTime = Number(loginTimeRaw);
        const now = Date.now();

        // Require an explicit login session marker and enforce expiry.
        if (!loginTimeRaw || Number.isNaN(loginTime) || (now - loginTime) > SESSION_DURATION) {
          signOut(auth);
          clearLoginSession();
          setUser(null);
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        clearLoginSession();
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = () => {
    clearLoginSession();
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
