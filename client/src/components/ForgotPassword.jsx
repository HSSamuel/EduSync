import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Sending...");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const parseRes = await response.json();

      if (response.ok) {
        setStatus("✅ " + parseRes.message);
        setEmail("");
      } else {
        setStatus("❌ " + parseRes.error);
      }
    } catch (err) {
      setStatus("❌ Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-800 dark:text-white mt-10">
      <h2 className="text-3xl font-bold text-center">Reset Password</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
        Enter your registered email address and we'll send you a link to reset
        your password.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 mt-4 font-bold text-white rounded-lg transition-colors ${isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
