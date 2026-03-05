import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import DashboardSkeleton from "./DashboardSkeleton";
import UtilitySidebar from "./UtilitySidebar";
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
  ChevronDown,
  Search,
  Bell,
  ArrowUp,
} from "lucide-react";

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
import CommandPalette from "./CommandPalette";

const Dashboard = () => {
  const { 
    userData, 
    subjects, 
    setSubjects, 
    students, 
    setStudents, 
    loading, 
    logout 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  const [expandedCategories, setExpandedCategories] = useState({
    Academics: true,
    Administration: true,
    Workspace: true,
  });

  const mainContentRef = useRef(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleScroll = () => {
    if (mainContentRef.current && mainContentRef.current.scrollTop > 300) {
      setShowTopBtn(true);
    } else {
      setShowTopBtn(false);
    }
  };

  const scrollToTop = () => {
    mainContentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (loading) return <DashboardSkeleton />;
  if (!userData) return null;

  const isAdmin = userData?.your_role === "Admin";
  const isTeacher = userData?.your_role === "Teacher";
  const isParent = userData?.your_role === "Parent";
  const isStudent = userData?.your_role === "Student";

  const userInitial = userData?.full_name ? userData.full_name.charAt(0) : "U";

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

  const navCategories = {
    Academics: ["overview", "subjects", "timetable", "cbt", "grades"],
    Administration: ["students", "attendance", "finance"],
    Workspace: ["vault", "calendar", "broadcast", "chat"],
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-20 ${isSidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && "justify-center w-full"}`}>
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

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-4 [&::-webkit-scrollbar]:hidden" aria-label="Main Navigation">
          {Object.entries(navCategories).map(([category, itemIds]) => {
            const categoryItems = navItems.filter(
              (i) => itemIds.includes(i.id) && i.show,
            );
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="mb-2">
                {isSidebarOpen && (
                  <button
                    onClick={() => toggleCategory(category)}
                    aria-expanded={expandedCategories[category]}
                    aria-controls={`category-${category}`}
                    className="w-full flex items-center justify-between px-4 py-2 mb-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors outline-none group"
                  >
                    <h3 className="text-[10px] font-black uppercase tracking-widest group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {category}
                    </h3>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${expandedCategories[category] ? "rotate-180" : ""}`}
                    />
                  </button>
                )}

                <motion.div
                  id={`category-${category}`}
                  initial={false}
                  animate={{
                    height: !isSidebarOpen || expandedCategories[category] ? "auto" : 0,
                    opacity: !isSidebarOpen || expandedCategories[category] ? 1 : 0,
                    marginTop: !isSidebarOpen || expandedCategories[category] ? 4 : 0
                  }}
                  className="space-y-1 overflow-hidden"
                >
                  {categoryItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={!isSidebarOpen ? item.label : ""}
                        aria-current={isActive ? "page" : undefined}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 font-semibold text-sm transition-all rounded-xl relative group ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                        } ${!isSidebarOpen && "justify-center px-0"}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="desktop-active-indicator"
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                          />
                        )}
                        <item.icon
                          size={18}
                          className={`shrink-0 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"}`}
                        />
                        {isSidebarOpen && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 md:bg-black/60 md:backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 md:hidden flex flex-col"
              aria-label="Mobile Navigation"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
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
                  aria-label="Close mobile menu"
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
                {Object.entries(navCategories).map(([category, itemIds]) => {
                  const categoryItems = navItems.filter(
                    (i) => itemIds.includes(i.id) && i.show,
                  );
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={`mobile-${category}`} className="mb-2">
                      <button
                        onClick={() => toggleCategory(category)}
                        aria-expanded={expandedCategories[category]}
                        className="w-full flex items-center justify-between px-4 py-2 mb-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors outline-none group"
                      >
                        <h3 className="text-[10px] font-black uppercase tracking-widest group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                          {category}
                        </h3>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${expandedCategories[category] ? "rotate-180" : ""}`}
                        />
                      </button>

                      <motion.div
                        initial={false}
                        animate={{
                          height: expandedCategories[category] ? "auto" : 0,
                          opacity: expandedCategories[category] ? 1 : 0,
                          marginTop: expandedCategories[category] ? 4 : 0
                        }}
                        className="space-y-1 overflow-hidden"
                      >
                        {categoryItems.map((item) => {
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                setIsMobileMenuOpen(false);
                              }}
                              aria-current={isActive ? "page" : undefined}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all relative ${
                                isActive
                                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="mobile-active-indicator"
                                  className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                                />
                              )}
                              <item.icon
                                size={18}
                                className={isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}
                              />
                              {item.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    </div>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* RIGHT SIDE LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence>
  {showTopBtn && (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="absolute bottom-8 right-8 xl:right-[350px] z-[100] p-2 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      title="Back to top"
    >
      <ArrowUp size={16} strokeWidth={2.0} />
    </motion.button>
  )}
</AnimatePresence>

        <CommandPalette
          toggleTheme={toggleTheme}
          isDark={isDark}
          logout={logout}
        />

        <header className="h-16 shrink-0 bg-white/95 md:bg-white/80 dark:bg-gray-800/95 md:dark:bg-gray-800/80 md:backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Mobile Menu"
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 hidden lg:block w-48">
              {navItems.find((i) => i.id === activeTab)?.label || "Dashboard"}
            </h2>

            <button
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                )
              }
              aria-label="Open Command Palette"
              className="hidden sm:flex items-center justify-between w-full max-w-md px-4 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-full transition-all group"
            >
              <span className="flex items-center gap-2">
                <Search
                  size={16}
                  className="text-gray-400 group-hover:text-blue-500 transition-colors"
                />
                Search students, subjects, or actions...
              </span>
              <kbd className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] font-bold text-gray-400">
                <span className="text-sm">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 pl-4">
            <button
              onClick={toggleTheme}
              aria-label={`Toggle ${isDark ? 'Light' : 'Dark'} Mode`}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {(!isTeacher && !isParent) && (
              <button
                onClick={() => setIsUtilityOpen(true)}
                aria-label="Open Notifications Center"
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative xl:hidden"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
              </button>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {userData?.full_name}
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {userData?.your_role}
                </span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md cursor-default border-2 border-white dark:border-gray-700">
                {userInitial}
              </div>
            </div>

            <button
              onClick={logout}
              aria-label="Log out"
              className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors hidden sm:block"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          <main
            ref={mainContentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative"
          >
            <div className="max-w-[1400px] mx-auto pb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full"
                >
                  {activeTab === "overview" && isAdmin && <AnalyticsCards />}
                  {activeTab === "overview" && isStudent && <StudentBento userData={userData} />}
                  {activeTab === "subjects" && !isParent && (
                    <SubjectsTab
                      isAdmin={isAdmin}
                      isTeacher={isTeacher}
                      subjects={subjects}
                      setSubjects={setSubjects}
                    />
                  )}
                  {activeTab === "students" && isAdmin && (
                    <StudentsTab isAdmin={isAdmin} />
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
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {(!isTeacher && !isParent) && (
            <UtilitySidebar 
              userData={userData} 
              isOpen={isUtilityOpen} 
              setIsOpen={setIsUtilityOpen} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;