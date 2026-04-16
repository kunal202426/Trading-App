"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail, Sparkles } from "lucide-react";

import { AuthCharactersScene } from "@/components/ui/auth-characters-scene";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AnimatedCharactersLoginPageProps {
  email: string;
  password: string;
  error?: string;
  isLoading?: boolean;
  logoSrc?: string;
  brandName?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  onBack?: () => void;
  onSignup?: () => void;
}

export function AnimatedCharactersLoginPage({
  email,
  password,
  error = "",
  isLoading = false,
  logoSrc,
  brandName = "YISIL",
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleLogin,
  onBack,
  onSignup,
}: AnimatedCharactersLoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const privateMode = password.length > 0 && showPassword;

  return (
    <div className="min-h-screen bg-[#f5f7ff]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#5f7bff] via-[#4361ee] to-[#2f46c6] p-12 text-white lg:flex">
          <div className="relative z-20 flex items-center gap-3 text-lg font-semibold">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              {logoSrc ? (
                <img src={logoSrc} alt={brandName} className="size-7 rounded-sm object-contain" />
              ) : (
                <Sparkles className="size-4" />
              )}
            </div>
            <span>{brandName}</span>
          </div>

          <div className="relative z-20 flex h-[500px] items-end justify-center">
            <AuthCharactersScene isTyping={isTyping} privateMode={privateMode} />
          </div>

          <div className="relative z-20 flex items-center gap-8 text-sm text-white/70">
            <button type="button" className="transition-colors hover:text-white">
              Privacy Policy
            </button>
            <button type="button" className="transition-colors hover:text-white">
              Terms of Service
            </button>
            <button type="button" className="transition-colors hover:text-white">
              Contact
            </button>
          </div>

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

        <div className="relative flex items-center justify-center bg-[#f5f7ff] p-6 sm:p-8">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="absolute left-4 top-4 h-9 gap-2 rounded-full border-border/70 bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}

          <div className="w-full max-w-[430px]">
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f7bff] via-[#4361ee] to-[#2f46c6] p-3 text-white shadow-sm lg:hidden">
              <div className="mb-3 flex items-center gap-2 text-base font-semibold">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                  {logoSrc ? (
                    <img src={logoSrc} alt={brandName} className="size-6 rounded-sm object-contain" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                </div>
                <span>{brandName}</span>
              </div>
              <div className="flex justify-center">
                <AuthCharactersScene compact isTyping={isTyping} privateMode={privateMode} />
              </div>
            </div>

            <div className="mb-10 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Please enter your details to continue</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anna@gmail.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => onEmailChange(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="h-12 border-border/60 bg-background focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => onPasswordChange(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                    className="h-12 border-border/60 bg-background pr-10 focus-visible:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                    Remember for 30 days
                  </Label>
                </div>
                <button type="button" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              ) : null}

              <Button type="submit" className="h-12 w-full text-base font-medium" size="lg" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Log in"}
              </Button>
            </form>

            <div className="mt-6">
              <Button
                variant="outline"
                className="h-12 w-full border-border/60 bg-background hover:bg-accent"
                type="button"
                disabled={isLoading}
                onClick={onGoogleLogin}
              >
                <Mail className="mr-2 size-5" />
                Log in with Google
              </Button>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={onSignup} className="font-medium text-foreground hover:underline">
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedCharactersLoginPage;
