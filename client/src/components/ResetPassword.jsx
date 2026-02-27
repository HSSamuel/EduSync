import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams(); // Grabs the secret token from the URL!
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setStatus("❌ Passwords do not match.");
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        },
      );
      const parseRes = await response.json();

      if (response.ok) {
        setStatus(parseRes.message);
        setTimeout(() => navigate("/login"), 3000); // Send them to login after 3 seconds
      } else {
        setStatus("❌ " + parseRes.error);
      }
    } catch (err) {
      setStatus("❌ Server error.");
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-800 dark:text-white mt-10">
      <h2 className="text-3xl font-bold text-center">Create New Password</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          Update Password
        </button>
      </form>

      {status && (
        <div
          className={`p-3 mt-4 text-center font-semibold text-sm rounded ${status.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {status}
        </div>
      )}

      <div className="text-center mt-4">
        <Link
          to="/login"
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
