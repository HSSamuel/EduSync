import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
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
import StudentBento from "./StudentBento";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("");

  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dark Mode State
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
          else if (profileData.your_role === "Student")
            setActiveTab("overview");
          else setActiveTab("subjects"); // Teacher default

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
            const parsedStudents = await studentsRes.json();
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

  const logout = async (e) => {
    e.preventDefault();

    try {
      // Tell the backend to clear the httpOnly refresh cookie
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error", err);
    }

    localStorage.removeItem("token"); // Remove the short-lived access token
    navigate("/login");
  };

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      show: isAdmin || isStudent,
    },
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
    { id: "finance", label: "Billing", icon: CreditCard, show: !isTeacher },
    { id: "vault", label: "Vault", icon: FolderLock, show: true },
    { id: "calendar", label: "Calendar", icon: Calendar, show: true },
    { id: "broadcast", label: "Broadcast", icon: Megaphone, show: isAdmin },
    { id: "chat", label: "Live Chat", icon: MessageSquare, show: true },
  ];

  if (error)
    return (
      <div className="flex h-screen items-center justify-center text-red-500 font-bold">
        {error}
      </div>
    );
  if (!userData)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 animate-pulse font-bold">
        Loading Secure Environment...
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-20 ${isSidebarOpen ? "w-64" : "w-20"}`}
      >
        {/* Sidebar Header (Logo) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div
            className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && "justify-center w-full"}`}
          >
            <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md">
              E
            </div>
            {isSidebarOpen && (
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white font-serif whitespace-nowrap">
                Edu<span className="text-blue-600 font-sans">Sync.</span>
              </h1>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 [&::-webkit-scrollbar]:hidden">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-sm transition-all group relative ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white"
                  } ${!isSidebarOpen && "justify-center"}`}
                  title={!isSidebarOpen ? item.label : ""}
                >
                  <item.icon
                    size={20}
                    className={`shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}
                  />

                  {isSidebarOpen && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Active Indicator Dot */}
                  {isActive && isSidebarOpen && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Sidebar Footer (Collapse Toggle) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isSidebarOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md">
              E
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-serif">
              Edu<span className="text-blue-600 font-sans">Sync.</span>
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <item.icon
                    size={20}
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
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* TOPBAR (Glassmorphism) */}
        <header className="h-16 shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between px-4 sm:px-6 z-10">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 hidden sm:block">
              {navItems.find((i) => i.id === activeTab)?.label || "Dashboard"}
            </h2>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell (Visual only for now) */}
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

            {/* Profile Section */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {userData.message
                    .replace("Welcome back, ", "")
                    .replace("!", "")}
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {userData.your_role}
                </span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md cursor-default border-2 border-white dark:border-gray-700">
                {userInitial}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* MAIN SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 relative">
          <div className="max-w-[1400px] mx-auto pb-12">
            {/* AnimatePresence handles the exit animations */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab} // Changing the key triggers the animation
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                {activeTab === "overview" && isAdmin && <AnalyticsCards />}
                {activeTab === "overview" && isStudent && (
                  <StudentBento userData={userData} />
                )}

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
                {activeTab === "broadcast" && (
                  <BroadcastTab isAdmin={isAdmin} />
                )}
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
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
