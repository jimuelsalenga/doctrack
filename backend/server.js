const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();

// ✅ Swagger Definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DocTrack API',
      version: '1.0.0',
      description: 'Document Request and Approval System — New Era University',
      contact: {
        name: 'DocTrack Support'
      }
    },
    servers: [
      {
        url: 'https://doctrack-taupe.vercel.app',
        description: 'Production Server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            name:      { type: 'string', example: 'Juan Dela Cruz' },
            email:     { type: 'string', example: 'juan@gmail.com' },
            password:  { type: 'string', example: 'password123' },
            role:      { type: 'string', enum: ['Requester', 'Admin'], example: 'Requester' },
            program:   { type: 'string', example: 'BS in Computer Science' },
            yearLevel: { type: 'string', example: '2nd Year' }
          }
        },
        Request: {
          type: 'object',
          properties: {
            _id:            { type: 'string', example: '6a0d9c4543da9bbf31ef4918' },
            requesterName:  { type: 'string', example: 'Juan Dela Cruz' },
            requesterEmail: { type: 'string', example: 'juan@gmail.com' },
            documentType:   { type: 'string', example: 'Transcript of Records' },
            description:    { type: 'string', example: 'For scholarship application' },
            status:         { type: 'string', enum: ['Pending', 'Under Review', 'Approved', 'Ready', 'Rejected', 'Completed'] },
            fileUrl:        { type: 'string', example: 'https://res.cloudinary.com/...' },
            dueDate:        { type: 'string', example: '2026-05-28T00:00:00.000Z' },
            createdAt:      { type: 'string', example: '2026-05-20T12:34:29.000Z' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
 apis: [
  path.join(__dirname, 'routes', 'authRoutes.js'),
  path.join(__dirname, 'routes', 'docRoutes.js')
]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const allowedOrigins = [
  'https://doctrack-fend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isLocal = origin.startsWith('http://localhost:');
    const isVercel = origin.endsWith('.vercel.app');
    if (isLocal || isVercel) callback(null, true);
    else { console.log("CORS Blocked:", origin); callback(new Error('Not allowed by CORS')); }
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

// ✅ Swagger UI route — accessible at /api-docs
app.get('/api-docs', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>DocTrack API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
        <style>
          body { margin: 0; }
          .swagger-ui .topbar { background-color: #1e293b; }
          .swagger-ui .topbar-wrapper img { display: none; }
          .swagger-ui .topbar-wrapper::after {
            content: "DocTrack API Documentation";
            color: white;
            font-size: 1.1rem;
            font-weight: bold;
            margin-left: 16px;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: '/api-docs.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: 'StandaloneLayout',
              persistAuthorization: true,
              deepLinking: true
            });
          };
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

// ✅ Keep this — serves the raw JSON spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/docs', require('./routes/docRoutes'));

app.use((err, req, res, next) => {
  console.error('Captured Error:', err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Local: http://localhost:${PORT}`));
}

module.exports = app;