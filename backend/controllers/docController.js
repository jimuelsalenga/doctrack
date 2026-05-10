const Request = require('../models/Request');

// Get all requests (Filtered by role)
exports.getAllRequests = async (req, res) => {
    try {
        const { role, userId } = req.query;
        let query = {};

        // If requester, only show their own documents
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

// Update request status (Admin action)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; 

        const updatedRequest = await Request.findByIdAndUpdate(
            id,
            { 
                status, 
                remarks, 
                $push: { 
                    statusHistory: { 
                        status, 
                        remarks, 
                        changedAt: new Date() 
                    } 
                } 
            },
            { new: true, runValidators: true }
        );

        if (!updatedRequest) return res.status(404).json({ message: "Request not found" });
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: "Error updating status", error: err.message });
    }
};

// Create new request
exports.createRequest = async (req, res) => {
    try {
        const { requester, requesterName, requesterEmail, documentType, description, program, yearLevel } = req.body;

        if (!requesterEmail || requesterEmail === 'undefined') {
            return res.status(400).json({ message: "Requester email is missing." });
        }

        const newRequest = new Request({
            requester,
            requesterName,
            requesterEmail,
            documentType,
            description,
            // Capture these from the frontend state
            program: program || 'N/A',
            yearLevel: yearLevel || 'N/A',
            fileName: req.file ? req.file.filename : null,
            // NOTE: On Vercel, this path in /tmp is temporary!
            filePath: req.file ? req.file.path : null, 
            status: 'Pending'
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: "Error creating request", error: err.message });
    }
};

// Update request content (User Edit)
exports.updateRequestContent = async (req, res) => {
    try {
        const { documentType, description } = req.body;
        const updateData = { documentType, description };

        if (req.file) {
            updateData.fileName = req.file.filename;
            updateData.filePath = req.file.path;
        }

        const updatedDoc = await Request.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );
        
        if (!updatedDoc) return res.status(404).json({ message: "Document not found" });
        res.json(updatedDoc);
    } catch (err) {
        res.status(500).json({ message: "Error updating content", error: err.message });
    }
};