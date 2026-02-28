import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Award, FileDown, PlusCircle, Check, X, Edit3, UserSearch } from "lucide-react";

const GradesTab = ({ isAdmin, isTeacher, isParent, students, subjects }) => {
  const [gradeForm, setGradeForm] = useState({
    student_id: "", subject_id: "", academic_term: "", test_score: "", exam_score: "",
  });
  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const [reportCard, setReportCard] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editScores, setEditScores] = useState({ test_score: "", exam_score: "" });
  const [myChildren, setMyChildren] = useState([]);

  useEffect(() => {
    if (!isAdmin && !isTeacher && !isParent) fetchMyReportCard();
    if (isParent) {
      const fetchChildren = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("http://localhost:5000/api/students/my-children", { headers: { jwt_token: token } });
          if (response.ok) setMyChildren(await response.json());
        } catch (err) { console.error(err); }
      };
      fetchChildren();
    }
  }, [isAdmin, isTeacher, isParent]);

  const fetchMyReportCard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/results/me", { headers: { jwt_token: token } });
      if (response.ok) setReportCard(await response.json());
    } catch (err) { console.error(err.message); }
  };

  const fetchAdminReportCard = async (student_id) => {
    if (!student_id) return setReportCard([]);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/results/student/${student_id}`, { headers: { jwt_token: token } });
      if (response.ok) setReportCard(await response.json());
    } catch (err) { console.error(err.message); }
  };

  const handleStudentSelect = (e) => {
    const id = e.target.value;
    setSelectedReportStudent(id);
    fetchAdminReportCard(id);
    setEditingId(null);
  };

  const onSubmitGrade = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/results", {
        method: "POST", headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify(gradeForm),
      });
      if (response.ok) {
        setGradeForm({ student_id: "", subject_id: "", academic_term: "", test_score: "", exam_score: "" });
        if (selectedReportStudent === gradeForm.student_id) fetchAdminReportCard(gradeForm.student_id);
      } else alert("❌ Error saving grade.");
    } catch (err) { console.error(err.message); }
  };

  const startEditing = (result) => {
    setEditingId(result.result_id);
    setEditScores({ test_score: result.test_score, exam_score: result.exam_score });
  };
  
  const cancelEditing = () => {
    setEditingId(null);
    setEditScores({ test_score: "", exam_score: "" });
  };

  const saveEdit = async (result_id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/results/${result_id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify(editScores),
      });
      if (response.ok) {
        setEditingId(null);
        fetchAdminReportCard(selectedReportStudent);
      }
    } catch (err) { console.error(err.message); }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      let studentName = "My";
      if ((isAdmin || isTeacher || isParent) && selectedReportStudent) {
        const sourceList = isParent ? myChildren : students;
        const student = sourceList.find((s) => s.student_id.toString() === selectedReportStudent.toString());
        if (student) studentName = student.full_name;
      }
      doc.setFontSize(22);
      doc.setTextColor(147, 51, 234);
      doc.text("EduSync Official Report Card", 14, 22);
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text(`Name: ${studentName}`, 14, 32);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 40);
      const tableRows = reportCard.map(row => [row.subject_name, row.academic_term, row.test_score, row.exam_score, row.total_score]);
      autoTable(doc, {
        head: [["Subject", "Term", "Test Score", "Exam Score", "Total (%)"]],
        body: tableRows, startY: 48, theme: "striped", headStyles: { fillColor: [147, 51, 234] }, styles: { fontSize: 11 },
      });
      doc.save(`${studentName.replace(/\s+/g, "_")}_ReportCard.pdf`);
    } catch (err) { console.error("PDF Generation Error: ", err); }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Grade Entry Form (Sleek Grid) */}
      {(isAdmin || isTeacher) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <PlusCircle size={20} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Record Academic Result</h4>
          </div>
          
          <form onSubmit={onSubmitGrade} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select required className="md:col-span-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" value={gradeForm.student_id} onChange={(e) => setGradeForm({ ...gradeForm, student_id: e.target.value })}>
              <option value="">Select Student...</option>
              {students.map((s) => <option key={s.student_id} value={s.student_id}>{s.full_name}</option>)}
            </select>
            <select required className="md:col-span-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" value={gradeForm.subject_id} onChange={(e) => setGradeForm({ ...gradeForm, subject_id: e.target.value })}>
              <option value="">Select Subject...</option>
              {subjects.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
            </select>
            <input type="text" placeholder="Term (e.g. T1)" required className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" value={gradeForm.academic_term} onChange={(e) => setGradeForm({ ...gradeForm, academic_term: e.target.value })} />
            
            <div className="md:col-span-2 relative">
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold text-xs">/ 40</span>
              <input type="number" step="0.01" max="40" placeholder="Test Score" required className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" value={gradeForm.test_score} onChange={(e) => setGradeForm({ ...gradeForm, test_score: e.target.value })} />
            </div>
            <div className="md:col-span-2 relative">
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold text-xs">/ 60</span>
              <input type="number" step="0.01" max="60" placeholder="Exam Score" required className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium" value={gradeForm.exam_score} onChange={(e) => setGradeForm({ ...gradeForm, exam_score: e.target.value })} />
            </div>
            <button type="submit" className="md:col-span-1 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl shadow-md shadow-purple-500/30 hover:bg-purple-700 hover:-translate-y-0.5 transition-all">
              Save Grade
            </button>
          </form>
        </div>
      )}

      {/* Report Card Viewer */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        
        {/* Header Actions */}
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Award size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {isAdmin || isTeacher ? "Official Transcript" : isParent ? "Child's Report Card" : "My Report Card"}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Digital Academic Records</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
            {/* Student Selector (If Admin/Teacher/Parent) */}
            {(isAdmin || isTeacher || isParent) && (
              <div className="relative w-full sm:w-64">
                <UserSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold cursor-pointer transition-all" value={selectedReportStudent} onChange={handleStudentSelect}>
                  <option value="">Select Student...</option>
                  {(isParent ? myChildren : students).map((s) => (
                    <option key={s.student_id} value={s.student_id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {reportCard.length > 0 && (
              <button onClick={downloadPDF} className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-md hover:bg-gray-800 dark:hover:bg-white hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm">
                <FileDown size={18} /> Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Data Grid */}
        {((isAdmin || isTeacher || isParent) && !selectedReportStudent) ? (
          <div className="p-12 text-center text-gray-400">
             <UserSearch size={48} className="mx-auto mb-4 opacity-50" />
             <p className="font-medium">Please select a student to view their transcript.</p>
          </div>
        ) : reportCard.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
             <p className="font-medium italic">No academic records found for this student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-6 md:p-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-bold">Subject</th>
                  <th className="pb-3 font-bold">Term</th>
                  <th className="pb-3 font-bold text-center">Test (/40)</th>
                  <th className="pb-3 font-bold text-center">Exam (/60)</th>
                  <th className="pb-3 font-black text-indigo-600 dark:text-indigo-400 text-center">Total (%)</th>
                  {(isAdmin || isTeacher) && <th className="pb-3 font-bold text-right pr-4">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {reportCard.map((row) => (
                  <tr key={row.result_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 font-bold text-gray-900 dark:text-white">{row.subject_name}</td>
                    <td className="py-4 text-sm font-semibold text-gray-500">{row.academic_term}</td>

                    {editingId === row.result_id ? (
                      <>
                        <td className="py-2 text-center">
                          <input type="number" step="0.01" max="40" className="w-16 px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold shadow-inner" value={editScores.test_score} onChange={(e) => setEditScores({ ...editScores, test_score: e.target.value })} />
                        </td>
                        <td className="py-2 text-center">
                          <input type="number" step="0.01" max="60" className="w-16 px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold shadow-inner" value={editScores.exam_score} onChange={(e) => setEditScores({ ...editScores, exam_score: e.target.value })} />
                        </td>
                        <td className="py-4 text-center text-xs text-gray-400 italic">Calculating...</td>
                        <td className="py-4 text-right pr-2 space-x-1">
                          <button onClick={() => saveEdit(row.result_id)} className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors" title="Save"><Check size={16} /></button>
                          <button onClick={cancelEditing} className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors" title="Cancel"><X size={16} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 text-center font-medium text-gray-600 dark:text-gray-300">{row.test_score}</td>
                        <td className="py-4 text-center font-medium text-gray-600 dark:text-gray-300">{row.exam_score}</td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-black ${row.total_score >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {row.total_score}%
                          </span>
                        </td>
                        {(isAdmin || isTeacher) && (
                          <td className="py-4 text-right pr-2">
                            <button onClick={() => startEditing(row)} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Edit Grade">
                              <Edit3 size={16} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesTab;