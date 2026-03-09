import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { apiFetchOrThrow, setAccessToken } from "../utils/api";

const GOOGLE_AUTH_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || "/dashboard";
  const isSuccess = statusMessage.includes("✅");

  const handleAuthSuccess = (token, message = "✅ Login successful.") => {
    setAccessToken(token);
    setStatusMessage(message);
    navigate(redirectPath, { replace: true });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Signing you in...");

    try {
      const data = await apiFetchOrThrow(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        "Unable to sign you in.",
      );

      const accessToken = data?.data?.token || data?.token;
      if (!accessToken) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      handleAuthSuccess(accessToken);
    } catch (err) {
      setStatusMessage(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setStatusMessage("Verifying Google account...");

    try {
      const data = await apiFetchOrThrow(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify({
            token: credentialResponse.credential,
            type: "login",
          }),
        },
        "Google authentication failed.",
      );

      const accessToken = data?.data?.token || data?.token;
      if (!accessToken) {
        throw new Error(
          "Google login succeeded but no access token was returned.",
        );
      }

      handleAuthSuccess(accessToken);
    } catch (err) {
      setStatusMessage(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950"
      style={{
        backgroundImage: "url('/images/edusync-login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-br from-sky-950/35 via-slate-950/20 to-indigo-950/35" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden border-r border-white/15 bg-white/8 p-7 text-white md:flex md:flex-col md:justify-center lg:p-8">
            <div className="mx-auto w-full max-w-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-lg">
                <ShieldCheck size={20} className="text-white" />
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.32em] text-white/75">
                EduSync Portal
              </p>

              <h1 className="mt-4 max-w-xs text-3xl font-black leading-tight text-slate-950">
                Welcome back to your learning space.
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/88">
                Sign in fast, track school activity, and keep your academic
                workflow moving from one secure portal.
              </p>

              <div className="mt-5 space-y-3 rounded-[1.35rem] border border-white/15 bg-white/10 p-4">
                {[
                  "Secure access for admins, teachers, students, and parents.",
                  "One compact dashboard for academics and communication.",
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
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-indigo-950/30">
                  <LogIn size={18} />
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Welcome Back</h2>
                <p className="mt-1 text-sm text-white/78">
                  Use your email or Google account to continue.
                </p>
              </div>

              {GOOGLE_AUTH_ENABLED ? (
                <div className="mt-4 space-y-3">
                  <div className="overflow-hidden rounded-xl bg-white/90 p-1">
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={onGoogleSuccess}
                        onError={() => {
                          setIsLoading(false);
                          setStatusMessage("❌ Google popup closed or failed.");
                        }}
                        theme="outline"
                        size="large"
                        shape="rectangular"
                        text="signin_with"
                        width="280"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/15" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/60">
                      or continue with email
                    </span>
                    <div className="h-px flex-1 bg-white/15" />
                  </div>
                </div>
              ) : null}

              <form onSubmit={onSubmitForm} className="mt-4 space-y-3">
                <Field
                  id="email"
                  type="email"
                  label="Email"
                  icon={<Mail size={15} />}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />

                <div className="text-left">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/80"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-blue-200 hover:text-blue-100"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-xl border border-white/20 bg-white/88 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/20"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-950/25 transition hover:-translate-y-0.5 hover:from-sky-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              {statusMessage ? (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                    isSuccess
                      ? "border-emerald-200/70 bg-emerald-100/90 text-emerald-800"
                      : "border-red-200/70 bg-red-100/90 text-red-700"
                  }`}
                  aria-live="polite"
                >
                  {statusMessage}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/72">
                <p>Don’t have an account?</p>
                <Link to="/register" className="font-bold text-white hover:text-blue-200">
                  Sign Up
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const Field = ({ id, label, icon, ...props }) => (
  <div className="text-left">
    <label
      htmlFor={id}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/80"
    >
      {label}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        id={id}
        className="w-full rounded-xl border border-white/20 bg-white/88 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/20"
        required
        {...props}
      />
    </div>
  </div>
);

export default Login;
