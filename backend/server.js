const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();

// ====================== MIDDLEWARES ======================
// ✅ FIX: Explicit array of origins is much safer for Vercel
const allowedOrigins = [
  'https://doctrack-fend.vercel.app', 
  'http://localhost:3000', // For local React testing
  'http://localhost:5173'  // For local Vite testing
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// Explicitly handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================== SWAGGER CONFIG ======================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DocTrack API Documentation',
      version: '1.0.0',
      description: 'API for National University Document System',
    },
    servers: [
      { 
        url: process.env.NODE_ENV === 'production' 
          ? 'https://doctrack-taupe.vercel.app' 
          : `http://localhost:${process.env.PORT || 5000}`, 
        description: 'Server' 
      }
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ====================== DATABASE ======================
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI); 
    console.log('✅ SUCCESS: Database Connected!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err; 
  }
};

// Middleware to ensure DB is connected before handling routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

// ====================== ROUTES ======================
app.get('/health', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/docs', require('./routes/docRoutes')); // Make sure this matches your folder exactly

// ====================== GLOBAL ERROR HANDLER ======================
app.use((err, req, res, next) => {
  console.error('Captured Error:', err.stack);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload Error: ${err.message}` });
  }

  res.status(500).json({ 
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

// ====================== SERVER ======================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server: http://localhost:${PORT}`);
  });
}

module.exports = app;