import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

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

  const fetchGlobalData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch Profile
      const profileRes = await apiFetch("/dashboard", { method: "GET" });

      if (!profileRes.ok) {
        localStorage.removeItem("token");
        setUserData(null);
        setSubjects([]);
        setStudents([]);
        navigate("/login");
        return;
      }

      const profileData = await profileRes.json();
      setUserData(profileData);

      // Fetch Subjects and Students in parallel
      const [subRes, stdRes] = await Promise.all([
        apiFetch("/subjects", { method: "GET" }),
        apiFetch("/students?limit=1000", { method: "GET" }),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData);
      }

      if (stdRes.ok) {
        const stdData = await stdRes.json();
        setStudents(stdData?.data || stdData);
      }
    } catch (err) {
      console.error("Context Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      // Clear refresh cookie on server
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      // Even if server fails, we still log out locally
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      setUserData(null);
      setSubjects([]);
      setStudents([]);
      navigate("/login");
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
