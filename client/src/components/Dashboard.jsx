import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import our new sub-components!
import SubjectsTab from "./SubjectsTab";
import StudentsTab from "./StudentsTab";
import GradesTab from "./GradesTab";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("subjects");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const profileRes = await fetch("http://localhost:5000/api/dashboard", {
          headers: { jwt_token: token },
        });
        if (profileRes.ok) {
          setUserData(await profileRes.json());

          const subjectsRes = await fetch(
            "http://localhost:5000/api/subjects",
            { headers: { jwt_token: token } },
          );
          if (subjectsRes.ok) setSubjects(await subjectsRes.json());

          const studentsRes = await fetch(
            "http://localhost:5000/api/students",
            { headers: { jwt_token: token } },
          );
          if (studentsRes.ok) setStudents(await studentsRes.json());
        } else {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const isAdmin = userData?.your_role === "Admin";

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 mt-10 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-800 dark:text-white transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 dark:border-gray-700">
        <h2 className="text-3xl font-bold">
          {isAdmin ? "Admin Vault" : "Student Portal"}
        </h2>
        <button
          onClick={logout}
          className="mt-4 md:mt-0 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {error ? (
        <p className="text-red-500 font-semibold">{error}</p>
      ) : userData ? (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg shadow-inner flex justify-between items-center ${isAdmin ? "bg-blue-50 dark:bg-gray-700" : "bg-green-50 dark:bg-green-900/20"}`}
          >
            <div>
              <h3 className="text-2xl mb-1">👋 {userData.message}</h3>
              <p className="text-lg">
                <strong>Role:</strong> {userData.your_role}
              </p>
            </div>
          </div>

          <div className="flex space-x-2 md:space-x-4 border-b dark:border-gray-700 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("subjects")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "subjects" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}
            >
              📚 {isAdmin ? "Manage Subjects" : "My Subjects"}
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("students")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "students" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}
              >
                👨‍🎓 Enrolled Students
              </button>
            )}
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "grades" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-purple-600"}`}
            >
              📊 {isAdmin ? "Grades & Reports" : "My Report Card"}
            </button>
          </div>

          {/* Conditional Rendering of our new Child Components! */}
          {activeTab === "subjects" && (
            <SubjectsTab
              isAdmin={isAdmin}
              subjects={subjects}
              setSubjects={setSubjects}
            />
          )}
          {activeTab === "students" && isAdmin && (
            <StudentsTab
              isAdmin={isAdmin}
              students={students}
              setStudents={setStudents}
            />
          )}
          {activeTab === "grades" && (
            <GradesTab
              isAdmin={isAdmin}
              students={students}
              subjects={subjects}
            />
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic animate-pulse">
          Loading secure data...
        </p>
      )}
    </div>
  );
};

export default Dashboard;
