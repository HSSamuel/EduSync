import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { apiFetchOrThrow } from "../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSuccess = status.includes("✅");

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
      className="relative min-h-screen overflow-hidden bg-slate-950"
      style={{
        backgroundImage: "url('/images/edusync-auth-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/35 via-slate-950/20 to-indigo-950/35" />

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
                Reset access to your account.
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/88">
                Enter the email linked to your EduSync account and we will send
                a secure reset link.
              </p>

              <div className="mt-5 space-y-3 rounded-[1.35rem] border border-white/15 bg-white/10 p-4">
                {[
                  "Reset links are sent only to registered email addresses.",
                  "For privacy, the response stays generic whether the email exists or not.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emerald-300" />
                    <p className="text-sm leading-6 text-white/88">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex items-center justify-center p-3 sm:p-5 md:p-6">
            <div className="w-full max-w-md rounded-[1.4rem] border border-white/20 bg-white/12 p-4 text-white shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
              <div className="text-center">
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-950/30">
                  <Mail size={18} />
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Reset Password</h2>
                <p className="mt-1 text-sm text-white/78">
                  We’ll email you a secure reset link.
                </p>
              </div>

              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <div className="text-left">
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/80"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={15} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      className="w-full rounded-xl border border-white/20 bg-white/88 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/20"
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
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/25 transition hover:-translate-y-0.5 hover:from-cyan-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
