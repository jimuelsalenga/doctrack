const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true, trim: true, lowercase: true },
    documentType: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    fileName: { type: String },
    filePath: { type: String },
    fileUrl: { type: String },  // ✅ NEW: Cloudinary public URL
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Ready', 'Rejected'],
        default: 'Pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true, maxlength: 300, default: "" },
    statusHistory: [{
        status: String,
        remarks: String,
        changedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

RequestSchema.index({ requester: 1, status: 1 });
RequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Request', RequestSchema);