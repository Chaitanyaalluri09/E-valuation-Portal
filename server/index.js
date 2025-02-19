// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() =>console.log('Connected to MongoDB')
    )
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
const subjectRoutes = require('./routes/subjects');
app.use('/api/subjects', subjectRoutes);
const evaluationRoutes = require('./routes/evaluations');
app.use('/api/evaluations', evaluationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});