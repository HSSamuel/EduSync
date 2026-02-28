import React, { useState, useEffect } from "react";
import { Users, GraduationCap, BookOpen, Library, TrendingUp } from "lucide-react";

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
        const response = await fetch("http://localhost:5000/api/dashboard/stats", {
          headers: { jwt_token: token },
        });
        if (response.ok) {
          setStats(await response.json());
        }
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
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/30",
    },
    {
      title: "Active Teachers",
      value: stats.totalTeachers,
      icon: Users,
      gradient: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/30",
    },
    {
      title: "Total Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-500/30",
    },
    {
      title: "Vault Documents",
      value: stats.totalDocuments,
      icon: Library,
      gradient: "from-amber-500 to-orange-400",
      shadow: "shadow-amber-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-lg ${card.shadow} transform hover:-translate-y-1.5 transition-all duration-300 group cursor-default`}
          >
            {/* Decorative Background Element */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  {card.title}
                </p>
                <h3 className="text-4xl font-black tracking-tight">{card.value}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                <Icon size={28} className="text-white" />
              </div>
            </div>
            
            {/* Tiny trend indicator for extra premium feel */}
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/80 bg-white/10 w-fit px-2 py-1 rounded-full backdrop-blur-md">
              <TrendingUp size={12} />
              <span>Live Data</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;