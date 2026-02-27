import React, { useState, useEffect } from "react";

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
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
      {/* Students Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-1">
              Total Students
            </p>
            <h3 className="text-4xl font-black">{stats.totalStudents}</h3>
          </div>
          <div className="text-5xl opacity-50">👨‍🎓</div>
        </div>
      </div>

      {/* Teachers Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-1">
              Active Teachers
            </p>
            <h3 className="text-4xl font-black">{stats.totalTeachers}</h3>
          </div>
          <div className="text-5xl opacity-50">👩‍🏫</div>
        </div>
      </div>

      {/* Subjects Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-green-100 text-sm font-bold uppercase tracking-wider mb-1">
              Total Subjects
            </p>
            <h3 className="text-4xl font-black">{stats.totalSubjects}</h3>
          </div>
          <div className="text-5xl opacity-50">📚</div>
        </div>
      </div>

      {/* Vault Card */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-yellow-100 text-sm font-bold uppercase tracking-wider mb-1">
              Vault Documents
            </p>
            <h3 className="text-4xl font-black">{stats.totalDocuments}</h3>
          </div>
          <div className="text-5xl opacity-50">🏛️</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;
