"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { backendPath } from "@/services/backend";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isSignup) {
      if (!name.trim()) return setError("Please enter your name.");
      if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email address.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
    } else {
      if (!username.trim()) return setError("Please enter your username or email.");
      if (!password) return setError("Please enter your password.");
    }

    setLoading(true);

    try {
      if (isSignup) {
        await api.auth.signup({
          name: name.trim(),
          email: email.trim(),
          username: username.trim() || undefined,
          password,
        });
        setSuccess("Account created successfully! Redirecting...");
      } else {
        await api.auth.signin(username.trim(), password);
        setSuccess("Signed in successfully! Redirecting...");
      }

      setTimeout(() => {
        // Hard refresh so navbar and cookies re-sync across ports
        window.location.href = "/listings";
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please check your details and try again.");
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[460px] rounded-[28px] border border-slate-300/30 bg-white/95 p-8 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
        <p className="text-xs font-bold tracking-widest text-teal-700 uppercase">
          {isSignup ? "Create account" : "Welcome back"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          {isSignup ? "Register Now" : "Login Now"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {isSignup
            ? "Create your account to publish room listings and manage your properties."
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
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1.5 h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 px-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
              />
            </label>
          )}

          {isSignup && (
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Email Address *
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1.5 h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 px-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
              />
            </label>
          )}

          <label className="block text-xs font-bold text-slate-700 uppercase">
            {isSignup ? "Username (Optional)" : "Username or Email *"}
            <input
              required={!isSignup}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isSignup ? "Choose a username" : "Enter username or email"}
              className="mt-1.5 h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 px-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase">
            Password *
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "Create a secure password" : "Enter your password"}
              className="mt-1.5 h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 px-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
            />
          </label>

          <button
            type="submit"
            disabled={loading || Boolean(success)}
            className="mt-2 h-12 w-full rounded-2xl bg-teal-700 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600 sm:text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            href={isSignup ? "/signin" : "/signup"}
            className="font-bold text-teal-700 hover:text-teal-800"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400 uppercase before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
          or continue with
        </div>

        {/* Google OAuth Button with official 4-colored SVG */}
        <a
          href={backendPath("/auth/google")}
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
    </section>
  );
}
