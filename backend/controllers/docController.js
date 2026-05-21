const Request = require('../models/Request');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath, originalName) => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'doctrack',
        resource_type: 'auto',
        public_id: `${Date.now()}-${originalName}`,
    });
    try { fs.unlinkSync(filePath); } catch (_) {}
    return result.secure_url;
};

exports.getAllRequests = async (req, res) => {
    try {
        const { role, userId } = req.query;
        let query = {};
        if (role === 'Requester') {
            if (!userId) return res.status(400).json({ message: "User ID is required" });
            query = { requester: userId };
        }
        const requests = await Request.find(query).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching requests", error: err.message });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const updatedRequest = await Request.findByIdAndUpdate(
            id,
            { status, remarks, $push: { statusHistory: { status, remarks, changedAt: new Date() } } },
            { new: true, runValidators: true }
        );
        if (!updatedRequest) return res.status(404).json({ message: "Request not found" });
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: "Error updating status", error: err.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { requester, requesterName, requesterEmail, documentType, description, program, yearLevel } = req.body;

        if (!requesterEmail || requesterEmail === 'undefined') {
            return res.status(400).json({ message: "Requester email is missing." });
        }

        let fileUrl = null;
        let fileName = null;
        if (req.file) {
            fileName = req.file.originalname;
            fileUrl = await uploadToCloudinary(req.file.path, req.file.originalname);
        }

        const newRequest = new Request({
            requester, requesterName, requesterEmail,
            documentType, description,
            program: program || 'N/A',
            yearLevel: yearLevel || 'N/A',
            fileName,
            fileUrl,
            status: 'Pending'
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error("Error creating request:", err);
        res.status(500).json({ message: "Error creating request", error: err.message });
    }
};

exports.updateRequestContent = async (req, res) => {
    try {
        const { documentType, description } = req.body;
        const updateData = { documentType, description };

        if (req.file) {
            updateData.fileName = req.file.originalname;
            updateData.fileUrl = await uploadToCloudinary(req.file.path, req.file.originalname);
        }

        const updatedDoc = await Request.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedDoc) return res.status(404).json({ message: "Document not found" });
        res.json(updatedDoc);
    } catch (err) {
        res.status(500).json({ message: "Error updating content", error: err.message });
    }
};