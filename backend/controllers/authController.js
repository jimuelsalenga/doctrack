const router = require('express').Router();
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- REGISTER ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, program, yearLevel } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        console.log(`Attempting to register: ${normalizedEmail}`);

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword, 
            role: role || 'Requester',
            program: program || 'N/A', 
            yearLevel: yearLevel || 'N/A'
        });

        await newUser.save();
        console.log(`✅ SUCCESS: User ${normalizedEmail} saved to collection 'User'`);
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("❌ REGISTRATION ERROR:", err);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        
        console.log(`🔍 Login Attempt: Searching 'User' collection for ${normalizedEmail}`);

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log(`❌ FAILED: ${normalizedEmail} not found in 'User' collection.`);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password.trim(), user.password);

        if (isMatch) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'super_secret_key_2026',
                { expiresIn: '1h' }
            );
            console.log(`✅ LOGIN SUCCESS: ${normalizedEmail}`);
            res.json({
                token,
                role: user.role,
                name: user.name,
                userId: user._id.toString()
            });
        } else {
            console.log(`❌ FAILED: Password incorrect for ${normalizedEmail}`);
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("❌ SERVER ERROR:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;