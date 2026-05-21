const router = require('express').Router();
const docController = require('../controllers/docController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, '/tmp'); },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png) and PDFs are allowed!'), false);
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

router.get('/all', docController.getAllRequests);

router.post('/create', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) return res.status(400).json({ message: `Upload error: ${err.message}` });
        else if (err) return res.status(400).json({ message: err.message });
        next();
    });
}, docController.createRequest);

router.patch('/status/:id', docController.updateRequestStatus);
router.patch('/update/:id', upload.single('file'), docController.updateRequestContent);
router.patch('/complete/:id', docController.markCompleted); // ✅ NEW: student marks as completed

module.exports = router;