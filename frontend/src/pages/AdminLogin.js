import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import neuLogo from '../assets/neu-logo.png';

const API_BASE = 'https://doctrack-taupe.vercel.app';

const AdminLogin = () => {
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

            const { token, role, name, userId } = res.data;

            // ✅ Only allow Admin accounts here
            if (role !== 'Admin') {
                setMsg("❌ Access denied. This portal is for administrators only.");
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('name', name);
            localStorage.setItem('userId', userId);
            localStorage.setItem('email', email.trim().toLowerCase());

            setMsg("✅ Welcome, Admin! Redirecting...");
            setTimeout(() => navigate('/admin'), 1500);

        } catch (err) {
            if (!err.response) {
                setMsg("❌ Network Error. Please try again.");
            } else {
                setMsg(`❌ ${err.response?.data?.message || "Invalid credentials."}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                        <img src={neuLogo} alt="NEU Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white">Admin Portal</h2>
                    <p className="text-slate-400 font-medium mt-1">DocTrack — Authorized Personnel Only</p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Email</label>
                            <input
                                type="email" required placeholder="admin@school.edu"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                            <input
                                type="password" required placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
                            />
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${loading ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900'}`}
                        >
                            {loading ? "Verifying..." : "Access Admin Dashboard"}
                        </button>
                    </form>

                    {msg && (
                        <div className={`mt-5 text-center p-4 rounded-2xl text-xs font-black uppercase tracking-wider ${msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {msg}
                        </div>
                    )}
                </div>

                <p className="text-center mt-6 text-slate-600 text-xs">
                    Not an admin?{' '}
                    <a href="/login" className="text-slate-400 hover:text-white transition-colors">Student Login →</a>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;