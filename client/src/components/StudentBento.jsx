import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "../utils/api";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const calculateGPA = (results = []) => {
  if (!results.length) return 0.0;

  let totalPoints = 0;
  results.forEach((row) => {
    const score = Number(row.total_score || 0);
    // Standard Academic Grade Point translation scale
    if (score >= 70) totalPoints += 4.0;
    else if (score >= 60) totalPoints += 3.5;
    else if (score >= 50) totalPoints += 3.0;
    else if (score >= 45) totalPoints += 2.0;
    else totalPoints += 0.0;
  });

  return (totalPoints / results.length).toFixed(2);
};

const formatTime12Hour = (time) => {
  if (!time || typeof time !== "string" || !time.includes(":")) return time;
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
};

export default function StudentBento({ userData }) {
  const [loading, setLoading] = useState(true);
  const [gpa, setGpa] = useState(0.0);
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchBentoMetrics = async () => {
      try {
        setLoading(true);

        // 1. Fetch Dynamic GPA from personal results
        const resultsRes = await apiFetch("/results/me", { method: "GET" });
        let rawResults = [];
        if (resultsRes.ok) {
          const resData = await resultsRes.json();
          rawResults = resData?.data || [];
          if (isMounted) setGpa(calculateGPA(rawResults));
        }

        // 2. Fetch Today's Timetable Schedule
        if (userData?.class_grade) {
          const timetableRes = await apiFetch(
            `/timetable/${encodeURIComponent(userData.class_grade)}`,
            { method: "GET" },
          );
          if (timetableRes.ok) {
            const timeData = await timetableRes.json();
            const currentDay = new Date().toLocaleDateString("en-US", {
              weekday: "long",
            });
            const scheduleForToday = timeData?.data?.[currentDay] || [];
            if (isMounted) setTodayClasses(scheduleForToday);
          }
        }

        // 3. Fetch Recent Modules Uploaded for School
        const modulesRes = await apiFetch("/modules", { method: "GET" });
        if (modulesRes.ok) {
          const modData = await modulesRes.json();
          const sortedModules = (modData?.data || []).slice(0, 2); // Pull top 2 latest files
          if (isMounted) setRecentMaterials(sortedModules);
        }
      } catch (err) {
        console.error("Failed to load dashboard bento data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBentoMetrics();

    return () => {
      isMounted = false;
    };
  }, [userData]);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span className="font-semibold text-sm">
          Compiling workspace data...
        </span>
      </div>
    );
  }

  const maxGPA = 4.0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset =
    circumference - (Math.min(gpa, maxGPA) / maxGPA) * circumference;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 auto-rows-[180px] gap-6"
    >
      {/* WELCOME CARD */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 md:row-span-1 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-center group"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
        <Sparkles
          className="absolute right-6 top-6 text-blue-300 opacity-50"
          size={24}
        />

        <h2 className="text-3xl font-black font-serif tracking-tight mb-2 z-10">
          {userData?.welcome_message || "Welcome back!"}
        </h2>
        <p className="text-blue-100 font-medium z-10">
          {todayClasses.length > 0
            ? `You have ${todayClasses.length} class slot(s) scheduled on your roster today.`
            : "No classes are scheduled on your timetable for today."}
        </p>
      </motion.div>

      {/* DYNAMIC GPA CARD */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-1 md:row-span-2 rounded-[2rem] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform duration-300"
      >
        <div className="absolute top-5 left-5 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-600 dark:text-purple-400">
          <Award size={20} />
        </div>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 mt-4 font-sans">
          Current GPA
        </h3>

        <div className="relative flex items-center justify-center w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-100 dark:text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-purple-600 dark:text-purple-500 transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-900 dark:text-white font-sans">
              {gpa}
            </span>
            <span className="text-xs font-bold text-gray-400 font-sans">
              / 4.0
            </span>
          </div>
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
          Cumulative Scale
        </p>
      </motion.div>

      {/* DYNAMIC DAILY SCHEDULE CARD */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-1 md:row-span-2 rounded-[2rem] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 hover:-translate-y-1 transition-transform duration-300 flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-500">
            <CalendarDays size={20} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white font-sans">
            Today's Roster
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:hidden">
          {todayClasses.length === 0 ? (
            <p className="text-xs italic text-gray-400 dark:text-gray-500 font-medium text-center pt-8">
              Free day! No records found.
            </p>
          ) : (
            todayClasses.map((cls, idx) => {
              const isBreak =
                String(cls.subject).toLowerCase().includes("break") ||
                String(cls.subject).toLowerCase().includes("lunch");
              return (
                <div
                  key={idx}
                  className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700 last:before:hidden"
                >
                  <div
                    className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-sm ${isBreak ? "bg-amber-400" : "bg-blue-500"}`}
                  />
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-0.5 font-sans">
                    {formatTime12Hour(cls.start_time)}
                  </p>
                  <p
                    className={`font-semibold text-sm font-sans ${isBreak ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
                  >
                    {cls.subject}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* DYNAMIC RECENT MATERIALS CARD */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 md:row-span-1 rounded-[2rem] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 font-sans">
            <BookOpen className="text-emerald-500" size={20} /> Learning Vault
          </h3>
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-center">
          {recentMaterials.length === 0 ? (
            <p className="text-xs italic text-gray-400 dark:text-gray-500 font-medium text-center">
              No files uploaded recently.
            </p>
          ) : (
            recentMaterials.map((mod, idx) => (
              <a
                key={idx}
                href={mod.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate font-sans">
                    {mod.title}
                  </p>
                  <p className="text-xs font-medium text-gray-500 truncate font-sans">
                    {mod.subject_name || "Course material"}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-sm font-sans shrink-0">
                  Open
                </span>
              </a>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
