import React, { useState, useEffect } from "react";

const AttendanceTab = ({ students }) => {
  // Default the date to today
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState({});

  // When students load, default everyone to "Present"
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

    // Format the data into an array for the backend
    const attendanceList = Object.keys(attendanceState).map((student_id) => ({
      student_id,
      status: attendanceState[student_id],
    }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/attendance", {
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

  return (
    <div className="animate-fade-in bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
        <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">
          📝 Daily Roll Call
        </h4>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <form onSubmit={onSubmitAttendance}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="p-3 border-b dark:border-gray-600">
                  Student Name
                </th>
                <th className="p-3 border-b dark:border-gray-600">Class</th>
                <th className="p-3 border-b dark:border-gray-600 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">
                    No students enrolled.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.student_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-3 border-b dark:border-gray-700 font-semibold">
                      {student.full_name}
                    </td>
                    <td className="p-3 border-b dark:border-gray-700 text-gray-500">
                      {student.class_grade}
                    </td>
                    <td className="p-3 border-b dark:border-gray-700 text-center">
                      <select
                        value={attendanceState[student.student_id] || "Present"}
                        onChange={(e) =>
                          handleStatusChange(student.student_id, e.target.value)
                        }
                        className={`px-3 py-1 rounded font-bold outline-none ${
                          attendanceState[student.student_id] === "Present"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : attendanceState[student.student_id] === "Absent"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {students.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Submit Attendance
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AttendanceTab;
