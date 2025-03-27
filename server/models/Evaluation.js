const mongoose = require('mongoose');

const studentSubmissionSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: true
  },
  answerPaperUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Compeleted'],
    default: 'Not Started'
  },
  marks: {
    type: Number,
    default: null
  }
});

const evaluationSchema = new mongoose.Schema({
  regulation: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionPaperUrl: {
    type: String,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  studentSubmissions: [studentSubmissionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema); 