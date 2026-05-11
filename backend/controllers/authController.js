const router = require('express').Router();
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, program, yearLevel } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) return res.status(400).json({ message: "User already exists" });

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
        console.log(`✅ [Register] Saved to DB: ${normalizedEmail}`);
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("❌ [Register] Error:", err);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        
        console.log(`🔍 [Login Attempt] Searching for: ${normalizedEmail}`);

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log(`❌ [Login] Not found in collection 'users': ${normalizedEmail}`);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'super_secret_key_2026',
                { expiresIn: '1h' }
            );
            console.log(`✅ [Login] Success: ${normalizedEmail}`);
            res.json({
                token,
                role: user.role,
                name: user.name,
                userId: user._id.toString()
            });
        } else {
            console.log(`❌ [Login] Password mismatch for: ${normalizedEmail}`);
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("❌ [Login] Server Error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;