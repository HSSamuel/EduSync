import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { apiFetchOrThrow } from "../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSuccess = status.includes("✅");
  const hasStatus = Boolean(status);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Sending reset link...");

    try {
      const data = await apiFetchOrThrow(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
        "Unable to send reset email.",
      );

      setStatus(
        `✅ ${data?.message || "If that email exists, a reset link has been sent."}`,
      );
      setEmail("");
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/18 via-slate-800/12 to-indigo-900/22" />

      <div
        className="pointer-events-none absolute left-6 top-8 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl sm:h-64 sm:w-64"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl sm:h-64 sm:w-64"
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
                Reset access to your learning portal.
              </h1>

              <p className="mx-auto mt-5 max-w-md text-base leading-5 text-white/90">
                Enter the email address linked to your EduSync account and we
                will send a secure reset link to help you regain access.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-white/20 bg-white/14 p-6 backdrop-blur-md">
                <div className="flex items-start justify-center gap-3 text-left">
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <p className="text-base leading-8 text-white/92">
                    Reset links are sent only to registered account email
                    addresses.
                  </p>
                </div>

                <div className="mt-4 flex items-start justify-center gap-3 text-left">
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  <p className="text-base leading-8 text-white/92">
                    For your protection, the response remains generic whether
                    the email exists or not.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="w-full max-w-md rounded-[1.75rem] border border-white/22 bg-white/14 p-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-7">
              <div className="mb-6">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white shadow-lg shadow-blue-900/25">
                  <Mail size={26} />
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white">
                  Reset Password
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-base leading-5 text-white">
                  Enter your registered email address and we’ll send you a
                  secure reset link.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="text-left">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/90"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                      aria-hidden="true"
                    />

                    <input
                      id="email"
                      type="email"
                      className="w-full rounded-2xl border border-white/20 bg-white/85 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/20"
                      placeholder="Your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/25 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              {hasStatus && (
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
                  className="inline-flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-blue-200"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-xs leading-6 text-white/88 md:hidden">
                Reset links are sent to the email attached to your account.
                Check spam or promotions if you don’t see it quickly.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
