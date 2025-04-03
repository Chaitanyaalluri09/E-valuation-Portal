// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'evaluator'],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  subjects: {
    type: [String],
    required: function() { return this.role === 'evaluator'; }
  },
  assignedPapers: {
    type: Number,
    default: 0,
    required: function() { return this.role === 'evaluator'; }
  },
  assignedEvaluations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  tempPassword: String,
  resetPasswordOTP: {
    type: String,
  },
  resetPasswordExpiry: {
    type: Date,
  },
  emailUpdateOTP: {
    type: String,
  },
  emailUpdateExpiry: {
    type: Date,
  },
  pendingEmail: {
    type: String,
  }
});

module.exports = mongoose.model('User', userSchema);