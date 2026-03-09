import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function DashboardHero({ title, description, inviteCode, schoolName }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy invite code:", error);
    }
  };

  return (
    <div className="mb-6 sm:mb-8 space-y-4">
      <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-3xl text-justify">
          {description}
        </p>
      </div>

      {inviteCode ? (
        <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-cyan-50 px-5 py-4 shadow-sm dark:border-emerald-800/70 dark:from-emerald-950/40 dark:to-cyan-950/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">
                School Invite Code
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[0.2em] text-gray-900 dark:text-white">
                {inviteCode}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Share this code with teachers, students, and parents to join
                {schoolName ? ` ${schoolName}` : " your school"}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-gray-900 dark:text-emerald-300 dark:hover:bg-gray-800"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
