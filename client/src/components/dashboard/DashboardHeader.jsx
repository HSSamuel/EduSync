import React, { useEffect, useRef } from "react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  Pencil,
  ChevronDown,
} from "lucide-react";

export default function DashboardHeader({
  currentTab,
  isDark,
  toggleTheme,
  setIsMobileMenuOpen,
  setIsUtilityOpen,
  isTeacher,
  isParent,
  userData,
  role,
  userInitial,
  logout,
  isProfileMenuOpen,
  setIsProfileMenuOpen,
  openProfileModal,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setIsProfileMenuOpen]);

  return (
    <header className="relative h-16 shrink-0 bg-white/95 md:bg-white/80 dark:bg-gray-900/95 md:dark:bg-gray-900/80 md:backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-[120]">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open Mobile Menu"
          className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="hidden lg:block min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {currentTab?.label || "Dashboard"}
          </h2>
        </div>

        <button
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
          aria-label="Open Command Palette"
          className="hidden sm:flex items-center justify-between w-full max-w-md px-4 py-2.5 text-sm text-gray-500 bg-gray-100/90 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-full transition-all group"
        >
          <span className="flex items-center gap-2 truncate">
            <Search
              size={16}
              className="text-gray-400 group-hover:text-blue-500 transition-colors"
            />
            <span className="truncate">
              Search students, subjects, or actions...
            </span>
          </span>
          <kbd className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] font-bold text-gray-400 shrink-0">
            <span className="text-sm">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 pl-4 shrink-0">
        <button
          onClick={toggleTheme}
          aria-label={`Toggle ${isDark ? "Light" : "Dark"} Mode`}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {!isTeacher && !isParent && (
          <button
            onClick={() => setIsUtilityOpen(true)}
            aria-label="Open Notifications Center"
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative xl:hidden"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          </button>
        )}

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

        <div ref={menuRef} className="relative flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex flex-col items-end min-w-0">
            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[180px]">
              {userData?.full_name}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {role}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white dark:border-gray-800 shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:scale-105 transition-transform">
              {userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={`${userData?.full_name || "User"} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>

            <ChevronDown
              size={16}
              className={`hidden sm:block text-gray-500 transition-transform ${
                isProfileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-14 w-72 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden z-[200]">
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {userData?.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userData?.email || "No email available"}
                </p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1">
                  {role}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    openProfileModal("view");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User size={16} />
                  View Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    openProfileModal("edit");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          aria-label="Log out"
          className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors hidden sm:block"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
