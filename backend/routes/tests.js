const express = require('express');
const { body, validationResult } = require('express-validator');
const Test = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/tests
router.get('/', protect, async (req, res) => {
  try {
    const tests = await Test.find().sort('-createdAt');

    // Скрываем правильные ответы от студентов
    if (req.user.role === 'STUDENT') {
      const sanitized = tests.map(t => {
        const obj = t.toObject();
        obj.questions = obj.questions.map(q => ({
          ...q,
          options: q.options.map(o => ({ text: o.text, _id: o._id }))
        }));
        return obj;
      });
      return res.json({ tests: sanitized });
    }

    res.json({ tests });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/tests/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    if (req.user.role === 'STUDENT') {
      const obj = test.toObject();
      obj.questions = obj.questions.map(q => ({
        ...q,
        options: q.options.map(o => ({ text: o.text, _id: o._id }))
      }));
      return res.json({ test: obj });
    }

    res.json({ test });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/tests (ADMIN)
router.post('/', protect, authorize('ADMIN'), [
  body('title').trim().notEmpty().withMessage('Название обязательно'),
  body('questions').isArray({ min: 1 }).withMessage('Минимум 1 вопрос')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const test = await Test.create(req.body);
    res.status(201).json({ test });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/tests/:id (ADMIN)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }
    res.json({ test });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// DELETE /api/tests/:id (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }
    res.json({ message: 'Тест удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
