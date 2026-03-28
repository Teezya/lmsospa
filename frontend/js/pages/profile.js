// Страница профиля
const ProfilePage = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();

    try {
      const { user } = await API.get('/auth/me');

      app.innerHTML = `
        <div class="fade-in" style="max-width: 600px; margin: 0 auto;">
          <div class="page-header">
            <h1>Профиль</h1>
          </div>

          <div class="card">
            <div style="text-align:center;margin-bottom:32px">
              <div class="navbar__avatar" style="width:80px;height:80px;font-size:2rem;margin:0 auto 16px">
                ${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}
              </div>
              <h2>${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</h2>
              <p style="color:var(--text-muted)">${Utils.escapeHtml(user.email)}</p>
              <span class="badge ${user.role === 'ADMIN' ? 'badge--accent' : 'badge--info'}" style="margin-top:8px">
                ${user.role === 'ADMIN' ? 'Администратор' : 'Студент'}
              </span>
              ${user.group ? `<p style="color:var(--text-secondary);margin-top:8px">Группа: ${Utils.escapeHtml(user.group.name)}</p>` : ''}
            </div>

            <form id="profileForm">
              <div class="form-group">
                <label>Имя</label>
                <input type="text" class="form-input" id="profFirstName" value="${Utils.escapeHtml(user.firstName)}">
              </div>
              <div class="form-group">
                <label>Фамилия</label>
                <input type="text" class="form-input" id="profLastName" value="${Utils.escapeHtml(user.lastName)}">
              </div>
              <button type="submit" class="btn btn--primary btn--full">Сохранить изменения</button>
            </form>
          </div>
        </div>
      `;

      document.getElementById('profileForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const { user: updated } = await API.put('/users/profile/me', {
            firstName: document.getElementById('profFirstName').value,
            lastName: document.getElementById('profLastName').value
          });

          API.setUser({
            ...API.getUser(),
            firstName: updated.firstName,
            lastName: updated.lastName
          });

          App.updateNavbar();
          Notify.success('Профиль обновлён');
        } catch (err) {
          Notify.error(err.message);
        }
      };
    } catch (err) {
      Notify.error(err.message);
    }
  }
};
