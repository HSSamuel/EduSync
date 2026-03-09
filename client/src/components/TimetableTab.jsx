import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  BookOpen,
  Plus,
  Save,
  Trash2,
  Grip,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "../utils/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const CLASS_GRADES = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const EMPTY_SCHEDULE = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
};

const TimetableTab = ({ isAdmin, subjects = [] }) => {
  const [selectedClass, setSelectedClass] = useState("JSS 1");
  const [activeDay, setActiveDay] = useState("Monday");
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [newSlot, setNewSlot] = useState({
    start_time: "08:00",
    end_time: "09:00",
    subject: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const subjectOptions = useMemo(() => {
    const mapped = subjects.map((s) => ({
      label: s.subject_name,
      value: s.subject_name,
    }));

    return [
      { label: "Assembly", value: "Assembly" },
      { label: "Break / Lunch", value: "Break / Lunch" },
      ...mapped,
    ];
  }, [subjects]);

  const daySchedule = schedule[activeDay] || [];

  const clearFeedback = () => {
    setFeedback({ type: "", message: "" });
  };

  const normalizeSchedule = (incoming) => {
    const normalized = { ...EMPTY_SCHEDULE };

    if (!incoming || typeof incoming !== "object") return normalized;

    for (const day of DAYS) {
      const slots = Array.isArray(incoming[day]) ? incoming[day] : [];
      normalized[day] = [...slots].sort((a, b) =>
        String(a.start_time).localeCompare(String(b.start_time)),
      );
    }

    return normalized;
  };

  const fetchTimetable = async () => {
    setIsLoading(true);
    clearFeedback();

    try {
      const res = await apiFetch(
        `/timetable/${encodeURIComponent(selectedClass)}`,
      );

      if (!res.ok) {
        throw new Error("Failed to load timetable.");
      }

      const payload = await res.json().catch(() => ({}));
      setSchedule(normalizeSchedule(payload?.data));
    } catch (error) {
      console.error(error);
      setSchedule(EMPTY_SCHEDULE);
      setFeedback({
        type: "error",
        message: "Unable to load timetable right now.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasTimeConflict = (slotToCheck, list, ignoreIndex = -1) => {
    const startA = slotToCheck.start_time;
    const endA = slotToCheck.end_time;

    return list.some((slot, index) => {
      if (index === ignoreIndex) return false;

      const startB = slot.start_time;
      const endB = slot.end_time;

      return startA < endB && endA > startB;
    });
  };

  const validateSlot = () => {
    if (!newSlot.subject) {
      setFeedback({ type: "error", message: "Select a subject first." });
      return false;
    }

    if (!newSlot.start_time || !newSlot.end_time) {
      setFeedback({
        type: "error",
        message: "Choose both start and end time.",
      });
      return false;
    }

    if (newSlot.start_time >= newSlot.end_time) {
      setFeedback({
        type: "error",
        message: "End time must be later than start time.",
      });
      return false;
    }

    if (hasTimeConflict(newSlot, daySchedule)) {
      setFeedback({
        type: "error",
        message: "This time overlaps with another class.",
      });
      return false;
    }

    return true;
  };

  const handleAddSlot = () => {
    clearFeedback();

    if (!validateSlot()) return;

    const updatedSchedule = {
      ...schedule,
      [activeDay]: [...daySchedule, newSlot].sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      ),
    };

    setSchedule(updatedSchedule);
    setNewSlot({
      start_time: newSlot.end_time,
      end_time: newSlot.end_time,
      subject: "",
    });

    setFeedback({
      type: "success",
      message: `${activeDay} updated.`,
    });
  };

  const handleRemoveSlot = (indexToRemove) => {
    clearFeedback();

    const updatedSchedule = {
      ...schedule,
      [activeDay]: daySchedule.filter((_, index) => index !== indexToRemove),
    };

    setSchedule(updatedSchedule);
    setFeedback({
      type: "success",
      message: "Class removed.",
    });
  };

  const saveTimetable = async () => {
    setIsSaving(true);
    clearFeedback();

    try {
      const res = await apiFetch("/timetable", {
        method: "POST",
        body: JSON.stringify({
          class_grade: selectedClass,
          schedule,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            data?.details?.[0]?.message ||
            "Failed to save timetable.",
        );
      }

      setSchedule(normalizeSchedule(data?.data?.schedule || schedule));
      setFeedback({
        type: "success",
        message: data?.message || `Saved for ${selectedClass}.`,
      });
    } catch (error) {
      console.error("Save timetable error:", error);
      setFeedback({
        type: "error",
        message: error.message || "Failed to save timetable.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const formatTime12Hour = (time) => {
    if (!time || typeof time !== "string" || !time.includes(":")) return time;

    const [hourStr, minute] = time.split(":");
    const hour = Number(hourStr);

    if (Number.isNaN(hour)) return time;

    const suffix = hour >= 12 ? "PM" : "AM";
    const normalizedHour = hour % 12 || 12;

    return `${normalizedHour}:${minute} ${suffix}`;
  };
  const getBadgeTone = (subject) => {
    const label = String(subject || "").toLowerCase();

    if (label.includes("break") || label.includes("lunch")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
    }

    if (label.includes("assembly")) {
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800";
    }

    return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800";
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <CalendarDays size={24} />
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Timetable
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Weekly class schedule
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full min-w-[150px] rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              {CLASS_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`min-w-fit rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeDay === day
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {feedback.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div
        className={`grid gap-5 ${isAdmin ? "xl:grid-cols-[340px_minmax(0,1fr)]" : "grid-cols-1"}`}
      >
        {isAdmin && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white">
                  Add Class
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {activeDay}
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300">
                <Plus size={18} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Time
                </label>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="relative">
                    <Clock3
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) =>
                        setNewSlot((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm font-bold text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <span className="text-sm font-bold text-gray-400">to</span>

                  <div className="relative">
                    <Clock3
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) =>
                        setNewSlot((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm font-bold text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Subject
                </label>

                <div className="relative">
                  <BookOpen
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={newSlot.subject}
                    onChange={(e) =>
                      setNewSlot((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Choose subject</option>
                    {subjectOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddSlot}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
              >
                <Plus size={16} />
                Add Class
              </button>
            </div>

            <div className="my-5 border-t border-gray-200 dark:border-gray-700" />

            <button
              onClick={saveTimetable}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {activeDay}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedClass}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
              <Grip size={15} />
              {daySchedule.length}{" "}
              {daySchedule.length === 1 ? "class" : "classes"}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
                />
              ))}
            </div>
          ) : daySchedule.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center dark:border-gray-700 dark:bg-gray-900/20">
              <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300">
                <CalendarDays size={28} />
              </div>

              <h5 className="text-lg font-black text-gray-900 dark:text-white">
                No classes yet
              </h5>

              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {isAdmin
                  ? "Use the form on the left to add the first class for this day."
                  : "No classes have been scheduled for this day yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {daySchedule.map((slot, index) => (
                <div
                  key={`${slot.subject}-${slot.start_time}-${slot.end_time}-${index}`}
                  className="group rounded-lg border border-gray-200 bg-gray-50 p-2.5 transition hover:shadow-sm dark:border-gray-700 dark:bg-gray-900/30"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`shrink-0 rounded-lg border p-1.5 ${getBadgeTone(slot.subject)}`}
                    >
                      <BookOpen size={14} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                            {slot.subject}
                          </h5>

                          <div className="mt-1.5 flex flex-col items-start gap-1.5">
                            <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              <Clock3 size={12} className="shrink-0" />
                              <span className="whitespace-nowrap">
                                {formatTime12Hour(slot.start_time)} -{" "}
                                {formatTime12Hour(slot.end_time)}
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 dark:text-gray-500">
                              <ChevronRight size={11} />
                              {activeDay}
                            </span>
                          </div>
                        </div>

                        {isAdmin ? (
                          <button
                            onClick={() => handleRemoveSlot(index)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                          >
                            <Trash2 size={11} />
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableTab;
