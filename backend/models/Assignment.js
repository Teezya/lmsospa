const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название задания обязательно'],
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  type: {
    type: String,
    enum: ['TEST', 'DOCUMENT'],
    required: true
  },
  theme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  deadline: {
    type: Date,
    required: [true, 'Дедлайн обязателен']
  },
  maxScore: {
    type: Number,
    default: 100
  },
  category: {
    type: String,
    enum: ['Экзамен', 'Лабораторная', 'Практика', 'Контрольная', 'Домашнее задание', 'Другое'],
    default: 'Другое'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  allowResubmit: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
