import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  UserCheck,
  MonitorPlay,
  CalendarDays,
  FolderLock,
  Megaphone,
  Calendar,
  CreditCard,
  MessageSquare,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
} from "lucide-react";

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
import CBTTab from "./CBTTab";
import TimetableTab from "./TimetableTab";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("");

  // Local Dark Mode State
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  const navigate = useNavigate();

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const profileRes = await fetch("http://localhost:5000/api/dashboard", {
          headers: { jwt_token: token },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (!isMounted) return;

          setUserData(profileData);

          // Smart Routing Defaults
          if (profileData.your_role === "Admin") setActiveTab("overview");
          else if (profileData.your_role === "Parent") setActiveTab("grades");
          else setActiveTab("subjects");

          const subjectsRes = await fetch(
            "http://localhost:5000/api/subjects",
            { headers: { jwt_token: token } },
          );
          if (subjectsRes.ok) {
            const parsedSubjects = await subjectsRes.json();
            if (isMounted) setSubjects(parsedSubjects);
          }

          const studentsRes = await fetch(
            "http://localhost:5000/api/students",
            { headers: { jwt_token: token } },
          );
          if (studentsRes.ok) {
            const parsedStudents = await studentsRes.json(); // 👈 FIXED!
            if (isMounted) setStudents(parsedStudents);
          }
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard Fetch Error:", err);
          setError(`System Error: ${err.message}`);
        }
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // --- ROLE CHECKERS ---
  const isAdmin = userData?.your_role === "Admin";
  const isTeacher = userData?.your_role === "Teacher";
  const isParent = userData?.your_role === "Parent";
  const isStudent = !isAdmin && !isTeacher && !isParent;

  const userInitial = userData?.message
    ? userData.message.replace("Welcome back, ", "").charAt(0)
    : "U";

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, show: isAdmin },
    {
      id: "subjects",
      label: isAdmin || isTeacher ? "Manage Subjects" : "My Subjects",
      icon: BookOpen,
      show: !isParent,
    },
    { id: "students", label: "Students", icon: Users, show: isAdmin },
    {
      id: "attendance",
      label: "Roll Call",
      icon: UserCheck,
      show: isAdmin || isTeacher,
    },
    { id: "cbt", label: "CBT Exams", icon: MonitorPlay, show: !isParent },
    { id: "timetable", label: "Timetable", icon: CalendarDays, show: true },
    { id: "vault", label: "Vault", icon: FolderLock, show: true },
    { id: "broadcast", label: "Broadcast", icon: Megaphone, show: isAdmin },
    { id: "calendar", label: "Calendar", icon: Calendar, show: true },
    { id: "finance", label: "Billing", icon: CreditCard, show: !isTeacher },
    { id: "chat", label: "Live Chat", icon: MessageSquare, show: true },
    {
      id: "grades",
      label:
        isAdmin || isTeacher
          ? "Grades & Reports"
          : isParent
            ? "Child's Report Card"
            : "My Report Card",
      icon: GraduationCap,
      show: true,
    },
  ];

  if (error)
    return (
      <div className="text-center mt-20 text-red-500 font-bold">{error}</div>
    );
  if (!userData)
    return (
      <div className="text-center mt-20 text-gray-500 animate-pulse font-bold">
        Loading Secure Environment...
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in flex flex-col">
      {/* --- TOP BRANDING & PROFILE BAR --- */}
      <header className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Upper Header: Logo & Profile */}
          <div className="flex justify-between items-center h-16 pt-2">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md">
                E
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Edu<span className="text-blue-600">Sync.</span>
              </h1>
              <span className="ml-4 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded-full text-gray-600 dark:text-gray-300 hidden md:block uppercase tracking-wider">
                {userData.your_role}
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User Profile Info */}
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {userData.message
                    .replace("Welcome back, ", "")
                    .replace("!", "")}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md cursor-default">
                {userInitial}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="ml-2 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:block text-sm">Logout</span>
              </button>
            </div>
          </div>

          {/* Lower Header: SCROLLABLE NAVIGATION TABS */}
          <nav className="flex overflow-x-auto space-x-6 [&::-webkit-scrollbar]:hidden pt-4 mt-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <item.icon
                      size={16}
                      className={
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400"
                      }
                    />
                    {item.label}
                  </button>
                );
              })}
          </nav>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="pb-12">
          {activeTab === "overview" && isAdmin && <AnalyticsCards />}

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
          {activeTab === "finance" && !isTeacher && (
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
      </main>
    </div>
  );
};

export default Dashboard;
