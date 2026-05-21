import React, { useState } from 'react';
import { X, FileText, Clock, Edit3, CheckCircle, XCircle, AlertCircle, ExternalLink, RotateCcw, PackageCheck, CalendarClock } from 'lucide-react';

const statusConfig = {
    "Pending":      { color: "bg-slate-100 text-slate-700",     icon: <Clock size={14} />,        bar: "bg-slate-400"   },
    "Under Review": { color: "bg-amber-100 text-amber-700",     icon: <AlertCircle size={14} />,  bar: "bg-amber-400"   },
    "Approved":     { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={14} />,  bar: "bg-emerald-500" },
    "Ready":        { color: "bg-blue-100 text-blue-700",       icon: <CheckCircle size={14} />,  bar: "bg-blue-500"    },
    "Rejected":     { color: "bg-rose-100 text-rose-700",       icon: <XCircle size={14} />,      bar: "bg-rose-500"    },
    "Completed":    { color: "bg-slate-800 text-white",         icon: <CheckCircle size={14} />,  bar: "bg-slate-800"   },
};

const FilePreview = ({ fileUrl, fileName }) => {
    const [imgError, setImgError] = useState(false);
    if (!fileUrl) return <p className="text-sm text-slate-400 font-medium">No file attached.</p>;
    const isPdf = fileName?.toLowerCase().endsWith('.pdf');
    return (
        <div className="space-y-3">
            {!isPdf && !imgError && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={fileUrl} alt={fileName || 'Uploaded file'} className="w-full max-h-64 object-contain" onError={() => setImgError(true)} />
                </div>
            )}
            {isPdf && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50" style={{ height: '300px' }}>
                    <iframe src={fileUrl} title="PDF Preview" className="w-full h-full" />
                </div>
            )}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate">{fileName || 'Uploaded file'}</span>
                </div>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:underline flex-shrink-0 ml-2">
                    Open <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};

const ViewRequest = ({ isOpen, onClose, request, onEdit, onResubmit, onMarkCompleted }) => {
    if (!isOpen || !request) return null;

    const { documentType, description, status, remarks, requesterName, fileName, fileUrl, createdAt, statusHistory = [], dueDate, estimatedDays } = request;
    const cfg = statusConfig[status] || statusConfig["Pending"];
    const canEdit = status === 'Pending';
    const canResubmit = status === 'Rejected';       // ✅ NEW
    const canComplete = status === 'Ready';           // ✅ NEW

    const fmt = (date) => date
        ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    const fmtDate = (date) => date
        ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                <div className="px-8 pt-8 pb-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Request Details</p>
                        <h2 className="text-2xl font-black text-slate-900">{documentType}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-1"><X size={24} /></button>
                </div>

                <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">

                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Status</span>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${cfg.color}`}>
                            {cfg.icon} {status}
                        </span>
                    </div>

                    {/* ✅ NEW: Due date / estimated processing time */}
                    {(status === 'Approved' || status === 'Ready') && dueDate && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                            <CalendarClock size={20} className="text-blue-500 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Estimated Ready By</p>
                                <p className="text-sm font-bold text-blue-800 mt-0.5">{fmtDate(dueDate)}</p>
                                {estimatedDays && <p className="text-[10px] text-blue-400 mt-0.5">Processing time: {estimatedDays} day{estimatedDays > 1 ? 's' : ''}</p>}
                            </div>
                        </div>
                    )}

                    {/* ✅ NEW: Ready for pickup banner */}
                    {status === 'Ready' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                            <PackageCheck size={20} className="text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ready for Pickup</p>
                                <p className="text-xs text-emerald-700 font-medium mt-0.5">Visit the Registrar's Office to claim your document.</p>
                            </div>
                        </div>
                    )}

                    {/* Admin feedback on rejection */}
                    {status === 'Rejected' && remarks && (
                        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Admin Feedback</p>
                            <p className="text-sm text-rose-700 font-medium italic">"{remarks}"</p>
                        </div>
                    )}

                    {/* General remarks */}
                    {status !== 'Rejected' && remarks && (
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-2xl">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Remarks</p>
                            <p className="text-sm text-blue-700 font-medium">{remarks}</p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description / Purpose</p>
                        <p className="text-sm text-slate-700 font-medium">{description || 'No description provided.'}</p>
                    </div>

                    {/* File */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Supporting File</p>
                        <FilePreview fileUrl={fileUrl} fileName={fileName} />
                    </div>

                    {/* Submitted by / date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Submitted By</p>
                            <p className="text-sm font-bold text-slate-700">{requesterName}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Submitted On</p>
                            <p className="text-sm font-bold text-slate-700">{fmt(createdAt)}</p>
                        </div>
                    </div>

                    {/* Status History */}
                    {statusHistory.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Status History</p>
                            <div className="space-y-2">
                                {[...statusHistory].reverse().map((h, i) => {
                                    const hcfg = statusConfig[h.status] || statusConfig["Pending"];
                                    return (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${hcfg.bar}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${hcfg.color}`}>{h.status}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{fmt(h.changedAt)}</span>
                                                </div>
                                                {h.remarks && <p className="text-xs text-slate-600 mt-1 italic">"{h.remarks}"</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="px-8 pb-8 pt-4 border-t border-slate-100 flex gap-3 flex-wrap">
                    <button onClick={onClose} className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest text-xs border border-slate-200">
                        Close
                    </button>

                    {/* ✅ Edit button for Pending */}
                    {canEdit && (
                        <button onClick={() => { onClose(); onEdit(); }} className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <Edit3 size={15} /> Edit
                        </button>
                    )}

                    {/* ✅ NEW: Resubmit button for Rejected */}
                    {canResubmit && (
                        <button onClick={onResubmit} className="flex-1 py-3.5 bg-amber-500 text-white font-bold rounded-2xl shadow hover:bg-amber-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <RotateCcw size={15} /> Resubmit
                        </button>
                    )}

                    {/* ✅ NEW: Mark as Completed button for Ready */}
                    {canComplete && (
                        <button onClick={onMarkCompleted} className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <PackageCheck size={15} /> Mark Picked Up
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewRequest;