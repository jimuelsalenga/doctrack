import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import neuLogo from '../assets/neu-logo.png';

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
        try {
            const res = await axios.post(`${API_BASE}/api/auth/login`, {
                email: email.trim().toLowerCase(),
                password: password.trim()
            });

            const { token, role, name, userId, program, yearLevel } = res.data;

            // ✅ Block admins from using the student login
            if (role === 'Admin') {
                setMsg("❌ Please use the Admin Portal to sign in.");
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('name', name);
            localStorage.setItem('userId', userId);
            localStorage.setItem('email', email.trim().toLowerCase());
            localStorage.setItem('program', program || 'N/A');
            localStorage.setItem('yearLevel', yearLevel || 'N/A');

            setMsg("✅ Login Successful! Redirecting...");
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err) {
            if (!err.response) {
                setMsg("❌ Network Error. Please try again.");
            } else {
                setMsg(`❌ ${err.response?.data?.message || "Invalid email or password."}`);
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
                    <p className="text-slate-500 font-medium">Student Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                        <input
                            type="email" required placeholder="you@gmail.com"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password" required placeholder="••••••••"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                {msg && (
                    <div className={`mt-6 text-center p-4 rounded-2xl text-xs font-black uppercase tracking-wider ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {msg}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
                    <p className="text-slate-500 text-sm font-medium">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 font-black hover:underline">Register Now</Link>
                    </p>
                    {/* ✅ Subtle admin link — not obvious to students */}
                    <p className="text-slate-300 text-xs">
                        Staff?{' '}
                        <Link to="/admin/login" className="hover:text-slate-400 transition-colors">Admin Portal →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;