import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

// --- Framer Motion Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
};

const Landing = () => {
  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 flex flex-col overflow-x-hidden">
      {/* --- PREMIUM DEPTH BACKGROUND --- */}
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-300/40 dark:from-blue-900/20 dark:to-indigo-900/20 blur-[120px] animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-tl from-purple-300/30 to-pink-300/30 dark:from-purple-900/20 dark:to-pink-900/20 blur-[120px] animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        ></div>
      </div>

      {/* --- GLASS NAVBAR --- */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-50 w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-white/40 dark:border-gray-800/60 rounded-full mt-6 shadow-[0_4px_30px_rgb(0,0,0,0.04)]"
      >
        <div className="text-2xl font-black font-serif tracking-tighter text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-sans text-xl shadow-lg shadow-blue-500/30">
            E
          </div>
          <span>
            Edu
            <span className="text-gray-900 dark:text-white font-sans">
              Sync.
            </span>
          </span>
        </div>
        <div className="space-x-1 md:space-x-4 flex items-center">
          <Link
            to="/login"
            className="px-5 py-2.5 font-bold text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex flex-col justify-center items-center text-center px-4 mt-24 md:mt-32 w-full">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl space-y-8"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-sm font-bold text-blue-600 dark:text-blue-400 mb-2"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            EduSync 2.0 is now available
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold font-serif tracking-tight leading-[1.05]"
          >
            The Modern Way to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Manage Your School.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Bring administrators, teachers, and students into one unified
            workspace. Distribute materials, automate grading, and communicate
            instantly without the headache.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link
              to="/register"
              className="px-8 py-4 w-full sm:w-auto text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight size={20} />
            </Link>
            <Link
              to="#features"
              className="px-8 py-4 w-full sm:w-auto text-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              Explore Features
            </Link>
          </motion.div>
        </motion.div>

        {/* --- SOCIAL PROOF --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 w-full max-w-5xl mx-auto border-y border-gray-200/50 dark:border-gray-800/50 py-8"
        >
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
            Trusted by Forward-Thinking Institutions
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale dark:opacity-40">
            {/* Dummy Logos built with standard icons/text for neatness */}
            <div className="flex items-center gap-2 font-black text-xl">
              <BookOpen size={24} /> Academica
            </div>
            <div className="flex items-center gap-2 font-black text-xl">
              <ShieldCheck size={24} /> Crestview Prep
            </div>
            <div className="flex items-center gap-2 font-black text-xl">
              <Zap size={24} /> Spark College
            </div>
          </div>
        </motion.div>

        {/* --- FEATURES BENTO GRID --- */}
        <div
          id="features"
          className="mt-32 mb-20 max-w-7xl mx-auto w-full px-6"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-serif mb-4">
              Everything you need to run a school.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
              Stop juggling spreadsheets, WhatsApp groups, and messy paper
              trails. EduSync handles the heavy lifting so educators can focus
              on teaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left transition-all"
            >
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 shadow-inner">
                <BookOpen size={28} />
              </div>
              <h3 className="text-2xl font-bold font-serif mb-3">
                Curriculum Hub
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                Create classes, assign teachers, and securely upload PDF
                syllabuses directly to the student portal. Keep learning
                materials centralized.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left transition-all md:-translate-y-8"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold font-serif mb-3">
                Student Rosters
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                Register students instantly. Keep track of academic standing,
                parental links, and trigger automated absence alerts securely.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-left transition-all"
            >
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <h3 className="text-2xl font-bold font-serif mb-3">
                Auto Grading
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                Input test scores and let our database auto-calculate final
                totals. Download PDF report cards instantly and email them to
                parents.
              </p>
            </motion.div>
          </div>
        </div>

        {/* --- TESTIMONIALS --- */}
        <div className="w-full bg-blue-50 dark:bg-gray-900 border-y border-blue-100 dark:border-gray-800 py-24 px-6 relative z-10">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black font-serif mb-16">
              Loved by Educators
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-1 text-amber-400 mb-4">
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 italic mb-6">
                  "EduSync has completely transformed how we communicate with
                  parents. The automated grading and report card generation
                  saves our staff dozens of hours every term."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold rounded-full flex items-center justify-center text-lg">
                    SJ
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Sarah Jenkins
                    </h4>
                    <p className="text-sm text-gray-500">
                      Principal, Crestview Prep
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-1 text-amber-400 mb-4">
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 italic mb-6">
                  "Having the CBT module built directly into the platform is a
                  game-changer. My students take their quizzes, and the system
                  grades them instantly. Beautiful UI too!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold rounded-full flex items-center justify-center text-lg">
                    DO
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      David O.
                    </h4>
                    <p className="text-sm text-gray-500">
                      Senior Science Teacher
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM CTA --- */}
        <div className="w-full max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            <h2 className="text-4xl md:text-6xl font-black font-serif text-white mb-6 relative z-10">
              Ready to modernize your school?
            </h2>
            <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto relative z-10">
              Join the growing community of institutions using EduSync to
              deliver a world-class digital experience to their students and
              parents.
            </p>

            <Link
              to="/register"
              className="relative z-10 inline-flex px-10 py-5 text-lg bg-white text-blue-900 font-black rounded-2xl shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-1 items-center justify-center gap-2"
            >
              Get Started as an Admin
            </Link>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 px-6 mt-auto z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-4 mb-12">
          <div className="md:col-span-1">
            <div className="text-2xl font-black font-serif tracking-tighter text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-4">
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
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              The Next-Generation School Management & Learning Platform.
            </p>
            <div className="flex gap-4 mt-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <a href="#" className="transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <li>
                <Link
                  to="/register"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Admin Login
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Student Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Resources
            </h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Implementation Guide
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Data Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 font-medium">
          <p>© {new Date().getFullYear()} EduSync. All rights reserved.</p>
          <p className="mt-2 md:mt-0 flex items-center gap-1">
            Designed with{" "}
            <span className="text-red-500 text-lg leading-none">♥</span> for
            Education
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
