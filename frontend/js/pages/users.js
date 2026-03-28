// Страница пользователей (ADMIN)
const UsersPage = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();

    try {
      const { users } = await API.get('/users');
      const { groups } = await API.get('/groups');

      app.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1>Пользователи</h1>
              <p class="page-header__subtitle">${users.length} пользователь(ей)</p>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Группа</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td data-label="Имя"><strong>${Utils.escapeHtml(u.firstName)} ${Utils.escapeHtml(u.lastName)}</strong></td>
                    <td data-label="Email" style="color:var(--text-muted)">${Utils.escapeHtml(u.email)}</td>
                    <td data-label="Роль">
                      <span class="badge ${u.role === 'ADMIN' ? 'badge--accent' : 'badge--info'}">
                        ${u.role === 'ADMIN' ? 'Админ' : 'Студент'}
                      </span>
                    </td>
                    <td data-label="Группа">${Utils.escapeHtml(u.group?.name || '—')}</td>
                    <td data-label="Действия">
                      <button class="btn btn--secondary btn--sm" onclick="UsersPage.openEdit('${u._id}', '${u.role}', '${u.group?._id || ''}')">Изменить</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.groups = groups;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  groups: [],

  openEdit(userId, currentRole, currentGroupId) {
    Modal.open('Изменить пользователя', `
      <form id="userEditForm">
        <div class="form-group">
          <label>Роль</label>
          <select class="form-select" id="ueRole">
            <option value="STUDENT" ${currentRole === 'STUDENT' ? 'selected' : ''}>Студент</option>
            <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>Администратор</option>
          </select>
        </div>
        <div class="form-group">
          <label>Группа</label>
          <select class="form-select" id="ueGroup">
            <option value="">Без группы</option>
            ${this.groups.map(g => `<option value="${g._id}" ${g._id === currentGroupId ? 'selected' : ''}>${Utils.escapeHtml(g.name)}</option>`).join('')}
          </select>
        </div>
        <button type="submit" class="btn btn--primary btn--full">Сохранить</button>
      </form>
    `);

    document.getElementById('userEditForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.put(`/users/${userId}`, {
          role: document.getElementById('ueRole').value,
          group: document.getElementById('ueGroup').value || null
        });
        Modal.close();
        Notify.success('Пользователь обновлён');
        this.render();
      } catch (err) {
        Notify.error(err.message);
      }
    };
  }
};
