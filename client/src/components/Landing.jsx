import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 flex flex-col">
      
      {/* --- NAVBAR --- */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">
          Edu<span className="text-gray-900 dark:text-white">Sync.</span>
        </div>
        <div className="space-x-4">
          <Link to="/login" className="font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition-colors">
            Log In
          </Link>
          <Link to="/register" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="flex-grow flex flex-col justify-center items-center text-center px-4 mt-16 md:mt-0">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            The Modern Way to <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Manage Your School.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            EduSync brings administrators and students together. Manage subjects, distribute course materials, and auto-calculate grades all in one secure, lightning-fast platform.
          </p>
          
          <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/register" className="px-8 py-4 w-full sm:w-auto text-lg bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              Create an Account
            </Link>
            <Link to="/login" className="px-8 py-4 w-full sm:w-auto text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-400 shadow-sm hover:shadow-md transition-all">
              Admin Login
            </Link>
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="mt-24 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6 pb-20">
          
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">Subject Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Create classes, assign teachers, and seamlessly upload PDF syllabuses directly to the student portal.</p>
          </div>

          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-xl font-bold mb-2">Student Rosters</h3>
            <p className="text-gray-600 dark:text-gray-400">Register new students in seconds. Keep track of emails, grade levels, and enrollment dates securely.</p>
          </div>

          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Automated Grading</h3>
            <p className="text-gray-600 dark:text-gray-400">Input test and exam scores and let our database auto-calculate the final totals instantly. No calculators needed.</p>
          </div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full py-6 text-center text-gray-500 dark:text-gray-500 border-t dark:border-gray-800">
        <p>© {new Date().getFullYear()} EduSync. Built with React & PostgreSQL.</p>
      </footer>

    </div>
  );
};

export default Landing;