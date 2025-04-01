// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://e-valuation-portal-frontend.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add this before your routes
app.options('*', cors());

// Add at the top after imports
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'EMAIL_USER',
  'EMAIL_APP_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
const subjectRoutes = require('./routes/subjects');
app.use('/api/subjects', subjectRoutes);
const evaluationRoutes = require('./routes/evaluations');
app.use('/api/evaluations', evaluationRoutes);
const paperSchemaRoutes = require('./routes/paperSchemas');
app.use('/api/paper-schemas', paperSchemaRoutes);

// Add before routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Add after routes but before app.listen
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});