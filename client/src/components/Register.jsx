import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Admin", // Default role
  });
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const parseRes = await response.json();

      if (response.ok) {
        setStatusMessage("✅ Account Created! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setStatusMessage("❌ " + (parseRes.error || "Registration failed."));
      }
    } catch (err) {
      console.error(err.message);
      setStatusMessage("❌ Server error. Check your connection.");
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-800 dark:text-white transition-colors duration-300 animate-fade-in mt-10">
      <h2 className="text-3xl font-bold text-center">Create Account</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
        Join the EduSync platform today.
      </p>

      <form onSubmit={onSubmitForm} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Full Name</label>
          <input
            type="text"
            name="full_name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600 transition-colors"
            placeholder="John Doe"
            value={formData.full_name}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600 transition-colors"
            placeholder="john@example.com"
            value={formData.email}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600 transition-colors"
            placeholder="••••••••"
            value={formData.password}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Account Type</label>
          <select
            name="role"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600 transition-colors"
            value={formData.role}
            onChange={onChange}
          >
            <option value="Admin">School Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
            <option value="Parent">Parent</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors shadow-md"
        >
          Register
        </button>
      </form>

      {statusMessage && (
        <div
          className={`p-3 mt-4 text-center font-semibold text-sm rounded ${statusMessage.includes("✅") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}
        >
          {statusMessage}
        </div>
      )}

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-blue-600 hover:underline dark:text-blue-400"
        >
          Log in here.
        </Link>
      </p>
    </div>
  );
};

export default Register;
