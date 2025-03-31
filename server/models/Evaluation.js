const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  registerNumber: String,
  answerPaperUrl: String,
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  questionMarks: [{
    questionNumber: String,
    marks: Number
  }],
  totalMarks: Number,
  lastModified: {
    type: Date,
    default: Date.now
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
  subjectCode: {
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
  studentSubmissions: [submissionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  paperSchema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaperSchema',
    required: true
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema); 