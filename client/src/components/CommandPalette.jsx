import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Search,
  Users,
  BookOpen,
  Receipt,
  Calendar,
  MonitorPlay,
  Settings,
  Moon,
  Sun,
  LogOut,
  GraduationCap,
  Megaphone,
} from "lucide-react";

export default function CommandPalette({ toggleTheme, isDark, logout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Helper to execute an action and close the palette
  const runCommand = (command) => {
    command();
    setOpen(false);
  };

  // Prevent rendering if not open
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
      {/* Blurred Backdrop - optimized for mobile */}
      <div
        className="fixed inset-0 bg-black/60 md:bg-black/40 md:backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Command Modal */}
      <div className="relative z-10 w-full max-w-2xl px-4 animate-fade-in-up">
        <Command
          className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
          loop
        >
          {/* Search Input Area */}
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

          {/* Results Area */}
          <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="p-6 text-center text-sm text-gray-500 font-medium">
              No results found. Try searching for "Students" or "Settings".
            </Command.Empty>

            {/* Group: Navigation */}
            <Command.Group
              heading="Navigation"
              className="px-2 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/dashboard?tab=students"))
                }
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <Users size={18} /> Go to Student Roster
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/dashboard?tab=subjects"))
                }
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <BookOpen size={18} /> Manage Subjects & Modules
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/dashboard?tab=grades"))
                }
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <GraduationCap size={18} /> View Grades & Transcripts
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/dashboard?tab=finance"))
                }
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <Receipt size={18} /> Financial Ledger & Invoices
              </Command.Item>
            </Command.Group>

            {/* Group: Actions */}
            <Command.Group
              heading="Quick Actions"
              className="px-2 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/dashboard?tab=broadcast"))
                }
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <Megaphone size={18} /> Send a Mass Broadcast
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate("/dashboard?tab=cbt"))
                }
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-600 dark:aria-selected:bg-blue-900/30 dark:aria-selected:text-blue-400 transition-colors"
              >
                <MonitorPlay size={18} /> Create New CBT Exam
              </Command.Item>
            </Command.Group>

            {/* Group: Settings */}
            <Command.Group
              heading="Preferences"
              className="px-2 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 dark:border-gray-800 mt-2"
            >
              <Command.Item
                onSelect={() => runCommand(toggleTheme)}
                className="flex items-center gap-3 px-3 py-3 mt-1 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                Toggle {isDark ? "Light" : "Dark"} Mode
              </Command.Item>
              <Command.Item
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