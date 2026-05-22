const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Dela Cruz
 *               email:
 *                 type: string
 *                 example: juan@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [Requester, Admin]
 *                 example: Requester
 *               program:
 *                 type: string
 *                 example: BS in Computer Science
 *               yearLevel:
 *                 type: string
 *                 example: 2nd Year
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully!
 *       400:
 *         description: Email already exists or missing fields
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, program, yearLevel } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) return res.status(400).json({ error: "Email already exists" });

        const assignedRole = role || 'Requester';
        const user = new User({
            name, email: normalizedEmail, password, role: assignedRole,
            ...(assignedRole === 'Requester' && { program: program || 'N/A', yearLevel: yearLevel || 'N/A' })
        });
        await user.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Registration failed", message: err.message });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 role:
 *                   type: string
 *                   example: Requester
 *                 name:
 *                   type: string
 *                   example: Juan Dela Cruz
 *                 userId:
 *                   type: string
 *                   example: 6a0d9c4543da9bbf31ef4918
 *                 program:
 *                   type: string
 *                   example: BS in Computer Science
 *                 yearLevel:
 *                   type: string
 *                   example: 2nd Year
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '1h' }
            );
            res.json({
                token, role: user.role, name: user.name,
                userId: user._id.toString(),
                program: user.program, yearLevel: user.yearLevel
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Login failed", message: err.message });
    }
});

module.exports = router;