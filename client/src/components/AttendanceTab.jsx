import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  UserCheck,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Users
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const AttendanceTab = ({ students }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState({});

  useEffect(() => {
    const initialState = {};
    students.forEach((s) => {
      initialState[s.student_id] = "Present";
    });
    setAttendanceState(initialState);
  }, [students]);

  const handleStatusChange = (student_id, status) => {
    setAttendanceState({ ...attendanceState, [student_id]: status });
  };

  const onSubmitAttendance = async (e) => {
    e.preventDefault();
    const attendanceList = Object.keys(attendanceState).map((student_id) => ({
      student_id,
      status: attendanceState[student_id],
    }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({ date, attendanceList }),
      });

      if (response.ok) {
        alert(
          "✅ Roll Call Submitted! Parents of absent students have been notified.",
        );
      } else {
        alert("❌ Failed to submit attendance.");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Helper for rendering dynamic status styles
  const getStatusStyles = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "Late":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle2 size={16} className="mr-1.5" />;
      case "Absent":
        return <XCircle size={16} className="mr-1.5" />;
      case "Late":
        return <Clock size={16} className="mr-1.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 transition-all">
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <UserCheck size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Attendance
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Record attendance and notify parents automatically.
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-auto">
          <CalendarDays
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
            required
          />
        </div>
      </div>

      <form onSubmit={onSubmitAttendance}>
        {/* Modern Data Grid */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold border-b dark:border-gray-700">
                    Student Info
                  </th>
                  <th className="p-4 font-bold border-b dark:border-gray-700 w-32">
                    Class
                  </th>
                  <th className="p-4 font-bold border-b dark:border-gray-700 w-48 text-right">
                    Attendance Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-12 text-center text-gray-500">
                      <Users
                        size={40}
                        className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                      />
                      <p className="font-medium text-lg">No students found.</p>
                      <p className="text-sm mt-1">
                        Enroll students to start taking attendance.
                      </p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const currentStatus =
                      attendanceState[student.student_id] || "Present";
                    return (
                      <tr
                        key={student.student_id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="p-4">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {student.full_name}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {student.class_grade}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="relative inline-block">
                            {/* Visual Indicator Layer (behind the invisible select) */}
                            <div
                              className={`absolute inset-0 flex items-center px-3 py-1.5 rounded-lg border ${getStatusStyles(currentStatus)} pointer-events-none transition-colors`}
                            >
                              {getStatusIcon(currentStatus)}
                              <span className="font-bold text-sm">
                                {currentStatus}
                              </span>
                            </div>
                            {/* Actual Select Input (Made transparent but clickable) */}
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  student.student_id,
                                  e.target.value,
                                )
                              }
                              className="relative z-10 w-full pl-3 pr-8 py-1.5 opacity-0 cursor-pointer h-full"
                            >
                              <option value="Present">Present</option>
                              <option value="Late">Late</option>
                              <option value="Absent">Absent</option>
                            </select>
                            {/* Custom Caret */}
                            <div
                              className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none ${getStatusStyles(currentStatus).split(" ")[1]}`}
                            >
                              ▼
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {students.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-lg"
            >
              <Send size={20} />
              <span>Submit Roll Call</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AttendanceTab;