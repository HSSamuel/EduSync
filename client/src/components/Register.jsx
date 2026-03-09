import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  School,
  Ticket,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { apiFetchOrThrow, setAccessToken } from "../utils/api";

const GOOGLE_AUTH_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const ROLES = ["Admin", "Teacher", "Student", "Parent"];

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [inviteCodeDetails, setInviteCodeDetails] = useState(null);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  const isAdmin = formData.role === "Admin";
  const isSuccess = statusMessage.includes("✅");
  const passwordHint = useMemo(() => {
    const value = formData.password;
    return {
      length: value.length >= 6,
      hasLetter: /[A-Za-z]/.test(value),
      hasNumber: /\d/.test(value),
    };
  }, [formData.password]);

  const setField = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const validateRoleRequirements = () => {
    if (isAdmin && !formData.school_name.trim()) {
      setStatusMessage("❌ Please enter your school name.");
      return false;
    }

    if (!isAdmin && !formData.invite_code.trim()) {
      setStatusMessage("❌ Please enter your school invite code.");
      return false;
    }

    return true;
  };

  const revealInviteCode = (payload, token) => {
    const inviteCode =
      payload?.data?.school?.invite_code || payload?.school?.invite_code;
    const schoolName =
      payload?.data?.school?.school_name ||
      payload?.school?.school_name ||
      formData.school_name;

    setAccessToken(token);
    setInviteCodeDetails({ inviteCode, schoolName });
    setStatusMessage("✅ Account created successfully. Save this invite code.");
    setIsLoading(false);
  };

  const handleAuthSuccess = (token, payload) => {
    if (formData.role === "Admin") {
      const inviteCode =
        payload?.data?.school?.invite_code || payload?.school?.invite_code;
      if (inviteCode) {
        revealInviteCode(payload, token);
        return;
      }
    }

    setAccessToken(token);
    setStatusMessage("✅ Account created successfully.");
    navigate("/dashboard", { replace: true });
  };

  const copyInviteCode = async () => {
    if (!inviteCodeDetails?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCodeDetails.inviteCode);
      setCopiedInviteCode(true);
      window.setTimeout(() => setCopiedInviteCode(false), 1800);
    } catch (error) {
      console.error("Failed to copy invite code:", error);
    }
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();

    if (!validateRoleRequirements()) return;

    setIsLoading(true);
    setStatusMessage("Creating account...");

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(isAdmin
          ? { school_name: formData.school_name }
          : { invite_code: formData.invite_code }),
      };

      const data = await apiFetchOrThrow(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "Registration failed.",
      );

      const accessToken = data?.data?.token || data?.token;
      if (!accessToken) {
        throw new Error(
          "Registration succeeded but no access token was returned.",
        );
      }

      handleAuthSuccess(accessToken, data);
    } catch (err) {
      setStatusMessage(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse) => {
    if (!validateRoleRequirements()) return;

    setIsLoading(true);
    setStatusMessage("Registering with Google...");

    try {
      const data = await apiFetchOrThrow(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify({
            token: credentialResponse.credential,
            type: "register",
            role: formData.role,
            ...(isAdmin
              ? { school_name: formData.school_name }
              : { invite_code: formData.invite_code }),
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

      handleAuthSuccess(accessToken, data);
    } catch (err) {
      setStatusMessage(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  const statusClass = isSuccess
    ? "border-emerald-200/70 bg-emerald-100/90 text-emerald-800"
    : "border-red-200/70 bg-red-100/90 text-red-700";

  if (inviteCodeDetails) {
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
        <div className="absolute inset-0 bg-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/35 via-slate-950/20 to-blue-950/35" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
          <div className="w-full max-w-md rounded-[1.4rem] border border-white/20 bg-white/12 p-4 text-center text-white shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-950/30">
              <Check size={20} />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.32em] text-white/75">
              School Created
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white">
              Your invite code is ready
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Share this code with teachers, students, and parents so they can join
              {inviteCodeDetails.schoolName ? ` ${inviteCodeDetails.schoolName}` : " your school"}.
            </p>

            <div className="mt-4 rounded-[1.2rem] border border-white/15 bg-white/10 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200/85">
                Invite Code
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-950/35 px-3 py-3">
                <span className="truncate text-base font-black tracking-[0.22em] text-white sm:text-lg">
                  {inviteCodeDetails.inviteCode}
                </span>
                <button
                  type="button"
                  onClick={copyInviteCode}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/16"
                  aria-label="Copy invite code"
                  title="Copy invite code"
                >
                  {copiedInviteCode ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/68">
                Save it now. You can also find it later on your dashboard.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copyInviteCode}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/18 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/16"
              >
                {copiedInviteCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedInviteCode ? "Copied" : "Copy Code"}
              </button>
              <button
                type="button"
                onClick={goToDashboard}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-blue-700"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/35 via-slate-950/20 to-blue-950/35" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden border-r border-white/15 bg-white/8 p-7 text-white md:flex md:flex-col md:justify-center lg:p-8">
            <div className="mx-auto w-full max-w-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-lg">
                <School size={20} className="text-white" />
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.32em] text-white/75">
                EduSync Registration
              </p>

              <h1 className="mt-4 max-w-xs text-3xl font-black leading-tight text-slate-950">
                Create your school account in minutes.
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/88">
                Launch a cleaner school workspace and onboard staff, students,
                and parents with less friction.
              </p>

              <img
                src="/images/edusync-register-side.jpg"
                alt="Students learning together"
                className="mt-5 h-40 w-full rounded-[1.35rem] border border-white/15 object-cover"
              />

              <div className="mt-5 space-y-3 rounded-[1.35rem] border border-white/15 bg-white/10 p-4">
                {[
                  "Admins can create their school workspace instantly.",
                  "Teachers, students, and parents join securely with invite codes.",
                  "Everything starts from one streamlined portal.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                    <p className="text-sm leading-6 text-white/88">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex items-center justify-center p-3 sm:p-5 md:p-6">
            <div className="w-full max-w-md rounded-[1.4rem] border border-white/20 bg-white/12 p-4 text-white shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
              <div className="text-center">
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-950/30">
                  <UserPlus size={18} />
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Create Account</h2>
                <p className="mt-1 text-sm text-white/78">
                  Register your school to continue. Thank you.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setField("role", role)}
                    disabled={isLoading}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      formData.role === role
                        ? "border-emerald-300/80 bg-white text-slate-900"
                        : "border-white/15 bg-white/8 text-white/85 hover:bg-white/12"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmitForm} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id="full_name"
                    label="Full Name"
                    icon={<UserPlus size={15} />}
                    placeholder="Full name"
                    value={formData.full_name}
                    onChange={(e) => setField("full_name", e.target.value)}
                    disabled={isLoading}
                  />

                  <Field
                    id="email"
                    type="email"
                    label="Email"
                    icon={<Mail size={15} />}
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {isAdmin ? (
                    <Field
                      id="school_name"
                      label="School Name"
                      icon={<School size={15} />}
                      placeholder="Your school name"
                      value={formData.school_name}
                      onChange={(e) => setField("school_name", e.target.value)}
                      disabled={isLoading}
                    />
                  ) : (
                    <Field
                      id="invite_code"
                      label="Invite Code"
                      icon={<Ticket size={15} />}
                      placeholder="School invite code"
                      value={formData.invite_code}
                      onChange={(e) => setField("invite_code", e.target.value)}
                      disabled={isLoading}
                    />
                  )}

                  <div className="text-left">
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/80"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={15} />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/20 bg-white/88 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={(e) => setField("password", e.target.value)}
                        required
                        minLength="6"
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
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                      <Hint ok={passwordHint.length} text="6+ chars" />
                      <Hint ok={passwordHint.hasLetter} text="letter" />
                      <Hint ok={passwordHint.hasNumber} text="number" />
                    </div>
                  </div>
                </div>

                {GOOGLE_AUTH_ENABLED ? (
                  <div className="space-y-3">
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
                          text="signup_with"
                          width="280"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/15" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/60">
                        or use email
                      </span>
                      <div className="h-px flex-1 bg-white/15" />
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              {statusMessage ? (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2.5 text-sm font-semibold ${statusClass}`}
                  aria-live="polite"
                >
                  {statusMessage}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/72">
                <p>Already have an account?</p>
                <Link to="/login" className="font-bold text-white hover:text-blue-200">
                  Sign In
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
        className="w-full rounded-xl border border-white/20 bg-white/88 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
        required
        {...props}
      />
    </div>
  </div>
);

const Hint = ({ ok, text }) => (
  <span
    className={`rounded-full border px-2 py-0.5 ${
      ok
        ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-100"
        : "border-white/15 bg-white/8 text-white/65"
    }`}
  >
    {text}
  </span>
);

export default Register;
