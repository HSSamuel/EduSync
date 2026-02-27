import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --- Import our Sub-Components ---
import SubjectsTab from "./SubjectsTab";
import StudentsTab from "./StudentsTab";
import GradesTab from "./GradesTab";
import SchoolVaultTab from "./SchoolVaultTab";
import AnalyticsCards from "./AnalyticsCards";
import AttendanceTab from "./AttendanceTab";
import BroadcastTab from "./BroadcastTab";
import CalendarTab from "./CalendarTab";
import FinanceTab from "./FinanceTab";
import ChatTab from "./ChatTab";
import CBTTab from "./CBTTab"; // 👈 IMPORTED CBT
import TimetableTab from "./TimetableTab"; // 👈 IMPORTED TIMETABLE

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
          const profileData = await profileRes.json();
          setUserData(profileData);

          // Smart Routing: If a parent logs in, default to the Grades tab. Otherwise, default to Subjects.
          if (profileData.your_role === "Parent") {
            setActiveTab("grades");
          } else {
            setActiveTab("subjects");
          }

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

  // --- ROLE CHECKERS ---
  const isAdmin = userData?.your_role === "Admin";
  const isTeacher = userData?.your_role === "Teacher";
  const isParent = userData?.your_role === "Parent";
  const isStudent = !isAdmin && !isTeacher && !isParent;

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 mt-10 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-800 dark:text-white transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 dark:border-gray-700">
        <h2 className="text-3xl font-bold">
          {isAdmin
            ? "Admin Vault"
            : isTeacher
              ? "Teacher Portal"
              : isParent
                ? "Parent Portal"
                : "Student Portal"}
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
          {/* Dynamic Welcome Banner! */}
          <div
            className={`p-6 rounded-lg shadow-inner flex justify-between items-center ${
              isAdmin
                ? "bg-blue-50 dark:bg-gray-700"
                : isTeacher
                  ? "bg-indigo-50 dark:bg-indigo-900/30"
                  : isParent
                    ? "bg-orange-50 dark:bg-orange-900/20"
                    : "bg-green-50 dark:bg-green-900/20"
            }`}
          >
            <div>
              <h3 className="text-2xl mb-1">👋 {userData.message}</h3>
              <p className="text-lg">
                <strong>Role:</strong> {userData.your_role}
              </p>
            </div>
          </div>

          {/* --- ANALYTICS CARDS (Admin Only) --- */}
          {isAdmin && <AnalyticsCards />}

          {/* --- TABS NAVIGATION --- */}
          <div className="flex space-x-2 md:space-x-4 border-b dark:border-gray-700 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Subjects Tab */}
            {!isParent && (
              <button
                onClick={() => setActiveTab("subjects")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "subjects" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}
              >
                📚 {isAdmin || isTeacher ? "Manage Subjects" : "My Subjects"}
              </button>
            )}

            {/* Students Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("students")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "students" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}
              >
                👨‍🎓 Enrolled Students
              </button>
            )}

            {/* Attendance Tab */}
            {(isAdmin || isTeacher) && (
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "attendance" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}
              >
                📝 Daily Roll Call
              </button>
            )}

            {/* NEW: CBT Exams Tab (Admins, Teachers, Students) */}
            {!isParent && (
              <button
                onClick={() => setActiveTab("cbt")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "cbt" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-purple-600"}`}
              >
                💻 CBT Exams
              </button>
            )}

            {/* NEW: Timetable Tab (Everyone) */}
            <button
              onClick={() => setActiveTab("timetable")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "timetable" ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-indigo-600"}`}
            >
              🗓️ Timetable
            </button>

            {/* Vault Tab */}
            <button
              onClick={() => setActiveTab("vault")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "vault" ? "bg-yellow-500 text-gray-900" : "text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-500"}`}
            >
              🏛️ School Vault
            </button>

            {/* Broadcast Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("broadcast")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "broadcast" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600"}`}
              >
                📢 Broadcast
              </button>
            )}

            {/* Calendar Tab */}
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "calendar" ? "bg-teal-500 text-white" : "text-gray-500 hover:text-teal-600"}`}
            >
              📅 Calendar
            </button>

            {/* Finance Tab */}
            {!isTeacher && (
              <button
                onClick={() => setActiveTab("finance")}
                className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "finance" ? "bg-amber-500 text-white" : "text-gray-500 hover:text-amber-600"}`}
              >
                💳 Billing & Fees
              </button>
            )}

            {/* Chat Tab */}
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === "chat" ? "bg-pink-500 text-white" : "text-gray-500 hover:text-pink-600"}`}
            >
              💬 Live Chat
            </button>

            {/* Grades Tab */}
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-4 py-2 font-bold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "grades" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-purple-600"}`}
            >
              📊{" "}
              {isAdmin || isTeacher
                ? "Grades & Reports"
                : isParent
                  ? "Child's Report Card"
                  : "My Report Card"}
            </button>
          </div>

          {/* --- CONDITIONAL RENDERING OF THE ACTIVE TAB --- */}
          {activeTab === "subjects" && !isParent && (
            <SubjectsTab
              isAdmin={isAdmin}
              isTeacher={isTeacher}
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
          {activeTab === "attendance" && (isAdmin || isTeacher) && (
            <AttendanceTab students={students} />
          )}

          {/* NEW MODULES RENDERED HERE */}
          {activeTab === "cbt" && !isParent && (
            <CBTTab
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              isStudent={isStudent}
              subjects={subjects}
            />
          )}
          {activeTab === "timetable" && (
            <TimetableTab
              isAdmin={isAdmin}
              isStudent={isStudent}
              userData={userData}
              subjects={subjects}
            />
          )}

          {activeTab === "vault" && <SchoolVaultTab isAdmin={isAdmin} />}
          {activeTab === "broadcast" && <BroadcastTab isAdmin={isAdmin} />}
          {activeTab === "calendar" && <CalendarTab isAdmin={isAdmin} />}

          {activeTab === "finance" && (
            <FinanceTab
              isAdmin={isAdmin}
              isParent={isParent}
              isStudent={isStudent}
              students={students}
            />
          )}

          {activeTab === "chat" && <ChatTab userData={userData} />}

          {activeTab === "grades" && (
            <GradesTab
              isAdmin={isAdmin}
              isTeacher={isTeacher}
              isParent={isParent}
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
