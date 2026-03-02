import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const BroadcastTab = ({ isAdmin }) => {
  const [formData, setFormData] = useState({
    audience: "All",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isAdmin) return null; // Security fallback

  const onSubmitBroadcast = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setStatus("Sending...");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/school/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify(formData),
      });

      const parseRes = await response.json();

      if (response.ok) {
        setStatus(parseRes.message);
        setFormData({ audience: "All", subject: "", message: "" }); // Reset form
      } else {
        setStatus(`❌ Error: ${parseRes.error}`);
      }
    } catch (err) {
      setStatus("❌ Failed to connect to server.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-fade-in bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 p-6">
      <div className="border-b dark:border-gray-700 pb-4 mb-6">
        <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">
          📢 Mass Email Broadcast
        </h4>
        <p className="text-sm text-gray-500 mt-1">
          Send official communications directly to user inboxes.
        </p>
      </div>

      <form onSubmit={onSubmitBroadcast} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">
            Target Audience
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            value={formData.audience}
            onChange={(e) =>
              setFormData({ ...formData, audience: e.target.value })
            }
          >
            <option value="All">Everyone (Parents, Teachers, Students)</option>
            <option value="Parent">All Parents</option>
            <option value="Teacher">All Teachers</option>
            <option value="Student">All Students</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Email Subject</label>
          <input
            type="text"
            placeholder="e.g., Important: School Closure Tomorrow"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Message Body</label>
          <textarea
            rows="6"
            placeholder="Type your message here..."
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            required
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className={`px-8 py-3 font-bold rounded-lg shadow-md text-white transition-colors ${isSending ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isSending ? "Dispatching Emails..." : "🚀 Send Broadcast"}
        </button>
      </form>

      {status && (
        <div
          className={`mt-4 p-3 rounded text-sm font-bold ${status.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default BroadcastTab;