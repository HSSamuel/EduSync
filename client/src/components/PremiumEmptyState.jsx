// src/components/PremiumEmptyState.jsx
import React from "react";
import { Sparkles } from "lucide-react";

const PremiumEmptyState = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] relative overflow-hidden group animate-fade-in">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50 pointer-events-none"></div>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

      {/* Floating Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-3xl transform rotate-6 scale-105 transition-transform group-hover:rotate-12"></div>
        <div className="relative bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <Icon size={40} className="text-blue-600 dark:text-blue-400" />
        </div>
        <Sparkles
          className="absolute -top-3 -right-3 text-amber-400 animate-pulse"
          size={20}
        />
      </div>

      <h3 className="text-2xl font-black font-serif text-gray-900 dark:text-white mb-2 z-10">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 z-10 font-medium text-sm">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="relative z-10 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default PremiumEmptyState;
