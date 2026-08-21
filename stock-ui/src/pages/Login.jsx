import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { touchSession, clearLoginSession } from "../contexts/AuthContext";
import { queueTourAfterLogin, clearQueuedTour } from "../tour/tourSteps";
import { useAppStore } from "../store/useAppStore";
import logo from "../assets/logo.png";
import AnimatedCharactersLoginPage from "../components/ui/animated-characters-login-page";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      touchSession();
      await signInWithEmailAndPassword(auth, email, password);
      if (useAppStore.getState().recordLogin()) queueTourAfterLogin();
      navigate("/portfolio");
    } catch (err) {
      clearLoginSession();
      clearQueuedTour();
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      touchSession();
      await signInWithPopup(auth, provider);
      if (useAppStore.getState().recordLogin()) queueTourAfterLogin();
      navigate("/portfolio");
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
        try {
          const provider = new GoogleAuthProvider();
          touchSession();
          if (useAppStore.getState().recordLogin()) queueTourAfterLogin();
          await signInWithRedirect(auth, provider);
          return;
        } catch {
          clearLoginSession();
          clearQueuedTour();
          setError("Google sign-in was blocked. Please allow popups and try again.");
        }
      } else if (err.code === "auth/unauthorized-domain") {
        clearLoginSession();
        clearQueuedTour();
        setError("This domain is not authorized in Firebase Auth settings.");
      } else if (err.code === "auth/operation-not-allowed") {
        clearLoginSession();
        clearQueuedTour();
        setError("Google sign-in is not enabled in Firebase Authentication.");
      } else {
        clearLoginSession();
        clearQueuedTour();
        setError("Google sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedCharactersLoginPage
      brandName="YISIL"
      logoSrc={logo}
      email={email}
      password={password}
      error={error}
      isLoading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      onGoogleLogin={handleGoogleLogin}
      onBack={handleBack}
      onSignup={() => navigate("/signup")}
    />
  );
};

export default Login;
