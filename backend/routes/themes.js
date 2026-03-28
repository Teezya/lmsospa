const express = require('express');
const { body, validationResult } = require('express-validator');
const Theme = require('../models/Theme');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/themes?course=xxx
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.course) filter.course = req.query.course;

    const themes = await Theme.find(filter)
      .populate('course', 'title')
      .sort('order');

    res.json({ themes });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/themes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id).populate('course', 'title');
    if (!theme) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    res.json({ theme });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/themes (ADMIN)
router.post('/', protect, authorize('ADMIN'), [
  body('title').trim().notEmpty().withMessage('Название обязательно'),
  body('course').notEmpty().withMessage('ID курса обязателен')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const theme = await Theme.create(req.body);
    res.status(201).json({ theme });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/themes/:id (ADMIN)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const theme = await Theme.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!theme) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    res.json({ theme });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// DELETE /api/themes/:id (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const theme = await Theme.findByIdAndDelete(req.params.id);
    if (!theme) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    res.json({ message: 'Тема удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
