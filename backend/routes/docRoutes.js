const router = require('express').Router();
const docController = require('../controllers/docController');
const multer = require('multer');
const path = require('path');

// NOTE: We removed the fs.mkdirSync('uploads') block because Vercel is read-only.

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use /tmp for serverless environments like Vercel
        cb(null, '/tmp'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: fileFilter
});

// Routes
router.get('/all', docController.getAllRequests);
router.post('/create', upload.single('file'), docController.createRequest);
router.patch('/status/:id', docController.updateRequestStatus);
router.patch('/update/:id', upload.single('file'), docController.updateRequestContent);

module.exports = router;