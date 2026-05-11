import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import neuLogo from '../assets/neu-logo.png';

// ✅ Ensure this does NOT have a trailing slash
const API_BASE = 'https://doctrack-taupe.vercel.app';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);

        // 🔍 DEBUG: Log what we are sending
        console.log("Attempting login for:", email.trim().toLowerCase());

        try {
            const res = await axios.post(`${API_BASE}/api/auth/login`, { 
                email: email.trim().toLowerCase(), 
                password: password.trim() 
            });

            // 🔍 DEBUG: Log exactly what the server sent back
            console.log("Server Response Data:", res.data);

            const { token, role, name, userId } = res.data;

            // ✅ Store the data
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('name', name);
            localStorage.setItem('userId', userId);
            localStorage.setItem('email', email.trim().toLowerCase()); 
            
            setMsg("✅ Login Successful! Redirecting...");

            // Redirect based on role
            setTimeout(() => {
                if (role === 'Admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }, 1500);

        } catch (err) {
            console.error("Full Error Object:", err);

            if (!err.response) {
                // 🚨 THIS IS THE CORS FIX: 
                // If there is no response, it's usually a CORS or Connection issue
                setMsg("❌ Network Error: The browser blocked the connection (CORS). Check server logs.");
            } else {
                // This is an actual 401 or 400 error from the backend
                const errorMsg = err.response?.data?.message || "Invalid email or password.";
                setMsg(`❌ ${errorMsg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <img src={neuLogo} alt="NEU Logo" className="w-20 h-20 mb-4" />
                    <h2 className="text-3xl font-extrabold text-slate-800">DocTrack</h2>
                    <p className="text-slate-500 font-medium">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                        <input 
                            type="email" 
                            required
                            placeholder="you@gmail.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium" 
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 ${loading ? 'bg-slate-400 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 hover:shadow-blue-200'}`}
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                {msg && (
                    <div className={`mt-6 text-center p-4 rounded-2xl text-xs font-black uppercase tracking-wider ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {msg}
                    </div>
                )}

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500 text-sm font-medium">
                        Don't have an account? <Link to="/register" className="text-blue-600 font-black hover:underline ml-1">Register Now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;