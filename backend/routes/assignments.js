const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.theme) filter.theme = req.query.theme;

    if (req.user.role === 'STUDENT') {
      filter.isPublished = true;
      if (req.user.group) {
        filter.groups = req.user.group;
      }
    }

    const assignments = await Assignment.find(filter)
      .populate('theme', 'title')
      .populate('course', 'title')
      .populate('test', 'title questions')
      .populate('groups', 'name')
      .sort('-createdAt');

    // Для студентов - добавить статус сдачи
    if (req.user.role === 'STUDENT') {
      const submissions = await Submission.find({
        student: req.user._id,
        assignment: { $in: assignments.map(a => a._id) }
      });

      const submissionMap = {};
      submissions.forEach(s => {
        submissionMap[s.assignment.toString()] = s;
      });

      const enriched = assignments.map(a => {
        const obj = a.toObject();
        const sub = submissionMap[a._id.toString()];
        if (sub) {
          obj.submissionStatus = sub.status;
          obj.submissionScore = sub.score;
        } else {
          obj.submissionStatus = new Date() > a.deadline ? 'OVERDUE' : 'NOT_STARTED';
          obj.submissionScore = null;
        }
        return obj;
      });

      return res.json({ assignments: enriched });
    }

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/assignments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('theme', 'title')
      .populate('course', 'title')
      .populate('test')
      .populate('groups', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }

    let submission = null;
    if (req.user.role === 'STUDENT') {
      submission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id
      });

      // Скрываем правильные ответы от студента
      if (assignment.test) {
        const testObj = assignment.test.toObject();
        testObj.questions = testObj.questions.map(q => ({
          ...q,
          options: q.options.map(o => ({ text: o.text, _id: o._id }))
        }));
        assignment.test = testObj;
      }
    }

    // Для админа - все сабмиты
    let submissions = [];
    if (req.user.role === 'ADMIN') {
      submissions = await Submission.find({ assignment: assignment._id })
        .populate('student', 'firstName lastName email group')
        .sort('-submittedAt');
    }

    res.json({ assignment, submission, submissions });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/assignments (ADMIN)
router.post('/', protect, authorize('ADMIN'), [
  body('title').trim().notEmpty().withMessage('Название обязательно'),
  body('type').isIn(['TEST', 'DOCUMENT']).withMessage('Тип: TEST или DOCUMENT'),
  body('theme').notEmpty().withMessage('Тема обязательна'),
  body('course').notEmpty().withMessage('Курс обязателен'),
  body('deadline').isISO8601().withMessage('Некорректная дата дедлайна')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await Assignment.create(req.body);
    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/assignments/:id (ADMIN)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    res.json({ assignment });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// DELETE /api/assignments/:id (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    await Submission.deleteMany({ assignment: req.params.id });
    res.json({ message: 'Задание удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/assignments/:id/reassign (ADMIN) - повторная выдача
router.post('/:id/reassign', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { studentIds, newDeadline } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }

    if (newDeadline) {
      assignment.deadline = newDeadline;
      await assignment.save();
    }

    // Сброс статуса для указанных студентов
    await Submission.updateMany(
      { assignment: req.params.id, student: { $in: studentIds } },
      { status: 'NOT_STARTED', score: null, feedback: '', answers: [], files: [] }
    );

    res.json({ message: 'Задание переназначено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
