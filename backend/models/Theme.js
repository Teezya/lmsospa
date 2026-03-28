const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название темы обязательно'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Theme', themeSchema);
