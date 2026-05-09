const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

// Remove the manual DNS override—Vercel handles its own networking.
// const dns = require('dns');
// dns.setServers(['8.8.8.8', '8.8.4.4']); 

const app = express();

// ====================== MIDDLEWARES ======================
app.use(cors({
  origin: ['https://doctrack-fend.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ⚠️ WARNING: Local 'uploads' will not persist on Vercel. 
// Files uploaded here will disappear after a few minutes.
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
          ? 'https://doctrack-taupe.vercel.app' // Replace with your backend URL
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
// Use a variable to track connection status for serverless reuse
let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ SUCCESS: Database Connected!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

// Middleware to ensure DB is connected before handling routes
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ====================== ROUTES ======================
app.get('/health', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/docs', require('./routes/docRoutes'));

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

// Standard listen for local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server: http://localhost:${PORT}`);
  });
}

// ✅ CRITICAL: Export the app for Vercel
module.exports = app;