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
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";

const StudentsTab = ({ isAdmin }) => {
  // Registration Form State
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  // Data Grid State
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedParents, setSelectedParents] = useState({});

  // Pagination & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Reset page to 1 if search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass]);

  // Fetch Students with Debounce (Wait 300ms after user stops typing to query backend)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams({
          search: searchTerm,
          class_grade: filterClass,
          page: currentPage,
          limit: 9, // We show 9 cards per page for a neat 3x3 grid
        });

        const response = await fetch(
          `http://localhost:5000/api/students?${queryParams.toString()}`,
          {
            headers: { jwt_token: token },
          },
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

  // Fetch Parents for the dropdown
  useEffect(() => {
    if (isAdmin) {
      const fetchParents = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:5000/api/users/parents", {
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
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/students", {
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
        // Trigger a re-fetch to get the updated list and pagination math
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
    }
  };

  const linkParent = async (student_id) => {
    const parent_id = selectedParents[student_id];
    if (!parent_id)
      return alert("Please select a parent from the dropdown first!");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/students/${student_id}/link-parent`,
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
              <Users
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>
            <div className="relative md:col-span-1">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative md:col-span-1">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="password"
                placeholder="Temp Password"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                required
              />
            </div>
            <div className="relative md:col-span-1">
              <GraduationCap
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Class (e.g. JSS 1)"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md shadow-green-500/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>Register Student</span>
            </button>
          </div>
        </form>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            Student Roster
          </h4>
          <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 py-1 px-3 rounded-full text-xs font-black">
            {totalStudents} Total
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium shadow-sm"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
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

      {/* Roster Grid */}
      {students.length === 0 ? (
        <PremiumEmptyState
          icon={Users}
          title="No Students Found"
          description="Adjust your search filters or enroll a new student to see them here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Top Section: Student Info */}
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                      {student.full_name.charAt(0)}
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full tracking-wider border border-gray-200 dark:border-gray-600">
                      {student.class_grade}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {student.full_name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate flex items-center gap-2">
                    <Mail size={14} /> {student.email}
                  </p>
                </div>

                {/* Bottom Section: Link Parent */}
                <div className="p-5 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Link2 size={12} /> Family Link
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                      value={selectedParents[student.student_id] || ""}
                      onChange={(e) =>
                        setSelectedParents({
                          ...selectedParents,
                          [student.student_id]: e.target.value,
                        })
                      }
                    >
                      <option value="" className="text-gray-400">
                        Select Parent...
                      </option>
                      {parents.map((p) => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => linkParent(student.student_id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                    >
                      Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft
                  size={20}
                  className="text-gray-600 dark:text-gray-300"
                />
              </button>

              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight
                  size={20}
                  className="text-gray-600 dark:text-gray-300"
                />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentsTab;
