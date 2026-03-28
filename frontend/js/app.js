// Модальное окно
const Modal = {
  open(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('active');
  },

  close() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('modalBody').innerHTML = '';
  }
};

// Главное приложение
const App = {
  init() {
    Notify.init();
    this.setupNavbar();
    this.setupModal();
    this.registerRoutes();
    Router.init();
  },

  setupNavbar() {
    const burger = document.getElementById('burgerBtn');
    const menu = document.getElementById('navbarMenu');
    const overlay = document.getElementById('menuOverlay');

    const closeMenu = () => {
      burger.classList.remove('active');
      menu.classList.remove('open');
      overlay.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    const toggleMenu = () => {
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        burger.classList.add('active');
        menu.classList.add('open');
        overlay.classList.add('active');
        burger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
      }
    };

    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'navbarMenu');

    burger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Закрыть меню при клике на ссылку
    menu.addEventListener('click', (e) => {
      if (e.target.closest('.navbar__link')) {
        closeMenu();
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      closeMenu();
      API.removeToken();
      document.body.classList.remove('role-admin', 'role-student');
      Router.navigate('/login');
    });

    // Клик на аватар — профиль
    document.getElementById('navbarUser').addEventListener('click', () => {
      Router.navigate('/profile');
    });

    this.updateNavbar();
  },

  updateNavbar() {
    const user = API.getUser();
    const navbar = document.getElementById('navbar');

    if (!user) {
      navbar.classList.add('hidden');
      document.body.classList.remove('role-admin', 'role-student');
      return;
    }

    navbar.classList.remove('hidden');
    document.body.classList.remove('role-admin', 'role-student');
    document.body.classList.add(`role-${user.role.toLowerCase()}`);

    const avatar = document.getElementById('navbarAvatar');
    const username = document.getElementById('navbarUsername');

    avatar.textContent = (user.firstName?.[0] || '').toUpperCase() + (user.lastName?.[0] || '').toUpperCase();
    username.textContent = `${user.firstName} ${user.lastName}`;
  },

  setupModal() {
    document.getElementById('modalClose').addEventListener('click', Modal.close);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Modal.close();
    });
  },

  registerRoutes() {
    Router.add('/login', () => {
      LoginPage.render();
    });

    Router.add('/register', () => {
      LoginPage.isLogin = false;
      LoginPage.render();
    });

    Router.add('/dashboard', async () => {
      this.updateNavbar();
      await DashboardPage.render();
    });

    Router.add('/courses', async (params) => {
      this.updateNavbar();
      await CoursesPage.render(params);
    });

    Router.add('/assignments', async (params) => {
      this.updateNavbar();
      await AssignmentsPage.render(params);
    });

    Router.add('/grades', async () => {
      this.updateNavbar();
      await GradesPage.render();
    });

    Router.add('/groups', async () => {
      this.updateNavbar();
      await GroupsPage.render();
    });

    Router.add('/users', async () => {
      this.updateNavbar();
      await UsersPage.render();
    });

    Router.add('/profile', async () => {
      this.updateNavbar();
      await ProfilePage.render();
    });
  },

  setupFileUpload() {
    // Делегируем установку загрузки файлов при рендере страницы задания
    document.addEventListener('click', (e) => {
      const dropZone = e.target.closest('#dropZone');
      if (dropZone) {
        document.getElementById('fileInput')?.click();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'fileInput') {
        const files = e.target.files;
        const list = document.getElementById('fileList');
        const btn = document.getElementById('uploadBtn');

        if (list && files.length > 0) {
          list.innerHTML = Array.from(files).map(f => `
            <div class="file-item">
              <span>📎</span>
              <span class="file-item__name">${Utils.escapeHtml(f.name)}</span>
              <span class="file-item__size">${Utils.formatFileSize(f.size)}</span>
            </div>
          `).join('');

          if (btn) btn.disabled = false;
        }
      }
    });

    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'uploadForm') {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const btn = document.getElementById('uploadBtn');

        if (!fileInput.files.length) return;

        btn.disabled = true;
        btn.textContent = 'Загрузка...';

        try {
          const formData = new FormData();
          // Получить assignmentId из URL
          const hash = window.location.hash;
          const match = hash.match(/\/assignments\/([a-f0-9]+)/);
          if (!match) throw new Error('ID задания не найден');

          formData.append('assignmentId', match[1]);
          Array.from(fileInput.files).forEach(f => {
            formData.append('files', f);
          });

          await API.upload('/submissions/upload', formData);
          Notify.success('Работа отправлена!');
          Router.handleRoute();
        } catch (err) {
          Notify.error(err.message);
          btn.disabled = false;
          btn.textContent = 'Отправить';
        }
      }
    });
  }
};

// Запуск
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.setupFileUpload();
});
