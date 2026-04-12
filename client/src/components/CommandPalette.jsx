import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Search,
  Users,
  BookOpen,
  Receipt,
  MonitorPlay,
  Moon,
  Sun,
  LogOut,
  GraduationCap,
  Megaphone,
} from "lucide-react";

// Updated: Now accepts setActiveTab as a prop
export default function CommandPalette({ toggleTheme, isDark, logout, setActiveTab }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 1. Listen for standard keyboard shortcuts
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    // 2. Listen for our new custom event triggered from the Header button
    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleCustomOpen);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, []);

  // Updated: Changes the local state tab instead of routing to a URL
  const runCommand = (action) => {
    if (typeof action === 'string' && setActiveTab) {
      setActiveTab(action); // Switch the dashboard tab directly
    } else if (typeof action === 'function') {
      action(); // Run functions like toggleTheme or logout
    }
    setOpen(false); // Close the menu
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/60 md:bg-black/40 md:backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl px-4 animate-fade-in-up">
        <Command
          className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
          loop
        >
          <div className="flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
            <Search size={20} className="text-gray-400 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="What do you need to do? (Type a command or search...)"
              className="w-full px-4 py-5 bg-transparent border-none outline-none text-gray-900 dark:text-white font-medium placeholder:text-gray-400 text-lg"
            />
            <kbd className="hidden sm:inline-flex items-center h-6 px-2 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="p-6 text-center text-sm text-gray-500 font-medium">
              No results found. Try searching for "Students" or "Settings".
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="px-2 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              <Command.Item
                value="student roster users view list"
                onSelect={() => runCommand('students')}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <Users size={18} /> Go to Student Roster
              </Command.Item>
              <Command.Item
                value="subjects modules classes syllabus"
                onSelect={() => runCommand('subjects')}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <BookOpen size={18} /> Manage Subjects & Modules
              </Command.Item>
              <Command.Item
                value="grades transcripts reports scores"
                onSelect={() => runCommand('grades')}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <GraduationCap size={18} /> View Grades & Transcripts
              </Command.Item>
              <Command.Item
                value="finance invoices money payments bills"
                onSelect={() => runCommand('finance')}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <Receipt size={18} /> Financial Ledger & Invoices
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Quick Actions"
              className="px-2 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              <Command.Item
                value="mass broadcast email newsletter message"
                onSelect={() => runCommand('broadcast')}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <Megaphone size={18} /> Send a Mass Broadcast
              </Command.Item>
              <Command.Item
                value="cbt exam test quiz create"
                onSelect={() => runCommand('cbt')}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <MonitorPlay size={18} /> Create New CBT Exam
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Preferences"
              className="px-2 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 dark:border-gray-800 mt-2"
            >
              <Command.Item
                value="theme dark light mode switch"
                onSelect={() => runCommand(toggleTheme)}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                Toggle {isDark ? "Light" : "Dark"} Mode
              </Command.Item>
              <Command.Item
                value="logout sign out exit"
                onSelect={() => runCommand(logout)}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl cursor-pointer aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20 transition-colors"
              >
                <LogOut size={18} /> Log Out
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}