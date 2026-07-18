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
  ChevronDown,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

// 100% PRO FEATURE: Dynamic Thumbnail Generation for Documents
const getCloudinaryPreview = (url) => {
  if (!url) return null;
  if (url.includes("cloudinary.com")) {
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      // Add transformations: width 400, height 250, crop fill, format jpg, quality auto
      const transform = "w_400,h_250,c_fill,f_jpg,q_auto";
      const filePart = parts[1].replace(/\.[^/.]+$/, ".jpg");
      return `${parts[0]}/upload/${transform}/${filePart}`;
    }
  }
  return null;
};

const SubjectsTab = ({ isAdmin, isTeacher }) => {
  const [subjects, setSubjects] = useState([]);
  const [modulesBySubject, setModulesBySubject] = useState({});
  const [viewSubjectId, setViewSubjectId] = useState("");

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
  const { notifySuccess, notifyError, notifyInfo, confirm } = useAppContext();

  const fetchAllData = async () => {
    try {
      setLoadingSubjects(true);

      const [subRes, modRes] = await Promise.all([
        apiFetch("/subjects", { method: "GET" }),
        apiFetch("/modules", { method: "GET" }),
      ]);

      const subData = subRes.ok ? await subRes.json() : { data: [] };
      const modData = modRes.ok ? await modRes.json() : { data: [] };

      const fetchedSubjects = Array.isArray(subData.data) ? subData.data : [];
      setSubjects(fetchedSubjects);

      if (fetchedSubjects.length > 0 && !viewSubjectId) {
        setViewSubjectId(fetchedSubjects[0].subject_id);
      }

      const grouped = {};
      const modulesList = Array.isArray(modData.data) ? modData.data : [];
      modulesList.forEach((m) => {
        if (!grouped[m.subject_id]) grouped[m.subject_id] = [];
        grouped[m.subject_id].push(m);
      });

      setModulesBySubject(grouped);
    } catch (error) {
      console.error("Error loading subjects data:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjects;
    return subjects.filter((subject) => {
      const name = subject.subject_name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [subjects, searchTerm]);

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (
        !filteredSubjects.some(
          (s) => s.subject_id.toString() === viewSubjectId.toString(),
        )
      ) {
        setViewSubjectId(filteredSubjects[0].subject_id);
      }
    }
  }, [filteredSubjects, viewSubjectId]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      notifyInfo("Please enter a subject name.", "Missing details");
      return;
    }

    try {
      setCreatingSubject(true);
      const res = await apiFetch("/subjects", {
        method: "POST",
        body: JSON.stringify({ subject_name: subjectName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data.error || "Failed to create subject.");
        return;
      }

      notifySuccess("Subject created successfully.");
      setSubjectName("");

      if (data.data?.subject_id) {
        setViewSubjectId(data.data.subject_id);
      }

      await fetchAllData();
    } catch (error) {
      notifyError("Something went wrong while creating the subject.");
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleUploadModule = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !moduleTitle.trim() || !moduleFile) {
      notifyInfo(
        "Please select a subject, enter a title, and choose a file.",
        "Missing details",
      );
      return;
    }

    try {
      setUploadingModule(true);
      const formData = new FormData();
      formData.append("subject_id", selectedSubjectId);
      formData.append("title", moduleTitle.trim());
      formData.append("file", moduleFile);

      const res = await apiFetch("/modules", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data.error || "Failed to upload module.");
        return;
      }

      notifySuccess("Module uploaded successfully.");
      setModuleTitle("");
      setModuleFile(null);

      const fileInput = document.getElementById("module-file-input");
      if (fileInput) fileInput.value = "";

      setViewSubjectId(selectedSubjectId);
      await fetchAllData();
    } catch (error) {
      notifyError("Something went wrong while uploading the module.");
    } finally {
      setUploadingModule(false);
    }
  };

  const handleDeleteSubject = async (e, subjectId) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: "Delete subject",
      message:
        "Are you sure you want to delete this subject? All associated modules will be lost.",
      confirmText: "Delete subject",
      cancelText: "Keep subject",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      setDeletingId(subjectId);
      const res = await apiFetch(`/subjects/${subjectId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data.error || "Failed to delete subject.");
        return;
      }

      notifySuccess(data.message || "Subject deleted successfully.");
      setViewSubjectId("");
      await fetchAllData();
    } catch (error) {
      notifyError("Something went wrong while deleting the subject.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    const confirmed = await confirm({
      title: "Delete module",
      message:
        "Are you sure you want to delete this module? This action cannot be undone.",
      confirmText: "Delete module",
      cancelText: "Keep module",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      setDeletingModuleId(moduleId);
      const res = await apiFetch(`/modules/${moduleId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(data.error || "Failed to delete module.");
        return;
      }

      notifySuccess(data.message || "Module deleted successfully.");
      await fetchAllData();
    } catch (error) {
      notifyError("Something went wrong while deleting the module.");
    } finally {
      setDeletingModuleId(null);
    }
  };

  const activeSubject = subjects.find(
    (s) => s.subject_id.toString() === viewSubjectId?.toString(),
  );
  const subjectModules = activeSubject
    ? modulesBySubject[activeSubject.subject_id] || []
    : [];

  return (
    <div className="animate-fade-in space-y-6">
      {canManage && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <PlusCircle size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight text-gray-900 dark:text-white">
                  Create Subject
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add to academic catalog.
                </p>
              </div>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div className="relative">
                <BookOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900"
                  disabled={creatingSubject}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creatingSubject}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingSubject ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Create Subject
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-1.5 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <UploadCloud size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight text-gray-900 dark:text-white">
                  Upload Module
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Attach learning material.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadModule} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm font-medium outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-900"
                    disabled={uploadingModule}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option
                        key={subject.subject_id}
                        value={subject.subject_id}
                      >
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Module title"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-900"
                  disabled={uploadingModule}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="group relative min-w-0 flex-1">
                  <input
                    id="module-file-input"
                    type="file"
                    onChange={(e) => setModuleFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    disabled={uploadingModule}
                    required
                  />
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1 transition-all group-hover:border-green-300 group-focus-within:ring-2 group-focus-within:ring-green-500/20 dark:border-gray-700 dark:bg-gray-900 dark:group-hover:border-green-800/50">
                    <span className="whitespace-nowrap rounded-lg bg-green-100 px-3 py-1.5 text-[11px] font-bold text-green-700 transition-colors dark:bg-green-900/30 dark:text-green-400 sm:text-xs">
                      Choose File
                    </span>
                    <span className="block truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
                      {moduleFile ? moduleFile.name : "No file..."}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingModule}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-green-500/20 transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingModule ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  <span className="hidden sm:inline">
                    {uploadingModule ? "Uploading" : "Upload"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Subjects View - Elegant Dropdown Interface */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 pr-4">
            {/* FIXED: Single line, scaling font-size, no truncation on the paragraph so it flows naturally */}
            <h3 className="whitespace-nowrap text-lg font-black tracking-tight text-gray-900 dark:text-white sm:text-xl leading-tight">
              Subjects & Modules
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-snug">
              Select a subject to view its learning materials.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row shrink-0">
            <div className="relative w-full shrink-0 sm:w-48 lg:w-56">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div className="relative w-full shrink-0 sm:w-48 lg:w-56">
              <BookOpen
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={viewSubjectId}
                onChange={(e) => setViewSubjectId(e.target.value)}
                className="w-full appearance-none cursor-pointer rounded-xl border border-blue-200 bg-blue-50/50 py-2.5 pl-9 pr-8 text-sm font-bold text-blue-800 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-blue-900/50 dark:bg-blue-900/10 dark:text-blue-300"
                disabled={filteredSubjects.length === 0}
              >
                {filteredSubjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"
              />
            </div>
          </div>
        </div>

        {loadingSubjects ? (
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Loader2 size={20} className="mr-2 animate-spin" /> Loading data...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <PremiumEmptyState
            icon={FolderOpen}
            title="No subjects found"
            description="Create a subject or adjust your search to see results here."
          />
        ) : activeSubject ? (
          <div className="animate-fade-in overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30">
            <div className="flex flex-col items-center gap-4 border-b border-gray-200 bg-white p-5 text-center dark:border-gray-700 dark:bg-gray-800/80 sm:flex-row sm:justify-between sm:text-left">
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <div className="shrink-0 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-600 shadow-sm dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black leading-tight text-gray-900 dark:text-white">
                    {activeSubject.subject_name}
                  </h4>
                  <p className="mt-1 flex justify-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:justify-start">
                    {subjectModules.length} module
                    {subjectModules.length === 1 ? "" : "s"} available
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={(e) =>
                    handleDeleteSubject(e, activeSubject.subject_id)
                  }
                  disabled={deletingId === activeSubject.subject_id}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                >
                  {deletingId === activeSubject.subject_id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete Subject
                </button>
              )}
            </div>

            <div className="p-5">
              {subjectModules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center dark:border-gray-700 dark:bg-gray-900/50">
                  <FileText
                    size={32}
                    className="mx-auto mb-3 text-gray-400 opacity-50"
                  />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    No learning materials found
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a module using the form above to add resources to{" "}
                    {activeSubject.subject_name}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {subjectModules.map((module) => {
                    const previewUrl = getCloudinaryPreview(module.file_url);

                    return (
                      <div
                        key={module.module_id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
                      >
                        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {previewUrl ? (
                            <>
                              <img
                                src={previewUrl}
                                alt="Document preview"
                                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.classList.remove(
                                    "hidden",
                                  );
                                  e.target.nextElementSibling.classList.add(
                                    "flex",
                                  );
                                }}
                              />
                              <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700 transition-transform duration-500 group-hover:scale-105">
                                <FileText
                                  size={48}
                                  className="text-white/20 drop-shadow-sm"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700 transition-transform duration-500 group-hover:scale-105">
                              <FileText
                                size={48}
                                className="text-white/20 drop-shadow-sm"
                              />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/50" />

                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            <h5
                              className="text-center text-lg font-bold leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-3"
                              title={module.title}
                            >
                              {module.title}
                            </h5>
                          </div>

                          <div className="absolute right-3 top-3 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                            Document
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                          <a
                            href={module.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
                          >
                            Open File &rarr;
                          </a>

                          {canManage && (
                            <button
                              onClick={() =>
                                handleDeleteModule(module.module_id)
                              }
                              disabled={deletingModuleId === module.module_id}
                              className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              title="Delete Module"
                            >
                              {deletingModuleId === module.module_id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
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
        ) : null}
      </div>
    </div>
  );
};

export default SubjectsTab;
