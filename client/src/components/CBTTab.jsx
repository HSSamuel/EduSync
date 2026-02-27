import React, { useState, useEffect } from "react";

const CBTTab = ({ isTeacher, isAdmin, isStudent, subjects }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null); // When a student is taking a quiz

  // Teacher Form State
  const [newQuiz, setNewQuiz] = useState({ subject_id: "", title: "" });
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], answer: 0 },
  ]);

  // Student Test State
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

  // --- TEACHER ACTIONS ---
  const addQuestionField = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], answer: 0 },
    ]);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/cbt", {
      method: "POST",
      headers: { "Content-Type": "application/json", jwt_token: token },
      body: JSON.stringify({ ...newQuiz, questions }),
    });
    if (res.ok) {
      alert("✅ Quiz Created!");
      setNewQuiz({ subject_id: "", title: "" });
      setQuestions([{ text: "", options: ["", "", "", ""], answer: 0 }]);
      fetchQuizzes();
    }
  };

  // --- STUDENT ACTIONS ---
  const startQuiz = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/cbt/${id}`, {
      headers: { jwt_token: token },
    });
    if (res.ok) {
      setActiveQuiz(await res.json());
      setStudentAnswers({});
      setTestResult(null);
    }
  };

  const submitQuiz = async () => {
    if (
      !window.confirm("Submit your answers? You cannot change them after this.")
    )
      return;

    // Convert object {0: 1, 1: 3} to array [1, 3] matching question order
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
      const result = await res.json();
      setTestResult(result);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* --- TEACHER: QUIZ CREATOR --- */}
      {(isTeacher || isAdmin) && !activeQuiz && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
          <h4 className="text-xl font-bold mb-4 text-purple-800 dark:text-purple-400">
            📝 Create New CBT Quiz
          </h4>
          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 flex-1"
                value={newQuiz.subject_id}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, subject_id: e.target.value })
                }
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Quiz Title (e.g., Midterm Exam)"
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 flex-1"
                value={newQuiz.title}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-4 mt-6">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <input
                    type="text"
                    placeholder={`Question ${qIndex + 1}`}
                    className="w-full px-4 py-2 mb-3 border rounded-lg font-bold dark:bg-gray-700"
                    value={q.text}
                    onChange={(e) => {
                      const newQ = [...questions];
                      newQ[qIndex].text = e.target.value;
                      setQuestions(newQ);
                    }}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.answer === oIndex}
                          onChange={() => {
                            const newQ = [...questions];
                            newQ[qIndex].answer = oIndex;
                            setQuestions(newQ);
                          }}
                        />
                        <input
                          type="text"
                          placeholder={`Option ${oIndex + 1}`}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 text-sm"
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
                  <p className="text-xs text-purple-600 mt-2 font-bold">
                    ^ Select the radio button next to the correct answer.
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={addQuestionField}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition-colors"
              >
                + Add Question
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 shadow-md"
              >
                Publish Quiz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- STUDENT: TAKING THE QUIZ --- */}
      {isStudent && activeQuiz && !testResult && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-t-4 border-purple-600">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-black">{activeQuiz.title}</h2>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-red-500 font-bold hover:underline"
            >
              Exit Quiz
            </button>
          </div>

          <div className="space-y-8">
            {activeQuiz.questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <p className="text-lg font-bold mb-4">
                  {qIndex + 1}. {q.text}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oIndex) => (
                    <label
                      key={oIndex}
                      className="flex items-center gap-3 p-3 rounded border hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`student-answer-${qIndex}`}
                        className="w-5 h-5 text-purple-600"
                        onChange={() =>
                          setStudentAnswers({
                            ...studentAnswers,
                            [qIndex]: oIndex,
                          })
                        }
                      />
                      <span className="text-md">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitQuiz}
            className="mt-8 w-full py-4 bg-green-600 text-white text-xl font-black rounded-xl hover:bg-green-700 shadow-xl transform transition hover:-translate-y-1"
          >
            Submit Exam for Auto-Grading
          </button>
        </div>
      )}

      {/* --- STUDENT: TEST RESULT --- */}
      {testResult && (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl text-center border-t-8 border-green-500 animate-bounce-in">
          <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-2">
            Quiz Complete!
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            The system has automatically graded your exam.
          </p>

          <div className="inline-block p-8 rounded-full bg-green-100 dark:bg-green-900/30 border-4 border-green-400 mb-8">
            <span className="text-6xl font-black text-green-600 dark:text-green-400">
              {testResult.score} / {testResult.total}
            </span>
          </div>

          <div>
            <button
              onClick={() => {
                setTestResult(null);
                setActiveQuiz(null);
              }}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      )}

      {/* --- GLOBAL: QUIZ LIST --- */}
      {!activeQuiz && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
          <h4 className="text-xl font-bold mb-4 dark:text-white">
            📚 Available Quizzes
          </h4>
          {quizzes.length === 0 ? (
            <p className="text-gray-500 italic">
              No quizzes have been published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className="p-5 border rounded-lg bg-gray-50 dark:bg-gray-900 flex justify-between items-center hover:border-purple-400 transition-colors"
                >
                  <div>
                    <h5 className="font-bold text-lg">{quiz.title}</h5>
                    <p className="text-sm text-gray-500 font-semibold">
                      {quiz.subject_name}
                    </p>
                  </div>
                  {isStudent && (
                    <button
                      onClick={() => startQuiz(quiz.quiz_id)}
                      className="px-4 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700"
                    >
                      Start Test
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
