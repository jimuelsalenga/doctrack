import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Search, Eye, CheckCircle, XCircle, LogOut, LayoutDashboard,
  Settings, User, Mail, Clock, Hash, FileText, X, RotateCcw, Info
} from 'lucide-react';
import neuLogo from '../assets/neu-logo.png';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const adminName = localStorage.getItem('name') || "Admin";

  const axiosAuth = useMemo(() => axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Changed to /docs/all to match server.js prefix
      const res = await axiosAuth.get('/docs/all');
      setRequests(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showToast("Failed to fetch requests", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleUpdateStatus = async (id, newStatus, remarks = "") => {
    try {
      // Logic Fix: Sending data to /docs/status/:id as defined in backend
      await axiosAuth.patch(`/docs/status/${id}`, { 
        status: newStatus, 
        remarks: remarks || `Request marked as ${newStatus} by ${adminName}`
      });
      
      showToast(`Request marked as ${newStatus}`);
      fetchRequests(); 
      setSelectedRequest(null);
    } catch (err) {
      console.error("Update Error:", err.response?.data);
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = requests.filter(req => {
      const matchesTab = activeTab === 'All' || req.status === activeTab;
      const term = searchTerm.toLowerCase().trim();
      return matchesTab && (
        req.documentType?.toLowerCase().includes(term) ||
        req.requesterName?.toLowerCase().includes(term) ||
        req._id?.toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      let valA = a[sortConfig.key], valB = b[sortConfig.key];
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'submittedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [requests, activeTab, searchTerm, sortConfig]);

  const stats = {
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    ready: requests.filter(r => r.status === 'Ready').length,
    total: requests.length
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      {toast && (
        <div className={`fixed top-6 right-6 z-[120] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 h-screen p-6 fixed flex flex-col z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <img src={neuLogo} alt="NEU Logo" className="w-10 h-10 object-contain" />
          <h2 className="text-2xl font-black tracking-tighter text-slate-800">DocTrack</h2>
        </div>
        <nav className="space-y-1 flex-1">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${currentView === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`}>
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">{adminName.charAt(0)}</div>
            <div>
              <p className="font-bold text-slate-800 leading-none">{adminName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Administrator</p>
            </div>
          </div>
          <button onClick={() => window.confirm("Sign out?") && (localStorage.clear() || (window.location.href = '/login'))} className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-2xl font-bold transition-all text-sm">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 overflow-y-auto h-screen">
        {currentView === 'dashboard' ? (
          <div className="max-w-7xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Command Center</h1>
                <p className="text-slate-500 font-medium">Monitoring <span className="text-blue-600 font-bold">{requests.length}</span> active requests</p>
              </div>
              <button onClick={fetchRequests} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all shadow-sm">
                <RotateCcw size={20} />
              </button>
            </header>

            <div className="grid grid-cols-4 gap-6 mb-10">
              <StatCard label="Pending" count={stats.pending} color="amber" icon={<Clock size={20}/>} />
              <StatCard label="Approved" count={stats.approved} color="emerald" icon={<CheckCircle size={20}/>} />
              <StatCard label="Ready" count={stats.ready} color="blue" icon={<Info size={20}/>} />
              <StatCard label="Total" count={stats.total} color="slate" icon={<FileText size={20}/>} />
            </div>

            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white shadow-sm">
                {['All', 'Pending', 'Approved', 'Ready', 'Rejected'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search tracking ID or student name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm" />
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-white overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5 cursor-pointer" onClick={() => requestSort('requesterName')}>Student & ID</th>
                    <th className="px-6 py-5">Document Type</th>
                    <th className="px-6 py-5 cursor-pointer" onClick={() => requestSort('createdAt')}>Submitted</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-300">Synchronizing data...</td></tr>
                  ) : filteredAndSortedData.map(req => (
                    <tr key={req._id} className="hover:bg-white/80 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-800 text-sm">{req.requesterName}</p>
                        <p className="text-[10px] font-mono text-blue-500 font-bold">#{req._id?.slice(-8).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600">{req.documentType}</td>
                      <td className="px-6 py-5 text-slate-500 text-xs font-medium">{new Date(req.createdAt || req.submittedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => setSelectedRequest(req)} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAndSortedData.length === 0 && !loading && (
                <div className="py-20 text-center text-slate-400 font-bold">No requests found matching your criteria.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase tracking-widest">Configuration Panel Under Construction</div>
        )}
      </main>

      {/* Side Panel Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <StatusBadge status={selectedRequest.status} />
                  <h2 className="text-3xl font-black text-slate-900 mt-3">Request Profile</h2>
                  <p className="text-blue-600 font-mono text-sm font-bold">Ref: {selectedRequest._id?.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24} /></button>
              </div>

              <div className="space-y-4 mb-10">
                <DetailItem icon={<User size={18}/>} label="Student" value={selectedRequest.requesterName} />
                <DetailItem icon={<Hash size={18}/>} label="System Tracking ID" value={selectedRequest._id} />
                <DetailItem icon={<Mail size={18}/>} label="Email Address" value={selectedRequest.requesterEmail || selectedRequest.userEmail} />
                <DetailItem icon={<FileText size={18}/>} label="Document" value={selectedRequest.documentType} />
                <DetailItem icon={<Clock size={18}/>} label="Submitted On" value={new Date(selectedRequest.createdAt || selectedRequest.submittedAt).toLocaleString()} />
                {selectedRequest.remarks && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Latest Remarks</p>
                    <p className="text-sm font-medium text-amber-800 italic">"{selectedRequest.remarks}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons with Improved Logic */}
              <div className="grid grid-cols-2 gap-4">
                {selectedRequest.status === 'Pending' ? (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(selectedRequest._id, 'Approved', 'Documents verified and approved.')} 
                      className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => {
                        const reason = prompt("Reason for rejection?");
                        if(reason) handleUpdateStatus(selectedRequest._id, 'Rejected', reason);
                      }} 
                      className="border-2 border-rose-100 text-rose-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition-all"
                    >
                      Reject
                    </button>
                  </>
                ) : selectedRequest.status === 'Approved' ? (
                  <button 
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'Ready', 'Your document is now ready for pickup at the Registrar Office.')} 
                    className="col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Mark as Ready for Pickup
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'Pending', 'Status reset for re-verification.')} 
                    className="col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component helpers
const StatCard = ({ label, count, color, icon }) => (
  <div className={`p-6 rounded-[28px] border bg-white shadow-sm flex items-center gap-5 transition-all hover:-translate-y-1 hover:shadow-xl`}>
    <div className={`p-4 rounded-2xl ${
      color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
      color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
      'bg-slate-50 text-slate-600 border-slate-100'}`
    }>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 leading-none">{count}</h3>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    Approved: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    Ready: "bg-blue-100 text-blue-700",
    Rejected: "bg-rose-100 text-rose-700"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white shadow-sm ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
    <div className="text-slate-400">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700 leading-none">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;