import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  BookOpen,
  Plus,
  Save,
  Trash2,
  LayoutGrid,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const TimetableTab = ({ isAdmin, isStudent, userData, subjects }) => {
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const [activeDay, setActiveDay] = useState("Monday");
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  });

  const [newSlot, setNewSlot] = useState({
    start_time: "08:00",
    end_time: "09:00",
    subject: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const classGrades = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/timetable/${selectedClass}`, {
        headers: { jwt_token: token },
      });
      if (res.ok) setSchedule(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSlot = () => {
    if (!newSlot.subject) return alert("Please select a subject!");
    const updatedSchedule = { ...schedule };
    updatedSchedule[activeDay] = [...updatedSchedule[activeDay], newSlot].sort(
      (a, b) => a.start_time.localeCompare(b.start_time),
    );
    setSchedule(updatedSchedule);
    setNewSlot({ start_time: newSlot.end_time, end_time: "", subject: "" });
  };

  const handleRemoveSlot = (index) => {
    const updatedSchedule = { ...schedule };
    updatedSchedule[activeDay].splice(index, 1);
    setSchedule(updatedSchedule);
  };

  const saveTimetable = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({ class_grade: selectedClass, schedule }),
      });
      if (res.ok)
        alert(`✅ Timetable for ${selectedClass} saved successfully!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Class Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <CalendarDays size={28} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Class Timetable
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage and view weekly schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner w-full md:w-auto">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Viewing:
          </label>
          <select
            className="bg-transparent text-gray-900 dark:text-white font-black text-lg outline-none cursor-pointer flex-1 md:flex-none"
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

      {/* Segmented Control for Days */}
      <div className="flex overflow-x-auto p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner [&::-webkit-scrollbar]:hidden">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeDay === day ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Admin Builder Panel */}
        {isAdmin && (
          <div className="xl:col-span-1 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
            <h5 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Plus size={20} className="text-indigo-500" /> Add to {activeDay}
            </h5>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Clock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  {/* 👈 PRO UI: font-mono for times */}
                  <input
                    type="time"
                    className="w-full pl-9 pr-3 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold"
                    value={newSlot.start_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col justify-center text-gray-400 font-bold text-sm">
                  -
                </div>
                <div className="flex-1 relative">
                  <Clock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  {/* 👈 PRO UI: font-mono for times */}
                  <input
                    type="time"
                    className="w-full pl-9 pr-3 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold"
                    value={newSlot.end_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="relative">
                <BookOpen
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <select
                  className="w-full pl-9 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold cursor-pointer text-gray-700 dark:text-gray-200"
                  value={newSlot.subject}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, subject: e.target.value })
                  }
                >
                  <option value="" className="text-gray-400">
                    -- Select Subject --
                  </option>
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
                className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800"
              >
                Add Block
              </button>
            </div>

            <hr className="my-6 border-gray-100 dark:border-gray-700" />

            <button
              onClick={saveTimetable}
              disabled={isSaving}
              className="w-full py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black rounded-xl shadow-md hover:bg-gray-800 dark:hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {isSaving ? "Saving..." : "Save Timetable"}
            </button>
          </div>
        )}

        {/* Timetable View Panel */}
        <div
          className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 ${isAdmin ? "xl:col-span-2" : "xl:col-span-3"}`}
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
            <h5 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {activeDay}'s Schedule
            </h5>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
              {schedule[activeDay]?.length || 0} Classes
            </span>
          </div>

          {!schedule[activeDay] || schedule[activeDay].length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/20">
              <LayoutGrid
                size={48}
                className="text-gray-300 dark:text-gray-600 mb-4"
              />
              <p className="text-gray-500 font-bold text-lg">Free day!</p>
              <p className="text-gray-400 text-sm mt-1">
                No classes scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
              {schedule[activeDay].map((slot, index) => {
                const isBreak =
                  slot.subject.includes("Break") ||
                  slot.subject.includes("Lunch");
                return (
                  <div
                    key={index}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      {isBreak ? (
                        <Clock size={16} className="text-amber-500" />
                      ) : (
                        <BookOpen size={16} />
                      )}
                    </div>
                    <div
                      className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 md:p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border transition-all hover:shadow-md ${isBreak ? "bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700"}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-1">
                        <h6
                          className={`font-black text-lg ${isBreak ? "text-amber-700 dark:text-amber-500" : "text-gray-900 dark:text-white"}`}
                        >
                          {slot.subject}
                        </h6>
                        {/* 👈 PRO UI: font-mono applied to display time for professional alignment */}
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-lg w-fit border border-gray-200 dark:border-gray-700 font-mono tracking-wide">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveSlot(index)}
                          className="mt-4 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-xs font-bold text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} /> Remove Slot
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableTab;
