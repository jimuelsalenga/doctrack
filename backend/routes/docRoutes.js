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
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png) and PDFs are allowed!'), false);
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

/**
 * @swagger
 * tags:
 *   name: Document Requests
 *   description: Submit and manage document requests
 */

/**
 * @swagger
 * /api/docs/all:
 *   get:
 *     summary: Get all document requests (Admin gets all, Requester gets own)
 *     tags: [Document Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Requester, Admin]
 *         description: Role of the requesting user
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Required when role is Requester
 *     responses:
 *       200:
 *         description: List of document requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Request'
 *       401:
 *         description: Unauthorized
 */
router.get('/all', docController.getAllRequests);

/**
 * @swagger
 * /api/docs/create:
 *   post:
 *     summary: Submit a new document request
 *     tags: [Document Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [documentType, requester, requesterName, requesterEmail]
 *             properties:
 *               documentType:
 *                 type: string
 *                 example: Transcript of Records
 *               description:
 *                 type: string
 *                 example: For scholarship application
 *               requester:
 *                 type: string
 *                 example: 6a0d9c4543da9bbf31ef4918
 *               requesterName:
 *                 type: string
 *                 example: Juan Dela Cruz
 *               requesterEmail:
 *                 type: string
 *                 example: juan@gmail.com
 *               program:
 *                 type: string
 *                 example: BS in Computer Science
 *               yearLevel:
 *                 type: string
 *                 example: 2nd Year
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Supporting file (PDF, JPG, PNG — max 5MB)
 *     responses:
 *       201:
 *         description: Request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Request'
 *       400:
 *         description: Missing required fields
 */
router.post('/create', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) return res.status(400).json({ message: `Upload error: ${err.message}` });
        else if (err) return res.status(400).json({ message: err.message });
        next();
    });
}, docController.createRequest);

/**
 * @swagger
 * /api/docs/status/{id}:
 *   patch:
 *     summary: Update request status (Admin only)
 *     tags: [Document Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Under Review, Approved, Ready, Rejected, Completed]
 *                 example: Approved
 *               remarks:
 *                 type: string
 *                 example: Documents verified and approved.
 *               estimatedDays:
 *                 type: number
 *                 example: 3
 *                 description: Days until ready (used when status is Approved or Ready)
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Request'
 *       404:
 *         description: Request not found
 */
router.patch('/status/:id', docController.updateRequestStatus);

/**
 * @swagger
 * /api/docs/update/{id}:
 *   patch:
 *     summary: Edit a pending document request (Student only)
 *     tags: [Document Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 example: Diploma
 *               description:
 *                 type: string
 *                 example: For board exam application
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New supporting file (optional)
 *     responses:
 *       200:
 *         description: Request updated successfully
 *       404:
 *         description: Request not found
 */
router.patch('/update/:id', upload.single('file'), docController.updateRequestContent);

/**
 * @swagger
 * /api/docs/complete/{id}:
 *   patch:
 *     summary: Mark a Ready request as Completed (Student confirms pickup)
 *     tags: [Document Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Request'
 *       400:
 *         description: Only Ready requests can be completed
 *       404:
 *         description: Request not found
 */
router.patch('/complete/:id', docController.markCompleted);

module.exports = router;