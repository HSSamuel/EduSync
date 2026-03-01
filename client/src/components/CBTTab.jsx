import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Plus,
  PlayCircle,
  Award,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  FileQuestion,
  Focus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CBTTab = ({ isTeacher, isAdmin, isStudent, subjects }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);

  const [newQuiz, setNewQuiz] = useState({ subject_id: "", title: "" });
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], answer: 0 },
  ]);

  const [studentAnswers, setStudentAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/cbt", {
      headers: { jwt_token: token },
    });
    if (res.ok) setQuizzes(await res.json());
  };

  const addQuestionField = () =>
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], answer: 0 },
    ]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/cbt", {
      method: "POST",
      headers: { "Content-Type": "application/json", jwt_token: token },
      body: JSON.stringify({ ...newQuiz, questions }),
    });
    if (res.ok) {
      alert("✅ Assessment Published Successfully!");
      setNewQuiz({ subject_id: "", title: "" });
      setQuestions([{ text: "", options: ["", "", "", ""], answer: 0 }]);
      fetchQuizzes();
    }
  };

  const startQuiz = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/cbt/${id}`, {
      headers: { jwt_token: token },
    });
    if (res.ok) {
      setActiveQuiz(await res.json());
      setStudentAnswers({});
      setTestResult(null);
      // Optional: Request full screen on browser
      if (document.documentElement.requestFullscreen) {
        document.documentElement
          .requestFullscreen()
          .catch((e) => console.log("Fullscreen denied", e));
      }
    }
  };

  const submitQuiz = async () => {
    if (
      !window.confirm("Submit your answers? You cannot change them after this.")
    )
      return;
    const answerArray = activeQuiz.questions.map(
      (_, index) => studentAnswers[index] ?? null,
    );
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/cbt/${activeQuiz.quiz_id}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({ student_answers: answerArray }),
      },
    );
    if (res.ok) {
      setTestResult(await res.json());
      if (document.fullscreenElement) document.exitFullscreen();
    }
  };

  const handleExitQuiz = () => {
    if (
      window.confirm(
        "Are you sure you want to exit? Your progress will be lost.",
      )
    ) {
      setActiveQuiz(null);
      if (document.fullscreenElement) document.exitFullscreen();
    }
  };

  // Calculate Progress for Focus Mode
  const totalQuestions = activeQuiz?.questions?.length || 0;
  const answeredQuestions = Object.keys(studentAnswers).length;
  const progressPercentage =
    totalQuestions === 0 ? 0 : (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="animate-fade-in space-y-8 relative">
      {/* --- TEACHER: QUIZ CREATOR --- */}
      {(isTeacher || isAdmin) && !activeQuiz && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-gray-200/60 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="p-2.5 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black font-serif text-gray-900 dark:text-white tracking-tight">
                Create Assessment
              </h4>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Design automated multiple-choice tests.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateQuiz} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <select
                className="px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all text-sm font-bold flex-1 cursor-pointer"
                value={newQuiz.subject_id}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, subject_id: e.target.value })
                }
                required
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Assessment Title (e.g., Midterm Exam)"
                className="px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all text-sm font-bold flex-1"
                value={newQuiz.title}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 relative group transition-all hover:border-fuchsia-300 dark:hover:border-fuchsia-700"
                >
                  <div className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-black px-2.5 py-1 rounded-md">
                    Q{qIndex + 1}
                  </div>
                  <input
                    type="text"
                    placeholder="Type your question here..."
                    className="w-full md:w-5/6 px-4 py-3 mb-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all shadow-sm"
                    value={q.text}
                    onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].text = e.target.value;
                      setQuestions(newQ);
                    }}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${q.answer === oIndex ? "bg-fuchsia-50 border-fuchsia-400 dark:bg-fuchsia-900/20 dark:border-fuchsia-600" : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"}`}
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            const newQ = [...questions];
                            newQ[qIndex].answer = oIndex;
                            setQuestions(newQ);
                          }}
                        >
                          {q.answer === oIndex ? (
                            <CheckCircle2
                              className="text-fuchsia-600 dark:text-fuchsia-400"
                              size={20}
                            />
                          ) : (
                            <CircleDashed
                              className="text-gray-300 dark:text-gray-600 hover:text-fuchsia-400 transition-colors"
                              size={20}
                            />
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className="w-full bg-transparent border-none focus:outline-none text-sm font-medium dark:text-white"
                          value={opt}
                          onChange={(e) => {
                            const newQ = [...questions];
                            newQ[qIndex].options[oIndex] = e.target.value;
                            setQuestions(newQ);
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="button"
                onClick={addQuestionField}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Question
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/30 hover:bg-fuchsia-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Publish Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- STUDENT: TAKING THE QUIZ (FOCUS MODE OVERLAY) --- */}
      <AnimatePresence>
        {isStudent && activeQuiz && !testResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 overflow-y-auto flex flex-col"
          >
            {/* Focus Mode Topbar */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/50 shadow-sm">
              <div className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                    <Focus size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-serif text-gray-900 dark:text-white leading-tight">
                      {activeQuiz.title}
                    </h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {activeQuiz.subject_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {answeredQuestions} / {totalQuestions} Answered
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Focus Mode Active
                    </span>
                  </div>
                  <button
                    onClick={handleExitQuiz}
                    className="text-gray-500 hover:text-red-600 font-bold flex items-center gap-2 transition-colors bg-gray-100 hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm"
                  >
                    <ArrowLeft size={16} /> Exit
                  </button>
                </div>
              </div>

              {/* Live Progress Bar */}
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all duration-500 ease-out rounded-r-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </header>

            {/* Questions Canvas */}
            <main className="flex-1 w-full max-w-4xl mx-auto py-12 px-4 md:px-8 space-y-8">
              {activeQuiz.questions.map((q, qIndex) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIndex * 0.1 }}
                  key={qIndex}
                  className="p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] border border-gray-200/60 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4 mb-6">
                    <span className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 font-black text-sm">
                      {qIndex + 1}
                    </span>
                    <p className="text-xl font-bold font-serif text-gray-900 dark:text-gray-100 leading-relaxed mt-0.5">
                      {q.text}
                    </p>
                  </div>

                  <div className="space-y-3 pl-0 md:pl-12">
                    {q.options.map((opt, oIndex) => {
                      const isSelected = studentAnswers[qIndex] === oIndex;
                      return (
                        <label
                          key={oIndex}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:-translate-y-0.5 ${isSelected ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 dark:border-fuchsia-500 shadow-sm" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-fuchsia-300 dark:hover:border-fuchsia-700"}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-fuchsia-500" : "border-gray-300 dark:border-gray-600"}`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId={`dot-${qIndex}`}
                                className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full"
                              ></motion.div>
                            )}
                          </div>
                          <input
                            type="radio"
                            name={`student-answer-${qIndex}`}
                            className="hidden"
                            onChange={() =>
                              setStudentAnswers({
                                ...studentAnswers,
                                [qIndex]: oIndex,
                              })
                            }
                          />
                          <span
                            className={`text-base font-medium ${isSelected ? "text-fuchsia-900 dark:text-fuchsia-100 font-bold" : "text-gray-700 dark:text-gray-300"}`}
                          >
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              <div className="pt-8 pb-16 flex justify-end">
                <button
                  onClick={submitQuiz}
                  disabled={answeredQuestions < totalQuestions}
                  className={`px-10 py-4 font-black rounded-2xl shadow-xl transform transition-all flex items-center gap-2 ${answeredQuestions < totalQuestions ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500" : "bg-gray-900 text-white hover:-translate-y-1 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"}`}
                >
                  <CheckCircle2 size={20} />
                  {answeredQuestions < totalQuestions
                    ? "Answer all questions to submit"
                    : "Submit Assessment"}
                </button>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STUDENT: TEST RESULT --- */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto bg-gradient-to-b from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/10 p-10 md:p-16 rounded-[2.5rem] shadow-2xl text-center border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

          <Award
            size={80}
            className="mx-auto text-emerald-500 drop-shadow-md mb-6"
          />
          <h2 className="text-4xl font-black font-serif text-gray-900 dark:text-white mb-3 tracking-tight">
            Assessment Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg mb-10">
            Your responses have been securely graded and recorded.
          </p>

          <div className="inline-block p-1.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-10 shadow-lg shadow-emerald-500/30">
            <div className="bg-white dark:bg-gray-900 rounded-full w-48 h-48 flex flex-col items-center justify-center">
              <span className="text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600">
                {testResult.score}
              </span>
              <span className="text-gray-400 font-bold text-xl mt-1 font-sans">
                / {testResult.total}
              </span>
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                setTestResult(null);
                setActiveQuiz(null);
              }}
              className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md transform hover:-translate-y-0.5"
            >
              Return to Dashboard
            </button>
          </div>
        </motion.div>
      )}

      {/* --- GLOBAL: QUIZ LIST --- */}
      {!activeQuiz && !testResult && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/60 dark:border-gray-700/50">
          <h4 className="text-xl font-black font-serif mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <FileQuestion className="text-fuchsia-500" size={24} /> Available
            Assessments
          </h4>

          {quizzes.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
              <CircleDashed
                size={48}
                className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
              />
              <p className="text-gray-500 font-medium">
                No active assessments found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className="p-6 border border-gray-200/80 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:shadow-md transition-all group gap-4"
                >
                  <div>
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">
                      {quiz.subject_name}
                    </span>
                    <h5 className="font-bold font-serif text-lg text-gray-900 dark:text-white">
                      {quiz.title}
                    </h5>
                  </div>
                  {isStudent && (
                    <button
                      onClick={() => startQuiz(quiz.quiz_id)}
                      className="w-full sm:w-auto px-6 py-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 font-bold rounded-xl group-hover:bg-fuchsia-600 group-hover:text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <PlayCircle size={18} /> Enter Exam
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CBTTab;
