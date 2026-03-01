import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Calculator, ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 flex flex-col overflow-hidden">
      {/* --- PREMIUM DEPTH BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-300/40 dark:from-blue-900/30 dark:to-indigo-900/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-tl from-purple-300/40 to-pink-300/40 dark:from-purple-900/30 dark:to-pink-900/30 blur-[120px]"></div>
      </div>

      {/* --- GLASS NAVBAR --- */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-full mt-6 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
        <div className="text-2xl font-black font-serif tracking-tighter text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-sans text-xl shadow-md">
            E
          </div>
          <span>
            Edu
            <span className="text-gray-900 dark:text-white font-sans">
              Sync.
            </span>
          </span>
        </div>
        <div className="space-x-2 md:space-x-4 flex items-center">
          <Link
            to="/login"
            className="px-4 py-2 font-bold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 shadow-md transition-all transform hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex-grow flex flex-col justify-center items-center text-center px-4 mt-20 md:mt-12">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-sm font-bold text-blue-600 dark:text-blue-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            EduSync 2.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold font-serif tracking-tight leading-[1.1]">
            The Modern Way to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Manage Your School.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Bring administrators, teachers, and students into one unified
            workspace. Distribute materials, automate grading, and communicate
            instantly.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 w-full sm:w-auto text-lg bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:bg-blue-700 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* --- GLASS BENTO FEATURES GRID --- */}
        <div className="mt-28 mb-20 max-w-6xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold font-serif mb-3">
              Curriculum Hub
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Create classes, assign teachers, and securely upload PDF
              syllabuses directly to the student portal.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left hover:-translate-y-2 transition-transform duration-300 md:-translate-y-6">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold font-serif mb-3">
              Student Rosters
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Register students instantly. Keep track of academic standing,
              parental links, and automated absence alerts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
              <Calculator size={28} />
            </div>
            <h3 className="text-xl font-bold font-serif mb-3">Auto Grading</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Input test scores and let our database auto-calculate final
              totals. Download PDF report cards instantly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
