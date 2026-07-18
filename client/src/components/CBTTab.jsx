import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  PlusCircle,
  Loader2,
  Clock3,
  BookOpen,
  ListChecks,
  Trash2,
  ChevronDown,
  Check,
  Settings,
  ShieldCheck,
  ChevronUp,
  ArrowRight,
  X,
  HelpCircle,
} from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

const emptyQuestion = () => ({
  id: crypto.randomUUID(),
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  isExpanded: true,
});

// Robust extractors to catch data no matter what the backend schema names it
const getTestId = (t) => t?.test_id || t?.id || t?.cbt_id || t?.quiz_id;
const getDuration = (t) =>
  t?.duration || t?.duration_minutes || t?.time_limit || t?.time;
const getInstructions = (t) =>
  t?.instructions ||
  t?.description ||
  t?.details ||
  "No specific instructions provided for this exam. Standard examination rules apply.";
const getQCount = (t) =>
  t?.question_count || t?.total_questions || t?.questions?.length || 0;
const getFormat = (t) => t?.format || t?.test_type || "Multi-Choice";

const SmartOption = ({
  letter,
  value,
  isCorrect,
  onChange,
  onMarkCorrect,
  disabled,
}) => (
  <div
    className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${isCorrect ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-900/20 shadow-sm" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}`}
  >
    <button
      type="button"
      onClick={onMarkCorrect}
      disabled={disabled}
      className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black transition-all disabled:cursor-not-allowed ${isCorrect ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
      title={`Mark Option ${letter} as correct`}
    >
      {isCorrect ? <Check size={16} strokeWidth={3} /> : letter}
    </button>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={`Option ${letter}`}
      className="flex-1 w-full min-w-0 bg-transparent border-none text-sm font-medium outline-none px-2 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-60 truncate"
      required
    />
  </div>
);

export default function CBTTab({ isAdmin, isTeacher }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selectedTest, setSelectedTest] = useState(null);
  const [deletingTestId, setDeletingTestId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    duration_minutes: "",
    instructions: "",
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const canManage = isAdmin || isTeacher;
  const {
    subjects,
    loadSubjects,
    notifySuccess,
    notifyError,
    notifyInfo,
    confirm,
  } = useAppContext();

  useEffect(() => {
    loadSubjects();
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/cbt", { method: "GET" });
      if (res.ok) {
        const payload = await res.json();
        setTests(Array.isArray(payload?.data) ? payload.data : []);
      }
    } catch (err) {
      console.error("Failed to fetch CBT tests", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    );
  };

  const toggleQuestionAccordion = (index) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index ? { ...q, isExpanded: !q.isExpanded } : q,
      ),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev.map((q) => ({ ...q, isExpanded: false })),
      emptyQuestion(),
    ]);
  };

  const removeQuestion = (index, e) => {
    e.stopPropagation();
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
      notifyInfo("Please complete all test settings.", "Missing details");
      return;
    }
    const questionError = validateQuestions();
    if (questionError) {
      notifyInfo(questionError, "Question validation");
      return;
    }

    setCreating(true);
    try {
      const formattedQuestions = questions.map((q) => {
        const answerIndex =
          q.correct_option === "A"
            ? 0
            : q.correct_option === "B"
              ? 1
              : q.correct_option === "C"
                ? 2
                : 3;
        return {
          text: q.question_text.trim(),
          options: [
            q.option_a.trim(),
            q.option_b.trim(),
            q.option_c.trim(),
            q.option_d.trim(),
          ],
          answer: answerIndex,
        };
      });

      const payload = {
        title: formData.title.trim(),
        subject_id: Number(formData.subject_id),
        duration_minutes: Number(formData.duration_minutes),
        instructions:
          formData.instructions?.trim() || "No instructions provided.",
        questions: formattedQuestions,
      };

      const res = await apiFetch("/cbt", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.message || data.error || "Failed to create CBT test.");
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
      notifyError("Something went wrong while creating the test.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!testId) {
      notifyError("Cannot identify test ID. Deletion failed.");
      return;
    }

    const confirmed = await confirm({
      title: "Delete Exam",
      message:
        "Are you sure you want to permanently delete this exam? All student submissions tied to this test will also be lost.",
      confirmText: "Delete Exam",
      cancelText: "Cancel",
      tone: "danger",
    });

    if (!confirmed) return;

    setDeletingTestId(testId);
    try {
      const res = await apiFetch(`/cbt/${testId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.error || data.message || "Failed to delete exam.");
        return;
      }

      notifySuccess("Exam deleted successfully.");
      setSelectedTest(null);
      await fetchTests();
    } catch (error) {
      notifyError("Something went wrong while deleting the exam.");
    } finally {
      setDeletingTestId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {canManage && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                  Exam Settings
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Configure core test details.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Test Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Term Examination"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={creating}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Subject
                </label>
                <div className="relative">
                  <select
                    value={formData.subject_id}
                    onChange={(e) =>
                      setFormData({ ...formData, subject_id: e.target.value })
                    }
                    className="w-full appearance-none cursor-pointer px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    disabled={creating}
                    required
                  >
                    <option value="" disabled>
                      Select subject
                    </option>
                    {subjects.map((subject) => (
                      <option
                        key={subject.subject_id}
                        value={subject.subject_id}
                      >
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock3
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="45"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    disabled={creating}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Instructions (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Read all questions carefully..."
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                  disabled={creating}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 shadow-md shadow-violet-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Building Exam...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Publish Test
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-8 bg-gray-50 dark:bg-gray-800/40 p-5 md:p-6 rounded-[2rem] border border-gray-200 dark:border-gray-700/50 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Questions Builder
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  Draft questions and click a letter to mark it correct.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                disabled={creating}
                className="inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-gray-700 text-sm font-bold shadow-sm transition-all disabled:opacity-60"
              >
                <PlusCircle size={16} /> Add Question
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm group transition-all hover:border-violet-300 dark:hover:border-violet-700 overflow-hidden"
                >
                  <div
                    onClick={() => toggleQuestionAccordion(index)}
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1 text-gray-400 shrink-0">
                        {question.isExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                      <h5 className="font-black text-sm uppercase tracking-widest text-gray-700 dark:text-gray-300 shrink-0">
                        Question {index + 1}
                      </h5>
                      {!question.isExpanded && question.question_text && (
                        <span className="truncate text-sm text-gray-500 dark:text-gray-400 ml-2 hidden sm:block">
                          - {question.question_text}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeQuestion(index, e)}
                      disabled={questions.length === 1 || creating}
                      className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />{" "}
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  {question.isExpanded && (
                    <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 animate-fade-in">
                      <textarea
                        rows="2"
                        placeholder="Type your question here..."
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(index, "question_text", e.target.value)
                        }
                        className="w-full px-4 py-3 mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                        disabled={creating}
                        required
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SmartOption
                          letter="A"
                          value={question.option_a}
                          isCorrect={question.correct_option === "A"}
                          onChange={(e) =>
                            updateQuestion(index, "option_a", e.target.value)
                          }
                          onMarkCorrect={() =>
                            updateQuestion(index, "correct_option", "A")
                          }
                          disabled={creating}
                        />
                        <SmartOption
                          letter="B"
                          value={question.option_b}
                          isCorrect={question.correct_option === "B"}
                          onChange={(e) =>
                            updateQuestion(index, "option_b", e.target.value)
                          }
                          onMarkCorrect={() =>
                            updateQuestion(index, "correct_option", "B")
                          }
                          disabled={creating}
                        />
                        <SmartOption
                          letter="C"
                          value={question.option_c}
                          isCorrect={question.correct_option === "C"}
                          onChange={(e) =>
                            updateQuestion(index, "option_c", e.target.value)
                          }
                          onMarkCorrect={() =>
                            updateQuestion(index, "correct_option", "C")
                          }
                          disabled={creating}
                        />
                        <SmartOption
                          letter="D"
                          value={question.option_d}
                          isCorrect={question.correct_option === "D"}
                          onChange={(e) =>
                            updateQuestion(index, "option_d", e.target.value)
                          }
                          onMarkCorrect={() =>
                            updateQuestion(index, "correct_option", "D")
                          }
                          disabled={creating}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ACTIVE EXAMS LIST */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-5">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <FileCheck2 size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Active CBT Exams
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              View created tests and their configurations.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading exams...
          </div>
        ) : tests.length === 0 ? (
          <PremiumEmptyState
            icon={FileCheck2}
            title="No CBT tests yet"
            description="Created tests will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tests.map((test, index) => {
              const testId = getTestId(test);
              const duration = getDuration(test);
              const format = getFormat(test);

              return (
                <div
                  key={testId || index}
                  onClick={() => setSelectedTest(test)}
                  role="button"
                  tabIndex={0}
                  className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-xl hover:border-violet-300 dark:hover:border-violet-600 transition-all cursor-pointer group hover:-translate-y-1 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      <FileCheck2 size={20} />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 shadow-sm">
                      Ready
                    </span>
                  </div>

                  <h4
                    className="font-black text-lg text-gray-900 dark:text-white leading-tight mb-3 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"
                    title={test.title}
                  >
                    {test.title}
                  </h4>

                  <div className="space-y-2.5 mt-4">
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <BookOpen
                        size={16}
                        className="mr-2.5 text-gray-400 dark:text-gray-500 shrink-0"
                      />
                      <span className="truncate">
                        {test.subject_name || "General Subject"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Clock3
                        size={16}
                        className="mr-2.5 text-gray-400 dark:text-gray-500 shrink-0"
                      />
                      <span>
                        {duration ? `${duration} Minutes` : "Untimed"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <ListChecks
                        size={16}
                        className="mr-2.5 text-gray-400 dark:text-gray-500 shrink-0"
                      />
                      <span className="truncate">{format}</span>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 dark:from-gray-800 dark:via-gray-800/80 to-transparent p-5 pt-12 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out flex items-end">
                    <div className="w-full flex items-center justify-between text-violet-600 dark:text-violet-400 font-bold text-sm">
                      View Details <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 100% PRO: Drop Z-index to 50 so toasts float above it! */}
      {selectedTest && (
        <div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedTest(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-gray-900 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="pr-4 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 shadow-sm">
                    Active Exam
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                    <BookOpen size={12} className="shrink-0" />{" "}
                    {selectedTest.subject_name || "General Subject"}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                  {selectedTest.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTest(null)}
                className="p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white rounded-full transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Robust Duration Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Clock3 size={16} />{" "}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Duration
                    </span>
                  </div>
                  <p className="text-lg font-black text-gray-900 dark:text-white truncate">
                    {getDuration(selectedTest)
                      ? `${getDuration(selectedTest)} Mins`
                      : "Untimed"}
                  </p>
                </div>

                {/* Robust Question Count Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <HelpCircle size={16} />{" "}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Total Questions
                    </span>
                  </div>
                  <p className="text-lg font-black text-gray-900 dark:text-white truncate">
                    {getQCount(selectedTest)} Questions
                  </p>
                </div>

                {/* Format Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <ListChecks size={16} />{" "}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Format
                    </span>
                  </div>
                  <p className="text-lg font-black text-gray-900 dark:text-white truncate">
                    {getFormat(selectedTest)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                  Instructions
                </h4>
                <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed shadow-inner whitespace-pre-wrap">
                  {getInstructions(selectedTest)}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-gray-200 p-5 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              {canManage ? (
                <button
                  onClick={() => handleDeleteTest(getTestId(selectedTest))}
                  disabled={deletingTestId === getTestId(selectedTest)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 border border-red-100 dark:border-red-900/30 shadow-sm"
                >
                  {deletingTestId === getTestId(selectedTest) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete Exam
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <button
                onClick={() => setSelectedTest(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md hover:shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
