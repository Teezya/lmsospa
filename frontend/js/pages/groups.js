// Страница групп (ADMIN)
const GroupsPage = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();

    try {
      const { groups } = await API.get('/groups');

      app.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1>Группы</h1>
              <p class="page-header__subtitle">${groups.length} групп(ы)</p>
            </div>
            <button class="btn btn--primary" onclick="GroupsPage.openCreate()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Новая группа
            </button>
          </div>

          <div class="grid grid--3 stagger">
            ${groups.length ? groups.map(g => `
              <div class="card card--clickable" onclick="GroupsPage.showDetail('${g._id}')">
                <div class="card__title">${Utils.escapeHtml(g.name)}</div>
                <div class="card__text">${Utils.escapeHtml(g.description || 'Без описания')}</div>
                <div class="card__meta">
                  <span>Создана: ${Utils.formatDate(g.createdAt)}</span>
                </div>
              </div>
            `).join('') : Utils.emptyState('Нет групп', 'Создайте первую группу')}
          </div>
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  openCreate() {
    Modal.open('Новая группа', `
      <form id="groupForm">
        <div class="form-group">
          <label>Название</label>
          <input type="text" class="form-input" id="groupName" placeholder="ИС-21" required>
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea class="form-input" id="groupDesc" placeholder="Описание группы..."></textarea>
        </div>
        <button type="submit" class="btn btn--primary btn--full">Создать</button>
      </form>
    `);

    document.getElementById('groupForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.post('/groups', {
          name: document.getElementById('groupName').value,
          description: document.getElementById('groupDesc').value
        });
        Modal.close();
        Notify.success('Группа создана');
        this.render();
      } catch (err) {
        Notify.error(err.message);
      }
    };
  },

  async showDetail(groupId) {
    try {
      const { group, students } = await API.get(`/groups/${groupId}`);

      Modal.open(Utils.escapeHtml(group.name), `
        <div>
          <p style="color:var(--text-muted);margin-bottom:20px">${Utils.escapeHtml(group.description || '')}</p>
          <div class="section__title">Студенты (${students.length})</div>
          ${students.length ? students.map(s => `
            <div class="activity-item">
              <div class="activity-item__dot"></div>
              <div class="activity-item__content">
                <div class="activity-item__text">${Utils.escapeHtml(s.firstName)} ${Utils.escapeHtml(s.lastName)}</div>
                <div class="activity-item__time">${Utils.escapeHtml(s.email)}</div>
              </div>
            </div>
          `).join('') : '<p style="color:var(--text-muted)">Нет студентов</p>'}
          <div class="actions mt-3">
            <button class="btn btn--danger btn--sm" onclick="GroupsPage.deleteGroup('${groupId}')">Удалить группу</button>
          </div>
        </div>
      `);
    } catch (err) {
      Notify.error(err.message);
    }
  },

  async deleteGroup(id) {
    if (!confirm('Удалить группу?')) return;
    try {
      await API.delete(`/groups/${id}`);
      Modal.close();
      Notify.success('Группа удалена');
      this.render();
    } catch (err) {
      Notify.error(err.message);
    }
  }
};
