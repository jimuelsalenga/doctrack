const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Added for path handling
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

// Suppress swagger-jsdoc deprecation warnings
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, type, ...args) => {
  if (type === 'DeprecationWarning' && String(warning).includes('url.parse')) return;
  originalEmitWarning.call(process, warning, type, ...args);
};

const app = express();

// ====================== MIDDLEWARES ======================
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Added to help parse form-data

// ✅ FIX: Serve the 'uploads' folder statically
// Without this, you cannot view the uploaded documents in the browser/dashboard
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================== SWAGGER CONFIG ======================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DocTrack API Documentation',
      version: '1.0.0',
      description: 'API for National University Document Request System',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Development server' }],
  },
apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ====================== DATABASE ======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ SUCCESS: Database Connected!'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ====================== ROUTES ======================

app.get('/health', (req, res) => res.send('API is running...'));

// Auth Routes (Login/Register)
app.use('/api/auth', require('./routes/authRoutes'));

// Document Routes
// ✅ This prefix MUST match your frontend calls: http://localhost:5000/api/docs
app.use('/api/docs', require('./routes/docRoutes'));

// ====================== GLOBAL ERROR HANDLER ======================
// ✅ Improved error handler to catch Multer/FileFilter errors specifically
app.use((err, req, res, next) => {
  console.error('Captured Error:', err.message);
  
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ message: `Upload Error: ${err.message}` });
  }
  
  if (err.message === 'Only images and PDFs are allowed!') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ 
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

// ====================== SERVER ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('-----------------------------------------');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📖 Docs:   http://localhost:${PORT}/api-docs`);
  console.log('-----------------------------------------');
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  mongoose.connection.close();
  process.exit(0);
});