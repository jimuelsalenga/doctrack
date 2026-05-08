const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // ✅ REMOVED manual bcrypt.hash here. 
        // The User model's pre-save hook handles this automatically.
        const newUser = new User({
            name,
            email: normalizedEmail,
            password, // Pass plain password; model will hash it
            role: role || 'Requester'
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

        console.log(`--- Login Attempt: ${normalizedEmail} ---`);
        
        if (!user) {
            console.log("❌ User not found in database.");
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare plain text password from req.body with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("✅ Password match result:", isMatch);

        if (isMatch) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '1h' }
            );

            // Send back clean data that matches your Login.js expectations
            res.json({
                token,
                role: user.role,
                name: user.name,
                email: user.email,
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

module.exports = router;