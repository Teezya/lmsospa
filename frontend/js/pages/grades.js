// Страница оценок
const GradesPage = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();
    const user = API.getUser();

    try {
      const { submissions } = await API.get('/submissions');

      app.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1>Оценки</h1>
              <p class="page-header__subtitle">${user.role === 'ADMIN' ? 'Все работы студентов' : 'Ваши результаты'}</p>
            </div>
          </div>

          ${submissions.length ? `
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    ${user.role === 'ADMIN' ? '<th>Студент</th>' : ''}
                    <th>Задание</th>
                    <th>Тип</th>
                    <th>Категория</th>
                    <th>Статус</th>
                    <th>Балл</th>
                    <th>Дедлайн</th>
                    ${user.role === 'ADMIN' ? '<th>Действия</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${submissions.map(s => `
                    <tr>
                      ${user.role === 'ADMIN' ? `<td data-label="Студент">${Utils.escapeHtml((s.student?.firstName || '') + ' ' + (s.student?.lastName || ''))}</td>` : ''}
                      <td data-label="Задание"><strong>${Utils.escapeHtml(s.assignment?.title || '—')}</strong></td>
                      <td data-label="Тип">${Utils.typeBadge(s.assignment?.type)}</td>
                      <td data-label="Категория"><span class="badge badge--accent">${Utils.escapeHtml(s.assignment?.category || '—')}</span></td>
                      <td data-label="Статус">${Utils.statusBadge(s.status)}</td>
                      <td data-label="Балл">
                        <strong style="font-size:1.1rem;color:${s.score !== null ? (s.score >= 60 ? 'var(--success)' : 'var(--warning)') : 'var(--text-muted)'}">
                          ${s.score !== null ? s.score : '—'}
                        </strong>
                      </td>
                      <td data-label="Дедлайн">${Utils.formatDate(s.assignment?.deadline)}</td>
                      ${user.role === 'ADMIN' ? `
                        <td data-label="Действия">
                          <button class="btn btn--secondary btn--sm" onclick="AssignmentsPage.openGrade('${s._id}', ${s.score || 0})">Оценить</button>
                        </td>
                      ` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : Utils.emptyState('Нет оценок', 'Результаты появятся после выполнения заданий')}
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
    }
  }
};
