import React from "react";
import { motion } from "framer-motion";

const DashboardSkeleton = () => {
  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 animate-pulse">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="ml-3 w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
        <div className="p-6 space-y-6 mt-4">
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-3">
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-md shrink-0"></div>
                  <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between px-6 z-10 animate-pulse">
          <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded-md hidden sm:block"></div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative w-full max-w-[1400px] mx-auto animate-pulse">
          {/* Top Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-800 rounded-[2rem]"
              ></div>
            ))}
          </div>
          {/* Main Area Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] bg-gray-200 dark:bg-gray-800 rounded-[2rem]"></div>
            <div className="lg:col-span-1 h-[400px] bg-gray-200 dark:bg-gray-800 rounded-[2rem]"></div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
