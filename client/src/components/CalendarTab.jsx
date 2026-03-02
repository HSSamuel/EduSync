import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const CalendarTab = ({ isAdmin }) => {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    event_type: "Event",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/school/events`, {
        headers: { jwt_token: token },
      });
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmitEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/school/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ title: "", event_date: "", event_type: "Event" });
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/school/events/${id}`, {
        method: "DELETE",
        headers: { jwt_token: token },
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper function to color-code event types
  const getEventColor = (type) => {
    switch (type) {
      case "Exam":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case "Holiday":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Admin Controls */}
      {isAdmin && (
        <form
          onSubmit={onSubmitEvent}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
              Event Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              required
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              value={formData.event_type}
              onChange={(e) =>
                setFormData({ ...formData, event_type: e.target.value })
              }
            >
              <option value="Event">General Event</option>
              <option value="Exam">Exam / Test</option>
              <option value="Holiday">Public Holiday</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md"
          >
            Add Event
          </button>
        </form>
      )}

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h4 className="text-xl font-bold mb-4 dark:text-white">
          📅 Upcoming School Events
        </h4>
        {events.length === 0 ? (
          <p className="text-gray-500 italic">
            No upcoming events on the calendar.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.event_id}
                className={`flex items-center justify-between p-4 rounded-lg border ${getEventColor(event.event_type)}`}
              >
                <div>
                  <h5 className="font-bold text-lg">{event.title}</h5>
                  <p className="text-sm opacity-80">
                    {new Date(event.event_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black uppercase tracking-wider text-xs px-3 py-1 rounded-full bg-white/50 dark:bg-black/20">
                    {event.event_type}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => deleteEvent(event.event_id)}
                      className="text-lg hover:scale-110 transition-transform"
                    >
                      🗑️
                    </button>
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
