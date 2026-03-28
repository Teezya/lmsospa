require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./backend/config/db');
const User = require('./backend/models/User');

// Создание админа по умолчанию
async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      await User.create({
        firstName: 'Админ',
        lastName: 'Системы',
        email: 'admin@lms.ru',
        password: 'admin123',
        role: 'ADMIN'
      });
      console.log('Создан администратор по умолчанию: admin@lms.ru / admin123');
    }
  } catch (err) {
    console.error('Ошибка создания админа:', err.message);
  }
}

// Создаём папку uploads если нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(uploadsDir));

// API маршруты
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/courses', require('./backend/routes/courses'));
app.use('/api/themes', require('./backend/routes/themes'));
app.use('/api/assignments', require('./backend/routes/assignments'));
app.use('/api/tests', require('./backend/routes/tests'));
app.use('/api/submissions', require('./backend/routes/submissions'));
app.use('/api/groups', require('./backend/routes/groups'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/dashboard', require('./backend/routes/dashboard'));

// SPA — все не-api запросы отдают index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Недопустимый тип файла') {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });
});
