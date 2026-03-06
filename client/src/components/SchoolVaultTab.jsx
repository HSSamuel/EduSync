import React, { useState, useEffect } from "react";
import { FolderLock, Loader2, UploadCloud } from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";

const SchoolVaultTab = ({ isAdmin }) => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const fetchDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await apiFetch("/school/documents", {
        method: "GET",
      });

      if (response.ok) {
        const docs = await response.json();
        setDocuments(Array.isArray(docs) ? docs : []);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Failed to fetch documents:", err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const uploadDocument = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.target);

      const response = await apiFetch("/school/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json().catch(() => null);
        alert("✅ Document Uploaded to Vault!");
        e.target.reset();

        if (newDoc) {
          setDocuments((prev) => [newDoc, ...prev]);
        } else {
          // If API returns no doc object, re-fetch list.
          fetchDocs();
        }
      } else {
        const err = await response.json().catch(() => ({}));
        alert("❌ " + (err.error || "Upload Failed."));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      const response = await apiFetch(`/school/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.doc_id !== id));
      } else {
        const err = await response.json().catch(() => ({}));
        alert("❌ " + (err.error || "Delete failed."));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong while deleting.");
    }
  };

  const handleSecureDownload = (e, fileUrl) => {
    e.preventDefault();
    if (!fileUrl) return alert("File URL is missing.");

    let downloadUrl = fileUrl;

    // Cloudinary secure download trick: force attachment download
    if (fileUrl.includes("cloudinary.com")) {
      const parts = fileUrl.split("/upload/");
      if (parts.length === 2) {
        downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
    }

    window.open(downloadUrl, "_blank");
  };

  return (
    <div className="animate-fade-in space-y-6">
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
              disabled={isUploading}
            />

            <input
              type="file"
              name="document_file"
              accept=".pdf,.doc,.docx"
              className="text-sm file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200 cursor-pointer disabled:opacity-50"
              required
              disabled={isUploading}
            />

            <button
              type="submit"
              disabled={isUploading}
              className="w-full md:w-auto px-8 py-3 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <UploadCloud size={18} /> Upload File
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <div className="mt-4">
        {isLoadingDocs ? (
          <div className="py-12 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <PremiumEmptyState
            icon={FolderLock}
            title="The Vault is Empty"
            description="No official school documents have been securely uploaded yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.doc_id}
                className="p-6 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm bg-white/80 dark:bg-gray-800/80 flex justify-between items-start group hover:-translate-y-1 transition-all"
              >
                <div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {doc.title}
                  </h4>
                  <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                    {doc.uploaded_at
                      ? new Date(doc.uploaded_at).toLocaleDateString()
                      : ""}
                  </p>

                  <button
                    onClick={(e) => handleSecureDownload(e, doc.file_url)}
                    className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-sm font-bold rounded-lg text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    📥 Download
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => deleteDocument(doc.doc_id)}
                    className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Delete document"
                    title="Delete"
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
