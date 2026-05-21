import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, X, RotateCcw } from 'lucide-react';

const Request = ({ isOpen, onClose, onSuccess, initialData, resubmitData }) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://doctrack-taupe.vercel.app';

  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const isResubmit = !!resubmitData;  // ✅ NEW: resubmit mode
  const isEdit = !!initialData && !isResubmit;

  const documentTypes = [
    "Transcript of Records", "Certificate of Good Moral", "Diploma",
    "Certificate of Enrollment", "Honorable Dismissal"
  ];

useEffect(() => {
    if (!isOpen) return;
    if (isResubmit) {
      setDocumentType(resubmitData.documentType || '');
      setDescription(resubmitData.description || '');
      setFile(null);
    } else if (initialData) {
      setDocumentType(initialData.documentType || '');
      setDescription(initialData.description || '');
      setFile(null);
    } else {
      setDocumentType('');
      setDescription('');
      setFile(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, resubmitData, isOpen]);

  const resetForm = () => {
    setDocumentType('');
    setDescription('');
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Resubmit and new requests always require a file
    if (!documentType || ((!isEdit) && !file)) {
      alert("Please provide all required fields including a file.");
      return;
    }

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('email');
    const userName = localStorage.getItem('name');
    const userProgram = localStorage.getItem('program');
    const userYear = localStorage.getItem('yearLevel');

    if (!isEdit && (!userId || !userEmail)) {
      alert("User session error. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('description', description || '');
      formData.append('requester', userId);
      formData.append('requesterName', userName || "Student");
      formData.append('requesterEmail', userEmail);
      formData.append('program', userProgram || 'N/A');
      formData.append('yearLevel', userYear || 'N/A');

      if (file) formData.append('file', file);

      // ✅ Resubmit always creates a NEW request
      const url = isEdit
        ? `${API_BASE_URL}/api/docs/update/${initialData._id}`
        : `${API_BASE_URL}/api/docs/create`;

      const method = isEdit ? 'patch' : 'post';

      await axios({ method, url, data: formData, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });

      const successMsg = isResubmit
        ? "✅ Request resubmitted successfully!"
        : isEdit
        ? "✅ Request updated successfully!"
        : "✅ Request submitted successfully!";

      alert(successMsg);
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Submission Error:", err.response?.data);
      alert(`❌ ${err.response?.data?.message || "Error processing request."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert("Only PDFs and Images (JPG/PNG) are allowed!");
      e.target.value = null;
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("File is too large! Maximum size is 5MB.");
      e.target.value = null;
      return;
    }
    setFile(selectedFile);
  };

  if (!isOpen) return null;

  // ✅ Dynamic title based on mode
  const modalTitle = isResubmit ? 'Resubmit Request' : isEdit ? 'Edit Request' : 'New Request';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              {isResubmit && <RotateCcw size={20} className="text-amber-500" />}
              {modalTitle}
            </h2>
            {/* ✅ Resubmit notice */}
            {isResubmit && (
              <p className="text-xs text-amber-600 font-medium mt-1">Your previous request was rejected. Please upload a new file.</p>
            )}
          </div>
          <button onClick={() => { resetForm(); onClose(); }} className="text-slate-400 hover:text-slate-600">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Document Type *</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-medium">
              <option value="">Select a document...</option>
              {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description / Purpose</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none focus:border-blue-500 font-medium"
              placeholder="e.g., For scholarship application..." rows={3} />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              {isEdit ? 'Update File (Optional)' : 'Supporting File (ID/Clearance) *'}
            </label>
            <div className={`border-2 border-dashed rounded-3xl p-6 text-center transition-colors ${file ? 'border-emerald-200 bg-emerald-50' : isResubmit ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
              <Upload size={32} className={`mx-auto mb-3 ${file ? 'text-emerald-500' : isResubmit ? 'text-amber-400' : 'text-slate-300'}`} />
              <label className="cursor-pointer bg-white border px-6 py-2.5 rounded-xl inline-block font-bold hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                {file ? 'Change File' : 'Choose File'}
                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
              </label>
              <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase">PDF, JPG, or PNG only (Max 5MB)</p>
              {file && <p className="mt-2 text-xs text-emerald-600 font-bold truncate px-4">{file.name}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { resetForm(); onClose(); }}
              className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest text-xs">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:bg-slate-400 uppercase tracking-widest text-xs ${isResubmit ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-blue-600'}`}>
              {loading ? "Processing..." : isResubmit ? "Resubmit" : isEdit ? "Save Changes" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Request;