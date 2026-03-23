import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import MagneticButton from "../components/ui/MagneticButton";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/portfolio");
    } catch (err) {
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
      await signInWithPopup(auth, provider);
      navigate("/portfolio");
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch {
          setError("Google sign-in was blocked. Please allow popups and try again.");
        }
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase Auth sett ings.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled in Firebase Authentication.");
      } else {
        setError("Google sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f3f4f6",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ position: "absolute", top: { xs: 14, sm: 18 }, left: { xs: 14, sm: 18 }, zIndex: 2 }}>
        <MagneticButton type="button" arrow="←" onClick={handleBack} style={{ padding: "8px 12px", fontSize: 12 }}>
          Back
        </MagneticButton>

        
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: { xs: '100%', sm: 420 },
          borderRadius: { xs: 2, sm: 3 },
          border: '1px solid #e5e7eb',
          transformOrigin: 'center top',
          willChange: 'transform, box-shadow',
          animation: 'authCardFloat3d 7.2s ease-in-out infinite',
          '@keyframes authCardFloat3d': {
            '0%': {
              transform: 'translateY(0px)',
              boxShadow: '0 8px 20px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)',
            },
            '50%': {
              transform: 'translateY(-6px)',
              boxShadow: '0 20px 38px rgba(15,23,42,0.16), 0 8px 16px rgba(15,23,42,0.10)',
            },
            '100%': {
              transform: 'translateY(0px)',
              boxShadow: '0 8px 20px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)',
            },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 2, md: 3 } }}>
          <img src={logo} alt="Logo" style={{ height: 60, width: "auto" }} />
        </Box>

        <Typography variant="h5" align="center" sx={{ mb: { xs: 2, md: 3 }, fontWeight: 1000, color: '#0f172a', fontSize: { xs: '2.3rem', sm: '2.3em' } }}>
          Login
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <Box
              sx={{
                mt: 1,
                p: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                border: "1px solid #fecaca",
                bgcolor: "#fee2e2",
                color: "#b91c1c",
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
              }}
            >
              {error}
            </Box>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <Divider sx={{ my: { xs: 1.5, md: 2 } }}>OR</Divider>

        <Button
          fullWidth
          variant="outlined"
          onClick={handleGoogleLogin}
          disabled={loading}
          size="large"
          sx={{ mb: 1 }}
        >
          Sign in with Google
        </Button>

        <Button
          fullWidth
          variant="text"
          size="large"
          onClick={() => navigate("/signup")}
          sx={{ color: '#1976d2' }}
        >
          Create Account
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;
