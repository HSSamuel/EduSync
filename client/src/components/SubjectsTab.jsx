import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  PlusCircle,
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  Search,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";

const SubjectsTab = ({ isAdmin, isTeacher }) => {
  const [subjects, setSubjects] = useState([]);
  const [modulesBySubject, setModulesBySubject] = useState({});
  const [subjectName, setSubjectName] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleFile, setModuleFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [uploadingModule, setUploadingModule] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingModuleId, setDeletingModuleId] = useState(null);

  const canManage = isAdmin || isTeacher;

  const fetchModulesForSubject = async (subjectId) => {
    try {
      const res = await apiFetch(`/modules/${subjectId}`, {
        method: "GET",
      });

      if (res.ok) {
        const data = await res.json();
        setModulesBySubject((prev) => ({
          ...prev,
          [subjectId]: Array.isArray(data) ? data : [],
        }));
      } else {
        setModulesBySubject((prev) => ({
          ...prev,
          [subjectId]: [],
        }));
      }
    } catch (error) {
      console.error(`Error loading modules for subject ${subjectId}:`, error);
      setModulesBySubject((prev) => ({
        ...prev,
        [subjectId]: [],
      }));
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);

      const res = await apiFetch("/subjects", {
        method: "GET",
      });

      if (res.ok) {
        const data = await res.json();
        const safeSubjects = Array.isArray(data) ? data : [];
        setSubjects(safeSubjects);

        await Promise.all(
          safeSubjects.map((subject) =>
            fetchModulesForSubject(subject.subject_id),
          ),
        );
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to load subjects:", err);
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjects;

    return subjects.filter((subject) => {
      const name = subject.subject_name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [subjects, searchTerm]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();

    if (!subjectName.trim()) {
      alert("Please enter a subject name.");
      return;
    }

    try {
      setCreatingSubject(true);

      const res = await apiFetch("/subjects", {
        method: "POST",
        body: JSON.stringify({
          subject_name: subjectName.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to create subject.");
        return;
      }

      alert("✅ Subject created successfully.");
      setSubjectName("");
      await fetchSubjects();
    } catch (error) {
      console.error("Create subject error:", error);
      alert("❌ Something went wrong while creating the subject.");
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleUploadModule = async (e) => {
    e.preventDefault();

    if (!selectedSubjectId) {
      alert("Please select a subject.");
      return;
    }

    if (!moduleTitle.trim()) {
      alert("Please enter a module title.");
      return;
    }

    if (!moduleFile) {
      alert("Please choose a file to upload.");
      return;
    }

    try {
      setUploadingModule(true);

      const formData = new FormData();
      formData.append("subject_id", selectedSubjectId);
      formData.append("title", moduleTitle.trim());
      formData.append("module_file", moduleFile);

      const res = await apiFetch("/modules", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to upload module.");
        return;
      }

      alert("✅ Module uploaded successfully.");
      setModuleTitle("");
      setModuleFile(null);

      const fileInput = document.getElementById("module-file-input");
      if (fileInput) fileInput.value = "";

      await fetchModulesForSubject(selectedSubjectId);
    } catch (error) {
      console.error("Module upload error:", error);
      alert("❌ Something went wrong while uploading the module.");
    } finally {
      setUploadingModule(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(subjectId);

      const res = await apiFetch(`/subjects/${subjectId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to delete subject.");
        return;
      }

      alert(data.message || "✅ Subject deleted successfully.");
      await fetchSubjects();
    } catch (error) {
      console.error("Delete subject error:", error);
      alert("❌ Something went wrong while deleting the subject.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteModule = async (moduleId, subjectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this module?",
    );
    if (!confirmed) return;

    try {
      setDeletingModuleId(moduleId);

      const res = await apiFetch(`/modules/${moduleId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to delete module.");
        return;
      }

      alert(data.message || "✅ Module deleted successfully.");
      await fetchModulesForSubject(subjectId);
    } catch (error) {
      console.error("Delete module error:", error);
      alert("❌ Something went wrong while deleting the module.");
    } finally {
      setDeletingModuleId(null);
    }
  };

  const renderModules = (subject) => {
    const subjectModules = modulesBySubject[subject.subject_id] || [];

    if (subjectModules.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No modules uploaded yet.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {subjectModules.map((module) => (
          <div
            key={module.module_id}
            className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3"
          >
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                {module.title}
              </p>
              <a
                href={module.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                <FileText size={14} />
                Open file
              </a>
            </div>

            {canManage && (
              <button
                onClick={() =>
                  handleDeleteModule(module.module_id, subject.subject_id)
                }
                disabled={deletingModuleId === module.module_id}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 font-semibold disabled:opacity-60"
              >
                {deletingModuleId === module.module_id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {canManage && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <PlusCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Create Subject
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add a new subject to the academic catalog.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="relative">
                <BookOpen
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creatingSubject}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingSubject}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingSubject ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Create Subject
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <UploadCloud size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Upload Module
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Attach learning material to a subject.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadModule} className="space-y-4">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500"
                disabled={uploadingModule}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Module title"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500"
                disabled={uploadingModule}
                required
              />

              <input
                id="module-file-input"
                type="file"
                onChange={(e) => setModuleFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none"
                disabled={uploadingModule}
                required
              />

              <button
                type="submit"
                disabled={uploadingModule}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingModule ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    Upload Module
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Subjects & Modules
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Browse created subjects and their uploaded learning materials.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loadingSubjects ? (
          <div className="py-12 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" />
            Loading subjects...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <PremiumEmptyState
            icon={FolderOpen}
            title="No subjects found"
            description="Create a subject or adjust your search to see results here."
          />
        ) : (
          <div className="space-y-4">
            {filteredSubjects.map((subject) => {
              const subjectModules = modulesBySubject[subject.subject_id] || [];

              return (
                <div
                  key={subject.subject_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-gray-50/60 dark:bg-gray-900/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {subject.subject_name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {subjectModules.length} module
                        {subjectModules.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteSubject(subject.subject_id)}
                        disabled={deletingId === subject.subject_id}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 font-semibold disabled:opacity-60"
                      >
                        {deletingId === subject.subject_id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {renderModules(subject)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectsTab;
