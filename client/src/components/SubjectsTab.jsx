import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  UploadCloud,
  FolderOpen,
  FileText,
  CheckCircle2,
} from "lucide-react";

const SubjectsTab = ({ isAdmin, subjects, setSubjects }) => {
  const [subjectName, setSubjectName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [modules, setModules] = useState({});

  useEffect(() => {
    if (isAdmin) {
      const fetchTeachers = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            "http://localhost:5000/api/users/teachers",
            {
              headers: { jwt_token: token },
            },
          );
          if (response.ok) setTeachers(await response.json());
        } catch (err) {
          console.error(err.message);
        }
      };
      fetchTeachers();
    }
  }, [isAdmin]);

  const onSubmitSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({
          subject_name: subjectName,
          teacher_id: teacherId,
        }),
      });
      if (response.ok) {
        setSubjects([...subjects, await response.json()]);
        setSubjectName("");
        setTeacherId("");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/subjects/${id}`, {
        method: "DELETE",
        headers: { jwt_token: token },
      });
      if (response.ok) setSubjects(subjects.filter((s) => s.subject_id !== id));
    } catch (err) {
      console.error(err.message);
    }
  };

  const uploadModule = async (e, subject_id) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData(e.target);
      formData.append("subject_id", subject_id);
      const response = await fetch("http://localhost:5000/api/modules", {
        method: "POST",
        headers: { jwt_token: token },
        body: formData,
      });
      if (response.ok) {
        e.target.reset();
        fetchModules(subject_id);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchModules = async (subject_id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/modules/${subject_id}`,
        {
          headers: { jwt_token: token },
        },
      );
      if (response.ok)
        setModules({ ...modules, [subject_id]: await response.json() });
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Sleek Admin Control Bar */}
      {isAdmin && (
        <form
          onSubmit={onSubmitSubject}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center transition-all hover:shadow-md"
        >
          <div className="flex-1 w-full relative">
            <BookOpen
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="New Subject Name"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
          </div>

          <div className="flex-1 w-full">
            <select
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="" className="text-gray-400">
                Assign a Teacher...
              </option>
              {teachers.length === 0 && (
                <option disabled>No teachers found</option>
              )}
              {teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span>Add Subject</span>
          </button>
        </form>
      )}

      {/* Empty State */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <BookOpen
            size={48}
            className="text-gray-300 dark:text-gray-600 mb-4"
          />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No subjects have been created yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div
              key={subject.subject_id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group flex flex-col overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {subject.subject_name}
                  </h4>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteSubject(subject.subject_id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Delete Subject"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Upload Section */}
              {isAdmin && (
                <div className="p-5">
                  <form
                    onSubmit={(e) => uploadModule(e, subject.subject_id)}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      name="title"
                      placeholder="Material Title (e.g., Syllabus)"
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      required
                    />
                    <div className="relative">
                      <input
                        type="file"
                        name="module_file"
                        accept=".pdf,.doc,.docx"
                        className="w-full text-sm text-gray-500 file:cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 transition-all cursor-pointer"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2"
                    >
                      <UploadCloud size={16} /> Upload File
                    </button>
                  </form>
                </div>
              )}

              {/* Materials Section */}
              <div
                className={`p-5 ${isAdmin ? "bg-gray-50 dark:bg-gray-900/50 mt-auto" : "flex-grow"}`}
              >
                <button
                  onClick={() => fetchModules(subject.subject_id)}
                  className="w-full flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen size={16} className="text-amber-500" /> View
                    Materials
                  </span>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full group-hover/btn:bg-blue-100 group-hover/btn:text-blue-600 transition-colors">
                    Open
                  </span>
                </button>

                {modules[subject.subject_id] && (
                  <div className="mt-4 space-y-2 animate-fade-in">
                    {modules[subject.subject_id].length === 0 ? (
                      <div className="text-center py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 italic">
                          No files uploaded yet.
                        </p>
                      </div>
                    ) : (
                      modules[subject.subject_id].map((mod) => (
                        <a
                          key={mod.module_id}
                          href={mod.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 hover:shadow transition-all group/link"
                        >
                          <FileText
                            size={16}
                            className="text-blue-500 group-hover/link:text-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover/link:text-blue-600 truncate flex-1">
                            {mod.title}
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectsTab;
