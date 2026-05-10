const router = require('express').Router();
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, program, yearLevel } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // ✅ EXPLICIT HASHING: Hash the password right here
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword, // Save the safely hashed password
            role: role || 'Requester',
            program: program || 'N/A', 
            yearLevel: yearLevel || 'N/A'
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please enter all fields" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare the typed password with the explicitly hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '1h' }
            );

            res.json({
                token,
                role: user.role,
                name: user.name,
                email: user.email,
                program: user.program,
                yearLevel: user.yearLevel,
                userId: user._id.toString()
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- GET ALL USERS ROUTE ---
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); 
        res.status(200).json(users);
    } catch (err) {
        console.error("Fetch Users Error:", err);
        res.status(500).json({ message: "Failed to fetch users", error: err.message });
    }
});

module.exports = router;