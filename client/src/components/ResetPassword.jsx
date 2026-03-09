import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiFetchOrThrow } from "../utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      minLength: newPassword.length >= 6,
      matches: Boolean(confirmPassword) && newPassword === confirmPassword,
    }),
    [newPassword, confirmPassword],
  );

  const isSuccess = status.includes("✅");

  const onSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("❌ Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiFetchOrThrow(
        "/auth/reset-password",
        {
          method: "PUT",
          body: JSON.stringify({ token, newPassword }),
        },
        "Unable to reset password.",
      );

      setStatus(data?.message || "✅ Password successfully reset!");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CheckItem = ({ done, text }) => (
    <div className="flex items-center justify-center gap-2 text-sm">
      <span
        className={`inline-flex h-2.5 w-2.5 rounded-full ${
          done ? "bg-emerald-400" : "bg-white/35"
        }`}
        aria-hidden="true"
      />
      <span className={done ? "text-emerald-200" : "text-white/82"}>
        {text}
      </span>
    </div>
  );

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-900"
      style={{
        backgroundImage: "url('/images/edusync-auth-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-slate-900/28" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/18 via-slate-800/12 to-cyan-900/22" />

      <div
        className="pointer-events-none absolute left-6 top-8 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl sm:h-64 sm:w-64"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl sm:h-64 sm:w-64"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/25 bg-white/12 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:grid-cols-2">
          <div className="hidden border-r border-white/15 bg-white/10 p-8 text-white md:flex md:flex-col md:justify-center lg:p-10">
            <div className="mx-auto w-full max-w-lg text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/18 shadow-lg backdrop-blur-md">
                <ShieldCheck size={28} className="text-white" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/80">
                EduSync Security
              </p>

              <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950">
                Create a stronger password and protect your account.
              </h1>

              <p className="mx-auto mt-5 max-w-md text-base leading-8 text-white/90">
                Choose a new password you can remember easily but others cannot
                guess. Once updated, you’ll be redirected to log in again.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-white/20 bg-white/14 p-6 backdrop-blur-md">
                <div className="space-y-4">
                  <p className="text-base leading-8 text-white/92">
                    Your new password should be secure and different from your
                    old one.
                  </p>

                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-base text-white/92">
                    Use at least 6 characters.
                  </div>

                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-base text-white/92">
                    Make sure both fields match before submitting.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="w-full max-w-md rounded-[1.75rem] border border-white/22 bg-white/14 p-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-7">
              <div className="mb-6">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 text-white shadow-lg shadow-emerald-900/25">
                  <KeyRound size={26} />
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white">
                  Create New Password
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-white/88">
                  Enter your new password below to complete your password reset.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="text-left">
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/90"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-2xl border border-white/20 bg-white/85 py-3.5 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength="6"
                      disabled={isSubmitting}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label={
                        showPassword ? "Hide new password" : "Show new password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="text-left">
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/90"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full rounded-2xl border border-white/20 bg-white/85 py-3.5 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <CheckItem
                    done={passwordChecks.minLength}
                    text="Minimum of 6 characters"
                  />
                  <CheckItem
                    done={passwordChecks.matches}
                    text="Passwords match"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 transition-all hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>

              {status && (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${
                    isSuccess
                      ? "border-emerald-200/70 bg-emerald-100/90 text-emerald-800"
                      : "border-red-200/70 bg-red-100/90 text-red-700"
                  }`}
                  aria-live="polite"
                >
                  {status}
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-emerald-200"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-xs leading-6 text-white/88 md:hidden">
                Use a strong password and keep it private. You’ll be redirected
                to the login page after a successful update.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
