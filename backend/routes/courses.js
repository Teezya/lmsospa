const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Theme = require('../models/Theme');
const Assignment = require('../models/Assignment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses — список курсов
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'STUDENT' && req.user.group) {
      query = { groups: req.user.group, isPublished: true };
    }

    const courses = await Course.find(query)
      .populate('author', 'firstName lastName')
      .populate('groups', 'name')
      .sort('-createdAt');

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/courses/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('author', 'firstName lastName')
      .populate('groups', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    const themes = await Theme.find({ course: course._id }).sort('order');
    const assignments = await Assignment.find({ course: course._id })
      .populate('test', 'title')
      .sort('-createdAt');

    res.json({ course, themes, assignments });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/courses — создание курса (ADMIN)
router.post('/', protect, authorize('ADMIN'), [
  body('title').trim().notEmpty().withMessage('Название обязательно'),
  body('category').optional().isIn(['Экзамен', 'Лабораторная', 'Практика', 'Лекция', 'Семинар', 'Другое'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.create({
      ...req.body,
      author: req.user._id
    });

    res.status(201).json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/courses/:id — обновить курс (ADMIN)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// DELETE /api/courses/:id — удалить курс (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Удаляем связанные темы и задания
    await Theme.deleteMany({ course: req.params.id });
    await Assignment.deleteMany({ course: req.params.id });

    res.json({ message: 'Курс удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
