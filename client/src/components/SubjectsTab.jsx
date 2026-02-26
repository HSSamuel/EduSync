import React, { useState } from "react";

const SubjectsTab = ({ isAdmin, subjects, setSubjects }) => {
  const [subjectName, setSubjectName] = useState("");
  const [modules, setModules] = useState({});

  const onSubmitSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({ subject_name: subjectName, teacher_id: "1" }),
      });
      if (response.ok) {
        setSubjects([...subjects, await response.json()]);
        setSubjectName("");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const deleteSubject = async (id) => {
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
        alert("✅ File Uploaded!");
        e.target.reset();
        fetchModules(subject_id);
      } else {
        alert("❌ Error: " + (await response.json()).error);
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
        { headers: { jwt_token: token } },
      );
      if (response.ok)
        setModules({ ...modules, [subject_id]: await response.json() });
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      {isAdmin && (
        <form onSubmit={onSubmitSubject} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="New Subject Name"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
          >
            + Add Subject
          </button>
        </form>
      )}

      {subjects.length === 0 ? (
        <p className="text-gray-500 italic">No subjects available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.subject_id}
              className="p-5 border rounded-xl shadow-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600 relative flex flex-col justify-between"
            >
              <div className="pr-8">
                <h4 className="text-xl font-bold text-blue-600 dark:text-yellow-400">
                  {subject.subject_name}
                </h4>
                <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                  Subject ID: {subject.subject_id}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => deleteSubject(subject.subject_id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-bold text-xl"
                >
                  ✕
                </button>
              )}

              {isAdmin && (
                <div className="mt-4 pt-4 border-t dark:border-gray-600">
                  <form
                    onSubmit={(e) => uploadModule(e, subject.subject_id)}
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Syllabus"
                      className="px-3 py-1 text-sm border rounded dark:bg-gray-800"
                      required
                    />
                    <input
                      type="file"
                      name="module_file"
                      accept=".pdf,.doc,.docx"
                      className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded"
                    >
                      Upload File
                    </button>
                  </form>
                </div>
              )}

              <div className="mt-4 pt-2 border-t border-dashed border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => fetchModules(subject.subject_id)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-yellow-400"
                >
                  📂 View Materials
                </button>
                {modules[subject.subject_id] && (
                  <ul className="mt-2 space-y-2">
                    {modules[subject.subject_id].length === 0 ? (
                      <li className="text-xs text-gray-500 italic">
                        No files.
                      </li>
                    ) : (
                      modules[subject.subject_id].map((mod) => (
                        <li
                          key={mod.module_id}
                          className="text-sm bg-white dark:bg-gray-800 p-2 rounded shadow-sm border"
                        >
                          <a
                            href={mod.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            📄 {mod.title}
                          </a>
                        </li>
                      ))
                    )}
                  </ul>
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
