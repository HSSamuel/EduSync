import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Library,
  TrendingUp,
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

const AnalyticsCards = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalDocuments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/dashboard/stats",
          {
            headers: { jwt_token: token },
          },
        );
        if (response.ok) setStats(await response.json());
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: GraduationCap,
      color: "from-blue-500 to-cyan-400",
    },
    {
      title: "Active Teachers",
      value: stats.totalTeachers,
      icon: Users,
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "Total Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "from-emerald-500 to-teal-400",
    },
    {
      title: "Vault Documents",
      value: stats.totalDocuments,
      icon: Library,
      color: "from-amber-500 to-orange-400",
    },
  ];

  // Simulated Data for the Charts (In a real app, fetch this from the backend)
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
      value: parseInt(stats.totalStudents) || 150,
      color: "#3B82F6",
    },
    {
      name: "Teachers",
      value: parseInt(stats.totalTeachers) || 15,
      color: "#8B5CF6",
    },
    { name: "Parents", value: 80, color: "#10B981" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${card.color} rounded-3xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-300 group cursor-default`}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                    {card.title}
                  </p>
                  <h3 className="text-4xl font-black font-sans tracking-tight">
                    {card.value}
                  </h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white">
                Enrollment Growth
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total active students over 6 months
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
              <TrendingUp size={14} /> +12% this term
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={enrollmentData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorStudents"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorStudents)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographic Donut Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
          <div>
            <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white">
              User Base
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Distribution of portal accounts
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographicData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {demographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {demographicData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: data.color }}
                ></span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  {data.name}
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
