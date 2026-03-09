import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  ShieldCheck,
  Building,
  Hash,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { apiFetchOrThrow, setAccessToken } from "../utils/api";

const GOOGLE_AUTH_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const Register = () => {
  const [searchParams] = useSearchParams();
  const defaultInviteCode =
    searchParams.get("invite_code") || searchParams.get("school_id") || "";
  const defaultRole = searchParams.get("role") || "Admin";

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: defaultRole,
    school_name: "",
    invite_code: defaultInviteCode,
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const onChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    setStatusMessage("✅ Account created successfully.");
    navigate("/dashboard", { replace: true });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Creating account...");

    try {
      const data = await apiFetchOrThrow(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(formData),
        },
        "Registration failed.",
      );

      const accessToken = data?.data?.token || data?.token;
      if (!accessToken) {
        throw new Error(
          "Registration succeeded but no access token was returned.",
        );
      }

      handleAuthSuccess(accessToken);
    } catch (err) {
      setStatusMessage(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse) => {
    if (formData.role === "Admin" && !formData.school_name) {
      setStatusMessage(
        "❌ Please enter a School Name before using Google Sign-up.",
      );
      return;
    }

    if (formData.role !== "Admin" && !formData.invite_code) {
      setStatusMessage(
        "❌ Please enter a School Invite Code before using Google Sign-up.",
      );
      return;
    }

    setIsLoading(true);
    setStatusMessage("Registering via Google...");

    try {
      const data = await apiFetchOrThrow(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify({
            token: credentialResponse.credential,
            type: "register",
            role: formData.role,
            school_name: formData.school_name,
            invite_code: formData.invite_code,
          }),
        },
        "Google registration failed.",
      );

      const accessToken = data?.data?.token || data?.token;
      if (!accessToken) {
        throw new Error(
          "Google registration succeeded but no access token was returned.",
        );
      }

      handleAuthSuccess(accessToken);
    } catch (err) {
      setStatusMessage(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  const isSuccess = statusMessage.includes("✅");

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950"
      style={{
        backgroundImage: "url('/images/edusync-register-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/22" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/12 via-slate-900/8 to-blue-900/14" />

      <div
        className="pointer-events-none absolute left-4 top-6 h-32 w-32 rounded-full bg-emerald-300/15 blur-3xl sm:h-56 sm:w-56"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-blue-300/15 blur-3xl sm:h-56 sm:w-56"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="w-full max-w-5xl">
          <div className="md:grid md:grid-cols-2 md:overflow-hidden md:rounded-[1.7rem] md:border md:border-white/25 md:bg-white/12 md:shadow-[0_18px_60px_rgba(0,0,0,0.22)] md:backdrop-blur-2xl">
            <div className="hidden border-r border-white/15 bg-white/10 p-6 text-white md:flex md:flex-col md:justify-center lg:p-8">
              <div className="mx-auto w-full max-w-md text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/18 shadow-lg backdrop-blur-md">
                  <ShieldCheck size={24} className="text-white" />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">
                  EduSync Registration
                </p>

                <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 lg:text-[2rem]">
                  Create your smart school account.
                </h1>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white lg:text-[15px]">
                  Join EduSync to manage your school operations, access learning
                  tools, and connect your academic community in one place.
                </p>

                <div className="mx-auto mt-5 w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-white/20 bg-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-md">
                  <img
                    src="/images/edusync-register-side.jpg"
                    alt="Students learning together"
                    className="h-44 w-full object-cover lg:h-48"
                  />
                </div>

                <div className="mt-6 rounded-[1.4rem] border border-white/20 bg-white/14 p-4 backdrop-blur-md lg:p-5">
                  <div className="flex items-start justify-center gap-3 text-left">
                    <div className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <p className="text-sm leading-6 text-white lg:text-[15px]">
                      School admins can create their institution workspace
                      instantly.
                    </p>
                  </div>

                  <div className="mt-3 flex items-start justify-center gap-3 text-left">
                    <div className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <p className="text-sm leading-6 text-white lg:text-[15px]">
                      Teachers, students, and parents can join securely with
                      invite codes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:p-6 lg:p-8">
              <div className="w-full max-w-[19rem] rounded-[1.2rem] border border-white/20 bg-white/14 px-3 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:max-w-[23rem] sm:px-4 sm:py-4 md:max-w-[22rem] md:rounded-[1.45rem] md:px-4.5 md:py-4.5 lg:max-w-[24rem] lg:px-5 lg:py-5">
                <div className="mb-3">
                  <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-emerald-500/90 to-blue-600/90 text-white shadow-lg shadow-emerald-900/25 md:h-12 md:w-12 lg:h-14 lg:w-14 lg:rounded-2xl">
                    <UserPlus
                      size={16}
                      className="md:h-5 md:w-5 lg:h-6 lg:w-6"
                    />
                  </div>

                  <h2 className="text-[1.55rem] font-black tracking-tight text-white md:text-[1.7rem] lg:text-[1.9rem]">
                    Create Account
                  </h2>

                  <p className="mx-auto mt-1.5 max-w-[15rem] text-[13px] leading-[1.15rem] text-white md:max-w-[16.5rem] md:text-[13px] md:leading-5 lg:mt-2 lg:max-w-sm lg:text-[15px] lg:leading-6">
                    Join the next generation of school management.
                  </p>
                </div>

                <form
                  onSubmit={onSubmitForm}
                  className="space-y-2.5 md:space-y-3 lg:space-y-3.5"
                >
                  <div className="text-left">
                    <label
                      htmlFor="role"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-[11px] lg:text-xs"
                    >
                      Choose Your Role
                    </label>

                    <div className="mx-auto w-full max-w-[15.5rem] sm:max-w-[18rem] md:max-w-[17rem] lg:max-w-none">
                      <div className="relative">
                        <ShieldCheck
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                          size={16}
                          aria-hidden="true"
                        />
                        <select
                          id="role"
                          aria-label="Select Role"
                          name="role"
                          className="w-full appearance-none rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 md:rounded-xl md:py-2.5 md:pl-10.5 lg:rounded-2xl lg:py-3 lg:pl-11"
                          value={formData.role}
                          onChange={onChange}
                          disabled={isLoading}
                        >
                          <option value="Admin">School Admin</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                          <option value="Parent">Parent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {formData.role === "Admin" ? (
                    <div className="text-left">
                      <label
                        htmlFor="school_name"
                        className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-[11px] lg:text-xs"
                      >
                        School Name
                      </label>
                      <div className="relative">
                        <Building
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                          size={16}
                          aria-hidden="true"
                        />
                        <input
                          id="school_name"
                          type="text"
                          aria-label="School Name"
                          name="school_name"
                          placeholder="Your School's Name"
                          className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 md:rounded-xl md:py-2.5 md:pl-10.5 lg:rounded-2xl lg:py-3 lg:pl-11 lg:pr-4"
                          value={formData.school_name}
                          onChange={onChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-left">
                      <label
                        htmlFor="invite_code"
                        className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-[11px] lg:text-xs"
                      >
                        School Invite Code
                      </label>
                      <div className="relative">
                        <Hash
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                          size={16}
                          aria-hidden="true"
                        />
                        <input
                          id="invite_code"
                          type="text"
                          aria-label="School Invite Code"
                          name="invite_code"
                          placeholder="Ask your Admin for the code"
                          className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 md:rounded-xl md:py-2.5 md:pl-10.5 lg:rounded-2xl lg:py-3 lg:pl-11 lg:pr-4"
                          value={formData.invite_code}
                          onChange={onChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-blue-200/40 bg-blue-100/85 px-3 py-2.5 md:px-3.5 md:py-3 lg:rounded-2xl lg:px-4">
                    <div className="flex justify-center">
                      {GOOGLE_AUTH_ENABLED ? (
                        <GoogleLogin
                          onSuccess={onGoogleSuccess}
                          onError={() => {
                            setIsLoading(false);
                            setStatusMessage(
                              "❌ Google popup closed or failed",
                            );
                          }}
                          text="signup_with"
                          theme="outline"
                          shape="rectangular"
                          width="220"
                        />
                      ) : (
                        <p className="text-center text-xs text-amber-800">
                          Google sign-up is unavailable because{" "}
                          <code>VITE_GOOGLE_CLIENT_ID</code> is not configured.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="my-2.5 flex items-center md:my-3">
                    <div className="h-px flex-1 bg-white/20" />
                    <span className="mx-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 md:text-[10px] lg:mx-4 lg:text-[11px] lg:tracking-[0.28em]">
                      Or continue with email
                    </span>
                    <div className="h-px flex-1 bg-white/20" />
                  </div>

                  <div className="text-left">
                    <label
                      htmlFor="full_name"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-[11px] lg:text-xs"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <UserPlus
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                        size={16}
                        aria-hidden="true"
                      />
                      <input
                        id="full_name"
                        type="text"
                        aria-label="Full Name"
                        name="full_name"
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 md:rounded-xl md:py-2.5 md:pl-10.5 lg:rounded-2xl lg:py-3 lg:pl-11 lg:pr-4"
                        value={formData.full_name}
                        onChange={onChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-[11px] lg:text-xs"
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
                        aria-label="Email Address"
                        name="email"
                        placeholder="Email Address"
                        className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 md:rounded-xl md:py-2.5 md:pl-10.5 lg:rounded-2xl lg:py-3 lg:pl-11 lg:pr-4"
                        value={formData.email}
                        onChange={onChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/90 md:text-[11px] lg:text-xs"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:left-4"
                        size={16}
                        aria-hidden="true"
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        aria-label="Password"
                        name="password"
                        placeholder="Password"
                        className="w-full rounded-xl border border-white/20 bg-white/85 py-2 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 md:rounded-xl md:py-2.5 md:pl-10.5 md:pr-10.5 lg:rounded-2xl lg:py-3 lg:pl-11 lg:pr-11"
                        value={formData.password}
                        onChange={onChange}
                        required
                        disabled={isLoading}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 md:right-3.5 lg:right-4"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 transition-all hover:-translate-y-0.5 hover:from-emerald-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70 md:rounded-xl md:py-2.5 lg:rounded-2xl lg:py-3.5"
                  >
                    <UserPlus size={16} />
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                {statusMessage && (
                  <div
                    className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold leading-5 md:rounded-xl md:px-3.5 md:py-2.5 lg:mt-4 lg:rounded-2xl lg:px-4 lg:py-3 ${
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
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-bold text-white underline decoration-white/50 underline-offset-4 transition hover:text-emerald-200"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-center text-[10px] leading-[1.1rem] text-white md:rounded-xl md:px-3.5 md:py-2 lg:mt-5 lg:rounded-2xl lg:px-4 lg:py-3 lg:text-xs">
                  Create your school account securely and get started in
                  minutes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
