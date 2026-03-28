// Простой hash-роутер
const Router = {
  routes: {},
  currentPage: null,

  add(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/login';
    const [path, ...params] = hash.split('/').filter(Boolean);
    const routePath = '/' + path;

    // Проверка авторизации
    const token = API.getToken();
    const publicRoutes = ['/login', '/register'];

    if (!token && !publicRoutes.includes(routePath)) {
      this.navigate('/login');
      return;
    }

    if (token && publicRoutes.includes(routePath)) {
      this.navigate('/dashboard');
      return;
    }

    // Найти обработчик
    const handler = this.routes[routePath];
    if (handler) {
      this.currentPage = routePath;
      this.updateNavActive(path);
      await handler(params);
    } else {
      this.navigate('/dashboard');
    }
  },

  updateNavActive(page) {
    document.querySelectorAll('.navbar__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
};
