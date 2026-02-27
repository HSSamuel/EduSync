import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  // 1. Memory for what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  // 2. The function that talks to your Node.js backend
  const onSubmitForm = async (e) => {
    e.preventDefault(); // Prevents the page from reloading
    try {
      const body = { email, password };

      // Send the data to our API
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const parseRes = await response.json();

      // 3. Check if we got the VIP pass (token)
      if (parseRes.token) {
        localStorage.setItem("token", parseRes.token); // Save token to the browser's vault!
        setStatusMessage("✅ Login Successful! VIP Pass Secured.");

        navigate("/dashboard");
      } else {
        setStatusMessage("❌ " + parseRes.error);
      }
    } catch (err) {
      console.error(err.message);
      setStatusMessage("❌ Server error. Check your connection.");
    }
  };

  return (
    // Mobile responsive container that adapts to dark mode!
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-800 dark:text-white transition-colors duration-300">
      <h2 className="text-3xl font-bold text-center">EduSync Login</h2>

      <form onSubmit={onSubmitForm} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 transition-colors"
            placeholder="admin@edusync.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600 transition-colors"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="text-right">
          <a
            href="/forgot-password"
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors"
        >
          Sign In
        </button>
      </form>

      {/* Success or Error Message Display */}
      {statusMessage && (
        <div className="p-3 mt-4 text-center font-semibold text-sm rounded bg-gray-100 dark:bg-gray-700">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default Login;
