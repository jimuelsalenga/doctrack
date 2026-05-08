import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import neuLogo from '../assets/neu-logo.png';

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
            const res = await axios.post('http://localhost:5000/api/auth/login', { 
                email: email.trim().toLowerCase(), // ✅ Normalize email
                password 
            });

            const data = res.data;
            
            // Extract user data reliably regardless of backend nesting
            const user = data.user || data;
            const role = user.role || data.role;

            // ✅ Save to localStorage for use in other components like Request.js
            localStorage.setItem('token', data.token);
            localStorage.setItem('name', user.name);
            localStorage.setItem('userId', user.id || user._id || data.userId);
            localStorage.setItem('role', role);
            localStorage.setItem('email', user.email || email.trim().toLowerCase()); 
            localStorage.setItem('program', res.data.user.program);
            localStorage.setItem('yearLevel', res.data.user.yearLevel);
           
            setMsg("✅ Login Successful! Redirecting...");

            // ✅ Redirect based on the actual role returned from the database
            setTimeout(() => {
                if (role === 'Admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);

        } catch (err) {
            console.error("Login Error:", err.response?.data);
            setMsg(`❌ ${err.response?.data?.message || "Invalid email or password."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
                <img src={neuLogo} alt="NEU Logo" className="w-20 h-20 mx-auto mb-6" />
                <h2 className="text-3xl font-extrabold text-center mb-1 text-slate-800">DocTrack</h2>
                <p className="text-slate-500 text-center mb-10">Sign in to your account</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 uppercase tracking-wider">Email</label>
                        <input 
                            type="email" 
                            required
                            placeholder="you@gmail.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 uppercase tracking-wider">Password</label>
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                {msg && (
                    <div className={`mt-6 text-center p-3 rounded-xl text-sm font-bold ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {msg}
                    </div>
                )}

                <p className="mt-10 text-center text-slate-600 text-sm font-medium">
                    Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Register Now</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;