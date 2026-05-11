const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ====================== CORS ======================
// We keep this simple because vercel.json is doing the heavy lifting now
app.use(cors({
    origin: "https://doctrack-fend.vercel.app",
    credentials: true
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================== DATABASE ======================
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    try {
        await mongoose.connect(process.env.MONGO_URI); 
        console.log("✅ Database Connected");
    } catch (err) {
        console.error('❌ MongoDB Error:', err.message);
    }
};

app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// ====================== ROUTES ======================
app.get('/health', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/docs', require('./routes/docRoutes'));

// Error Handler
app.use((err, req, res, next) => {
    res.status(500).json({ message: 'Server Error', error: err.message });
});

module.exports = app;