const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'https://doctrack-fend.vercel.app', 
  'http://localhost:3000',
  'http://localhost:5173'
];

// ====================== MIDDLEWARES ======================
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow anything that is localhost or ends with .vercel.app
    const isLocal = origin.startsWith('http://localhost:');
    const isVercel = origin.endsWith('.vercel.app');
    
    if (isLocal || isVercel) {
      callback(null, true);
    } else {
      console.log("CORS Blocked Origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); 
    // ✅ DEBUG LOG: This will tell us exactly which DB we are using
    console.log(`✅ DATABASE CONNECTED: ${conn.connection.db.databaseName}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err; 
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

app.get('/health', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/docs', require('./routes/docRoutes'));

app.use((err, req, res, next) => {
  console.error('Captured Error:', err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Local Server: http://localhost:${PORT}`));
}

module.exports = app;