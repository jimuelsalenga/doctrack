import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Requester', program: ' ', yearLevel: ' ' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(""); 

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            setMsg("✅ " + res.data.message);
            
            // Clear form
            setFormData({ name: '', email: '', password: '', role: 'Requester' });
            
            // Allow user to see success message before redirect
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Registration Failed. Ensure the email is unique.";
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
                    <input 
                        className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Full Name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        required 
                    />
                    <select 
                         className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                         value={formData.yearLevel}
                         onChange={(e) => setFormData({...formData, yearLevel: e.target.value})}
>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                    </select>
                    <select 
                        className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                        <option value="Requester">Bachelor of Elementary Education</option>
                        <option value="Requester">Bachelor of Secondary Education</option>
                        <option value="Requester">BS in Accountancy</option>
                        <option value="Requester">BS in Accounting Information System</option>
                        <option value="Requester">BS in Accounting Technology</option>
                        <option value="Requester">BS in Business Administration</option>
                        <option value="Requester">BS in Entrepreneurship</option>
                        <option value="Requester">BS in Real Estate Management</option>
                        <option value="Requester">BS in Computer Science</option>
                        <option value="Requester">BS in Information Systems</option>
                        <option value="Requester">BS in Information Technology</option>
                        <option value="Requester">BS in Information System</option>
                        <option value="Requester">BS in Entertainment and Multimedia Computing</option>
                        <option value="Requester">BS in Medical Technology</option>
                        <option value="Requester">BS in Nursing</option>
                        <option value="Requester">BS in Physical Therapy</option>
                        <option value="Requester">BS in Psychology</option>
                    </select>
                    <input 
                        className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                        type="email" 
                        placeholder="Email Address" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    <input 
                        className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                        type="password" 
                        placeholder="Create Password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    <select 
                        className="w-full border border-slate-300 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                        <option value="Requester">Student / Requester Account</option>
                        <option value="Admin">Staff / Admin Account</option>
                    </select>

                    <button 
                        disabled={loading} 
                        className={`w-full text-white font-bold py-3 rounded-xl transition ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? "Processing..." : "Create Account"}
                    </button>
                </form>

                {msg && (
                    <p className={`mt-4 text-center font-medium p-2 rounded-lg ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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