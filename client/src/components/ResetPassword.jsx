import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetchOrThrow } from "../utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("❌ Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiFetchOrThrow(
        "/auth/reset-password",
        {
          method: "PUT",
          body: JSON.stringify({ token, newPassword }),
        },
        "Unable to reset password.",
      );

      setStatus(data?.message || "✅ Password successfully reset!");
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
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
