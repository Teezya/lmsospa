// Страница авторизации
const LoginPage = {
  isLogin: true,

  render() {
    const app = document.getElementById('app');
    document.getElementById('navbar').classList.add('hidden');

    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-card__logo">
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#grad2)"/>
              <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" stroke-width="1.5" fill="none"/>
              <path d="M16 8V24" stroke="white" stroke-width="1.5" opacity="0.5"/>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="32" y2="32">
                  <stop stop-color="#7C6AFF"/>
                  <stop offset="1" stop-color="#3B2F8A"/>
                </linearGradient>
              </defs>
            </svg>
            <h1>LMS</h1>
            <p>Система управления обучением</p>
          </div>

          <div class="auth-tabs">
            <div class="auth-tab ${this.isLogin ? 'active' : ''}" id="tabLogin">Вход</div>
            <div class="auth-tab ${!this.isLogin ? 'active' : ''}" id="tabRegister">Регистрация</div>
          </div>

          <form id="authForm">
            <div id="registerFields" class="${this.isLogin ? 'hidden' : ''}">
              <div class="form-group">
                <label>Имя</label>
                <input type="text" class="form-input" id="firstName" placeholder="Иван">
              </div>
              <div class="form-group">
                <label>Фамилия</label>
                <input type="text" class="form-input" id="lastName" placeholder="Иванов">
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-input" id="email" placeholder="email@example.com" required>
            </div>

            <div class="form-group">
              <label>Пароль</label>
              <input type="password" class="form-input" id="password" placeholder="Минимум 6 символов" required>
            </div>

            <button type="submit" class="btn btn--primary btn--full btn--lg" id="authSubmit">
              ${this.isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    `;

    this.attachEvents();
  },

  attachEvents() {
    document.getElementById('tabLogin').onclick = () => {
      this.isLogin = true;
      this.render();
    };

    document.getElementById('tabRegister').onclick = () => {
      this.isLogin = false;
      this.render();
    };

    document.getElementById('authForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('authSubmit');
      btn.disabled = true;
      btn.textContent = 'Загрузка...';

      try {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (this.isLogin) {
          const data = await API.post('/auth/login', { email, password });
          API.setToken(data.token);
          API.setUser(data.user);
          Notify.success('Добро пожаловать!');
          Router.navigate('/dashboard');
        } else {
          const firstName = document.getElementById('firstName').value.trim();
          const lastName = document.getElementById('lastName').value.trim();

          if (!firstName || !lastName) {
            throw new Error('Заполните все поля');
          }

          const data = await API.post('/auth/register', {
            firstName, lastName, email, password
          });
          API.setToken(data.token);
          API.setUser(data.user);
          Notify.success('Регистрация успешна!');
          Router.navigate('/dashboard');
        }
      } catch (err) {
        Notify.error(err.message);
        btn.disabled = false;
        btn.textContent = this.isLogin ? 'Войти' : 'Зарегистрироваться';
      }
    };
  }
};
