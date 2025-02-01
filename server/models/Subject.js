const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  regulation: {
    type: String,
    required: true,
    trim: true
  },
  
  year: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4'],
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['1', '2'],
    trim: true
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  }
});

// Create the model
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 