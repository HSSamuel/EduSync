import React, { useState, useEffect } from "react";

const TimetableTab = ({ isAdmin, isStudent, userData, subjects }) => {
  // Default to JSS 1, or the student's actual class if we had it in userData
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const [activeDay, setActiveDay] = useState("Monday");
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  });

  // Admin Builder State
  const [newSlot, setNewSlot] = useState({
    start_time: "08:00",
    end_time: "09:00",
    subject: "",
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const classGrades = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/timetable/${selectedClass}`,
        { headers: { jwt_token: token } },
      );
      if (res.ok) {
        setSchedule(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSlot = () => {
    if (!newSlot.subject) return alert("Please select a subject!");

    const updatedSchedule = { ...schedule };
    updatedSchedule[activeDay] = [...updatedSchedule[activeDay], newSlot]
      // Sort chronologically by start time
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    setSchedule(updatedSchedule);
    setNewSlot({ start_time: newSlot.end_time, end_time: "", subject: "" }); // Auto-increment time logic helper
  };

  const handleRemoveSlot = (index) => {
    const updatedSchedule = { ...schedule };
    updatedSchedule[activeDay].splice(index, 1);
    setSchedule(updatedSchedule);
  };

  const saveTimetable = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({ class_grade: selectedClass, schedule }),
      });
      if (res.ok)
        alert(`✅ Timetable for ${selectedClass} saved successfully!`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <h4 className="text-xl font-bold dark:text-white flex items-center gap-2">
          🗓️ Class Timetable
        </h4>
        <div className="flex items-center gap-4">
          <label className="font-bold text-gray-600 dark:text-gray-300">
            Viewing Class:
          </label>
          <select
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 font-bold"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classGrades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="flex overflow-x-auto space-x-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border dark:border-gray-700">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${activeDay === day ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Builder Panel */}
        {isAdmin && (
          <div className="lg:col-span-1 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 h-fit">
            <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-4">
              ➕ Add Block to {activeDay}
            </h5>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                    value={newSlot.start_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                    value={newSlot.end_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Subject / Activity
                </label>
                <select
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  value={newSlot.subject}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, subject: e.target.value })
                  }
                >
                  <option value="">-- Select Subject --</option>
                  <option value="Break / Lunch">🥪 Break / Lunch</option>
                  <option value="Assembly">📢 Assembly</option>
                  {subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_name}>
                      {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddSlot}
                className="w-full py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
              >
                Add to Schedule
              </button>
            </div>

            <hr className="my-6 border-blue-200 dark:border-blue-700" />

            <button
              onClick={saveTimetable}
              className="w-full py-3 bg-green-600 text-white font-black rounded-lg shadow-lg hover:bg-green-700 animate-pulse"
            >
              💾 Save Weekly Timetable
            </button>
          </div>
        )}

        {/* Timetable View Panel */}
        <div
          className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 ${isAdmin ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <h5 className="text-2xl font-black mb-6 text-gray-800 dark:text-gray-100">
            {activeDay}'s Schedule
          </h5>

          {!schedule[activeDay] || schedule[activeDay].length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl dark:border-gray-600">
              <p className="text-gray-500 text-lg">
                No classes scheduled for {activeDay} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule[activeDay].map((slot, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl border-l-4 shadow-sm ${slot.subject.includes("Break") ? "bg-amber-50 border-amber-400 dark:bg-amber-900/20" : "bg-gray-50 border-blue-500 dark:bg-gray-900 dark:border-blue-400"}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[100px]">
                      <p className="font-black text-lg text-gray-800 dark:text-gray-200">
                        {slot.start_time}
                      </p>
                      <p className="text-xs text-gray-500 font-bold">
                        to {slot.end_time}
                      </p>
                    </div>
                    <div>
                      <h6 className="font-bold text-xl">{slot.subject}</h6>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveSlot(index)}
                      className="text-red-500 hover:text-red-700 font-bold p-2 bg-red-50 rounded-lg dark:bg-red-900/30"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableTab;
