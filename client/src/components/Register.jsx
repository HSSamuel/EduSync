import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, ShieldCheck, Building, Hash } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: "", email: "", password: "", role: "Admin", school_name: "", school_id: ""
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Creating account...");
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const parseRes = await response.json();
      if (response.ok) {
        setStatusMessage("✅ Account Created! Redirecting...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setStatusMessage("❌ " + (parseRes.error || "Registration failed."));
        setIsLoading(false);
      }
    } catch (err) {
      setStatusMessage("❌ Server error. Check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center overflow-hidden pt-10 pb-10">
      {/* BACKGROUND DEPTH ORBS */}
      <div className="absolute top-[5%] right-[20%] w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-pulse"></div>
      <div className="absolute bottom-[5%] left-[20%] w-[30rem] h-[30rem] bg-blue-400/20 dark:bg-blue-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* GLASSMORPHISM CARD */}
      <div className="relative z-10 w-full max-w-md p-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black font-serif tracking-tight text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
            Join the next generation of school management.
          </p>
        </div>

        <form onSubmit={onSubmitForm} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserPlus className="text-gray-400" size={18} />
            </div>
            <input type="text" name="full_name" placeholder="Full Name" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.full_name} onChange={onChange} required />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="text-gray-400" size={18} />
            </div>
            <input type="email" name="email" placeholder="Email Address" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.email} onChange={onChange} required />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-gray-400" size={18} />
            </div>
            <input type="password" name="password" placeholder="Password" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.password} onChange={onChange} required />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <ShieldCheck className="text-gray-400" size={18} />
            </div>
            <select name="role" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium cursor-pointer" value={formData.role} onChange={onChange}>
              <option value="Admin">School Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
              <option value="Parent">Parent</option>
            </select>
          </div>

          {/* FIX: Conditional Input for Multi-Tenancy */}
          {formData.role === "Admin" ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building className="text-gray-400" size={18} />
              </div>
              <input type="text" name="school_name" placeholder="Your School's Name" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.school_name} onChange={onChange} required />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hash className="text-gray-400" size={18} />
              </div>
              <input type="number" name="school_id" placeholder="School ID (Ask your Admin)" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.school_id} onChange={onChange} required />
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full py-4 mt-4 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? "Processing..." : "Create Account"}
          </button>
        </form>

        {statusMessage && (
          <div className={`mt-5 p-3.5 text-center font-bold text-sm rounded-xl ${statusMessage.includes("✅") ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
            {statusMessage}
          </div>
        )}

        <div className="mt-8 text-center border-t border-gray-200/60 dark:border-gray-700/50 pt-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors">
              Log in here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;