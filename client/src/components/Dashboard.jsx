import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import DashboardSkeleton from "./DashboardSkeleton";
import UtilitySidebar from "./UtilitySidebar";
import CommandPalette from "./CommandPalette";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardHero from "./dashboard/DashboardHero";
import DashboardContent from "./dashboard/DashboardContent";
import {
  getDashboardRoleFlags,
  getDashboardNavItems,
  NAV_CATEGORIES,
  getTabDescription,
} from "../utils/dashboardConfig";

const Dashboard = () => {
  const { userData, subjects, setSubjects, students, loading, logout } = useAppContext();

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
    mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <DashboardSkeleton />;
  if (!userData) return null;

  const flags = getDashboardRoleFlags(userData);
  const { role, isTeacher, isParent } = flags;
  const navItems = getDashboardNavItems(flags);
  const currentTab = navItems.find((item) => item.id === activeTab);
  const userInitial = userData?.full_name ? userData.full_name.charAt(0) : "U";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <DashboardSidebar
        navCategories={NAV_CATEGORIES}
        navItems={navItems}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <AnimatePresence>
          {showTopBtn && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="absolute bottom-8 right-8 xl:right-[350px] z-[100] p-3 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              title="Back to top"
            >
              <ArrowUp size={16} strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>

        <CommandPalette toggleTheme={toggleTheme} isDark={isDark} logout={logout} />

        <DashboardHeader
          currentTab={currentTab}
          isDark={isDark}
          toggleTheme={toggleTheme}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setIsUtilityOpen={setIsUtilityOpen}
          isTeacher={isTeacher}
          isParent={isParent}
          userData={userData}
          role={role}
          userInitial={userInitial}
          logout={logout}
        />

        <div className="flex flex-1 overflow-hidden bg-transparent min-w-0">
          <main
            ref={mainContentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative min-w-0"
          >
            <div className="max-w-[1400px] mx-auto pb-12">
              <DashboardHero
                title={currentTab?.label || "Dashboard"}
                description={getTabDescription(activeTab, flags)}
              />

              <DashboardContent
                activeTab={activeTab}
                flags={flags}
                userData={userData}
                subjects={subjects}
                setSubjects={setSubjects}
                students={students}
              />
            </div>
          </main>

          {!isTeacher && !isParent && (
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
