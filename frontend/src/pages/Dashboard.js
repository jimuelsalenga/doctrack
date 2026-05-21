import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import neuLogo from '../assets/neu-logo.png';
import {
  Search, Plus, FileText, Clock, CheckCircle, Edit3,
  User, LogOut, LayoutDashboard, ChevronRight, Bell,
  X, RefreshCw, AlertCircle, Package, Filter,
  ChevronDown, TrendingUp, Calendar, Hash, Inbox
} from 'lucide-react';
import Request from '../components/Request';
import ViewRequest from '../components/ViewRequest';

const API_BASE_URL = 'https://doctrack-taupe.vercel.app';

// ─── Status config (single source of truth) ───────────────────────────────────
const STATUS_CONFIG = {
  'Pending':      { bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-400'   },
  'Under Review': { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  'Approved':     { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Ready':        { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  'Completed':    { bg: 'bg-slate-800',   text: 'text-white',       dot: 'bg-white'       },
  'Rejected':     { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
};

const StatusPill = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} ${size === 'sm' ? 'px-2.5 py-1 text-[9px]' : 'px-3.5 py-1.5 text-[10px]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Timeline tracker ──────────────────────────────────────────────────────────
const STEPS = ['Pending', 'Under Review', 'Approved', 'Ready', 'Completed'];
const stepIndex = (status) => {
  if (status === 'Rejected') return -1;
  return STEPS.indexOf(status);
};

const StatusTimeline = ({ status }) => {
  const current = stepIndex(status);
  if (current === -1) return (
    <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
      <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
      <p className="text-xs font-bold text-rose-600">This request was rejected.</p>
    </div>
  );
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${i < current ? 'bg-emerald-500' : i === current ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-200'}`}>
              {i < current ? <CheckCircle size={12} className="text-white" /> :
               i === current ? <div className="w-2 h-2 bg-white rounded-full" /> :
               <div className="w-2 h-2 bg-slate-300 rounded-full" />}
            </div>
            <p className={`text-[8px] font-black uppercase leading-none text-center max-w-[42px] ${i === current ? 'text-blue-600' : i < current ? 'text-emerald-600' : 'text-slate-300'}`}>
              {step === 'Under Review' ? 'Review' : step}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-3 transition-all ${i < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const userName    = localStorage.getItem('name')      || 'Student';
  const userRole    = localStorage.getItem('role')      || 'Requester';
  const userId      = localStorage.getItem('userId');
  const token       = localStorage.getItem('token');
  const userEmail   = localStorage.getItem('email')     || 'N/A';
  const userProgram = localStorage.getItem('program')   || 'N/A';
  const userYear    = localStorage.getItem('yearLevel') || 'N/A';

  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [resubmitData,   setResubmitData]   = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [isViewOpen,     setIsViewOpen]     = useState(false);
  const [requests,       setRequests]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('Dashboard');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('All');
  const [showFilter,     setShowFilter]     = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);

  // Notifications
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [notifLastSeen, setNotifLastSeen] = useState(() =>
    parseInt(localStorage.getItem('notifLastSeen') || '0')
  );
  const notifRef  = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!token) window.location.replace('/login');
    if (userRole === 'Admin') window.location.replace('/admin');
  }, [token, userRole]);

  const fetchMyRequests = useCallback(async (silent = false) => {
    if (!token || !userId || userId === 'undefined') { setLoading(false); return; }
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/docs/all`, {
        params: { userId, role: userRole },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); window.location.replace('/login'); }
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [token, userId, userRole]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setShowNotifs(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Notifications derived from statusHistory
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

  const unreadCount = useMemo(() =>
    allNotifications.filter(n => n.changedAt > notifLastSeen).length,
    [allNotifications, notifLastSeen]
  );

  const handleOpenNotifs = () => {
    setShowNotifs(prev => !prev);
    const now = Date.now();
    setNotifLastSeen(now);
    localStorage.setItem('notifLastSeen', now.toString());
  };

  // Handlers
  const handleView          = (req) => { setViewingRequest(req); setIsViewOpen(true); };
  const handleEdit          = (req) => { setEditingRequest(req); setResubmitData(null); setIsModalOpen(true); };
  const handleEditFromView  = (req) => handleEdit(req);
  const handleNewRequest    = ()    => { setEditingRequest(null); setResubmitData(null); setIsModalOpen(true); };
  const handleResubmit      = (req) => {
    setIsViewOpen(false);
    setEditingRequest(null);
    setResubmitData({ documentType: req.documentType, description: req.description || '' });
    setIsModalOpen(true);
  };
  const handleMarkCompleted = async (req) => {
    if (!window.confirm('Confirm you have picked up your document?')) return;
    try {
      await axios.patch(`${API_BASE_URL}/api/docs/complete/${req._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsViewOpen(false);
      fetchMyRequests(true);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to mark as completed.'));
    }
  };

  // Filtered + searched data
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchSearch = req.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req._id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'All' || req.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, searchTerm, filterStatus]);

  // Stats
  const stats = {
    active:    requests.filter(r => ['Pending', 'Under Review'].includes(r.status)).length,
    ready:     requests.filter(r => ['Approved', 'Ready'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'Completed').length,
    rejected:  requests.filter(r => r.status === 'Rejected').length,
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.clear(); sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  // Most recent request for quick-status card
  const latestRequest = requests[0] || null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex font-sans text-slate-900">

      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-68 bg-white border-r border-slate-200 h-screen p-6 fixed z-20 flex flex-col" style={{ width: '272px' }}>
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab('Dashboard')}>
          <img src={neuLogo} alt="Logo" className="h-10 w-auto" />
          <div className="font-black text-2xl tracking-tighter text-slate-800">DocTrack</div>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'Dashboard',   icon: <LayoutDashboard size={19} />, label: 'Dashboard'   },
            { id: 'My Requests', icon: <Inbox size={19} />,           label: 'My Requests' },
            { id: 'Profile',     icon: <User size={19} />,            label: 'Profile'     },
          ].map(({ id, icon, label }) => (
            <NavItem key={id} icon={icon} label={label} active={activeTab === id} onClick={() => setActiveTab(id)} />
          ))}
        </nav>

        {/* Quick status of latest request */}
        {latestRequest && (
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:border-blue-200 transition-all"
               onClick={() => handleView(latestRequest)}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Latest Request</p>
            <p className="text-xs font-bold text-slate-700 truncate mb-2">{latestRequest.documentType}</p>
            <StatusPill status={latestRequest.status} />
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-slate-500">System Online</span>
          </div>
          <button onClick={handleSignOut}
            className="w-full bg-rose-50 text-rose-600 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 ml-[272px]">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search by document type or ID…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none transition-all font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 border border-transparent" />
          </div>

          <div className="flex items-center gap-4">
            {/* Refresh */}
            <button onClick={() => fetchMyRequests(true)}
              className={`p-2 text-slate-400 hover:text-blue-600 transition-all ${refreshing ? 'animate-spin text-blue-500' : ''}`}>
              <RefreshCw size={18} />
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={handleOpenNotifs}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                    <p className="font-black text-slate-800 text-sm">Notifications</p>
                    <button onClick={() => setShowNotifs(false)}><X size={14} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {allNotifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={28} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-bold">No notifications yet</p>
                      </div>
                    ) : allNotifications.map((n, i) => {
                      const isUnread = n.changedAt > notifLastSeen;
                      const nDate = new Date(n.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={i} className={`px-5 py-3.5 ${isUnread ? 'bg-blue-50/60' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{n.documentType}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <StatusPill status={n.status} />
                              </div>
                              {n.remarks && <p className="text-[10px] text-slate-400 mt-1 italic truncate">"{n.remarks}"</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <p className="text-[9px] text-slate-400 whitespace-nowrap">{nDate}</p>
                              {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + name */}
            <button onClick={() => setActiveTab('Profile')}
              className="flex items-center gap-3 border-l pl-4 border-slate-200 hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="font-bold text-slate-900 text-sm leading-none">{userName}</p>
                <p className="text-[9px] uppercase tracking-widest text-blue-500 font-black mt-0.5">{userProgram}</p>
              </div>
              <img className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-100"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&bold=true`} alt="avatar" />
            </button>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">

          {/* ── Dashboard Tab ── */}
          {activeTab === 'Dashboard' && (
            <>
              {/* Greeting */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Good {getGreeting()}, <span className="text-blue-600">{firstName(userName)}</span> 👋
                </h1>
                <p className="text-slate-500 font-medium mt-1 text-sm">Here's an overview of your document requests.</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Active" value={stats.active}    accent="blue"    icon={<Clock size={18}/>}         note="Pending + Review" />
                <StatCard label="Ready"  value={stats.ready}     accent="emerald" icon={<Package size={18}/>}       note="For pickup" />
                <StatCard label="Done"   value={stats.completed} accent="slate"   icon={<CheckCircle size={18}/>}   note="Completed" />
                <StatCard label="Total"  value={requests.length} accent="indigo"  icon={<TrendingUp size={18}/>}    note="All requests" />
              </div>

              {/* Alert banner for rejected requests */}
              {stats.rejected > 0 && (
                <div className="mb-6 flex items-center gap-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="p-2 bg-rose-100 rounded-xl flex-shrink-0"><AlertCircle size={18} className="text-rose-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-rose-700">
                      {stats.rejected} request{stats.rejected > 1 ? 's were' : ' was'} rejected
                    </p>
                    <p className="text-xs text-rose-500 font-medium">Review the feedback and resubmit if needed.</p>
                  </div>
                  <button onClick={() => { setFilterStatus('Rejected'); setActiveTab('My Requests'); }}
                    className="text-xs font-black text-rose-600 underline whitespace-nowrap">View All</button>
                </div>
              )}

              {/* Ready for pickup banner */}
              {requests.some(r => r.status === 'Ready') && (
                <div className="mb-6 flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0"><Package size={18} className="text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-blue-700">Your document is ready for pickup!</p>
                    <p className="text-xs text-blue-500 font-medium">Visit the Registrar's Office to claim your document.</p>
                  </div>
                  <button onClick={() => { setFilterStatus('Ready'); setActiveTab('My Requests'); }}
                    className="text-xs font-black text-blue-600 underline whitespace-nowrap">View</button>
                </div>
              )}

              {/* Recent activity */}
              <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-800">Recent Activity</h2>
                  <button onClick={() => setActiveTab('My Requests')}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    View All <ChevronRight size={13} />
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {loading ? <LoadingRows /> :
                   filteredRequests.length > 0 ?
                   filteredRequests.slice(0, 5).map(req => (
                     <RequestRow key={req._id} req={req} onView={() => handleView(req)} onEdit={() => handleEdit(req)} />
                   )) :
                   <EmptyState message="No document requests yet." onNew={handleNewRequest} />}
                </div>
              </div>
            </>
          )}

          {/* ── My Requests Tab ── */}
          {activeTab === 'My Requests' && (
            <>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">My Requests</h1>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {/* Filter dropdown */}
                <div className="relative" ref={filterRef}>
                  <button onClick={() => setShowFilter(p => !p)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${filterStatus !== 'All' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                    <Filter size={15} />
                    {filterStatus === 'All' ? 'Filter by Status' : filterStatus}
                    <ChevronDown size={14} />
                  </button>
                  {showFilter && (
                    <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2 min-w-[160px]">
                      {['All', ...Object.keys(STATUS_CONFIG)].map(s => (
                        <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-all ${filterStatus === s ? 'text-blue-600' : 'text-slate-600'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {loading ? <LoadingRows /> :
                   filteredRequests.length > 0 ?
                   filteredRequests.map(req => (
                     <RequestRow key={req._id} req={req} onView={() => handleView(req)} onEdit={() => handleEdit(req)} showTimeline />
                   )) :
                   <EmptyState message={filterStatus !== 'All' ? `No ${filterStatus} requests.` : 'No requests found.'} onNew={handleNewRequest} />}
                </div>
              </div>
            </>
          )}

          {/* ── Profile Tab ── */}
          {activeTab === 'Profile' && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-black text-slate-900 mb-6">My Profile</h1>

              {/* Profile hero */}
              <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-8 mb-4">
                <div className="flex items-center gap-6">
                  <img className="w-20 h-20 rounded-2xl ring-4 ring-blue-50"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=128&bold=true`} alt="avatar" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{userName}</h2>
                    <p className="text-blue-500 font-black uppercase tracking-widest text-[10px] mt-1">{userRole}</p>
                    <p className="text-slate-500 text-sm font-medium mt-0.5">{userEmail}</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Info fields */}
              <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-8 mb-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">Student Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label="Student ID"   value={userId?.slice(-6).toUpperCase() || 'N/A'} icon={<Hash size={14}/>} />
                  <ProfileField label="Program"       value={userProgram}                              icon={<FileText size={14}/>} />
                  <ProfileField label="Year Level"    value={userYear}                                 icon={<Calendar size={14}/>} />
                  <ProfileField label="Email"         value={userEmail}                                icon={<User size={14}/>} />
                </div>
              </div>

              {/* Request summary */}
              <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-8">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">Request Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(STATUS_CONFIG).map(([status]) => {
                    const count = requests.filter(r => r.status === status).length;
                    return (
                      <button key={status} onClick={() => { setFilterStatus(status); setActiveTab('My Requests'); }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                        <StatusPill status={status} />
                        <span className="font-black text-slate-700">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── FAB ─────────────────────────────────────────────────────────────── */}
      <button onClick={handleNewRequest}
        className="fixed bottom-8 right-8 bg-slate-900 text-white pl-5 pr-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-2xl hover:bg-blue-600 transition-all active:scale-95 group z-30">
        <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
          <Plus size={16} />
        </div>
        New Request
      </button>

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}
      <ViewRequest
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        request={viewingRequest}
        onEdit={() => handleEditFromView(viewingRequest)}
        onResubmit={() => handleResubmit(viewingRequest)}
        onMarkCompleted={() => handleMarkCompleted(viewingRequest)}
      />
      <Request
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setResubmitData(null); }}
        onSuccess={fetchMyRequests}
        initialData={editingRequest}
        resubmitData={resubmitData}
      />
    </div>
  );
};

// ─── Helper functions ──────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
const firstName = (name) => name.split(' ')[0];

// ─── Sub-components ────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {active && <ChevronRight size={15} />}
  </button>
);

const StatCard = ({ label, value, accent, icon, note }) => {
  const accents = {
    blue:   { ring: 'ring-blue-100',   bg: 'bg-blue-50',   text: 'text-blue-600',   num: 'text-blue-700'   },
    emerald:{ ring: 'ring-emerald-100',bg: 'bg-emerald-50',text: 'text-emerald-600',num: 'text-emerald-700'},
    slate:  { ring: 'ring-slate-100',  bg: 'bg-slate-100', text: 'text-slate-600',  num: 'text-slate-700'  },
    indigo: { ring: 'ring-indigo-100', bg: 'bg-indigo-50', text: 'text-indigo-600', num: 'text-indigo-700' },
  };
  const a = accents[accent] || accents.slate;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className={`w-9 h-9 ${a.bg} ${a.text} rounded-xl flex items-center justify-center mb-3 ring-4 ${a.ring}`}>{icon}</div>
      <p className={`text-3xl font-black ${a.num} leading-none`}>{value}</p>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{note}</p>
    </div>
  );
};

const ProfileField = ({ label, value, icon }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-slate-400">{icon}</span>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="font-bold text-slate-700 text-sm truncate" title={value}>{value}</p>
  </div>
);

const LoadingRows = () => (
  <div className="py-16 text-center">
    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
    <p className="font-bold text-slate-400 text-sm">Loading your requests…</p>
  </div>
);

const EmptyState = ({ message, onNew }) => (
  <div className="py-16 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <FileText size={24} className="text-slate-300" />
    </div>
    <p className="font-bold text-slate-400 text-sm mb-4">{message}</p>
    <button onClick={onNew}
      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-blue-600 transition-all">
      + New Request
    </button>
  </div>
);

const RequestRow = ({ req, onView, onEdit, showTimeline = false }) => {
  const { _id, documentType, createdAt, status, remarks } = req;
  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const remarksStr = !remarks ? '' : typeof remarks === 'object' ? JSON.stringify(remarks) : remarks;

  return (
    <div onClick={onView} className="group px-8 py-5 hover:bg-slate-50/70 transition-all cursor-pointer">
      <div className="flex items-center justify-between gap-4">
        {/* Icon + info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all flex-shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{documentType}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-mono font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                #{_id?.slice(-6).toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{date}</span>
            </div>
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusPill status={status} />
          {status === 'Pending' && (
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit Request">
              <Edit3 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline (My Requests tab only) */}
      {showTimeline && status !== 'Rejected' && (
        <div className="mt-4 pl-14">
          <StatusTimeline status={status} />
        </div>
      )}

      {/* Rejection feedback */}
      {status === 'Rejected' && remarksStr && (
        <div className="mt-3 ml-14 p-3 bg-rose-50 border-l-4 border-rose-400 rounded-r-xl">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Admin Feedback</p>
          <p className="text-xs text-rose-700 font-medium italic">"{remarksStr}"</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;