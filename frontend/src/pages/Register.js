import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'https://doctrack-taupe.vercel.app';

const Register = () => {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'Requester', 
        program: 'Bachelor of Elementary Education', 
        yearLevel: '1st Year' 
    });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(""); 

        try {
            // ✅ IMPROVEMENT: Normalize data before sending to backend
            const submissionData = {
                ...formData,
                email: formData.email.trim().toLowerCase(),
                name: formData.name.trim()
            };

            const res = await axios.post(`${API_BASE}/api/auth/register`, submissionData);
            
            setMsg("✅ " + (res.data.message || "Registration successful!"));
            
            // Clear form
            setFormData({ 
                name: '', 
                email: '', 
                password: '', 
                role: 'Requester', 
                program: 'Bachelor of Elementary Education', 
                yearLevel: '1st Year' 
            });
            
            // Redirect to login after a short delay
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error("Registration Error:", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Registration Failed. Please try again.";
            setMsg("❌ " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Create Account</h2>
                    <p className="text-slate-500 mt-2">Document Request System</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Full Name</label>
                        <input 
                            className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            placeholder="John Doe" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            required 
                        />
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
                        <input 
                            className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            type="email" 
                            placeholder="name@email.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                        <input 
                            className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            type="password" 
                            placeholder="••••••••" 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            required 
                        />
                    </div>

                    {/* Year Level */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Year Level</label>
                        <select 
                             className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                             value={formData.yearLevel}
                             onChange={(e) => setFormData({...formData, yearLevel: e.target.value})}
                        >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>

                    {/* Program */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Academic Program</label>
                        <select 
                            className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            value={formData.program}
                            onChange={(e) => setFormData({...formData, program: e.target.value})}
                        >
                            <option value="Bachelor of Elementary Education">Bachelor of Elementary Education</option>
                            <option value="Bachelor of Secondary Education">Bachelor of Secondary Education</option>
                            <option value="BS in Accountancy">BS in Accountancy</option>
                            <option value="BS in Computer Science">BS in Computer Science</option>
                            <option value="BS in Information Technology">BS in Information Technology</option>
                            <option value="BS in Nursing">BS in Nursing</option>
                        </select>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Account Type</label>
                        <select 
                            className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="Requester">Student / Requester Account</option>
                            <option value="Admin">Staff / Admin Account</option>
                        </select>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading} 
                        className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                {msg && (
                    <p className={`mt-4 text-center font-bold p-3 rounded-xl text-sm ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {msg}
                    </p>
                )}
                
                <p className="mt-8 text-center text-slate-600 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;