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
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

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
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: { xs: '100%', sm: 420 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid #e5e7eb' }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 2, md: 3 } }}>
          <img src={logo} alt="Logo" style={{ height: 60, width: "auto" }} />
        </Box>

        <Typography variant="h5" align="center" sx={{ mb: { xs: 2, md: 3 }, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
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

        <Divider sx={{ my: { xs: 1.5, md: 2 } }}>or</Divider>

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
