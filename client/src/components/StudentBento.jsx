import React from "react";
import {
  CalendarDays,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

// Framer Motion Variants for staggering children
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }, // Delay between each card popping in
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

const StudentBento = ({ userData }) => {
  const currentGPA = 3.8;
  const maxGPA = 4.0;
  const gpaPercentage = (currentGPA / maxGPA) * 100;
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset =
    circumference - (gpaPercentage / 100) * circumference;

  const todayClasses = [
    { time: "08:00 AM", subject: "Mathematics", type: "class" },
    { time: "10:30 AM", subject: "Physics", type: "class" },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "01:00 PM", subject: "Computer Science", type: "class" },
  ];

  const recentModules = [
    { title: "Algebra Chapter 1", subject: "Mathematics", date: "Today" },
    { title: "Newton's Laws PDF", subject: "Physics", date: "Yesterday" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 auto-rows-[180px] gap-6"
    >
      {/* 1. WELCOME CARD */}
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
          You have 2 upcoming classes and 1 new module to review today.
        </p>
      </motion.div>

      {/* 2. GPA / GRADES CARD */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-1 md:row-span-2 rounded-[2rem] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col items-center justify-center relative hover:-translate-y-1 transition-transform duration-300"
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
              r={circleRadius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-100 dark:text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r={circleRadius}
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
              {currentGPA}
            </span>
            <span className="text-xs font-bold text-gray-400 font-sans">
              / 4.0
            </span>
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
          +0.2 from last term
        </p>
      </motion.div>

      {/* 3. TODAY'S SCHEDULE */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-1 md:row-span-2 rounded-[2rem] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:-translate-y-1 transition-transform duration-300 flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-500">
            <CalendarDays size={20} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white font-sans">
            Today's Classes
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:hidden">
          {todayClasses.map((cls, idx) => (
            <div
              key={idx}
              className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700 last:before:hidden"
            >
              <div
                className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-sm ${cls.type === "break" ? "bg-amber-400" : "bg-blue-500"}`}
              ></div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 font-sans">
                {cls.time}
              </p>
              <p
                className={`font-semibold text-sm font-sans ${cls.type === "break" ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
              >
                {cls.subject}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 4. RECENT MODULES */}
      <motion.div
        variants={itemVariants}
        className="md:col-span-2 md:row-span-1 rounded-[2rem] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 font-sans">
            <BookOpen className="text-emerald-500" size={20} /> Recent Materials
          </h3>
          <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 font-sans">
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {recentModules.map((mod, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-sans">
                  {mod.title}
                </p>
                <p className="text-xs font-medium text-gray-500 font-sans">
                  {mod.subject}
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-sm font-sans">
                {mod.date}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentBento;
