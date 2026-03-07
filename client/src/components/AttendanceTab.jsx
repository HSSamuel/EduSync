import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";

const AttendanceTab = ({ students = [] }) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceMap, setAttendanceMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  const submitAttendance = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    if (filteredStudents.length === 0) {
      alert("No students found for the selected class.");
      return;
    }

    const attendanceList = filteredStudents.map((student) => ({
      student_id: student.student_id,
      date: selectedDate,
      status: attendanceMap[student.student_id] || "Present",
    }));

    setSubmitting(true);
    try {
      const res = await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ attendanceList }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to submit attendance.");
        return;
      }

      alert(data.message || "✅ Attendance submitted successfully.");
    } catch (error) {
      console.error("Attendance submit error:", error);
      alert("❌ Something went wrong while submitting attendance.");
    } finally {
      setSubmitting(false);
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
                const isPresent =
                  (attendanceMap[student.student_id] || "Present") ===
                  "Present";

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
                          !isPresent
                            ? "bg-red-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <XCircle size={16} />
                        Absent
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
        <PremiumEmptyState
          icon={CalendarCheck2}
          title="Attendance history not yet available"
          description="Your current backend supports attendance submission, but not attendance retrieval yet. We can add the history endpoint next after all mismatches are fixed."
        />
      </div>
    </div>
  );
};

export default AttendanceTab;
