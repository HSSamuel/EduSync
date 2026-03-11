import React, { useState } from "react";
import { Megaphone, Send, Loader2, Users } from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

const BroadcastTab = ({ isAdmin, isTeacher }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("All");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  const canBroadcast = isAdmin || isTeacher;
  const { notifySuccess, notifyError, notifyInfo } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      notifyInfo("Please provide both title and message.", "Missing details");
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch("/school/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.error || "Failed to send broadcast.");
        return;
      }

      notifySuccess(data.message || "Broadcast sent successfully.");

      setLastSent({
        title: title.trim(),
        message: message.trim(),
        audience,
        created_at: new Date().toISOString(),
      });

      setTitle("");
      setMessage("");
      setAudience("All");
    } catch (err) {
      console.error("Broadcast send error:", err);
      notifyError("Something went wrong while sending the broadcast.");
    } finally {
      setSending(false);
    }
  };

  if (!canBroadcast) {
    return (
      <PremiumEmptyState
        icon={Megaphone}
        title="Broadcast unavailable"
        description="Only admins and teachers can send broadcasts."
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400">
            <Megaphone size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Send Broadcast
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share important information with selected users.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Broadcast title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
            disabled={sending}
            required
          />

          <textarea
            rows="5"
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
            disabled={sending}
            required
          />

          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
                disabled={sending}
              >
                <option value="All">All</option>
                <option value="Students">Students</option>
                <option value="Parents">Parents</option>
                <option value="Teachers">Teachers</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-fuchsia-600 text-white font-bold hover:bg-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        {lastSent ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Last Sent Broadcast
            </h3>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {lastSent.title}
                </h4>
                <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
                  {lastSent.audience}
                </span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {lastSent.message}
              </p>

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {new Date(lastSent.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <PremiumEmptyState
            icon={Megaphone}
            title="No local broadcast preview yet"
            description="Your backend currently supports sending broadcasts, but not fetching broadcast history. After you send one, the most recent sent message will appear here for this session."
          />
        )}
      </div>
    </div>
  );
};

export default BroadcastTab;
