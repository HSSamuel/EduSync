import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
const SchoolContext = createContext();

export const useAppContext = () => {
  const auth = useContext(AuthContext);
  const school = useContext(SchoolContext);
  return { ...auth, ...school };
};

const API_URL = import.meta.env.VITE_API_URL;

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
      const profileRes = await fetch(`${API_URL}/dashboard`, {
        headers: { jwt_token: token },
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserData(profileData);

        // Fetch Subjects and Students in parallel
        const [subRes, stdRes] = await Promise.all([
          fetch(`${API_URL}/subjects`, { headers: { jwt_token: token } }),
          fetch(`${API_URL}/students?limit=1000`, { headers: { jwt_token: token } }),
        ]);

        if (subRes.ok) setSubjects(await subRes.json());
        if (stdRes.ok) {
          const parsed = await stdRes.json();
          setStudents(parsed.data || parsed);
        }
      } else {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (err) {
      console.error("Context Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ userData, setUserData, loading, logout, refreshData: fetchGlobalData }}>
      <SchoolContext.Provider value={{ subjects, setSubjects, students, setStudents }}>
        {children}
      </SchoolContext.Provider>
    </AuthContext.Provider>
  );
};