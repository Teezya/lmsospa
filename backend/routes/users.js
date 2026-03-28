const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/users (ADMIN)
router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.group) filter.group = req.query.group;

    const users = await User.find(filter)
      .populate('group', 'name')
      .sort('lastName');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/users/:id (ADMIN)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { role, group } = req.body;
    const updateData = {};
    if (role) updateData.role = role;
    if (group !== undefined) updateData.group = group || null;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true
    }).populate('group', 'name');

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/users/profile/me — обновить свой профиль
router.put('/profile/me', protect, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName },
      { new: true, runValidators: true }
    ).populate('group', 'name');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
