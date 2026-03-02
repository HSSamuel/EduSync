import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, ShieldCheck, Building, Hash } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google'; // 👈 NEW

const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: "", email: "", password: "", role: "Admin", school_name: "", school_id: ""
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAuthSuccess = (token) => {
    localStorage.setItem("token", token); 
    setStatusMessage("✅ Account Created! Redirecting...");
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Creating account...");
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const parseRes = await response.json();
      if (response.ok) {
        handleAuthSuccess(parseRes.token || parseRes); // Fallback if token isn't returned on register directly
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

  // 👈 NEW: Google Register Handler
  const onGoogleSuccess = async (credentialResponse) => {
    if (formData.role === "Admin" && !formData.school_name) {
      return setStatusMessage("❌ Please enter a School Name before using Google Sign-up.");
    }
    if (formData.role !== "Admin" && !formData.school_id) {
      return setStatusMessage("❌ Please enter a School ID before using Google Sign-up.");
    }

    setStatusMessage("Registering via Google...");
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          token: credentialResponse.credential, 
          type: "register",
          role: formData.role,
          school_name: formData.school_name,
          school_id: formData.school_id
        }),
      });
      const parseRes = await response.json();
      
      if (response.ok && parseRes.token) {
        handleAuthSuccess(parseRes.token);
      } else {
        setStatusMessage("❌ " + parseRes.error);
      }
    } catch (err) {
      setStatusMessage("❌ Google Registration failed.");
    }
  };


  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center overflow-hidden pt-10 pb-10">
      <div className="absolute top-[5%] right-[20%] w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-pulse"></div>
      <div className="absolute bottom-[5%] left-[20%] w-[30rem] h-[30rem] bg-blue-400/20 dark:bg-blue-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-pulse" style={{ animationDelay: '3s' }}></div>

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
              <ShieldCheck className="text-gray-400" size={18} />
            </div>
            <select name="role" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium cursor-pointer" value={formData.role} onChange={onChange}>
              <option value="Admin">School Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
              <option value="Parent">Parent</option>
            </select>
          </div>

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

          {/* 👈 NEW: Google Registration Button right below School ID */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
             <p className="text-xs text-center text-blue-800 dark:text-blue-300 font-bold mb-3">FAST REGISTRATION (Recommended)</p>
             <div className="flex justify-center">
               <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={() => setStatusMessage("❌ Google popup closed or failed")}
                  text="signup_with"
                  theme="outline"
                  shape="rectangular"
               />
             </div>
          </div>

          <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or Email</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserPlus className="text-gray-400" size={18} />
            </div>
            <input type="text" name="full_name" placeholder="Full Name" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.full_name} onChange={onChange} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="text-gray-400" size={18} />
            </div>
            <input type="email" name="email" placeholder="Email Address" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.email} onChange={onChange} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-gray-400" size={18} />
            </div>
            <input type="password" name="password" placeholder="Password" className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium" value={formData.password} onChange={onChange} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 mt-4 font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? "Processing..." : "Create Account Manually"}
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