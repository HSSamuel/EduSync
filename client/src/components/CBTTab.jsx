import React, { useState, useEffect } from "react";
import { BrainCircuit, Plus, PlayCircle, Award, ArrowLeft, CheckCircle2, CircleDashed, FileQuestion } from "lucide-react";

const CBTTab = ({ isTeacher, isAdmin, isStudent, subjects }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);

  const [newQuiz, setNewQuiz] = useState({ subject_id: "", title: "" });
  const [questions, setQuestions] = useState([{ text: "", options: ["", "", "", ""], answer: 0 }]);

  const [studentAnswers, setStudentAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/cbt", { headers: { jwt_token: token } });
    if (res.ok) setQuizzes(await res.json());
  };

  const addQuestionField = () => setQuestions([...questions, { text: "", options: ["", "", "", ""], answer: 0 }]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/cbt", {
      method: "POST", headers: { "Content-Type": "application/json", jwt_token: token },
      body: JSON.stringify({ ...newQuiz, questions })
    });
    if (res.ok) {
      alert("✅ Quiz Created!");
      setNewQuiz({ subject_id: "", title: "" });
      setQuestions([{ text: "", options: ["", "", "", ""], answer: 0 }]);
      fetchQuizzes();
    }
  };

  const startQuiz = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/cbt/${id}`, { headers: { jwt_token: token } });
    if (res.ok) {
      setActiveQuiz(await res.json());
      setStudentAnswers({});
      setTestResult(null);
    }
  };

  const submitQuiz = async () => {
    if (!window.confirm("Submit your answers? You cannot change them after this.")) return;
    const answerArray = activeQuiz.questions.map((_, index) => studentAnswers[index] ?? null);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/cbt/${activeQuiz.quiz_id}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json", jwt_token: token },
      body: JSON.stringify({ student_answers: answerArray })
    });
    if (res.ok) setTestResult(await res.json());
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* --- TEACHER: QUIZ CREATOR --- */}
      {(isTeacher || isAdmin) && !activeQuiz && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="p-2.5 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Create Assessment</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Design automated multiple-choice tests.</p>
            </div>
          </div>

          <form onSubmit={handleCreateQuiz} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <select className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all text-sm font-medium flex-1 cursor-pointer" value={newQuiz.subject_id} onChange={(e) => setNewQuiz({...newQuiz, subject_id: e.target.value})} required>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
              </select>
              <input type="text" placeholder="Assessment Title (e.g., Midterm Exam)" className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all text-sm font-medium flex-1" value={newQuiz.title} onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})} required />
            </div>

            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-gray-50/50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 relative">
                  <div className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-black px-2.5 py-1 rounded-md">Q{qIndex + 1}</div>
                  <input type="text" placeholder="Type your question here..." className="w-full md:w-5/6 px-4 py-3 mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all" value={q.text} onChange={(e) => { const newQ = [...questions]; newQ[qIndex].text = e.target.value; setQuestions(newQ); }} required />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${q.answer === oIndex ? "bg-fuchsia-50 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:border-fuchsia-700" : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"}`}>
                        <div className="cursor-pointer" onClick={() => { const newQ = [...questions]; newQ[qIndex].answer = oIndex; setQuestions(newQ); }}>
                          {q.answer === oIndex ? <CheckCircle2 className="text-fuchsia-600 dark:text-fuchsia-400" size={20} /> : <CircleDashed className="text-gray-300 dark:text-gray-600" size={20} />}
                        </div>
                        <input type="text" placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} className="w-full bg-transparent border-none focus:outline-none text-sm font-medium dark:text-white" value={opt} onChange={(e) => { const newQ = [...questions]; newQ[qIndex].options[oIndex] = e.target.value; setQuestions(newQ); }} required />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button type="button" onClick={addQuestionField} className="flex-1 py-3.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> Add Question
              </button>
              <button type="submit" className="flex-1 py-3.5 bg-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/30 hover:bg-fuchsia-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                Publish Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- STUDENT: TAKING THE QUIZ --- */}
      {isStudent && activeQuiz && !testResult && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <span className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest bg-fuchsia-50 dark:bg-fuchsia-900/30 px-3 py-1 rounded-full mb-2 inline-block">Live Exam</span>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">{activeQuiz.title}</h2>
            </div>
            <button onClick={() => setActiveQuiz(null)} className="text-gray-500 hover:text-red-500 font-bold flex items-center gap-2 transition-colors bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm">
              <ArrowLeft size={16} /> Exit
            </button>
          </div>

          <div className="space-y-8">
            {activeQuiz.questions.map((q, qIndex) => (
              <div key={qIndex} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 leading-relaxed">
                  <span className="text-fuchsia-500 mr-2">{qIndex + 1}.</span> {q.text}
                </p>
                <div className="space-y-3">
                  {q.options.map((opt, oIndex) => {
                    const isSelected = studentAnswers[qIndex] === oIndex;
                    return (
                      <label key={oIndex} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 dark:border-fuchsia-500" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-fuchsia-300 dark:hover:border-fuchsia-700"}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-fuchsia-500" : "border-gray-300 dark:border-gray-600"}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full"></div>}
                        </div>
                        <input type="radio" name={`student-answer-${qIndex}`} className="hidden" onChange={() => setStudentAnswers({...studentAnswers, [qIndex]: oIndex})} />
                        <span className={`text-md font-medium ${isSelected ? "text-fuchsia-900 dark:text-fuchsia-100" : "text-gray-700 dark:text-gray-300"}`}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button onClick={submitQuiz} className="w-full py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xl font-black rounded-2xl hover:shadow-xl transform transition hover:-translate-y-1">
              Submit Assessment
            </button>
          </div>
        </div>
      )}

      {/* --- STUDENT: TEST RESULT --- */}
      {testResult && (
        <div className="max-w-2xl mx-auto bg-gradient-to-b from-white to-green-50 dark:from-gray-800 dark:to-green-900/10 p-10 md:p-16 rounded-3xl shadow-2xl text-center border border-green-100 dark:border-green-900/50 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          
          <Award size={80} className="mx-auto text-green-500 drop-shadow-md mb-6" />
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Assessment Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-10">Your responses have been automatically graded.</p>
          
          <div className="inline-block p-1 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-10 shadow-lg shadow-green-500/30">
            <div className="bg-white dark:bg-gray-900 rounded-full w-48 h-48 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-emerald-600">{testResult.score}</span>
              <span className="text-gray-400 font-bold text-xl mt-1">/ {testResult.total}</span>
            </div>
          </div>
          
          <div>
            <button onClick={() => { setTestResult(null); setActiveQuiz(null); }} className="px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-800 dark:hover:bg-white transition-all shadow-md">
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* --- GLOBAL: QUIZ LIST --- */}
      {!activeQuiz && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <FileQuestion className="text-fuchsia-500" size={20} /> Available Assessments
          </h4>
          
          {quizzes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <CircleDashed size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 font-medium">No assessments currently active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {quizzes.map(quiz => (
                <div key={quiz.quiz_id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 flex justify-between items-center hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:shadow-md transition-all group">
                  <div>
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">{quiz.subject_name}</span>
                    <h5 className="font-bold text-lg text-gray-900 dark:text-white">{quiz.title}</h5>
                  </div>
                  {isStudent && (
                    <button onClick={() => startQuiz(quiz.quiz_id)} className="px-5 py-2.5 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 font-bold rounded-xl group-hover:bg-fuchsia-600 group-hover:text-white transition-all flex items-center gap-2">
                      <PlayCircle size={18} /> Start
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