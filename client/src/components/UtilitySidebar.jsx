import React from "react";
import { Bell, Clock, CheckCircle2, FileText, CreditCard, ChevronRight, X } from "lucide-react";

const UtilitySidebar = ({ userData, isOpen, setIsOpen }) => {
  const isAdmin = userData?.your_role === "Admin";
  const isStudent = userData?.your_role === "Student";

  const adminActivities = [
    { id: 1, type: "payment", text: "John Doe paid Tuition Invoice", time: "10 mins ago", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { id: 2, type: "document", text: "Mr. Smith uploaded Math Syllabus", time: "1 hour ago", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: 3, type: "system", text: "Automated backup completed", time: "3 hours ago", icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  const studentTasks = [
    { id: 1, text: "Complete Midterm CBT", due: "Today, 11:59 PM", urgent: true },
    { id: 2, text: "Review Algebra Chapter 1", due: "Tomorrow", urgent: false },
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop (Solid on mobile for performance, blurred on larger screens) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 md:bg-black/60 md:backdrop-blur-sm z-40 xl:hidden transition-opacity" 
          onClick={() => setIsOpen(false)} 
          aria-hidden="true"
        />
      )}

      {/* The Sidebar (Docked on XL, Slide-out on smaller screens) */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 xl:static 
        w-80 bg-white/95 dark:bg-gray-900/95 xl:bg-white/50 xl:dark:bg-gray-900/30 
        md:backdrop-blur-xl border-l border-gray-200/60 dark:border-gray-800/60 
        overflow-y-auto transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"}
      `} aria-label="Utility Center">
        <div className="p-6 flex-1 space-y-8">
          
          {/* Mobile Close Button & Header */}
          <div className="flex justify-between items-center xl:hidden border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-blue-600" /> Command Center
            </h3>
            <button 
              onClick={() => setIsOpen(false)} 
              aria-label="Close utility sidebar"
              className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>

          {/* Shared Section: Quick Calendar/Time */}
          <div className="hidden xl:block">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Today</h4>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <p className="text-sm font-medium text-blue-100 mb-1">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h3 className="text-2xl font-black font-sans">
                {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </h3>
            </div>
          </div>

          {/* Admin Specific: Live Activity Feed */}
          {isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Activity</h4>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-4">
                {adminActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 items-start group cursor-pointer">
                    <div className={`p-2 rounded-xl shrink-0 ${activity.bg}`}>
                      <activity.icon size={16} className={activity.color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug group-hover:text-blue-600 transition-colors">
                        {activity.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center justify-center gap-1">
                View All Activity <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Student Specific: Up Next & Tasks */}
          {isStudent && (
            <div>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Up Next</h4>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl mb-6">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-2">
                  <Clock size={16} />
                  <span className="text-xs font-bold">Starts in 45 mins</span>
                </div>
                <h5 className="font-bold text-gray-900 dark:text-white text-lg">Physics 101</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Room 3B • Mr. Davis</p>
              </div>

              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Pending Tasks</h4>
              <div className="space-y-3">
                {studentTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors" aria-label={`Mark task ${task.text} complete`} role="checkbox" aria-checked="false" tabIndex="0"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{task.text}</p>
                      <p className={`text-xs mt-1 font-medium ${task.urgent ? 'text-red-500' : 'text-gray-500'}`}>
                        Due: {task.due}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </aside>
    </>
  );
};

export default UtilitySidebar;