import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Mail,
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
  List,
  Square,
  CheckSquare,
  Trash2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

const DEFAULT_CLASS_ORDER = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const normalizeClassGrade = (value = "") => value.replace(/\s+/g, " ").trim();

const sortClassGrades = (a, b) => {
  const normalizedA = normalizeClassGrade(a);
  const normalizedB = normalizeClassGrade(b);

  const indexA = DEFAULT_CLASS_ORDER.indexOf(normalizedA);
  const indexB = DEFAULT_CLASS_ORDER.indexOf(normalizedB);

  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;

  return normalizedA.localeCompare(normalizedB);
};

const StudentsTab = ({ isAdmin }) => {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedParents, setSelectedParents] = useState({});
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const [isCompactView, setIsCompactView] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const pageSize = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass]);

  const fetchStudents = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        class_grade: filterClass,
        page: currentPage,
        limit: pageSize,
      });

      const response = await apiFetch(`/students?${queryParams.toString()}`, {
        method: "GET",
      });

      if (response.ok) {
        const parsed = await response.json();
        const nextStudents = parsed.data || [];

        setStudents(nextStudents);
        setTotalPages(parsed.meta?.pagination?.totalPages || 1);
        setTotalStudents(parsed.meta?.pagination?.total || 0);

        setSelectedStudentIds((prev) =>
          prev.filter((id) =>
            nextStudents.some((student) => student.student_id === id),
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterClass, currentPage]);

  useEffect(() => {
    if (isAdmin) {
      const fetchParents = async () => {
        try {
          const res = await apiFetch("/users/parents", {
            method: "GET",
          });

          if (res.ok) {
            const payload = await res.json();
            setParents(Array.isArray(payload?.data) ? payload.data : []);
          }
        } catch (err) {
          console.error(err);
        }
      };

      fetchParents();
    }
  }, [isAdmin]);

  const groupedStudents = useMemo(() => {
    const groups = {};

    students.forEach((student) => {
      const classKey = normalizeClassGrade(student.class_grade || "Unassigned");
      if (!groups[classKey]) groups[classKey] = [];
      groups[classKey].push(student);
    });

    return Object.entries(groups)
      .sort(([classA], [classB]) => sortClassGrades(classA, classB))
      .map(([classGrade, classStudents]) => ({
        classGrade,
        students: classStudents,
      }));
  }, [students]);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };

      groupedStudents.forEach((group) => {
        if (typeof next[group.classGrade] === "undefined") {
          next[group.classGrade] = true;
        }
      });

      return next;
    });
  }, [groupedStudents]);

  const refreshStudents = async () => {
    await fetchStudents();
  };

  const onSubmitStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiFetch("/students", {
        method: "POST",
        body: JSON.stringify({
          full_name: studentName,
          email: studentEmail,
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
        setStudentGrade("");

        notifySuccess(parseRes.message || "Student registered successfully.");
        await refreshStudents();
      } else {
        notifyError(parseRes.error || "Failed to register student.");
      }
    } catch (err) {
      console.error(err.message);
      notifyError("Something went wrong while registering the student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkParent = async (student_id) => {
    const parent_id = selectedParents[student_id];
    if (!parent_id) {
      notifyInfo("Please select a parent from the dropdown first.", "Parent required");
      return;
    }

    try {
      const response = await apiFetch(`/students/${student_id}/link-parent`, {
        method: "PUT",
        body: JSON.stringify({ parent_id }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        notifySuccess(data.message || "Parent successfully linked to this student.");
      } else {
        notifyError(data.error || "Failed to link parent.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Something went wrong while linking parent.");
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const allVisibleSelected =
    students.length > 0 &&
    students.every((student) =>
      selectedStudentIds.includes(student.student_id),
    );

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedStudentIds((prev) =>
        prev.filter(
          (id) => !students.some((student) => student.student_id === id),
        ),
      );
      return;
    }

    const visibleIds = students.map((student) => student.student_id);
    setSelectedStudentIds((prev) =>
      Array.from(new Set([...prev, ...visibleIds])),
    );
  };

  const areAllGroupSelected = (groupStudents) =>
    groupStudents.length > 0 &&
    groupStudents.every((student) =>
      selectedStudentIds.includes(student.student_id),
    );

  const toggleGroupSelection = (groupStudents) => {
    const groupIds = groupStudents.map((student) => student.student_id);
    const allSelected = areAllGroupSelected(groupStudents);

    if (allSelected) {
      setSelectedStudentIds((prev) =>
        prev.filter((id) => !groupIds.includes(id)),
      );
      return;
    }

    setSelectedStudentIds((prev) =>
      Array.from(new Set([...prev, ...groupIds])),
    );
  };

  const toggleGroupExpanded = (classGrade) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [classGrade]: !prev[classGrade],
    }));
  };

  const deleteSingleStudent = async (student) => {
    const confirmed = await confirm({
      title: "Delete student",
      message: `Delete ${student.full_name}? This action cannot be undone.`,
      confirmText: "Delete student",
      cancelText: "Keep student",
      tone: "danger",
    });

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await apiFetch(`/students/${student.student_id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSelectedStudentIds((prev) =>
          prev.filter((id) => id !== student.student_id),
        );
        notifySuccess(data.message || "Student deleted successfully.");
        await refreshStudents();
      } else {
        notifyError(data.error || "Failed to delete student.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Something went wrong while deleting the student.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
      notifyInfo("Please select at least one student.", "Selection required");
      return;
    }

    const confirmed = await confirm({
      title: "Delete selected students",
      message: `Delete ${selectedStudentIds.length} selected student(s)? This action cannot be undone.`,
      confirmText: "Delete students",
      cancelText: "Keep students",
      tone: "danger",
    });

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await apiFetch("/students/bulk-delete", {
        method: "DELETE",
        body: JSON.stringify({ student_ids: selectedStudentIds }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSelectedStudentIds([]);
        notifySuccess(data.message || "Selected students deleted successfully.");
        await refreshStudents();
      } else {
        notifyError(data.error || "Failed to delete selected students.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Something went wrong while deleting selected students.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="animate-fade-in space-y-8">
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
              Add a student to the school roster and send a secure password
              setup link by email.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmitStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Users
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
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
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
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
              <GraduationCap
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
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
                <>
                  <Loader2 size={18} className="animate-spin" /> Enrolling...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Register Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden">
          <h4 className="shrink truncate text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
            Students
          </h4>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black whitespace-nowrap text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <span>Total</span>
            <span>{totalStudents}</span>
          </span>

          <button
            onClick={toggleSelectAllVisible}
            aria-label={
              allVisibleSelected
                ? "Deselect all visible students"
                : "Select all visible students"
            }
            title={
              allVisibleSelected
                ? "Deselect all visible students"
                : "Select all visible students"
            }
            className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:text-blue-400"
            type="button"
          >
            {allVisibleSelected ? (
              <CheckSquare size={16} />
            ) : (
              <Square size={16} />
            )}
          </button>

          <button
            onClick={deleteSelectedStudents}
            type="button"
            disabled={isDeleting || selectedStudentIds.length === 0}
            aria-label="Delete selected students"
            title="Delete selected students"
            className="shrink-0 rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto xl:flex-nowrap">
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            aria-label="Toggle table density"
            title="Toggle Compact View"
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors hidden sm:block"
            type="button"
          >
            {isCompactView ? <LayoutList size={18} /> : <List size={18} />}
          </button>

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

      {students.length === 0 ? (
        <PremiumEmptyState
          icon={Users}
          title="No Students Found"
          description="Adjust your search filters or enroll a new student to see them here."
        />
      ) : (
        <div className="space-y-4">
          {groupedStudents.map((group) => {
            const groupExpanded = expandedGroups[group.classGrade] ?? true;
            const groupAllSelected = areAllGroupSelected(group.students);

            return (
              <div
                key={group.classGrade}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleGroupExpanded(group.classGrade)}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                      aria-label={`Toggle ${group.classGrade}`}
                      title={`Toggle ${group.classGrade}`}
                    >
                      {groupExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    <div className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-2">
                      {groupExpanded ? (
                        <FolderOpen size={18} />
                      ) : (
                        <Folder size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h5 className="truncate text-sm sm:text-base font-black text-gray-900 dark:text-white">
                        {group.classGrade}
                      </h5>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {group.students.length}{" "}
                        {group.students.length === 1 ? "student" : "students"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleGroupSelection(group.students)}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      aria-label={
                        groupAllSelected
                          ? `Deselect ${group.classGrade}`
                          : `Select ${group.classGrade}`
                      }
                      title={
                        groupAllSelected
                          ? `Deselect ${group.classGrade}`
                          : `Select ${group.classGrade}`
                      }
                    >
                      {groupAllSelected ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {groupExpanded && (
                  <div className="overflow-auto w-full">
                    <table className="w-full min-w-[980px] text-left border-collapse">
                      <thead className="bg-gray-50/70 dark:bg-gray-900/20">
                        <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                          <th
                            className={`${isCompactView ? "p-2.5" : "p-4"} font-bold border-b border-gray-200 dark:border-gray-700 w-14 text-center`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleGroupSelection(group.students)
                              }
                              className="inline-flex items-center justify-center text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              aria-label={`Select ${group.classGrade}`}
                              title={`Select ${group.classGrade}`}
                            >
                              {groupAllSelected ? (
                                <CheckSquare size={16} />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </th>

                          <th
                            className={`${isCompactView ? "p-2.5" : "p-4"} font-bold border-b border-gray-200 dark:border-gray-700`}
                          >
                            Student Info
                          </th>

                          <th
                            className={`${isCompactView ? "p-2.5" : "p-4"} font-bold border-b border-gray-200 dark:border-gray-700 w-32 text-center`}
                          >
                            Class
                          </th>

                          <th
                            className={`${isCompactView ? "p-2.5" : "p-4"} font-bold border-b border-gray-200 dark:border-gray-700`}
                          >
                            Parent Linkage
                          </th>

                          <th
                            className={`${isCompactView ? "p-2.5" : "p-4"} font-bold border-b border-gray-200 dark:border-gray-700 w-20 text-center`}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {group.students.map((student) => {
                          const isSelected = selectedStudentIds.includes(
                            student.student_id,
                          );

                          return (
                            <tr
                              key={student.student_id}
                              className={`transition-colors group ${
                                isSelected
                                  ? "bg-blue-50/50 dark:bg-blue-900/10"
                                  : "hover:bg-blue-50/30 dark:hover:bg-gray-800/50"
                              }`}
                            >
                              <td
                                className={`${isCompactView ? "p-2.5" : "p-4"} text-center`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStudentSelection(student.student_id)
                                  }
                                  aria-label={
                                    isSelected
                                      ? `Deselect ${student.full_name}`
                                      : `Select ${student.full_name}`
                                  }
                                  title={
                                    isSelected
                                      ? `Deselect ${student.full_name}`
                                      : `Select ${student.full_name}`
                                  }
                                  className="inline-flex items-center justify-center text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare
                                      size={16}
                                      className="text-blue-600 dark:text-blue-400"
                                    />
                                  ) : (
                                    <Square size={16} />
                                  )}
                                </button>
                              </td>

                              <td
                                className={`${isCompactView ? "p-2.5" : "p-4"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-black ${
                                      isCompactView
                                        ? "w-7 h-7 text-xs"
                                        : "w-9 h-9 text-sm"
                                    }`}
                                  >
                                    {student.full_name?.charAt(0) || "S"}
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className={`font-bold text-gray-900 dark:text-white leading-none mb-1 truncate ${
                                        isCompactView ? "text-sm" : "text-base"
                                      }`}
                                    >
                                      {student.full_name}
                                    </p>
                                    <p
                                      className={`text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate ${
                                        isCompactView
                                          ? "text-[10px]"
                                          : "text-xs"
                                      }`}
                                    >
                                      <Mail size={isCompactView ? 10 : 12} />
                                      <span className="truncate">
                                        {student.email}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td
                                className={`${isCompactView ? "p-2.5" : "p-4"} text-center`}
                              >
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-md font-black uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 ${
                                    isCompactView ? "text-[10px]" : "text-xs"
                                  }`}
                                >
                                  {student.class_grade}
                                </span>
                              </td>

                              <td
                                className={`${isCompactView ? "p-2.5" : "p-4"}`}
                              >
                                <div className="flex items-center gap-2 max-w-sm">
                                  <div className="relative flex-1">
                                    <Link2
                                      className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                                      size={isCompactView ? 12 : 14}
                                    />
                                    <select
                                      className={`w-full pl-8 pr-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer text-gray-700 dark:text-gray-200 ${
                                        isCompactView
                                          ? "py-1.5 text-xs"
                                          : "py-2 text-sm"
                                      }`}
                                      value={
                                        selectedParents[student.student_id] ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        setSelectedParents({
                                          ...selectedParents,
                                          [student.student_id]: e.target.value,
                                        })
                                      }
                                      aria-label={`Select parent for ${student.full_name}`}
                                    >
                                      <option
                                        value=""
                                        className="text-gray-400"
                                      >
                                        Select Parent...
                                      </option>
                                      {parents.map((p) => (
                                        <option
                                          key={p.user_id}
                                          value={p.user_id}
                                        >
                                          {p.full_name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <button
                                    onClick={() =>
                                      linkParent(student.student_id)
                                    }
                                    className={`bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shrink-0 ${
                                      isCompactView
                                        ? "px-2 py-1.5 text-xs"
                                        : "px-3 py-2 text-sm"
                                    }`}
                                    type="button"
                                  >
                                    Link
                                  </button>
                                </div>
                              </td>

                              <td
                                className={`${isCompactView ? "p-2.5" : "p-4"} text-center`}
                              >
                                <button
                                  type="button"
                                  onClick={() => deleteSingleStudent(student)}
                                  disabled={isDeleting}
                                  aria-label={`Delete ${student.full_name}`}
                                  title={`Delete ${student.full_name}`}
                                  className={`inline-flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isCompactView ? "p-1.5" : "p-2"
                                  }`}
                                >
                                  <Trash2 size={isCompactView ? 14 : 15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Showing Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  aria-label="Previous Page"
                  type="button"
                >
                  <ChevronLeft
                    size={16}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </button>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  aria-label="Next Page"
                  type="button"
                >
                  <ChevronRight
                    size={16}
                    className="text-gray-600 dark:text-gray-300"
                  />
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
