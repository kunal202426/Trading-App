import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

// Idle timeout: sign out after this long with no user activity, not a fixed
// time since login. Refreshed continuously by touchSession() below.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_TOUCH_THROTTLE_MS = 15 * 1000;
const LAST_ACTIVITY_KEY = "lastActivityAt";

export function touchSession() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch {}
}

export function clearLoginSession() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isSessionExpired = useCallback(() => {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return true; // no activity marker — nothing to trust, require fresh login
    const last = Number(raw);
    return Number.isNaN(last) || Date.now() - last > IDLE_TIMEOUT_MS;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        if (isSessionExpired()) {
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
  }, [isSessionExpired]);

  // Refresh the activity marker on real user interaction (throttled so we're
  // not hitting localStorage on every mousemove).
  useEffect(() => {
    if (!user) return;
    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > ACTIVITY_TOUCH_THROTTLE_MS) {
        lastWrite = now;
        touchSession();
      }
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, [user]);

  // Periodic idle check so a genuinely abandoned tab still gets signed out
  // even with zero interaction (not just on the next auth-state event).
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        signOut(auth);
        clearLoginSession();
        setUser(null);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user, isSessionExpired]);

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
