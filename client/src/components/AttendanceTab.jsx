import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  History,
  Filter,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

const AttendanceTab = ({ students = [] }) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceMap, setAttendanceMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyClass, setHistoryClass] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");

  const classOptions = useMemo(() => {
    const unique = [
      ...new Set((students || []).map((s) => s.class_grade).filter(Boolean)),
    ];
    return unique.sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return (students || []).filter((s) => s.class_grade === selectedClass);
  }, [students, selectedClass]);

  useEffect(() => {
    if (!selectedClass) {
      setAttendanceMap({});
      return;
    }

    const initialMap = {};
    filteredStudents.forEach((student) => {
      initialMap[student.student_id] = "Present";
    });
    setAttendanceMap(initialMap);
  }, [selectedClass, filteredStudents]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      const params = new URLSearchParams();

      if (historyClass) params.append("class_grade", historyClass);
      if (historyDate) params.append("date", historyDate);
      if (historyStatus) params.append("status", historyStatus);

      const url = params.toString()
        ? `/attendance?${params.toString()}`
        : "/attendance";

      const res = await apiFetch(url, { method: "GET" });
      const payload = await res.json().catch(() => ({}));
      const data = Array.isArray(payload?.data) ? payload.data : [];

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load attendance history.");
      }

      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Attendance history error:", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const submitAttendance = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      notifyInfo("Please select a class first.", "Missing class");
      return;
    }

    if (!selectedDate) {
      notifyInfo("Please select a date.", "Missing date");
      return;
    }

    if (filteredStudents.length === 0) {
      notifyInfo("No students found for the selected class.", "No students found");
      return;
    }

    const records = filteredStudents.map((student) => ({
      student_id: Number(student.student_id),
      status: attendanceMap[student.student_id] || "Present",
    }));

    setSubmitting(true);
    try {
      const res = await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          records,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.error || "Failed to submit attendance.");
        return;
      }

      notifySuccess(data.message || "Attendance submitted successfully.");

      setHistoryClass(selectedClass);
      setHistoryDate(selectedDate);
      setHistoryStatus("");
      await fetchHistory();
    } catch (error) {
      console.error("Attendance submit error:", error);
      notifyError("Something went wrong while submitting attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTone = (status) => {
    switch (status) {
      case "Present":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
      case "Absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
      case "Late":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
      case "Excused":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <CalendarCheck2 size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Mark Attendance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a class and submit daily attendance.
            </p>
          </div>
        </div>

        <form onSubmit={submitAttendance} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Select Class</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {!selectedClass ? (
            <PremiumEmptyState
              icon={Users}
              title="Select a class"
              description="Choose a class to start marking attendance."
            />
          ) : filteredStudents.length === 0 ? (
            <PremiumEmptyState
              icon={Users}
              title="No students in this class"
              description="There are no enrolled students for the selected class."
            />
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const currentStatus =
                  attendanceMap[student.student_id] || "Present";
                const isPresent = currentStatus === "Present";

                return (
                  <div
                    key={student.student_id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {student.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {student.class_grade}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.student_id, "Present")
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                          isPresent
                            ? "bg-emerald-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        Present
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.student_id, "Absent")
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                          currentStatus === "Absent"
                            ? "bg-red-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <XCircle size={16} />
                        Absent
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.student_id, "Late")
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                          currentStatus === "Late"
                            ? "bg-amber-500 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        Late
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(student.student_id, "Excused")
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                          currentStatus === "Excused"
                            ? "bg-sky-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredStudents.length > 0 && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CalendarCheck2 size={18} />
                    Submit Attendance
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <History size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Attendance History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review submitted attendance records by class, date, or status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={historyClass}
            onChange={(e) => setHistoryClass(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={historyDate}
            onChange={(e) => setHistoryDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={historyStatus}
            onChange={(e) => setHistoryStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Excused">Excused</option>
          </select>

          <button
            type="button"
            onClick={fetchHistory}
            disabled={historyLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {historyLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Filter size={16} />
                Apply Filters
              </>
            )}
          </button>
        </div>

        {historyLoading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading attendance history...
          </div>
        ) : history.length === 0 ? (
          <PremiumEmptyState
            icon={CalendarCheck2}
            title="No attendance records found"
            description="Try another filter or submit attendance to start building history."
          />
        ) : (
          <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="p-4 border-b border-gray-200 dark:border-gray-700">
                    Student
                  </th>
                  <th className="p-4 border-b border-gray-200 dark:border-gray-700">
                    Class
                  </th>
                  <th className="p-4 border-b border-gray-200 dark:border-gray-700">
                    Date
                  </th>
                  <th className="p-4 border-b border-gray-200 dark:border-gray-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {history.map((record) => (
                  <tr
                    key={record.attendance_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {record.full_name}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {record.class_grade}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {record.date}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusTone(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTab;
