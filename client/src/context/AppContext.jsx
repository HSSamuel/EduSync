import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
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

export const useAppContext = () => {
  const auth = useContext(AuthContext);
  const school = useContext(SchoolContext);
  return { ...auth, ...school };
};

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  const navigate = useNavigate();

  const subjectsLoadingRef = useRef(false);
  const studentsLoadingRef = useRef(false);

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

    const profile = extractResponseData(profilePayload, null);
    return profile;
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

    setUserData((prev) => ({
      ...prev,
      ...(updatedProfile || {}),
    }));

    return updatedProfile;
  }, []);

  const loadSubjects = useCallback(
    async ({ force = false } = {}) => {
      if (
        !userData ||
        userData.role === "Parent" ||
        userData.role === "Student"
      ) {
        if (!subjectsLoaded || subjects.length !== 0) {
          setSubjects([]);
          setSubjectsLoaded(true);
        }
        return [];
      }

      if (subjectsLoadingRef.current && !force) {
        return subjects;
      }

      if (subjectsLoaded && !force) {
        return subjects;
      }

      subjectsLoadingRef.current = true;

      try {
        const result = await apiJsonFetch("/subjects", { method: "GET" });
        const nextSubjects = result.ok
          ? extractResponseData(result.data, []) || []
          : [];

        const normalizedSubjects = Array.isArray(nextSubjects)
          ? nextSubjects
          : [];

        setSubjects(normalizedSubjects);
        setSubjectsLoaded(true);

        return normalizedSubjects;
      } finally {
        subjectsLoadingRef.current = false;
      }
    },
    [userData, subjectsLoaded, subjects],
  );

  const loadStudents = useCallback(
    async ({ force = false } = {}) => {
      if (!userData || userData.role === "Student") {
        if (!studentsLoaded || students.length !== 0) {
          setStudents([]);
          setStudentsLoaded(true);
        }
        return [];
      }

      if (studentsLoadingRef.current && !force) {
        return students;
      }

      if (studentsLoaded && !force) {
        return students;
      }

      studentsLoadingRef.current = true;

      try {
        const result = await apiJsonFetch("/students?limit=1000", {
          method: "GET",
        });

        const nextStudents = result.ok
          ? extractResponseData(result.data, []) || []
          : [];

        const normalizedStudents = Array.isArray(nextStudents)
          ? nextStudents
          : [];

        setStudents(normalizedStudents);
        setStudentsLoaded(true);

        return normalizedStudents;
      } finally {
        studentsLoadingRef.current = false;
      }
    },
    [userData, studentsLoaded, students],
  );

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

  return (
    <AuthContext.Provider
      value={{
        userData,
        setUserData,
        loading,
        logout,
        refreshData: fetchGlobalData,
        fetchDetailedProfile,
        updateProfile,
      }}
    >
      <SchoolContext.Provider
        value={{
          subjects,
          setSubjects,
          students,
          setStudents,
          loadSubjects,
          loadStudents,
          subjectsLoaded,
          studentsLoaded,
        }}
      >
        {children}
      </SchoolContext.Provider>
    </AuthContext.Provider>
  );
};
