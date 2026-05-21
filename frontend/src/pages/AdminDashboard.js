import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, CheckCircle, XCircle, LogOut, LayoutDashboard,
  Settings, User, Mail, Clock, Hash, FileText, X, RotateCcw, Info,
  ChevronLeft, ChevronRight, BookOpen, GraduationCap, AlignLeft, CalendarClock
} from 'lucide-react';
import neuLogo from '../assets/neu-logo.png';

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [toast, setToast] = useState(null);

  // ✅ NEW states
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const adminName = localStorage.getItem('name') || "Admin";

  const axiosAuth = useMemo(() => axios.create({
    baseURL: 'https://doctrack-taupe.vercel.app/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get('/docs/all');
      setRequests(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/admin/login');
      } else {
        showToast("Failed to fetch requests", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [axiosAuth, navigate]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ✅ Reset page + selection when tab/search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [activeTab, searchTerm]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // ✅ UPDATED: accepts estimatedDays
  const handleUpdateStatus = async (id, newStatus, remarks = "", days = null) => {
    try {
      const payload = {
        status: newStatus,
        remarks: remarks || `Request marked as ${newStatus} by ${adminName}`
      };
      if (days) payload.estimatedDays = days;
      await axiosAuth.patch(`/docs/status/${id}`, payload);
      showToast(`Request marked as ${newStatus}`);
      fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  // ✅ NEW: Bulk approve
  const handleBulkApprove = async (days) => {
    try {
      await Promise.all([...selectedIds].map(id =>
        axiosAuth.patch(`/docs/status/${id}`, {
          status: 'Approved',
          remarks: `Approved by ${adminName}`,
          estimatedDays: days
        })
      ));
      showToast(`${selectedIds.size} request(s) approved`);
      setSelectedIds(new Set());
      fetchRequests();
    } catch (err) {
      showToast("Bulk approve failed", "error");
    }
  };

  // ✅ NEW: Bulk reject
  const handleBulkReject = async (reason) => {
    try {
      await Promise.all([...selectedIds].map(id =>
        axiosAuth.patch(`/docs/status/${id}`, { status: 'Rejected', remarks: reason })
      ));
      showToast(`${selectedIds.size} request(s) rejected`);
      setSelectedIds(new Set());
      fetchRequests();
    } catch (err) {
      showToast("Bulk reject failed", "error");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/admin/login');
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
      if (['createdAt', 'submittedAt'].includes(sortConfig.key)) {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }
      return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [requests, activeTab, searchTerm, sortConfig]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedData, currentPage]);

  // ✅ Checkbox helpers
  const toggleSelectId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allPageSelected = paginatedData.length > 0 && paginatedData.every(r => selectedIds.has(r._id));

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(r => r._id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  };

  // ✅ FIXED: only Pending + Under Review = active
  const activeCount = requests.filter(r => ['Pending', 'Under Review'].includes(r.status)).length;

  const stats = {
    pending: requests.filter(r => r.status === 'Pending').length,
    underReview: requests.filter(r => r.status === 'Under Review').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    ready: requests.filter(r => r.status === 'Ready').length,
    total: requests.length
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
          {toast.msg}
        </div>
      )}

      {/* ✅ NEW: Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl mx-4">
            <h3 className="text-xl font-black text-slate-900 mb-1">Reject Request</h3>
            <p className="text-sm text-slate-500 mb-5">Provide a reason — the student will see this as feedback.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Incomplete supporting documents, ID is expired..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition-all"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-3.5 text-slate-500 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) return;
                  rejectModal.isBulk
                    ? handleBulkReject(rejectReason)
                    : handleUpdateStatus(rejectModal.id, 'Rejected', rejectReason);
                  setRejectModal(null);
                  setRejectReason('');
                }}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Approval Modal with due date */}
      {approveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl mx-4">
            <h3 className="text-xl font-black text-slate-900 mb-1">Approve Request</h3>
            <p className="text-sm text-slate-500 mb-5">Set the estimated processing time. The student will see an estimated pickup date.</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Estimated Days to Process</label>
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="number" min="1" max="30"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-center font-black text-xl transition-all"
                />
                <span className="text-sm font-bold text-slate-500">business day(s)</span>
              </div>
              <div className="flex items-center gap-2 mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CalendarClock size={15} className="text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-700">
                  Est. ready by: {new Date(Date.now() + estimatedDays * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setApproveModal(null)}
                className="flex-1 py-3.5 text-slate-500 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  approveModal.isBulk
                    ? handleBulkApprove(estimatedDays)
                    : handleUpdateStatus(approveModal.id, 'Approved', 'Documents verified and approved.', estimatedDays);
                  setApproveModal(null);
                }}
                className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all text-sm"
              >
                Confirm Approval
              </button>
            </div>
          </div>
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
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-lg">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-none">{adminName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-2xl font-bold transition-all text-sm">
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
                {/* ✅ FIXED: only Pending + Under Review = active */}
                <p className="text-slate-500 font-medium">
                  Monitoring <span className="text-blue-600 font-bold">{activeCount}</span> active requests
                </p>
              </div>
              <button onClick={fetchRequests} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all shadow-sm">
                <RotateCcw size={20} />
              </button>
            </header>

            {/* ✅ 5 stat cards */}
            <div className="grid grid-cols-5 gap-4 mb-10">
              <StatCard label="Pending" count={stats.pending} color="amber" icon={<Clock size={18}/>} />
              <StatCard label="Under Review" count={stats.underReview} color="purple" icon={<Eye size={18}/>} />
              <StatCard label="Approved" count={stats.approved} color="emerald" icon={<CheckCircle size={18}/>} />
              <StatCard label="Ready" count={stats.ready} color="blue" icon={<Info size={18}/>} />
              <StatCard label="Total" count={stats.total} color="slate" icon={<FileText size={18}/>} />
            </div>

            {/* ✅ NEW: Bulk action toolbar */}
            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <span className="text-sm font-black text-blue-700">{selectedIds.size} selected</span>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => setApproveModal({ isBulk: true })}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest">
                    Approve All
                  </button>
                  <button onClick={() => setRejectModal({ isBulk: true })}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest">
                    Reject All
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-black rounded-xl hover:bg-white transition-all uppercase tracking-widest">
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Tabs + Search */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white shadow-sm overflow-x-auto gap-1">
                {/* ✅ Added Under Review + Completed tabs */}
                {['All', 'Pending', 'Under Review', 'Approved', 'Ready', 'Rejected', 'Completed'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search ID or student name..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm" />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-white overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    {/* ✅ Bulk select header checkbox */}
                    <th className="px-5 py-5">
                      <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600" />
                    </th>
                    <th className="px-4 py-5 cursor-pointer hover:text-blue-500" onClick={() => requestSort('requesterName')}>Student & ID</th>
                    <th className="px-6 py-5">Document Type</th>
                    <th className="px-6 py-5 cursor-pointer hover:text-blue-500" onClick={() => requestSort('createdAt')}>Submitted</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="py-20 text-center font-bold text-slate-300">Synchronizing data...</td></tr>
                  ) : paginatedData.map(req => (
                    <tr key={req._id} className={`hover:bg-white/80 transition-colors group ${selectedIds.has(req._id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-5 py-5">
                        <input type="checkbox" checked={selectedIds.has(req._id)} onChange={() => toggleSelectId(req._id)}
                          className="w-4 h-4 rounded cursor-pointer accent-blue-600" />
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-bold text-slate-800 text-sm">{req.requesterName || "Unknown Student"}</p>
                        <p className="text-[10px] font-mono text-blue-500 font-bold">#{req._id?.slice(-8).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600">{req.documentType}</td>
                      <td className="px-6 py-5 text-slate-500 text-xs font-medium">{new Date(req.createdAt || req.submittedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-5"><StatusBadge status={req.status} /></td>
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

              {/* ✅ NEW: Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedData.length)} of {filteredAndSortedData.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {page}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase tracking-widest">Configuration Panel Under Construction</div>
        )}
      </main>

      {/* Request Profile Side Panel */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <StatusBadge status={selectedRequest.status} />
                  <h2 className="text-3xl font-black text-slate-900 mt-3">Request Profile</h2>
                  <p className="text-blue-600 font-mono text-sm font-bold">Ref: {selectedRequest._id?.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                <DetailItem icon={<User size={18}/>} label="Student" value={selectedRequest.requesterName || "Unknown"} />
                <DetailItem icon={<Hash size={18}/>} label="Tracking ID" value={selectedRequest._id} />
                <DetailItem icon={<Mail size={18}/>} label="Email" value={selectedRequest.requesterEmail || "N/A"} />
                {/* ✅ NEW: Program + Year Level */}
                <DetailItem icon={<GraduationCap size={18}/>} label="Program" value={selectedRequest.program || "N/A"} />
                <DetailItem icon={<BookOpen size={18}/>} label="Year Level" value={selectedRequest.yearLevel || "N/A"} />
                <DetailItem icon={<FileText size={18}/>} label="Document Type" value={selectedRequest.documentType} />
                {/* ✅ NEW: Description/Purpose */}
                {selectedRequest.description && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="text-slate-400 mt-0.5"><AlignLeft size={18}/></div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Purpose / Description</p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedRequest.description}</p>
                    </div>
                  </div>
                )}
                <DetailItem icon={<Clock size={18}/>} label="Submitted On" value={new Date(selectedRequest.createdAt).toLocaleString()} />

                {/* File with filename context */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Supporting File</p>
                  {/* ✅ NEW: Filename label as context */}
                  {selectedRequest.fileName && (
                    <p className="text-[10px] font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                      <FileText size={12} /> {selectedRequest.fileName}
                    </p>
                  )}
                  {selectedRequest.fileUrl ? (
                    <div className="space-y-3">
                      {selectedRequest.fileName?.toLowerCase().endsWith('.pdf') ? (
                        <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: '200px' }}>
                          <iframe src={selectedRequest.fileUrl} title="PDF" className="w-full h-full" />
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                          <img src={selectedRequest.fileUrl} alt="Supporting file" className="w-full max-h-48 object-contain" />
                        </div>
                      )}
                      <a href={selectedRequest.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-blue-600 hover:bg-blue-50 transition-all">
                        <FileText size={14} /> Open Full File
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 font-medium">{selectedRequest.fileName || "No file attached"}</p>
                  )}
                </div>

                {selectedRequest.remarks && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Latest Remarks</p>
                    <p className="text-sm font-medium text-amber-800 italic">"{selectedRequest.remarks}"</p>
                  </div>
                )}
              </div>

              {/* ✅ UPDATED: Action buttons with Under Review + proper modals */}
              <div className="space-y-3">
                {selectedRequest.status === 'Pending' && (
                  <>
                    {/* ✅ NEW: Under Review button */}
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest._id, 'Under Review', 'Request is currently being reviewed.')}
                      className="w-full bg-purple-100 text-purple-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-200 transition-all"
                    >
                      Mark as Under Review
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      {/* ✅ Opens approval modal instead of direct approve */}
                      <button
                        onClick={() => setApproveModal({ id: selectedRequest._id })}
                        className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Approve
                      </button>
                      {/* ✅ Opens rejection modal instead of prompt() */}
                      <button
                        onClick={() => setRejectModal({ id: selectedRequest._id })}
                        className="border-2 border-rose-100 text-rose-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {selectedRequest.status === 'Under Review' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setApproveModal({ id: selectedRequest._id })}
                      className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: selectedRequest._id })}
                      className="border-2 border-rose-100 text-rose-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'Approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'Ready', 'Your document is now ready for pickup at the Registrar Office.')}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Mark as Ready for Pickup
                  </button>
                )}

                {['Rejected', 'Ready', 'Completed'].includes(selectedRequest.status) && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest._id, 'Pending', 'Status reset for re-verification.')}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
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

// ✅ UPDATED: Added purple for Under Review
const StatCard = ({ label, count, color, icon }) => (
  <div className="p-5 rounded-[24px] border bg-white shadow-sm flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-xl">
    <div className={`p-3 rounded-2xl ${
      color === 'amber'   ? 'bg-amber-50 text-amber-600' :
      color === 'purple'  ? 'bg-purple-50 text-purple-600' :
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
      color === 'blue'    ? 'bg-blue-50 text-blue-600' :
      'bg-slate-50 text-slate-600'}`
    }>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 leading-none">{count}</h3>
    </div>
  </div>
);

// ✅ UPDATED: Added Under Review + Completed colors
const StatusBadge = ({ status }) => {
  const colors = {
    'Pending':      'bg-amber-100 text-amber-700',
    'Under Review': 'bg-purple-100 text-purple-700',
    'Approved':     'bg-emerald-100 text-emerald-700',
    'Ready':        'bg-blue-100 text-blue-700',
    'Rejected':     'bg-rose-100 text-rose-700',
    'Completed':    'bg-slate-800 text-white',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
    <div className="text-slate-400">{icon}</div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700 leading-none truncate" title={value}>{value}</p>
    </div>
  </div>
);

export default AdminDashboard;