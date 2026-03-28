const express = require('express');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Test = require('../models/Test');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/submissions — свои сабмиты (студент) или все (админ)
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'STUDENT') {
      filter.student = req.user._id;
    }
    if (req.query.assignment) filter.assignment = req.query.assignment;
    if (req.query.student) filter.student = req.query.student;

    const submissions = await Submission.find(filter)
      .populate('assignment', 'title type deadline maxScore category')
      .populate('student', 'firstName lastName email')
      .sort('-updatedAt');

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/submissions/test — сдать тест
router.post('/test', protect, async (req, res) => {
  try {
    const { assignmentId, answers } = req.body;
    const assignment = await Assignment.findById(assignmentId).populate('test');

    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }

    if (assignment.type !== 'TEST' || !assignment.test) {
      return res.status(400).json({ message: 'Это не тестовое задание' });
    }

    // Проверка дедлайна
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Дедлайн истёк' });
    }

    // Проверка существующей попытки
    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (submission && submission.status === 'GRADED' && !assignment.allowResubmit) {
      return res.status(400).json({ message: 'Повторная сдача запрещена' });
    }

    // Подсчёт баллов
    const test = assignment.test;
    let correctCount = 0;
    const totalQuestions = test.questions.length;

    answers.forEach(answer => {
      const question = test.questions.id(answer.questionId);
      if (!question) return;

      const correctOptions = question.options
        .map((opt, idx) => opt.isCorrect ? idx : -1)
        .filter(idx => idx !== -1);

      const selected = answer.selectedOptions || [];
      const isCorrect = correctOptions.length === selected.length &&
        correctOptions.every(idx => selected.includes(idx));

      if (isCorrect) correctCount++;
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    if (submission) {
      submission.answers = answers;
      submission.score = score;
      submission.status = 'GRADED';
      submission.submittedAt = new Date();
      submission.gradedAt = new Date();
      await submission.save();
    } else {
      submission = await Submission.create({
        assignment: assignmentId,
        student: req.user._id,
        answers,
        score,
        status: 'GRADED',
        submittedAt: new Date(),
        gradedAt: new Date()
      });
    }

    res.json({ submission, score, correctCount, totalQuestions });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/submissions/upload — загрузить файл
router.post('/upload', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }

    if (assignment.type !== 'DOCUMENT') {
      return res.status(400).json({ message: 'Это не задание с загрузкой файлов' });
    }

    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Дедлайн истёк' });
    }

    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (submission && submission.status === 'GRADED' && !assignment.allowResubmit) {
      return res.status(400).json({ message: 'Повторная сдача запрещена' });
    }

    const files = req.files.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      size: f.size
    }));

    if (submission) {
      submission.files = files;
      submission.status = 'SUBMITTED';
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = await Submission.create({
        assignment: assignmentId,
        student: req.user._id,
        files,
        status: 'SUBMITTED',
        submittedAt: new Date()
      });
    }

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/submissions/:id/grade — оценить работу (ADMIN)
router.put('/:id/grade', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Работа не найдена' });
    }

    submission.score = score;
    submission.feedback = feedback || '';
    submission.status = 'GRADED';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    await submission.save();

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
