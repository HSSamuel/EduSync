import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Library,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiFetch } from "../utils/api";

const AnalyticsCards = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalDocuments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiFetch("/dashboard/stats", {
          method: "GET",
        });

        if (response.ok) {
          const payload = await response.json();
          setStats(
            payload?.data || {
              totalStudents: 0,
              totalTeachers: 0,
              totalSubjects: 0,
              totalDocuments: 0,
            },
          );
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
  }, []);

  const navigateTo = (tabId) => {
    if (typeof onNavigate === "function" && tabId) {
      onNavigate(tabId);
    }
  };

  const handleKeyNavigate = (e, tabId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigateTo(tabId);
    }
  };

  const cards = [
    {
      id: "students",
      title: "Students",
      helper: "Open students page",
      value: stats.totalStudents,
      icon: GraduationCap,
      color: "from-blue-500 to-cyan-400",
    },
    {
      id: "attendance",
      title: "Teachers",
      helper: "Open roll call",
      value: stats.totalTeachers,
      icon: Users,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "subjects",
      title: "Subjects",
      helper: "Open subjects page",
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "from-emerald-500 to-teal-400",
    },
    {
      id: "vault",
      title: "Vault Docs",
      helper: "Open vault page",
      value: stats.totalDocuments,
      icon: Library,
      color: "from-amber-500 to-orange-400",
    },
  ];

  const enrollmentData = [
    { name: "Jan", students: 120 },
    { name: "Feb", students: 132 },
    { name: "Mar", students: 145 },
    { name: "Apr", students: 160 },
    { name: "May", students: 175 },
    { name: "Jun", students: 190 },
  ];

  const demographicData = [
    {
      name: "Students",
      value: parseInt(stats.totalStudents, 10) || 150,
      color: "#3B82F6",
      tabId: "students",
    },
    {
      name: "Teachers",
      value: parseInt(stats.totalTeachers, 10) || 15,
      color: "#8B5CF6",
      tabId: "attendance",
    },
    {
      name: "Parents",
      value: 80,
      color: "#10B981",
      tabId: "grades",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={() => navigateTo(card.id)}
              onKeyDown={(e) => handleKeyNavigate(e, card.id)}
              className={`relative overflow-hidden bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60`}
              title={card.helper}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />

              <div className="relative z-10 flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-white/90 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.12em] mb-1 leading-tight whitespace-normal break-words">
                    {card.title}
                  </p>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                    {card.value}
                  </h3>

                  <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] sm:text-[10px] font-bold text-white/95 backdrop-blur-sm">
                    <TrendingUp size={10} className="sm:w-3 sm:h-3 shrink-0" />
                    <span className="leading-tight whitespace-normal">
                      {card.helper}
                    </span>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-6 transition-transform duration-300 shrink-0">
                  <Icon
                    size={16}
                    className="text-white sm:w-[18px] sm:h-[18px]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigateTo("students")}
          onKeyDown={(e) => handleKeyNavigate(e, "students")}
          className="lg:col-span-2 min-w-0 bg-white dark:bg-gray-900/70 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          title="Open students page"
        >
          <div className="flex justify-between items-center mb-4 gap-3 min-w-0">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Enrollment Growth
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Active students over 6 months
              </p>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full shrink-0">
              <Activity size={12} />
              +12% term
            </span>
          </div>

          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={enrollmentData}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorStudents"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorStudents)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => navigateTo("students")}
          onKeyDown={(e) => handleKeyNavigate(e, "students")}
          className="lg:col-span-1 min-w-0 bg-white dark:bg-gray-900/70 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          title="Open students page"
        >
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              User Base
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Portal account distribution
            </p>
          </div>

          <div className="w-full min-w-0 overflow-hidden mt-3">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={demographicData}
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {demographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-2.5 mt-3">
            {demographicData.map((data, idx) => (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(data.tabId);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  handleKeyNavigate(e, data.tabId);
                }}
                className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 px-3 py-2.5 min-w-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                title={`Open ${data.name.toLowerCase()} page`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: data.color }}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {data.name}
                  </span>
                </div>

                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white shrink-0">
                  {data.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;
