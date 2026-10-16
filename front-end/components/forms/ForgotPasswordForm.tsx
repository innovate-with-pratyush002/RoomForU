"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  KeyRound,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  ShieldCheck,
  Check
} from "lucide-react";
import { api } from "@/lib/api";

export function ForgotPasswordForm() {
  // Step: 1 = Request OTP, 2 = Verify OTP, 3 = Set New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Input states
  const [identifier, setIdentifier] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return setError("Please enter your registered email address or username.");
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.auth.requestPasswordResetOtp(identifier.trim());

      setTargetEmail(res.targetEmail || identifier.trim().toLowerCase());
      setEmailMasked(res.emailMasked || (identifier.includes("@") ? identifier.trim() : "your registered email"));
      setStep(2);
      setResendCooldown(60);
      setSuccess(res.message || "A 6-digit verification code has been dispatched.");
      setLoading(false);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err?.message || "Failed to request password reset code. Please try again.");
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index: number, val: string) => {
    const cleanDigit = val.replace(/\D/g, "");
    if (!cleanDigit && val !== "") return;

    const newValues = [...otpValues];
    newValues[index] = cleanDigit.slice(-1);
    setOtpValues(newValues);

    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

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

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || "";
    }
    setOtpValues(newValues);

    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      return setError("Please enter the complete 6-digit verification code.");
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.auth.verifyPasswordResetOtp({
        email: targetEmail,
        otp,
      });

      setResetToken(res.resetToken);
      setStep(3);
      setSuccess("Code verified! You can now set your new password.");
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code. Please try again.");
      setLoading(false);
    }
  };

  // Resend Password Reset OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      const res = await api.auth.resendPasswordResetOtp(targetEmail);
      setSuccess(res.message || "A new verification code has been sent to your email.");
      setResendCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend reset code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Step 3: Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) return setError("Please enter a new password.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters long.");
    if (newPassword.length > 128) return setError("Password must not exceed 128 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.auth.confirmPasswordReset({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setStep(4);
      setSuccess(res.message || "Password reset successfully!");
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. The link or token may have expired.");
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[460px] rounded-[28px] border border-slate-300/30 bg-white/95 p-8 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800">
            <ShieldCheck size={13} className="text-teal-600" />
            {step === 4 ? "Complete" : `Step ${step} of 3`}
          </span>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && step !== 4 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: Enter Username or Email */}
        {step === 1 && (
          <div>
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-xs">
              <KeyRound size={26} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900 text-center">Forgot Password?</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 text-center">
              Enter your registered username or email address and we will send you a 6-digit verification code.
            </p>

            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Username or Email *
                <div className="relative mt-1.5">
                  <input
                    required
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or username"
                    className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-4 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                  <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="mt-2 h-12 w-full rounded-2xl bg-teal-700 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                {loading ? "Sending Verification Code..." : "Send Verification Code"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Enter Verification Code */}
        {step === 2 && (
          <div>
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-xs">
              <Mail size={26} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900 text-center">Enter Verification Code</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 text-center">
              We sent a 6-digit verification code to:
            </p>
            <p className="font-bold text-sm text-teal-800 text-center">{emailMasked}</p>

            <form onSubmit={handleVerifyOtp} className="mt-6">
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
                {loading ? "Verifying Code..." : "Verify Code"}
              </button>

              <div className="mt-5 text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Didn&apos;t receive code? Resend in{" "}
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

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Change username or email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <div>
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-xs">
              <Lock size={26} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900 text-center">Create New Password</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 text-center">
              Your identity has been verified. Choose a secure new password for your RoomForU account.
            </p>

            <form onSubmit={handleSetNewPassword} className="mt-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  New Password *
                </label>
                <div className="relative mt-1.5">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-11 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                  <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Confirm New Password *
                </label>
                <div className="relative mt-1.5">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 pl-11 pr-11 text-sm font-normal text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
                  />
                  <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Password checks preview */}
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Check
                    size={13}
                    className={newPassword.length >= 6 ? "text-emerald-600 font-bold" : "text-slate-300"}
                  />
                  <span>At least 6 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check
                    size={13}
                    className={newPassword && newPassword === confirmPassword ? "text-emerald-600 font-bold" : "text-slate-300"}
                  />
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || newPassword !== confirmPassword}
                className="mt-2 h-12 w-full rounded-2xl bg-teal-700 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                {loading ? "Resetting Password..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <div className="text-center py-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-xs">
              <CheckCircle size={36} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Password Reset Successful!</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your password has been securely updated. All active sessions have been invalidated. You can now log in with your new password.
            </p>

            <Link
              href="/signin"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-teal-700 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
