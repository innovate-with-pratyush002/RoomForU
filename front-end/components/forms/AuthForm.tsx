"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Mail,
  ArrowLeft,
  RotateCw,
  Lock,
  User as UserIcon,
  AtSign,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { api } from "@/lib/api";
import { backendPath } from "@/services/backend";
import { useAuth, broadcastAuthLogin } from "@/context/AuthContext";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const { refreshUser } = useAuth();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup OTP Verification State
  const [signupStep, setSignupStep] = useState<"form" | "otp">("form");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [returnToUrl, setReturnToUrl] = useState("/listings");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const target = params.get("returnTo");
      if (target && target.startsWith("/")) {
        setReturnToUrl(target);
      }
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle Form Submission (Sign in or Request Signup OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isSignup) {
      if (!name.trim()) return setError("Please enter your name.");
      if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email address.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password.length > 128) return setError("Password must not exceed 128 characters.");

      setLoading(true);
      try {
        const res = await api.auth.requestSignupOtp({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim() || undefined,
          password,
        });

        setSignupStep("otp");
        setOtpValues(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setSuccess(res.message || `A 6-digit verification code has been sent to ${email.trim()}.`);
        setLoading(false);

        // Auto focus first OTP digit input
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } catch (err: any) {
        setError(err?.message || "Failed to initiate signup. Please verify your details.");
        setLoading(false);
      }
    } else {
      // Normal Sign In
      if (!username.trim()) return setError("Please enter your username or email.");
      if (!password) return setError("Please enter your password.");
      if (password.length > 128) return setError("Password must not exceed 128 characters.");

      setLoading(true);
      try {
        await api.auth.signin(username.trim(), password);
        setSuccess("Signed in successfully! Redirecting...");

        await refreshUser();
        broadcastAuthLogin();

        setTimeout(() => {
          window.location.replace(returnToUrl);
        }, 500);
      } catch (err: any) {
        setError(err?.message || "Authentication failed. Please check your details and try again.");
        setLoading(false);
      }
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleanDigit = value.replace(/\D/g, "");
    if (!cleanDigit && value !== "") return;

    const newValues = [...otpValues];
    newValues[index] = cleanDigit.slice(-1);
    setOtpValues(newValues);

    // If digit entered, automatically focus next input box
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and Arrow keys in OTP inputs
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste in OTP box (e.g. user pastes 6-digit code)
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || "";
    }
    setOtpValues(newValues);

    // Focus last filled box or 6th box
    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Submit OTP for Signup Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      return setError("Please enter the complete 6-digit verification code.");
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.verifySignupOtp({
        email: email.trim().toLowerCase(),
        otp,
      });

      setSuccess(res.message || "Email verified! Account created successfully. Redirecting...");

      await refreshUser();
      broadcastAuthLogin();

      setTimeout(() => {
        window.location.replace(returnToUrl);
      }, 600);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code. Please try again.");
      setLoading(false);
    }
  };

  // Resend Signup OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      const res = await api.auth.resendSignupOtp(email.trim().toLowerCase());
      setSuccess(res.message || "A fresh verification code has been sent to your email.");
      setResendCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[460px] rounded-[28px] border border-slate-300/30 bg-white/95 p-8 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
        {/* Step 2: Signup OTP Verification Screen */}
        {isSignup && signupStep === "otp" ? (
          <div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSignupStep("form");
                  setError(null);
                  setSuccess(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
              >
                <ArrowLeft size={14} /> Back to details
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                <ShieldCheck size={13} className="text-teal-600" /> Step 2 of 2
              </span>
            </div>

            <div className="mt-5 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-xs">
                <Mail size={26} />
              </div>
              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Verify Your Email</h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                We sent a 6-digit verification code to:
              </p>
              <p className="font-bold text-sm text-teal-800">{email}</p>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                <CheckCircle size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-6">
              {/* 6 Digit OTP Inputs */}
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={loading}
                    className="size-12 rounded-xl border border-slate-300 bg-slate-50/60 text-center text-xl font-black text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/15 disabled:opacity-50"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpValues.join("").length !== 6}
                className="mt-6 h-12 w-full rounded-2xl bg-teal-700 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                {loading ? "Verifying & Creating Account..." : "Verify & Complete Signup"}
              </button>

              {/* Resend Code Section */}
              <div className="mt-5 text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Didn&apos;t receive code? Resend available in{" "}
                    <span className="font-bold text-teal-700 font-mono">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline disabled:opacity-50"
                  >
                    <RotateCw size={13} className={resending ? "animate-spin" : ""} />
                    {resending ? "Sending code..." : "Resend Verification Code"}
                  </button>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                Code expires in 10 minutes. Please check your spam folder if not received.
              </p>
            </form>
          </div>
        ) : (
          /* Step 1: Normal Sign In or Signup Form */
          <div>
            <p className="text-xs font-bold tracking-widest text-teal-700 uppercase">
              {isSignup ? "Create account" : "Welcome back"}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              {isSignup ? "Register Now" : "Login Now"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {isSignup
                ? "Enter your details to receive an email verification code and create your account."
                : "Sign in to manage your listings and explore student accommodations."}
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                <CheckCircle size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              {isSignup && (
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Full Name *
                  <div className="relative mt-1.5">
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                    />
                    <UserIcon size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </label>
              )}

              {isSignup && (
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Email Address *
                  <div className="relative mt-1.5">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                    />
                    <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </label>
              )}

              <label className="block text-xs font-bold text-slate-700 uppercase">
                {isSignup ? "Username (Optional)" : "Username or Email *"}
                <div className="relative mt-1.5">
                  <input
                    required={!isSignup}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={isSignup ? "Choose a username" : "Enter username or email"}
                    className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                  <AtSign size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </label>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Password *
                  </label>
                  {!isSignup && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline transition"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "Create a secure password" : "Enter your password"}
                    className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-11 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                  <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(success)}
                className="mt-2 h-12 w-full rounded-2xl bg-teal-700 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                {loading
                  ? isSignup
                    ? "Sending Verification Code..."
                    : "Signing in..."
                  : isSignup
                  ? "Continue to Email Verification"
                  : "Sign In"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-600 sm:text-sm">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <Link
                href={
                  isSignup
                    ? returnToUrl !== "/listings"
                      ? `/signin?returnTo=${encodeURIComponent(returnToUrl)}`
                      : "/signin"
                    : returnToUrl !== "/listings"
                    ? `/signup?returnTo=${encodeURIComponent(returnToUrl)}`
                    : "/signup"
                }
                className="font-bold text-teal-700 hover:text-teal-800"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </Link>
            </p>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400 uppercase before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
              or continue with
            </div>

            {/* Google OAuth Button */}
            <a
              href={backendPath(
                `/auth/google${returnToUrl !== "/listings" ? `?returnTo=${encodeURIComponent(returnToUrl)}` : ""}`
              )}
              aria-label="Continue with Google"
              title="Continue with Google"
              className="mx-auto flex size-12 items-center justify-center rounded-full border border-slate-300/50 bg-[#f8fbff] text-slate-900 shadow-xs transition hover:scale-105 hover:bg-white hover:shadow-md"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
