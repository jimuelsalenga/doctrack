import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import neuLogo from '../assets/neu-logo.png';
import {
  Search, Plus, FileText, Clock, CheckCircle, Edit3,
  User, LogOut, LayoutDashboard, ChevronRight, Bell
} from 'lucide-react';
import Request from '../components/Request';
import ViewRequest from '../components/ViewRequest';

const Dashboard = () => {
  const API_BASE_URL = 'https://doctrack-taupe.vercel.app';

  const userName = localStorage.getItem('name') || "User";
  const userRole = localStorage.getItem('role') || "Requester";
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('email') || "N/A";
  const userProgram = localStorage.getItem('program') || "N/A";
  const userYear = localStorage.getItem('yearLevel') || "N/A";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [resubmitData, setResubmitData] = useState(null); // ✅ NEW
  const [viewingRequest, setViewingRequest] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ NEW: Notification bell state
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifLastSeen, setNotifLastSeen] = useState(() => {
    return parseInt(localStorage.getItem('notifLastSeen') || '0');
  });
  const notifRef = useRef(null);

  useEffect(() => {
    if (!token) window.location.replace('/login');
    // ✅ Route guard: block admins from student dashboard
    if (userRole === 'Admin') window.location.replace('/admin');
  }, [token, userRole]);

  const fetchMyRequests = useCallback(async () => {
    if (!token || !userId || userId === 'undefined') { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/docs/all`, {
        params: { userId, role: userRole },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err.response?.data || err);
      if (err.response?.status === 401) { localStorage.clear(); window.location.replace('/login'); }
    } finally {
      setLoading(false);
    }
  }, [token, userId, userRole, API_BASE_URL]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  // ✅ Close notif dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Compute unread notifications from statusHistory
  const allNotifications = useMemo(() => {
    const notifs = [];
    requests.forEach(req => {
      (req.statusHistory || []).forEach(h => {
        notifs.push({
          requestId: req._id,
          documentType: req.documentType,
          status: h.status,
          remarks: h.remarks,
          changedAt: new Date(h.changedAt).getTime()
        });
      });
    });
    return notifs.sort((a, b) => b.changedAt - a.changedAt).slice(0, 15);
  }, [requests]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => n.changedAt > notifLastSeen).length;
  }, [allNotifications, notifLastSeen]);

  const handleOpenNotifs = () => {
    setShowNotifs(prev => !prev);
    const now = Date.now();
    setNotifLastSeen(now);
    localStorage.setItem('notifLastSeen', now.toString());
  };

  const handleView = (req) => {
    setViewingRequest(req);
    setIsViewOpen(true);
  };

  const handleEditFromView = (req) => {
    setEditingRequest(req);
    setResubmitData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (req) => {
    setEditingRequest(req);
    setResubmitData(null);
    setIsModalOpen(true);
  };

  const handleNewRequest = () => {
    setEditingRequest(null);
    setResubmitData(null);
    setIsModalOpen(true);
  };

  // ✅ NEW: Resubmit rejected request as a new one
  const handleResubmit = (req) => {
    setIsViewOpen(false);
    setEditingRequest(null);
    setResubmitData({
      documentType: req.documentType,
      description: req.description || ''
    });
    setIsModalOpen(true);
  };

  // ✅ NEW: Mark Ready request as Completed
  const handleMarkCompleted = async (req) => {
    if (!window.confirm("Confirm you have picked up your document?")) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/api/docs/complete/${req._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsViewOpen(false);
      fetchMyRequests();
      alert("✅ Request marked as completed!");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Failed to mark as completed."));
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req =>
      req.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const activeCount = requests.filter(r => ['Pending', 'Under Review'].includes(r.status)).length;
  const readyCount = requests.filter(r => ['Approved', 'Ready'].includes(r.status)).length;
  const totalCompleted = requests.filter(r => r.status === 'Completed').length;

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      localStorage.clear(); sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  const statusStyles = {
    "Approved": "bg-emerald-100 text-emerald-700",
    "Under Review": "bg-amber-100 text-amber-700",
    "Ready": "bg-blue-100 text-blue-700",
    "Completed": "bg-slate-800 text-white",
    "Rejected": "bg-rose-100 text-rose-700",
    "Pending": "bg-slate-100 text-slate-700"
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 h-screen p-6 fixed z-20">
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => setActiveTab('Dashboard')}>
          <img src={neuLogo} alt="Logo" className="h-10 w-auto" />
          <div className="font-black text-2xl tracking-tighter text-slate-800">DocTrack</div>
        </div>
        <nav className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <NavItem icon={<Clock size={20} />} label="My Requests" active={activeTab === 'My Requests'} onClick={() => setActiveTab('My Requests')} />
          <NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
        </nav>
        <div className="absolute bottom-8 left-6 right-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-600">Servers Online</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-72">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-5 flex justify-between items-center sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search document type or ID..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm outline-none transition-all font-medium" />
          </div>
          <div className="flex items-center gap-5">

            {/* ✅ NEW: Notification Bell with dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleOpenNotifs}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                    <p className="font-black text-slate-800 text-sm">Notifications</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Recent Updates</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {allNotifications.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 text-sm font-medium">No notifications yet.</p>
                    ) : (
                      allNotifications.map((n, i) => {
                        const isUnread = n.changedAt > notifLastSeen;
                        const nDate = new Date(n.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={i} className={`px-5 py-3 border-b border-slate-50 ${isUnread ? 'bg-blue-50/50' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{n.documentType}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Status changed to <span className={`font-black px-1.5 py-0.5 rounded ${statusStyles[n.status] || 'bg-slate-100 text-slate-600'}`}>{n.status}</span>
                                </p>
                                {n.remarks && <p className="text-[10px] text-slate-400 mt-1 italic truncate">"{n.remarks}"</p>}
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <p className="text-[9px] text-slate-400">{nDate}</p>
                                {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l pl-5 border-slate-200 cursor-pointer hover:opacity-80" onClick={() => setActiveTab('Profile')}>
              <div className="text-right">
                <p className="font-bold text-slate-900 text-sm leading-none mb-1">{userName}</p>
                <p className="text-[9px] uppercase tracking-widest text-blue-500 font-black">{userRole}</p>
              </div>
              <img className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-50"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&bold=true`} alt="profile" />
            </div>
          </div>
        </header>

        <main className="p-10 max-w-7xl mx-auto">
          {activeTab === 'Dashboard' && (
            <>
              <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Portal</h1>
                <p className="text-slate-500 font-medium mt-1">Manage and track your document requests.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard title="Active" count={activeCount} color="blue" icon={<FileText size={24} />} status="In Progress" />
                <StatCard title="Ready for Pickup" count={readyCount} color="emerald" icon={<CheckCircle size={24} />} status="Available Now" />
                <StatCard title="Total Completed" count={totalCompleted} color="slate" icon={<Clock size={24} />} status="All Time" />
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-800">Recent Activity</h2>
                  <button onClick={() => setActiveTab('My Requests')} className="text-sm font-bold text-blue-600 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-20">
                      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="font-bold text-slate-400">Updating your records...</p>
                    </div>
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.slice(0, 5).map(req => (
                      <RequestItem key={req._id} req={req} onView={() => handleView(req)} onEdit={() => handleEdit(req)} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold">No requests found.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'My Requests' && (
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
              <h2 className="text-3xl font-black mb-8">All Document Requests</h2>
              <div className="space-y-3">
                {filteredRequests.map(req => (
                  <RequestItem key={req._id} req={req} onView={() => handleView(req)} onEdit={() => handleEdit(req)} />
                ))}
                {filteredRequests.length === 0 && <p className="text-center py-10 font-bold text-slate-400">No matching records.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="max-w-2xl mx-auto bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm text-center">
              <img className="w-32 h-32 rounded-3xl mx-auto mb-6 ring-4 ring-blue-50"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=128&bold=true`} alt="profile" />
              <h2 className="text-3xl font-black text-slate-900">{userName}</h2>
              <p className="text-blue-500 font-black uppercase tracking-widest text-xs mt-2">{userRole}</p>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <ProfileField label="Student ID" value={userId?.slice(-6).toUpperCase() || 'N/A'} />
                <ProfileField label="Account Status" value="Verified" isStatus />
                <ProfileField label="Email" value={userEmail} />
                <ProfileField label="Program" value={userProgram} />
                <ProfileField label="Year Level" value={userYear} />
              </div>
            </div>
          )}
        </main>
      </div>

      <button onClick={handleNewRequest} className="fixed bottom-10 right-10 bg-slate-900 text-white pl-6 pr-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-blue-600 transition-all active:scale-95 group z-30">
        <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform"><Plus size={20} /></div>
        NEW REQUEST
      </button>

      <ViewRequest
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        request={viewingRequest}
        onEdit={() => handleEditFromView(viewingRequest)}
        onResubmit={() => handleResubmit(viewingRequest)}       // ✅ NEW
        onMarkCompleted={() => handleMarkCompleted(viewingRequest)} // ✅ NEW
      />

      <Request
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setResubmitData(null); }}
        onSuccess={fetchMyRequests}
        initialData={editingRequest}
        resubmitData={resubmitData} // ✅ NEW
      />
    </div>
  );
};

// --- Sub-components ---
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center px-4 py-3 rounded-2xl font-black transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
    <div className="flex items-center gap-4 w-full">
      {icon}
      <span className="text-sm uppercase tracking-widest flex-grow text-left">{label}</span>
      {active && <ChevronRight size={16} />}
    </div>
  </button>
);

const StatCard = ({ title, count, color, icon, status }) => {
  const colorMap = { blue: "from-blue-500 to-blue-600 shadow-blue-200", emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200", slate: "from-slate-700 to-slate-900 shadow-slate-200" };
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm transition-transform hover:scale-[1.02] duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} text-white shadow-lg`}>{icon}</div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-5xl font-black text-slate-900 mt-1 tracking-tighter">{count}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-500 uppercase">{status}</p>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value, isStatus }) => (
  <div className="p-4 bg-slate-50 rounded-2xl">
    <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
    <p className={`font-bold mt-1 ${isStatus ? 'text-emerald-600' : 'text-slate-700'}`}>{value}</p>
  </div>
);

const RequestItem = ({ req, onView, onEdit }) => {
  const { _id, documentType, createdAt, status, remarks } = req;
  const date = new Date(createdAt).toLocaleDateString();
  const statusStyles = {
    "Approved": "bg-emerald-100 text-emerald-700", "Under Review": "bg-amber-100 text-amber-700",
    "Ready": "bg-blue-100 text-blue-700", "Completed": "bg-slate-800 text-white",
    "Rejected": "bg-rose-100 text-rose-700", "Pending": "bg-slate-100 text-slate-700"
  };
  const getRemarksString = () => {
    if (!remarks) return "";
    return typeof remarks === 'object' ? JSON.stringify(remarks) : remarks;
  };
  return (
    <div onClick={onView} className="group flex flex-col p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all bg-white cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors shadow-sm">
            <FileText size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800">{documentType}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">#{_id?.slice(-6).toUpperCase()}</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{date}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
          </span>
          {status === 'Pending' && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Request">
              <Edit3 size={18} />
            </button>
          )}
        </div>
      </div>
      {status === 'Rejected' && remarks && (
        <div className="mt-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Feedback from Admin:</p>
          <p className="text-xs text-rose-700 font-medium italic">"{getRemarksString()}"</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;