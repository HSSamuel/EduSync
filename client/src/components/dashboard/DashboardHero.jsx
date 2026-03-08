import React from "react";

export default function DashboardHero({ title, description }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-3xl text-justify">
          {description}
        </p>
      </div>
    </div>
  );
}
