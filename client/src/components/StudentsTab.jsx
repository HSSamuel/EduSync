import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  GraduationCap,
  Link2,
  Users,
  CheckCircle2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutList,
  List
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";

const API_URL = import.meta.env.VITE_API_URL;

const StudentsTab = ({ isAdmin }) => {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedParents, setSelectedParents] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const [isCompactView, setIsCompactView] = useState(false); // 👈 Density Toggle State

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams({
          search: searchTerm,
          class_grade: filterClass,
          page: currentPage,
          limit: 15, 
        });

        const response = await fetch(
          `${API_URL}/students?${queryParams.toString()}`,
          { headers: { jwt_token: token } },
        );

        if (response.ok) {
          const parsed = await response.json();
          setStudents(parsed.data);
          setTotalPages(parsed.pagination.totalPages);
          setTotalStudents(parsed.pagination.total);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterClass, currentPage]);

  useEffect(() => {
    if (isAdmin) {
      const fetchParents = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/users/parents`, {
            headers: { jwt_token: token },
          });
          if (res.ok) setParents(await res.json());
        } catch (err) {
          console.error(err);
        }
      };
      fetchParents();
    }
  }, [isAdmin]);

  const onSubmitStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({
          full_name: studentName,
          email: studentEmail,
          password: studentPassword,
          class_grade: studentGrade,
        }),
      });
      const parseRes = await response.json();
      if (response.ok) {
        setSearchTerm("");
        setFilterClass("");
        setCurrentPage(1);
        setStudentName("");
        setStudentEmail("");
        setStudentPassword("");
        setStudentGrade("");
        alert("✅ " + parseRes.message);
      } else {
        alert("❌ " + parseRes.error);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkParent = async (student_id) => {
    const parent_id = selectedParents[student_id];
    if (!parent_id)
      return alert("Please select a parent from the dropdown first!");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/students/${student_id}/link-parent`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", jwt_token: token },
          body: JSON.stringify({ parent_id }),
        },
      );

      if (response.ok) {
        alert("✅ Parent successfully linked to this student!");
      } else {
        alert("❌ Failed to link parent.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Registration Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <UserPlus size={24} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Enroll New Student
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a student to the school roster.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmitStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-1">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium disabled:opacity-50"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="relative md:col-span-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium disabled:opacity-50"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="relative md:col-span-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Temp Password"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium disabled:opacity-50"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="relative md:col-span-1">
              <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Class (e.g. JSS 1)"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium disabled:opacity-50"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md shadow-green-500/30 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Enrolling...</>
              ) : (
                <><CheckCircle2 size={18} /> Register Student</>
              )}
            </button>
          </div>
        </form>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Toolbar: Search, Filter & Density Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            Student Roster
          </h4>
          <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 py-1 px-3 rounded-full text-xs font-black">
            {totalStudents} Total
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            aria-label="Toggle table density"
            title="Toggle Compact View"
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors hidden sm:block"
          >
            {isCompactView ? <LayoutList size={18} /> : <List size={18} />}
          </button>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium shadow-sm"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium shadow-sm cursor-pointer"
            >
              <option value="">All Classes</option>
              <option value="JSS 1">JSS 1</option>
              <option value="JSS 2">JSS 2</option>
              <option value="JSS 3">JSS 3</option>
              <option value="SS 1">SS 1</option>
              <option value="SS 2">SS 2</option>
              <option value="SS 3">SS 3</option>
            </select>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <PremiumEmptyState
          icon={Users}
          title="No Students Found"
          description="Adjust your search filters or enroll a new student to see them here."
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="overflow-auto max-h-[65vh] w-full relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 w-12 text-center transition-all`}>#</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 transition-all`}>Student Info</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 w-32 text-center transition-all`}>Class</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 transition-all`}>Parent Linkage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {students.map((student, index) => (
                  <tr key={student.student_id} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className={`${isCompactView ? 'p-2.5 text-[11px]' : 'p-4 text-xs'} text-center font-mono text-gray-400 transition-all`}>{(currentPage - 1) * 15 + index + 1}</td>
                    <td className={`${isCompactView ? 'p-2.5' : 'p-4'} transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-black ${isCompactView ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} transition-all`}>
                          {student.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold text-gray-900 dark:text-white leading-none mb-1 ${isCompactView ? 'text-sm' : 'text-base'}`}>{student.full_name}</p>
                          <p className={`text-gray-500 dark:text-gray-400 flex items-center gap-1 ${isCompactView ? 'text-[10px]' : 'text-xs'}`}>
                            <Mail size={isCompactView ? 10 : 12} /> {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${isCompactView ? 'p-2.5' : 'p-4'} text-center transition-all`}>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-black uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 ${isCompactView ? 'text-[10px]' : 'text-xs'}`}>
                        {student.class_grade}
                      </span>
                    </td>
                    <td className={`${isCompactView ? 'p-2.5' : 'p-4'} transition-all`}>
                      <div className="flex items-center gap-2 max-w-sm">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={isCompactView ? 12 : 14} />
                          <select
                            className={`w-full pl-8 pr-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer text-gray-700 dark:text-gray-200 ${isCompactView ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}
                            value={selectedParents[student.student_id] || ""}
                            onChange={(e) => setSelectedParents({ ...selectedParents, [student.student_id]: e.target.value })}
                            aria-label={`Select parent for ${student.full_name}`}
                          >
                            <option value="" className="text-gray-400">Select Parent...</option>
                            {parents.map((p) => (
                              <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => linkParent(student.student_id)}
                          className={`bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shrink-0 ${isCompactView ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
                        >
                          Link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Showing Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentsTab;