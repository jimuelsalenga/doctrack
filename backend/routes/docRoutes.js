const router = require('express').Router();
const docController = require('../controllers/docController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir + '/');
    },
    filename: (req, file, cb) => {
        // Use path.extname to keep the original file extension safely
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Optional: allow only PDFs and Images)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
    fileFilter: fileFilter
});

// ====================== ROUTES ======================

// GET: Fetch all requests (Filtered by role/userId via query params)
// Endpoint: GET /api/docs/all
router.get('/all', docController.getAllRequests);

// POST: Create a new document request with file upload
// Endpoint: POST /api/docs/create
router.post('/create', upload.single('file'), docController.createRequest);

// PATCH: Update status and remarks (Admin Only)
// Endpoint: PATCH /api/docs/status/:id
router.patch('/status/:id', docController.updateRequestStatus);

// PATCH: Update document content/description (User Edit)
// Endpoint: PATCH /api/docs/update/:id
// Note: Logic moved to docController.updateRequestContent for consistency
router.patch('/update/:id', upload.single('file'), docController.updateRequestContent);

module.exports = router;