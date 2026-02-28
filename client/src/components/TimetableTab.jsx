import React, { useState, useEffect } from "react";
import { CalendarDays, Clock, BookOpen, Plus, Save, Trash2, LayoutGrid } from "lucide-react";

const TimetableTab = ({ isAdmin, isStudent, userData, subjects }) => {
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const [activeDay, setActiveDay] = useState("Monday");
  const [schedule, setSchedule] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [],
  });

  const [newSlot, setNewSlot] = useState({ start_time: "08:00", end_time: "09:00", subject: "" });
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const classGrades = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/timetable/${selectedClass}`, { headers: { jwt_token: token } });
      if (res.ok) setSchedule(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleAddSlot = () => {
    if (!newSlot.subject) return alert("Please select a subject!");
    const updatedSchedule = { ...schedule };
    updatedSchedule[activeDay] = [...updatedSchedule[activeDay], newSlot].sort((a, b) => a.start_time.localeCompare(b.start_time));
    setSchedule(updatedSchedule);
    setNewSlot({ start_time: newSlot.end_time, end_time: "", subject: "" });
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
        method: "POST", headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({ class_grade: selectedClass, schedule }),
      });
      if (res.ok) alert(`✅ Timetable for ${selectedClass} saved successfully!`);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Class Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <CalendarDays size={24} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Class Timetable</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and view weekly schedules.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">Viewing:</label>
          <select
            className="bg-transparent text-gray-900 dark:text-white font-bold text-lg outline-none cursor-pointer"
            value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classGrades.map((grade) => (<option key={grade} value={grade}>{grade}</option>))}
          </select>
        </div>
      </div>

      {/* Segmented Control for Days */}
      <div className="flex overflow-x-auto p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 [&::-webkit-scrollbar]:hidden">
        {daysOfWeek.map((day) => (
          <button
            key={day} onClick={() => setActiveDay(day)}
            className={`flex-1 py-2.5 px-6 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeDay === day ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Admin Builder Panel */}
        {isAdmin && (
          <div className="xl:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
            <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Plus size={18} className="text-indigo-500" /> Add to {activeDay}
            </h5>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="time" className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} />
                </div>
                <div className="flex flex-col justify-center text-gray-400 font-bold text-sm">-</div>
                <div className="flex-1 relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="time" className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} />
                </div>
              </div>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium cursor-pointer" value={newSlot.subject} onChange={e => setNewSlot({...newSlot, subject: e.target.value})}>
                  <option value="">-- Select Subject --</option>
                  <option value="Break / Lunch">🥪 Break / Lunch</option>
                  <option value="Assembly">📢 Assembly</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_name}>{s.subject_name}</option>)}
                </select>
              </div>
              <button onClick={handleAddSlot} className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                Add Block
              </button>
            </div>
            
            <hr className="my-6 border-gray-100 dark:border-gray-700" />
            
            <button onClick={saveTimetable} className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
              <Save size={18} /> Save Timetable
            </button>
          </div>
        )}

        {/* Timetable View Panel */}
        <div className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 ${isAdmin ? "xl:col-span-2" : "xl:col-span-3"}`}>
          <div className="flex items-center justify-between mb-8">
            <h5 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{activeDay}'s Schedule</h5>
            <span className="text-sm font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">{schedule[activeDay]?.length || 0} Classes</span>
          </div>
          
          {(!schedule[activeDay] || schedule[activeDay].length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <LayoutGrid size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 font-medium">Free day! No classes scheduled.</p>
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
              {schedule[activeDay].map((slot, index) => {
                const isBreak = slot.subject.includes("Break") || slot.subject.includes("Lunch");
                return (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900 text-indigo-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                      {isBreak ? <Clock size={16} className="text-amber-500" /> : <BookOpen size={16} />}
                    </div>
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isBreak ? "bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700"}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                        <h6 className={`font-black text-lg ${isBreak ? "text-amber-700 dark:text-amber-500" : "text-gray-900 dark:text-white"}`}>{slot.subject}</h6>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2.5 py-1 rounded-md w-fit">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleRemoveSlot(index)} className="mt-3 text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} /> Remove Slot
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