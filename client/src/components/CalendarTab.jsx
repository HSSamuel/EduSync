import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  PlusCircle,
  Loader2,
  Clock3,
  MapPin,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";

const CalendarTab = ({ isAdmin, isTeacher }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
  });

  const canManage = isAdmin || isTeacher;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/school/events", {
        method: "GET",
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to fetch calendar events:", err);
        setEvents([]);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.event_date) {
      alert("Please provide at least title and date.");
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetch("/school/events", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          event_date: formData.event_date,
          location: formData.location.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to create event.");
        return;
      }

      alert(data.message || "✅ Event created successfully.");
      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
      });
      await fetchEvents();
    } catch (err) {
      console.error("Calendar create error:", err);
      alert("❌ Something went wrong while creating the event.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {canManage && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <PlusCircle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Event
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an event to the school calendar.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Event title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={creating}
              required
            />

            <textarea
              rows="4"
              placeholder="Event description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              disabled={creating}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={creating}
                required
              />

              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={creating}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
            <CalendarDays size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              School Calendar
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upcoming academic and school events.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <PremiumEmptyState
            icon={CalendarDays}
            title="No calendar events yet"
            description="Created events will appear here."
          />
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.event_id || index}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5"
              >
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  {event.title}
                </h4>

                {event.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} />
                    {event.event_date
                      ? new Date(event.event_date).toLocaleString()
                      : ""}
                  </span>

                  {event.location && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarTab;
