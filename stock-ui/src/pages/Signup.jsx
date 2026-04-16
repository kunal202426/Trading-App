import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { markLoginSession, clearLoginSession } from "../contexts/AuthContext";
import { queueTourAfterLogin, clearQueuedTour } from "../tour/tourSteps";
import logo from "../assets/logo.png";
import { AuthCharactersScene } from "../components/ui/auth-characters-scene";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const Signup = () => {
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [isTyping, setIsTyping]       = useState(false);

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      markLoginSession();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      queueTourAfterLogin();
      navigate("/portfolio");
    } catch (err) {
      clearLoginSession();
      clearQueuedTour();
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/weak-password":
          setError("Password is too weak.");
          break;
        default:
          setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#5f7bff] via-[#4361ee] to-[#2f46c6] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="relative z-20 flex items-center gap-3 text-lg font-semibold">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <img src={logo} alt="YISIL" className="size-7 rounded-sm object-contain" />
            </div>
            <span>YISIL</span>
          </div>

          <div className="relative z-20 max-w-md space-y-6">
            <h2 className="text-4xl font-semibold leading-tight">Build your portfolio command center.</h2>
            <p className="text-white/80">
              Create an account to unlock live model insights, execution monitoring, and your personalized trading workspace.
            </p>
            <div className="space-y-3 text-sm text-white/85">
              <p>Real-time signal visibility</p>
              <p>Integrated risk and exposure snapshots</p>
              <p>Fast onboarding and guided first-tour experience</p>
            </div>
          </div>

          <div className="relative z-20 flex h-[320px] items-end justify-center">
            <AuthCharactersScene compact isTyping={isTyping} />
          </div>

          <div className="relative z-20 text-sm text-white/70">Designed for focused, data-first decision making.</div>

          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute right-1/4 top-1/4 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 size-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative flex items-center justify-center p-6 sm:p-8">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="absolute left-4 top-4 h-9 gap-2 rounded-full border-border/70 bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f7bff] via-[#4361ee] to-[#2f46c6] p-3 text-white shadow-sm lg:hidden">
              <div className="mb-3 flex items-center gap-2 text-base font-semibold">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                  <img src={logo} alt="YISIL" className="size-6 rounded-sm object-contain" />
                </div>
                <span>YISIL</span>
              </div>
              <div className="flex justify-center">
                <AuthCharactersScene compact isTyping={isTyping} />
              </div>
            </div>

            <div className="mb-8 flex items-center justify-center gap-3">
              <img src={logo} alt="YISIL" className="h-10 w-auto" />
              <span className="text-xl font-semibold text-slate-800">Create account</span>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Anna Erikson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anna@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              ) : null}

              <Button type="submit" className="mt-1 h-11 w-full text-base" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              className="mt-3 h-10 w-full"
              onClick={() => navigate("/login")}
            >
              Already have an account? Log in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
