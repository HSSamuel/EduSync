import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
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

  const checks = useMemo(
    () => ({
      minLength: newPassword.length >= 6,
      hasNumber: /\d/.test(newPassword),
      matches: Boolean(confirmPassword) && newPassword === confirmPassword,
    }),
    [newPassword, confirmPassword],
  );

  const onSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("❌ Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Updating password...");

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
      setTimeout(() => navigate("/login", { replace: true }), 2200);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = status.includes("✅");

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950"
      style={{
        backgroundImage: "url('/images/edusync-auth-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/35 via-slate-950/20 to-cyan-950/35" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden border-r border-white/15 bg-white/8 p-7 text-white md:flex md:flex-col md:justify-center lg:p-8">
            <div className="mx-auto w-full max-w-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-lg">
                <ShieldCheck size={20} className="text-white" />
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.32em] text-white/75">
                EduSync Security
              </p>

              <h1 className="mt-4 max-w-xs text-3xl font-black leading-tight text-slate-950">
                Create a new secure password.
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/88">
                Choose a fresh password, confirm it once, and sign in again with
                confidence.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Hint ok={checks.minLength} text="6+ characters" />
                <Hint ok={checks.hasNumber} text="Include a number" />
                <Hint ok={checks.matches} text="Passwords match" />
              </div>
            </div>
          </aside>

          <main className="flex items-center justify-center p-3 sm:p-5 md:p-6">
            <div className="w-full max-w-md rounded-[1.4rem] border border-white/20 bg-white/12 p-4 text-white shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
              <div className="text-center">
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-950/30">
                  <KeyRound size={18} />
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Set New Password</h2>
                <p className="mt-1 text-sm text-white/78">
                  Enter and confirm your new password below.
                </p>
              </div>

              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <PasswordField
                  id="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  visible={showPassword}
                  toggleVisible={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                />

                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  visible={showConfirmPassword}
                  toggleVisible={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isSubmitting}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>

              {status ? (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                    isSuccess
                      ? "border-emerald-200/70 bg-emerald-100/90 text-emerald-800"
                      : "border-red-200/70 bg-red-100/90 text-red-700"
                  }`}
                  aria-live="polite"
                >
                  {status}
                </div>
              ) : null}

              <div className="mt-4 flex justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/86 transition hover:text-white"
                >
                  <ArrowLeft size={15} />
                  Back to Login
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const PasswordField = ({ id, label, value, onChange, visible, toggleVisible, disabled }) => (
  <div className="text-left">
    <label
      htmlFor={id}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/80"
    >
      {label}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Lock size={15} />
      </span>
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="w-full rounded-xl border border-white/20 bg-white/88 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
        placeholder="••••••••"
        value={value}
        onChange={onChange}
        required
        minLength="6"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={toggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

const Hint = ({ ok, text }) => (
  <span
    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
      ok
        ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-100"
        : "border-white/15 bg-white/8 text-white/65"
    }`}
  >
    {text}
  </span>
);

export default ResetPassword;
