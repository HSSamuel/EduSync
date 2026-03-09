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
    setStatusMessage("Authenticating...");

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
      <div className="absolute inset-0 bg-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-slate-900/8 to-indigo-900/14" />

      <div
        className="pointer-events-none absolute left-4 top-6 h-32 w-32 rounded-full bg-sky-300/15 blur-3xl sm:h-56 sm:w-56"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-indigo-300/15 blur-3xl sm:h-56 sm:w-56"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="w-full max-w-6xl">
          <div className="md:grid md:grid-cols-2 md:overflow-hidden md:rounded-[2rem] md:border md:border-white/25 md:bg-white/12 md:shadow-[0_20px_80px_rgba(0,0,0,0.22)] md:backdrop-blur-2xl">
            <div className="hidden border-r border-white/15 bg-white/10 p-8 text-white md:flex md:flex-col md:justify-center lg:p-10">
              <div className="mx-auto w-full max-w-lg text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/18 shadow-lg backdrop-blur-md">
                  <ShieldCheck size={28} className="text-white" />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/80">
                  EduSync Portal
                </p>

                <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950">
                  Welcome back to your smart learning space.
                </h1>

                <p className="mx-auto mt-5 max-w-md text-base leading-6 text-white">
                  Sign in to manage learning activities, track academic
                  progress, and stay connected across your school environment.
                </p>

                <div className="mt-8 rounded-[1.75rem] border border-white/20 bg-white/14 p-6 backdrop-blur-md">
                  <div className="flex items-start justify-center gap-3 text-left">
                    <div className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <p className="text-base leading-6 text-white">
                      Secure access for students, teachers, parents, and admins.
                    </p>
                  </div>

                  <div className="mt-4 flex items-start justify-center gap-3 text-left">
                    <div className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <p className="text-base leading-6 text-white">
                      Built to simplify school coordination and learning
                      management.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:p-8 lg:p-10">
              <div className="w-full max-w-[18.5rem] rounded-[1.2rem] border border-white/20 bg-white/14 px-3 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:max-w-[22rem] sm:px-4 sm:py-4 md:max-w-md md:rounded-[1.75rem] md:border-white/22 md:px-6 md:py-6">
                <div className="mb-3 sm:mb-4">
                  <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-sky-500/90 to-indigo-600/90 text-white shadow-lg shadow-sky-900/25 sm:h-12 sm:w-12 md:h-16 md:w-16 md:rounded-2xl">
                    <LogIn size={16} className="sm:h-5 sm:w-5 md:h-7 md:w-7" />
                  </div>

                  <h2 className="text-[1.55rem] font-black tracking-tight text-white md:text-3xl">
                    Welcome Back
                  </h2>

                  <p className="mx-auto mt-1.5 max-w-[15rem] text-[13px] leading-[1.15rem] text-white md:mt-3 md:max-w-sm md:text-base md:leading-6">
                    Enter your credentials to access the portal.
                  </p>
                </div>

                {GOOGLE_AUTH_ENABLED ? (
                  <>
                    <div className="mb-3 flex justify-center">
                      <div className="w-full overflow-hidden rounded-xl bg-white/90 p-1 shadow-sm md:rounded-2xl">
                        <div className="flex justify-center">
                          <GoogleLogin
                            onSuccess={onGoogleSuccess}
                            onError={() => {
                              setIsLoading(false);
                              setStatusMessage(
                                "❌ Google popup closed or failed",
                              );
                            }}
                            theme="outline"
                            size="large"
                            shape="rectangular"
                            text="signin_with"
                            width="260"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="my-3 flex items-center">
                      <div className="h-px flex-1 bg-white/20" />
                      <span className="mx-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 md:mx-4 md:text-[11px] md:tracking-[0.28em]">
                        Or continue with email
                      </span>
                      <div className="h-px flex-1 bg-white/20" />
                    </div>
                  </>
                ) : (
                  <div className="mb-3 rounded-xl border border-amber-200/70 bg-amber-100/90 px-3 py-2 text-sm text-amber-900 md:mb-4 md:rounded-2xl md:px-4 md:py-3">
                    Google sign-in is unavailable because{" "}
                    <code>VITE_GOOGLE_CLIENT_ID</code> is not configured.
                  </div>
                )}

                <form
                  onSubmit={onSubmitForm}
                  className="space-y-2.5 md:space-y-4"
                >
                  <div className="text-left">
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:mb-2 md:text-xs"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                        size={16}
                        aria-hidden="true"
                      />
                      <input
                        id="email"
                        type="email"
                        className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/20 md:rounded-2xl md:py-3 md:pl-11 md:pr-4"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="mb-1.5 flex items-end justify-between gap-2 md:mb-2 md:gap-3">
                      <label
                        htmlFor="password"
                        className="block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-xs"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-[11px] font-bold text-blue-200 transition-colors hover:text-blue-100 md:text-xs"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                        size={16}
                        aria-hidden="true"
                      />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/20 md:rounded-2xl md:py-3 md:pl-11 md:pr-11"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 md:right-4"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-900/25 transition-all hover:-translate-y-0.5 hover:from-sky-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 md:rounded-2xl md:py-3.5"
                  >
                    <LogIn size={16} />
                    {isLoading ? "Authenticating..." : "Sign In"}
                  </button>
                </form>

                {statusMessage && (
                  <div
                    className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold leading-5 md:mt-4 md:rounded-2xl md:px-4 md:py-3 ${
                      isSuccess
                        ? "border-emerald-200/70 bg-emerald-100/90 text-emerald-800"
                        : "border-red-200/70 bg-red-100/90 text-red-700"
                    }`}
                    aria-live="polite"
                  >
                    {statusMessage}
                  </div>
                )}

                <div className="mt-3 flex justify-center">
                  <p className="text-sm text-white">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="font-bold text-white underline decoration-white/50 underline-offset-4 transition hover:text-sky-200"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-center text-[10px] leading-[1.1rem] text-white md:mt-5 md:rounded-2xl md:px-4 md:py-3 md:text-xs">
                  Access your school portal securely from any device.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
