const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, program, yearLevel } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const assignedRole = role || 'Requester';

        const user = new User({
            name,
            email: normalizedEmail,
            password,
            role: assignedRole,
            // ✅ Only include program/yearLevel for students, not admins
            ...(assignedRole === 'Requester' && {
                program: program || 'N/A',
                yearLevel: yearLevel || 'N/A'
            })
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Registration failed", message: err.message });
    }
});

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
                token,
                role: user.role,
                name: user.name,
                userId: user._id.toString(),
                program: user.program,
                yearLevel: user.yearLevel
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