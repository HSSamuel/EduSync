import React, { useState } from "react";

const StudentsTab = ({ isAdmin, students, setStudents }) => {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  const onSubmitStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify({
          full_name: studentName,
          email: studentEmail,
          password: studentPassword,
          class_grade: studentGrade,
        }),
      });
      const parseRes = await response.json();
      if (response.ok) {
        setStudents([
          ...students,
          {
            student_id: parseRes.academic_record.student_id,
            full_name: parseRes.user_account.full_name,
            email: parseRes.user_account.email,
            class_grade: parseRes.academic_record.class_grade,
            enrollment_date: parseRes.academic_record.enrollment_date,
          },
        ]);
        setStudentName("");
        setStudentEmail("");
        setStudentPassword("");
        setStudentGrade("");
        alert("✅ " + parseRes.message);
      } else {
        alert("❌ " + parseRes.error);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  if (!isAdmin) return null; // Extra security: Don't render if not Admin

  return (
    <div className="animate-fade-in">
      <form
        onSubmit={onSubmitStudent}
        className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border dark:border-gray-600 mb-6 shadow-sm"
      >
        <h4 className="text-lg font-bold mb-4 dark:text-white">
          Enroll New Student
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            className="px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
            value={studentPassword}
            onChange={(e) => setStudentPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Class / Grade"
            className="px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
            value={studentGrade}
            onChange={(e) => setStudentGrade(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded w-full md:w-auto"
        >
          + Register Student
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {students.map((student) => (
          <div
            key={student.student_id}
            className="p-5 border rounded-xl shadow-sm bg-white dark:bg-gray-800"
          >
            <h4 className="text-xl font-bold text-green-600 dark:text-green-400">
              {student.full_name}
            </h4>
            <p className="text-sm">
              <strong>Email:</strong> {student.email}
            </p>
            <p className="text-sm">
              <strong>Class:</strong> {student.class_grade}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsTab;
