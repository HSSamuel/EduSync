import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Authenticating...");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const parseRes = await response.json();

      if (parseRes.token) {
        localStorage.setItem("token", parseRes.token);
        setStatusMessage("✅ Login Successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setStatusMessage("❌ " + parseRes.error);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err.message);
      setStatusMessage("❌ Server error. Check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center overflow-hidden pt-10">
      {/* --- BACKGROUND DEPTH ORBS --- */}
      <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"></div>
      <div
        className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-400/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* --- GLASSMORPHISM CARD --- */}
      <div className="relative z-10 w-full max-w-md p-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-4">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-black font-serif tracking-tight text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
            Enter your credentials to access the portal.
          </p>
        </div>

        <form onSubmit={onSubmitForm} className="space-y-5">
          <div className="relative">
            <label className="block mb-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium placeholder-gray-400"
                placeholder="admin@edusync.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {statusMessage && (
          <div
            className={`mt-5 p-3.5 text-center font-bold text-sm rounded-xl ${statusMessage.includes("✅") ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
