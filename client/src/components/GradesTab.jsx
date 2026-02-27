import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GradesTab = ({ isAdmin, isTeacher, isParent, students, subjects }) => {
  const [gradeForm, setGradeForm] = useState({
    student_id: "",
    subject_id: "",
    academic_term: "",
    test_score: "",
    exam_score: "",
  });
  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const [reportCard, setReportCard] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editScores, setEditScores] = useState({
    test_score: "",
    exam_score: "",
  });

  // --- NEW: Store the Parent's Children ---
  const [myChildren, setMyChildren] = useState([]);

  useEffect(() => {
    // If Student: Fetch their own grades immediately
    if (!isAdmin && !isTeacher && !isParent) {
      fetchMyReportCard();
    }
    // If Parent: Fetch the list of their children!
    if (isParent) {
      const fetchChildren = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            "http://localhost:5000/api/students/my-children",
            { headers: { jwt_token: token } },
          );
          if (response.ok) setMyChildren(await response.json());
        } catch (err) {
          console.error(err);
        }
      };
      fetchChildren();
    }
  }, [isAdmin, isTeacher, isParent]);

  const fetchMyReportCard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/results/me", {
        headers: { jwt_token: token },
      });
      if (response.ok) setReportCard(await response.json());
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchAdminReportCard = async (student_id) => {
    if (!student_id) {
      setReportCard([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/results/student/${student_id}`,
        { headers: { jwt_token: token } },
      );
      if (response.ok) setReportCard(await response.json());
    } catch (err) {
      console.error(err.message);
    }
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
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify(gradeForm),
      });
      if (response.ok) {
        alert("✅ Grade Successfully Saved!");
        setGradeForm({
          student_id: "",
          subject_id: "",
          academic_term: "",
          test_score: "",
          exam_score: "",
        });
        if (selectedReportStudent === gradeForm.student_id)
          fetchAdminReportCard(gradeForm.student_id);
      } else {
        alert("❌ Error saving grade.");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const startEditing = (result) => {
    setEditingId(result.result_id);
    setEditScores({
      test_score: result.test_score,
      exam_score: result.exam_score,
    });
  };
  const cancelEditing = () => {
    setEditingId(null);
    setEditScores({ test_score: "", exam_score: "" });
  };

  const saveEdit = async (result_id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/results/${result_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", jwt_token: token },
          body: JSON.stringify(editScores),
        },
      );
      if (response.ok) {
        setEditingId(null);
        fetchAdminReportCard(selectedReportStudent);
      } else {
        alert("❌ Failed to update grade.");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      let studentName = "My";

      // Safety check to put the right name on the PDF
      if ((isAdmin || isTeacher || isParent) && selectedReportStudent) {
        // Look in students OR myChildren depending on role
        const sourceList = isParent ? myChildren : students;
        const student = sourceList.find(
          (s) => s.student_id.toString() === selectedReportStudent.toString(),
        );
        if (student) studentName = student.full_name;
      }

      doc.setFontSize(22);
      doc.setTextColor(147, 51, 234);
      doc.text("EduSync Official Report Card", 14, 22);
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text(`Name: ${studentName}`, 14, 32);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 40);

      const tableColumn = [
        "Subject",
        "Term",
        "Test Score",
        "Exam Score",
        "Total (%)",
      ];
      const tableRows = [];
      reportCard.forEach((row) => {
        tableRows.push([
          row.subject_name,
          row.academic_term,
          row.test_score,
          row.exam_score,
          row.total_score,
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        theme: "striped",
        headStyles: { fillColor: [147, 51, 234] },
        styles: { fontSize: 11 },
      });
      doc.save(`${studentName.replace(/\s+/g, "_")}_ReportCard.pdf`);
    } catch (err) {
      console.error("PDF Generation Error: ", err);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {(isAdmin || isTeacher) && (
        <div className="bg-purple-50 dark:bg-gray-700 p-6 rounded-xl border border-purple-100 dark:border-gray-600 shadow-sm">
          <h4 className="text-xl font-bold mb-4 text-purple-800 dark:text-purple-300">
            Input New Grade
          </h4>
          <form
            onSubmit={onSubmitGrade}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <select
              required
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              value={gradeForm.student_id}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, student_id: e.target.value })
              }
            >
              <option value="">Select a Student...</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.full_name}
                </option>
              ))}
            </select>
            <select
              required
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              value={gradeForm.subject_id}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, subject_id: e.target.value })
              }
            >
              <option value="">Select a Subject...</option>
              {subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Term (e.g., Term 1)"
              required
              className="px-4 py-2 border rounded-lg dark:bg-gray-800"
              value={gradeForm.academic_term}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, academic_term: e.target.value })
              }
            />
            <input
              type="number"
              step="0.01"
              max="40"
              placeholder="Test Score (/40)"
              required
              className="px-4 py-2 border rounded-lg dark:bg-gray-800"
              value={gradeForm.test_score}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, test_score: e.target.value })
              }
            />
            <input
              type="number"
              step="0.01"
              max="60"
              placeholder="Exam Score (/60)"
              required
              className="px-4 py-2 border rounded-lg dark:bg-gray-800"
              value={gradeForm.exam_score}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, exam_score: e.target.value })
              }
            />
            <button
              type="submit"
              className="md:col-span-3 mt-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md"
            >
              + Save Grade
            </button>
          </form>
        </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 mb-4 dark:border-gray-700">
          <h4 className="text-xl font-bold">
            {isAdmin || isTeacher
              ? "View Student Report Card"
              : isParent
                ? "Child's Report Card"
                : "My Report Card"}
          </h4>

          {reportCard.length > 0 && (
            <button
              onClick={downloadPDF}
              className="mt-2 md:mt-0 px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-bold rounded shadow hover:bg-gray-700 dark:hover:bg-white"
            >
              📄 Download PDF
            </button>
          )}
        </div>

        {/* ADMIN / TEACHER DROPDOWN */}
        {(isAdmin || isTeacher) && (
          <select
            className="mb-6 px-4 py-2 border rounded-lg w-full md:w-1/2 dark:bg-gray-700 dark:border-gray-600"
            value={selectedReportStudent}
            onChange={handleStudentSelect}
          >
            <option value="">Select a Student...</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.full_name}
              </option>
            ))}
          </select>
        )}

        {/* PARENT DROPDOWN */}
        {isParent && (
          <select
            className="mb-6 px-4 py-2 border rounded-lg w-full md:w-1/2 dark:bg-gray-700 dark:border-gray-600"
            value={selectedReportStudent}
            onChange={handleStudentSelect}
          >
            <option value="">Select your child...</option>
            {myChildren.length === 0 && (
              <option disabled>No children linked yet.</option>
            )}
            {myChildren.map((c) => (
              <option key={c.student_id} value={c.student_id}>
                {c.full_name} ({c.class_grade})
              </option>
            ))}
          </select>
        )}

        {/* HIDE TABLE IF ADMIN/TEACHER/PARENT HAVEN'T SELECTED A STUDENT YET */}
        {(isAdmin || isTeacher || isParent) && !selectedReportStudent ? null : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto border dark:border-gray-600">
            {reportCard.length === 0 ? (
              <p className="p-6 text-gray-500 italic">
                No grades recorded yet.
              </p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <th className="p-4 border-b dark:border-gray-600">
                      Subject
                    </th>
                    <th className="p-4 border-b dark:border-gray-600">Term</th>
                    <th className="p-4 border-b dark:border-gray-600 text-center">
                      Test (/40)
                    </th>
                    <th className="p-4 border-b dark:border-gray-600 text-center">
                      Exam (/60)
                    </th>
                    <th className="p-4 border-b dark:border-gray-600 text-center font-bold text-purple-600 dark:text-purple-400">
                      Total (%)
                    </th>
                    {(isAdmin || isTeacher) && (
                      <th className="p-4 border-b dark:border-gray-600 text-center">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportCard.map((row) => (
                    <tr
                      key={row.result_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="p-4 border-b dark:border-gray-700 font-semibold">
                        {row.subject_name}
                      </td>
                      <td className="p-4 border-b dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        {row.academic_term}
                      </td>

                      {editingId === row.result_id ? (
                        <>
                          <td className="p-2 border-b dark:border-gray-700 text-center">
                            <input
                              type="number"
                              step="0.01"
                              max="40"
                              className="w-20 px-2 py-1 border rounded dark:bg-gray-800 text-center"
                              value={editScores.test_score}
                              onChange={(e) =>
                                setEditScores({
                                  ...editScores,
                                  test_score: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="p-2 border-b dark:border-gray-700 text-center">
                            <input
                              type="number"
                              step="0.01"
                              max="60"
                              className="w-20 px-2 py-1 border rounded dark:bg-gray-800 text-center"
                              value={editScores.exam_score}
                              onChange={(e) =>
                                setEditScores({
                                  ...editScores,
                                  exam_score: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="p-4 border-b dark:border-gray-700 text-center text-gray-400 italic">
                            Auto...
                          </td>
                          <td className="p-4 border-b dark:border-gray-700 text-center space-x-2">
                            <button
                              onClick={() => saveEdit(row.result_id)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-bold"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 border-b dark:border-gray-700 text-center">
                            {row.test_score}
                          </td>
                          <td className="p-4 border-b dark:border-gray-700 text-center">
                            {row.exam_score}
                          </td>
                          <td className="p-4 border-b dark:border-gray-700 text-center font-black text-lg text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/20">
                            {row.total_score}
                          </td>
                          {(isAdmin || isTeacher) && (
                            <td className="p-4 border-b dark:border-gray-700 text-center">
                              <button
                                onClick={() => startEditing(row)}
                                className="text-blue-500 hover:text-blue-700 font-semibold text-sm"
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesTab;
