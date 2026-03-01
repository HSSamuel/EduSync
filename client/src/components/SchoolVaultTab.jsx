// src/components/SchoolVaultTab.jsx
import React, { useState, useEffect } from "react";
import { FolderLock } from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";

const SchoolVaultTab = ({ isAdmin }) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/school/documents",
          { headers: { jwt_token: token } },
        );
        if (response.ok) setDocuments(await response.json());
      } catch (err) {
        console.error(err.message);
      }
    };
    fetchDocs();
  }, []);

  const uploadDocument = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData(e.target);
      const response = await fetch(
        "http://localhost:5000/api/school/documents",
        {
          method: "POST",
          headers: { jwt_token: token },
          body: formData,
        },
      );
      if (response.ok) {
        alert("✅ Document Uploaded to Vault!");
        e.target.reset();
        setDocuments([await response.json(), ...documents]);
      } else {
        alert("❌ Upload Failed.");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const deleteDocument = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/school/documents/${id}`,
        {
          method: "DELETE",
          headers: { jwt_token: token },
        },
      );
      if (response.ok) setDocuments(documents.filter((d) => d.doc_id !== id));
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Admin Upload Form */}
      {isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-700/50 shadow-sm">
          <h4 className="text-xl font-bold font-serif mb-4 text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
            <FolderLock size={20} /> Upload to School Vault
          </h4>
          <form
            onSubmit={uploadDocument}
            className="flex flex-col md:flex-row gap-4 items-center"
          >
            <input
              type="text"
              name="title"
              placeholder="Document Title (e.g., 2026 Calendar)"
              className="flex-1 px-4 py-3 border border-yellow-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
              required
            />
            <input
              type="file"
              name="document_file"
              accept=".pdf,.doc,.docx"
              className="text-sm file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200 dark:file:bg-yellow-700 dark:file:text-white transition-colors cursor-pointer"
              required
            />
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 shadow-md transform hover:-translate-y-0.5 transition-all"
            >
              Upload File
            </button>
          </form>
        </div>
      )}

      {/* Document List with Premium Empty State */}
      <div className="mt-4">
        {documents.length === 0 ? (
          <PremiumEmptyState
            icon={FolderLock}
            title="The Vault is Empty"
            description="No official school documents, calendars, or fee structures have been securely uploaded yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.doc_id}
                className="p-6 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl flex justify-between items-start group hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {doc.title}
                  </h4>
                  <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-sm font-bold rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                  >
                    📥 Download
                  </a>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteDocument(doc.doc_id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Document"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolVaultTab;
