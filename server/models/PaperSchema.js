const mongoose = require('mongoose');

const questionSetSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true
  },
  questions: [{
    questionNumber: {
      type: String,  // Like "1a", "1b", or just "1"
      required: true
    },
    maxMarks: {
      type: Number,
      required: true
    }
  }],
  choiceSetNumber: {
    type: Number,  // References another setNumber as choice
    required: true
  },
  hasParts: {
    type: Boolean,  // true for "a,b" parts, false for single questions
    default: false
  }
});

const paperSchemaModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  totalSets: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  questionSets: [questionSetSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaperSchema', paperSchemaModel); 