const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Текст вопроса обязателен'],
    trim: true
  },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  multipleCorrect: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название теста обязательно'],
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    trim: true
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number,
    default: 0
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Test', testSchema);
