// Дашборд
const DashboardPage = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();

    try {
      const data = await API.get('/dashboard');
      const user = API.getUser();

      if (user.role === 'ADMIN') {
        this.renderAdmin(app, data);
      } else {
        this.renderStudent(app, data);
      }
    } catch (err) {
      Notify.error(err.message);
      app.innerHTML = Utils.emptyState('Ошибка', err.message);
    }
  },

  renderAdmin(app, data) {
    app.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1>Дашборд</h1>
            <p class="page-header__subtitle">Обзор системы</p>
          </div>
        </div>

        <div class="stats stagger">
          <div class="stat-card">
            <div class="stat-card__label">Студенты</div>
            <div class="stat-card__value">${data.totalStudents}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Курсы</div>
            <div class="stat-card__value">${data.totalCourses}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Средний балл</div>
            <div class="stat-card__value stat-card__value--accent">${data.averageScore}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Просроченные</div>
            <div class="stat-card__value" style="color: var(--danger)">${data.overdueAssignments}</div>
          </div>
        </div>

        <div class="grid grid--2">
          <div class="section">
            <div class="section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Недавние работы
            </div>
            <div class="card">
              ${data.recentSubmissions.length ? data.recentSubmissions.map(s => `
                <div class="activity-item">
                  <div class="activity-item__dot"></div>
                  <div class="activity-item__content">
                    <div class="activity-item__text">
                      <strong>${Utils.escapeHtml(s.student?.firstName || '')} ${Utils.escapeHtml(s.student?.lastName || '')}</strong>
                      сдал «${Utils.escapeHtml(s.assignment?.title || '')}»
                    </div>
                    <div class="activity-item__time">${Utils.formatDateTime(s.submittedAt)}</div>
                  </div>
                </div>
              `).join('') : '<p class="text-center" style="color:var(--text-muted);padding:20px">Нет недавних работ</p>'}
            </div>
          </div>

          <div class="section">
            <div class="section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              Активность за неделю
            </div>
            <div class="card">
              <div id="activityChart" style="padding: 20px;">
                ${this.renderActivityChart(data.activity)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderActivityChart(activity) {
    if (!activity || activity.length === 0) {
      return '<p style="color:var(--text-muted);text-align:center">Нет данных</p>';
    }

    const max = Math.max(...activity.map(a => a.count), 1);
    const bars = activity.map(a => {
      const height = Math.max((a.count / max) * 120, 4);
      const day = new Date(a._id).toLocaleDateString('ru-RU', { weekday: 'short' });
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1">
          <span style="font-size:0.75rem;color:var(--text-primary);font-weight:600">${a.count}</span>
          <div style="width:100%;max-width:40px;height:${height}px;background:linear-gradient(to top,var(--accent-dark),var(--accent));border-radius:6px;transition:height 0.8s ease"></div>
          <span style="font-size:0.7rem;color:var(--text-muted)">${day}</span>
        </div>
      `;
    }).join('');

    return `<div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding-top:10px">${bars}</div>`;
  },

  renderStudent(app, data) {
    const progress = data.totalAssignments > 0
      ? Math.round((data.completedCount / data.totalAssignments) * 100) : 0;

    app.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1>Дашборд</h1>
            <p class="page-header__subtitle">Ваш прогресс обучения</p>
          </div>
        </div>

        <div class="stats stagger">
          <div class="stat-card">
            <div class="stat-card__label">Средний балл</div>
            <div class="stat-card__value stat-card__value--accent">${data.averageScore}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Выполнено</div>
            <div class="stat-card__value">${data.completedCount} / ${data.totalAssignments}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Прогресс</div>
            <div class="stat-card__value stat-card__value--accent">${progress}%</div>
            <div class="progress mt-1" style="margin-top:12px">
              <div class="progress__bar" style="width:${progress}%"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Оценено работ</div>
            <div class="stat-card__value">${data.gradedCount}</div>
          </div>
        </div>

        <div class="section">
          <div class="section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Ближайшие дедлайны
          </div>
          <div class="stagger">
            ${data.upcomingAssignments.length ? data.upcomingAssignments.map(a => `
              <div class="assignment-card" onclick="Router.navigate('/assignments/${a._id}')">
                <div class="assignment-card__icon ${a.type === 'TEST' ? 'assignment-card__icon--test' : 'assignment-card__icon--doc'}">
                  ${a.type === 'TEST'
                    ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                    : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>'
                  }
                </div>
                <div class="assignment-card__content">
                  <div class="assignment-card__title">${Utils.escapeHtml(a.title)}</div>
                  <div class="assignment-card__meta">
                    <span>${Utils.escapeHtml(a.course?.title || '')}</span>
                    <span class="assignment-card__deadline">⏰ ${Utils.timeLeft(a.deadline)}</span>
                  </div>
                </div>
                ${Utils.typeBadge(a.type)}
              </div>
            `).join('') : Utils.emptyState('Нет ближайших дедлайнов', 'Все задания выполнены или нет активных заданий')}
          </div>
        </div>
      </div>
    `;
  }
};
