const express = require('express');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — данные для дашборда
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      // Админский дашборд
      const totalStudents = await User.countDocuments({ role: 'STUDENT' });
      const totalCourses = await Course.countDocuments();
      const totalAssignments = await Assignment.countDocuments();

      // Средний балл
      const avgResult = await Submission.aggregate([
        { $match: { score: { $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]);
      const averageScore = avgResult.length > 0 ? Math.round(avgResult[0].avgScore) : 0;

      // Просроченные задания
      const overdueAssignments = await Assignment.countDocuments({
        deadline: { $lt: new Date() },
        isPublished: true
      });

      // Недавние сабмиты
      const recentSubmissions = await Submission.find({ status: 'SUBMITTED' })
        .populate('student', 'firstName lastName')
        .populate('assignment', 'title type')
        .sort('-submittedAt')
        .limit(10);

      // Активность по дням (последние 7 дней)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const activity = await Submission.aggregate([
        { $match: { submittedAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        totalStudents,
        totalCourses,
        totalAssignments,
        averageScore,
        overdueAssignments,
        recentSubmissions,
        activity
      });
    } else {
      // Студентский дашборд
      const submissions = await Submission.find({ student: req.user._id })
        .populate({
          path: 'assignment',
          select: 'title type deadline maxScore category course',
          populate: { path: 'course', select: 'title' }
        });

      // Считаем статистику
      let completedCount = 0;
      let totalScore = 0;
      let gradedCount = 0;
      const upcoming = [];

      submissions.forEach(s => {
        if (s.status === 'GRADED' || s.status === 'SUBMITTED') completedCount++;
        if (s.score !== null) {
          totalScore += s.score;
          gradedCount++;
        }
      });

      const averageScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;

      // Ближайшие дедлайны
      let filter = { isPublished: true };
      if (req.user.group) {
        filter.groups = req.user.group;
      }

      const upcomingAssignments = await Assignment.find({
        ...filter,
        deadline: { $gte: new Date() }
      })
        .populate('course', 'title')
        .sort('deadline')
        .limit(5);

      // Все назначения для подсчёта прогресса
      const totalAssignments = await Assignment.countDocuments(filter);

      res.json({
        averageScore,
        completedCount,
        totalAssignments,
        gradedCount,
        upcomingAssignments,
        recentSubmissions: submissions.slice(0, 10)
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
