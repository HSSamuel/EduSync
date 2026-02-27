import React, { useState, useEffect } from "react";

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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm">
          <h4 className="text-xl font-bold mb-4 text-yellow-800 dark:text-yellow-400">
            🔒 Upload to School Vault
          </h4>
          <form
            onSubmit={uploadDocument}
            className="flex flex-col md:flex-row gap-4 items-center"
          >
            <input
              type="text"
              name="title"
              placeholder="Document Title (e.g., 2026 Calendar)"
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              required
            />
            <input
              type="file"
              name="document_file"
              accept=".pdf,.doc,.docx"
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200 dark:file:bg-yellow-700 dark:file:text-white"
              required
            />
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 shadow-md"
            >
              Upload
            </button>
          </form>
        </div>
      )}

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <p className="text-gray-500 italic p-4">
            No documents in the vault yet.
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.doc_id}
              className="p-5 border rounded-xl shadow-sm bg-white dark:bg-gray-800 flex justify-between items-center group"
            >
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {doc.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  📥 Download File
                </a>
              </div>
              {isAdmin && (
                <button
                  onClick={() => deleteDocument(doc.doc_id)}
                  className="text-red-400 hover:text-red-600 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchoolVaultTab;
