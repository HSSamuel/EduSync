import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  PlusCircle,
  Loader2,
  Clock3,
  BookOpen,
  ListChecks,
  Trash2,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

const emptyQuestion = () => ({
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
});

const CBTTab = ({ isAdmin, isTeacher }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subjects, setSubjects] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    duration_minutes: "",
    instructions: "",
  });

  const [questions, setQuestions] = useState([emptyQuestion()]);

  const canManage = isAdmin || isTeacher;

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/subjects", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setSubjects([]);
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/cbt", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setTests(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to fetch CBT tests:", err);
        setTests([]);
      }
    } catch (err) {
      console.error("CBT fetch error:", err);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchTests();
  }, []);

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateQuestions = () => {
    if (questions.length === 0) return "Add at least one question.";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (
        !q.question_text.trim() ||
        !q.option_a.trim() ||
        !q.option_b.trim() ||
        !q.option_c.trim() ||
        !q.option_d.trim() ||
        !q.correct_option
      ) {
        return `Complete all fields for Question ${i + 1}.`;
      }
    }

    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.subject_id ||
      !formData.duration_minutes
    ) {
      notifyInfo("Please complete all required test fields.", "Missing details");
      return;
    }

    const questionError = validateQuestions();
    if (questionError) {
      notifyInfo(questionError, "Question validation");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subject_id: Number(formData.subject_id),
        duration_minutes: Number(formData.duration_minutes),
        instructions: formData.instructions.trim(),
        questions: questions.map((q) => ({
          question_text: q.question_text.trim(),
          option_a: q.option_a.trim(),
          option_b: q.option_b.trim(),
          option_c: q.option_c.trim(),
          option_d: q.option_d.trim(),
          correct_option: q.correct_option,
        })),
      };

      const res = await apiFetch("/cbt", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.error || "Failed to create CBT test.");
        return;
      }

      notifySuccess(data.message || "CBT test created successfully.");
      setFormData({
        title: "",
        subject_id: "",
        duration_minutes: "",
        instructions: "",
      });
      setQuestions([emptyQuestion()]);
      await fetchTests();
    } catch (err) {
      console.error("CBT create error:", err);
      notifyError("Something went wrong while creating the test.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {canManage && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <PlusCircle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create CBT Test
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set up a new computer-based test with questions.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <input
              type="text"
              placeholder="Test title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              disabled={creating}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.subject_id}
                onChange={(e) =>
                  setFormData({ ...formData, subject_id: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                disabled={creating}
                required
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                placeholder="Duration (minutes)"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                disabled={creating}
                required
              />
            </div>

            <textarea
              rows="4"
              placeholder="Instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              disabled={creating}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Questions
                </h4>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 font-semibold"
                >
                  <PlusCircle size={16} />
                  Add Question
                </button>
              </div>

              {questions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h5 className="font-bold text-gray-900 dark:text-white">
                      Question {index + 1}
                    </h5>

                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      disabled={questions.length === 1}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <textarea
                    rows="3"
                    placeholder="Enter question text"
                    value={question.question_text}
                    onChange={(e) =>
                      updateQuestion(index, "question_text", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    disabled={creating}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={question.option_a}
                      onChange={(e) =>
                        updateQuestion(index, "option_a", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={creating}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Option B"
                      value={question.option_b}
                      onChange={(e) =>
                        updateQuestion(index, "option_b", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={creating}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Option C"
                      value={question.option_c}
                      onChange={(e) =>
                        updateQuestion(index, "option_c", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={creating}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Option D"
                      value={question.option_d}
                      onChange={(e) =>
                        updateQuestion(index, "option_d", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={creating}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Correct Option
                    </label>
                    <select
                      value={question.correct_option}
                      onChange={(e) =>
                        updateQuestion(index, "correct_option", e.target.value)
                      }
                      className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      disabled={creating}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Create Test
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <FileCheck2 size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              CBT Tests
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View created tests and their setup details.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading CBT tests...
          </div>
        ) : tests.length === 0 ? (
          <PremiumEmptyState
            icon={FileCheck2}
            title="No CBT tests yet"
            description="Created tests will appear here."
          />
        ) : (
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={test.quiz_id || test.test_id || index}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5"
              >
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                  {test.title}
                </h4>

                <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen size={15} />
                    {test.subject_name || "Subject"}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} />
                    {test.duration_minutes || 0} minutes
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <ListChecks size={15} />
                    {test.question_count ?? 0} questions
                  </span>
                </div>

                {test.instructions && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {test.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CBTTab;
