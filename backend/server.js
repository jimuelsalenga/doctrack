const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();

// ====================== CORS CONFIG ======================
// ✅ Simplified for Vercel deployment stability
app.use(cors({
    origin: ["https://doctrack-fend.vercel.app", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================== DATABASE ======================
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI); 
        console.log(`✅ DATABASE CONNECTED: ${conn.connection.db.databaseName}`);
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
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

// ====================== ERROR HANDLER ======================
app.use((err, req, res, next) => {
    console.error('Captured Error:', err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Local Server: http://localhost:${PORT}`));
}

module.exports = app;