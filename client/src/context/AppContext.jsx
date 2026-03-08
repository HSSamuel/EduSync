import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiFetchOrThrow, apiJsonFetch } from "../utils/api";

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

  const navigate = useNavigate();

  const resetAppState = useCallback(() => {
    setUserData(null);
    setSubjects([]);
    setStudents([]);
  }, []);

  const fetchGlobalData = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        resetAppState();
        return;
      }

      const profileData = await apiFetchOrThrow(
        "/dashboard",
        { method: "GET" },
        "Unable to load your dashboard profile.",
      );
      setUserData(profileData);

      const [subjectsResult, studentsResult] = await Promise.all([
        apiJsonFetch("/subjects", { method: "GET" }),
        apiJsonFetch("/students?limit=1000", { method: "GET" }),
      ]);

      if (subjectsResult.ok) {
        setSubjects(Array.isArray(subjectsResult.data) ? subjectsResult.data : []);
      } else {
        setSubjects([]);
      }

      if (studentsResult.ok) {
        const nextStudents = Array.isArray(studentsResult.data)
          ? studentsResult.data
          : studentsResult.data?.data || [];
        setStudents(nextStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Context Fetch Error:", err);
      localStorage.removeItem("token");
      resetAppState();
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, resetAppState]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const logout = async () => {
    try {
      await apiJsonFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
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
      }}
    >
      <SchoolContext.Provider
        value={{
          subjects,
          setSubjects,
          students,
          setStudents,
        }}
      >
        {children}
      </SchoolContext.Provider>
    </AuthContext.Provider>
  );
};
