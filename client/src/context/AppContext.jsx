import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Info, X, TriangleAlert } from "lucide-react";
import {
  apiFetchOrThrow,
  apiJsonFetch,
  clearAccessToken,
  extractResponseData,
  getAccessToken,
  refreshAccessToken,
} from "../utils/api";

const AuthContext = createContext();
const SchoolContext = createContext();
const UiContext = createContext();

const TOAST_STYLES = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/70 dark:text-emerald-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/70 dark:text-red-200",
  info:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/70 dark:text-sky-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/70 dark:text-amber-200",
};

const TOAST_ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
  warning: AlertTriangle,
};

export const useAppContext = () => {
  const auth = useContext(AuthContext);
  const school = useContext(SchoolContext);
  const ui = useContext(UiContext);
  return { ...auth, ...school, ...ui };
};

const ToastViewport = ({ toasts, dismissToast }) => (
  <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3">
    {toasts.map((toast) => {
      const Icon = TOAST_ICONS[toast.type] || Info;
      return (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              {toast.title ? (
                <p className="text-sm font-semibold leading-5">{toast.title}</p>
              ) : null}
              <p className="text-sm leading-5">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      );
    })}
  </div>
);

const ConfirmDialog = ({ state, onResolve }) => {
  if (!state.open) return null;

  const toneStyles =
    state.tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <div className={`rounded-2xl p-3 ${state.tone === "danger" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {state.title || "Please confirm"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {state.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {state.cancelText || "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${toneStyles}`}
          >
            {state.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false });

  const navigate = useNavigate();
  const subjectsLoadingRef = useRef(false);
  const studentsLoadingRef = useRef(false);
  const toastTimersRef = useRef(new Map());
  const confirmResolverRef = useRef(null);

  const dismissToast = useCallback((id) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(({ type = "info", title = "", message, duration = 4500 }) => {
    if (!message) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    const timer = window.setTimeout(() => {
      dismissToast(id);
    }, duration);

    toastTimersRef.current.set(id, timer);
  }, [dismissToast]);

  const notifySuccess = useCallback((message, title = "Success") => {
    notify({ type: "success", title, message });
  }, [notify]);

  const notifyError = useCallback((message, title = "Action failed") => {
    notify({ type: "error", title, message, duration: 5500 });
  }, [notify]);

  const notifyInfo = useCallback((message, title = "Notice") => {
    notify({ type: "info", title, message });
  }, [notify]);

  const confirm = useCallback((options) => new Promise((resolve) => {
    confirmResolverRef.current = resolve;
    setConfirmState({
      open: true,
      title: options?.title || "Please confirm",
      message: options?.message || "Are you sure you want to continue?",
      confirmText: options?.confirmText || "Confirm",
      cancelText: options?.cancelText || "Cancel",
      tone: options?.tone || "default",
    });
  }), []);

  const handleConfirmResolve = useCallback((result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
    setConfirmState({ open: false });
  }, []);

  useEffect(() => () => {
    for (const timer of toastTimersRef.current.values()) {
      window.clearTimeout(timer);
    }
    toastTimersRef.current.clear();
  }, []);

  const resetAppState = useCallback(() => {
    setUserData(null);
    setSubjects([]);
    setStudents([]);
    setSubjectsLoaded(false);
    setStudentsLoaded(false);
    subjectsLoadingRef.current = false;
    studentsLoadingRef.current = false;
  }, []);

  const ensureSession = useCallback(async () => {
    let hasToken = Boolean(getAccessToken());
    if (!hasToken) {
      hasToken = await refreshAccessToken();
    }
    return hasToken;
  }, []);

  const fetchProfile = useCallback(async () => {
    const profilePayload = await apiFetchOrThrow(
      "/dashboard",
      { method: "GET" },
      "Unable to load your dashboard profile.",
    );

    const profile = extractResponseData(profilePayload, null);
    setUserData(profile);
    return profile;
  }, []);

  const fetchDetailedProfile = useCallback(async () => {
    const profilePayload = await apiFetchOrThrow(
      "/users/me",
      { method: "GET" },
      "Unable to load your profile.",
    );

    return extractResponseData(profilePayload, null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const result = await apiFetchOrThrow(
      "/users/me",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      "Unable to update profile.",
    );

    const updatedProfile = extractResponseData(result, null);
    setUserData((prev) => ({ ...prev, ...(updatedProfile || {}) }));
    return updatedProfile;
  }, []);

  const loadSubjects = useCallback(async ({ force = false } = {}) => {
    if (!userData || userData.role === "Parent" || userData.role === "Student") {
      if (!subjectsLoaded || subjects.length !== 0) {
        setSubjects([]);
        setSubjectsLoaded(true);
      }
      return [];
    }

    if ((subjectsLoadingRef.current || subjectsLoaded) && !force) {
      return subjects;
    }

    subjectsLoadingRef.current = true;
    try {
      const result = await apiJsonFetch("/subjects", { method: "GET" });
      const nextSubjects = result.ok ? extractResponseData(result.data, []) || [] : [];
      const normalizedSubjects = Array.isArray(nextSubjects) ? nextSubjects : [];
      setSubjects(normalizedSubjects);
      setSubjectsLoaded(true);
      return normalizedSubjects;
    } finally {
      subjectsLoadingRef.current = false;
    }
  }, [userData, subjectsLoaded, subjects]);

  const loadStudents = useCallback(async ({ force = false } = {}) => {
    if (!userData || userData.role === "Student") {
      if (!studentsLoaded || students.length !== 0) {
        setStudents([]);
        setStudentsLoaded(true);
      }
      return [];
    }

    if ((studentsLoadingRef.current || studentsLoaded) && !force) {
      return students;
    }

    studentsLoadingRef.current = true;
    try {
      const result = await apiJsonFetch("/students?limit=1000", { method: "GET" });
      const nextStudents = result.ok ? extractResponseData(result.data, []) || [] : [];
      const normalizedStudents = Array.isArray(nextStudents) ? nextStudents : [];
      setStudents(normalizedStudents);
      setStudentsLoaded(true);
      return normalizedStudents;
    } finally {
      studentsLoadingRef.current = false;
    }
  }, [userData, studentsLoaded, students]);

  const fetchGlobalData = useCallback(async () => {
    setLoading(true);
    try {
      const hasToken = await ensureSession();
      if (!hasToken) {
        resetAppState();
        setLoading(false);
        return;
      }
      await fetchProfile();
    } catch (err) {
      console.error("Context Fetch Error:", err);
      clearAccessToken();
      resetAppState();
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [ensureSession, fetchProfile, navigate, resetAppState]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const logout = async () => {
    try {
      await apiJsonFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAccessToken();
      resetAppState();
      setLoading(false);
      navigate("/login", { replace: true });
    }
  };

  const authValue = useMemo(() => ({
    userData,
    setUserData,
    loading,
    logout,
    refreshData: fetchGlobalData,
    fetchDetailedProfile,
    updateProfile,
  }), [userData, loading, fetchGlobalData, fetchDetailedProfile, updateProfile]);

  const schoolValue = useMemo(() => ({
    subjects,
    setSubjects,
    students,
    setStudents,
    loadSubjects,
    loadStudents,
    subjectsLoaded,
    studentsLoaded,
  }), [subjects, students, loadSubjects, loadStudents, subjectsLoaded, studentsLoaded]);

  const uiValue = useMemo(() => ({
    notify,
    notifySuccess,
    notifyError,
    notifyInfo,
    confirm,
  }), [notify, notifySuccess, notifyError, notifyInfo, confirm]);

  return (
    <AuthContext.Provider value={authValue}>
      <SchoolContext.Provider value={schoolValue}>
        <UiContext.Provider value={uiValue}>
          {children}
          <ToastViewport toasts={toasts} dismissToast={dismissToast} />
          <ConfirmDialog state={confirmState} onResolve={handleConfirmResolve} />
        </UiContext.Provider>
      </SchoolContext.Provider>
    </AuthContext.Provider>
  );
};
