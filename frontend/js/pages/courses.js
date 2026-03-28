// Страница курсов
const CoursesPage = {
  async render(params) {
    const app = document.getElementById('app');
    const user = API.getUser();

    if (params && params[0]) {
      return this.renderDetail(params[0]);
    }

    app.innerHTML = Utils.loader();

    try {
      const { courses } = await API.get('/courses');

      app.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1>Курсы</h1>
              <p class="page-header__subtitle">${courses.length} курс(ов)</p>
            </div>
            ${user.role === 'ADMIN' ? `
              <button class="btn btn--primary" onclick="CoursesPage.openCreate()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Новый курс
              </button>
            ` : ''}
          </div>

          <div class="grid grid--3 stagger">
            ${courses.length ? courses.map(c => `
              <div class="course-card" onclick="Router.navigate('/courses/${c._id}')">
                <div class="course-card__cover">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </div>
                <div class="course-card__body">
                  <div class="course-card__category">${Utils.escapeHtml(c.category)}</div>
                  <div class="course-card__title">${Utils.escapeHtml(c.title)}</div>
                  <div class="course-card__desc">${Utils.escapeHtml(c.description || 'Без описания')}</div>
                  <div class="course-card__footer">
                    <span class="course-card__author">${Utils.escapeHtml((c.author?.firstName || '') + ' ' + (c.author?.lastName || ''))}</span>
                    ${c.isPublished
                      ? '<span class="badge badge--success">Опубликован</span>'
                      : '<span class="badge badge--muted">Черновик</span>'
                    }
                  </div>
                </div>
              </div>
            `).join('') : Utils.emptyState('Нет курсов', 'Курсы пока не созданы')}
          </div>
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  async renderDetail(courseId) {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();
    const user = API.getUser();

    try {
      const { course, themes, assignments } = await API.get(`/courses/${courseId}`);

      app.innerHTML = `
        <div class="fade-in">
          <div class="back-link" onclick="Router.navigate('/courses')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>
            Назад к курсам
          </div>

          <div class="page-header">
            <div>
              <span class="badge badge--accent">${Utils.escapeHtml(course.category)}</span>
              <h1 style="margin-top: 8px">${Utils.escapeHtml(course.title)}</h1>
              <p class="page-header__subtitle">${Utils.escapeHtml(course.description || '')}</p>
            </div>
            ${user.role === 'ADMIN' ? `
              <div class="actions">
                <button class="btn btn--secondary" onclick="CoursesPage.openEdit('${course._id}')">Редактировать</button>
                <button class="btn btn--danger" onclick="CoursesPage.deleteCourse('${course._id}')">Удалить</button>
              </div>
            ` : ''}
          </div>

          <!-- Темы -->
          <div class="section">
            <div class="section__title flex justify-between">
              <span>Темы (${themes.length})</span>
              ${user.role === 'ADMIN' ? `
                <button class="btn btn--primary btn--sm" onclick="CoursesPage.openCreateTheme('${course._id}')">+ Тема</button>
              ` : ''}
            </div>
            <div class="stagger">
              ${themes.length ? themes.map((t, i) => `
                <div class="card" style="cursor:pointer" onclick="Router.navigate('/courses/${course._id}/theme/${t._id}')">
                  <div class="flex items-center gap-2">
                    <span style="color:var(--accent);font-weight:700;font-size:1.2rem">${String(i + 1).padStart(2, '0')}</span>
                    <div class="flex-1">
                      <div class="card__title">${Utils.escapeHtml(t.title)}</div>
                      <div class="card__text">${Utils.escapeHtml(t.description || '')}</div>
                    </div>
                    ${user.role === 'ADMIN' ? `
                      <div class="actions" onclick="event.stopPropagation()">
                        <button class="btn btn--secondary btn--sm" onclick="CoursesPage.openEditTheme('${t._id}')">✎</button>
                        <button class="btn btn--danger btn--sm" onclick="CoursesPage.deleteTheme('${t._id}', '${course._id}')">✕</button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('') : Utils.emptyState('Нет тем', 'Добавьте первую тему курса')}
            </div>
          </div>

          <!-- Задания курса -->
          <div class="section">
            <div class="section__title flex justify-between">
              <span>Задания (${assignments.length})</span>
              ${user.role === 'ADMIN' ? `
                <button class="btn btn--primary btn--sm" onclick="Router.navigate('/assignments/create?course=${course._id}')">+ Задание</button>
              ` : ''}
            </div>
            <div class="stagger">
              ${assignments.length ? assignments.map(a => `
                <div class="assignment-card" onclick="Router.navigate('/assignments/${a._id}')">
                  <div class="assignment-card__icon ${a.type === 'TEST' ? 'assignment-card__icon--test' : 'assignment-card__icon--doc'}">
                    ${a.type === 'TEST'
                      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/></svg>'
                      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>'
                    }
                  </div>
                  <div class="assignment-card__content">
                    <div class="assignment-card__title">${Utils.escapeHtml(a.title)}</div>
                    <div class="assignment-card__meta">
                      ${Utils.typeBadge(a.type)}
                      <span>⏰ ${Utils.formatDate(a.deadline)}</span>
                      <span class="badge badge--accent">${Utils.escapeHtml(a.category)}</span>
                    </div>
                  </div>
                </div>
              `).join('') : Utils.emptyState('Нет заданий', 'Создайте первое задание')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  openCreate() {
    Modal.open('Новый курс', `
      <form id="courseForm">
        <div class="form-group">
          <label>Название</label>
          <input type="text" class="form-input" id="courseTitle" required>
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea class="form-input" id="courseDesc"></textarea>
        </div>
        <div class="form-group">
          <label>Категория</label>
          <select class="form-select" id="courseCategory">
            <option value="Другое">Другое</option>
            <option value="Экзамен">Экзамен</option>
            <option value="Лабораторная">Лабораторная</option>
            <option value="Практика">Практика</option>
            <option value="Лекция">Лекция</option>
            <option value="Семинар">Семинар</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="coursePublished"> Опубликовать
          </label>
        </div>
        <button type="submit" class="btn btn--primary btn--full">Создать</button>
      </form>
    `);

    document.getElementById('courseForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.post('/courses', {
          title: document.getElementById('courseTitle').value,
          description: document.getElementById('courseDesc').value,
          category: document.getElementById('courseCategory').value,
          isPublished: document.getElementById('coursePublished').checked
        });
        Modal.close();
        Notify.success('Курс создан');
        this.render([]);
      } catch (err) {
        Notify.error(err.message);
      }
    };
  },

  async openEdit(courseId) {
    try {
      const { course } = await API.get(`/courses/${courseId}`);

      Modal.open('Редактировать курс', `
        <form id="courseEditForm">
          <div class="form-group">
            <label>Название</label>
            <input type="text" class="form-input" id="courseTitle" value="${Utils.escapeHtml(course.title)}" required>
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea class="form-input" id="courseDesc">${Utils.escapeHtml(course.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Категория</label>
            <select class="form-select" id="courseCategory">
              ${['Другое','Экзамен','Лабораторная','Практика','Лекция','Семинар'].map(c =>
                `<option value="${c}" ${course.category === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="coursePublished" ${course.isPublished ? 'checked' : ''}> Опубликовать
            </label>
          </div>
          <button type="submit" class="btn btn--primary btn--full">Сохранить</button>
        </form>
      `);

      document.getElementById('courseEditForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          await API.put(`/courses/${courseId}`, {
            title: document.getElementById('courseTitle').value,
            description: document.getElementById('courseDesc').value,
            category: document.getElementById('courseCategory').value,
            isPublished: document.getElementById('coursePublished').checked
          });
          Modal.close();
          Notify.success('Курс обновлён');
          this.renderDetail(courseId);
        } catch (err) {
          Notify.error(err.message);
        }
      };
    } catch (err) {
      Notify.error(err.message);
    }
  },

  async deleteCourse(id) {
    if (!confirm('Удалить курс и все связанные данные?')) return;
    try {
      await API.delete(`/courses/${id}`);
      Notify.success('Курс удалён');
      Router.navigate('/courses');
    } catch (err) {
      Notify.error(err.message);
    }
  },

  openCreateTheme(courseId) {
    Modal.open('Новая тема', `
      <form id="themeForm">
        <div class="form-group">
          <label>Название</label>
          <input type="text" class="form-input" id="themeTitle" required>
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea class="form-input" id="themeDesc"></textarea>
        </div>
        <div class="form-group">
          <label>Порядок</label>
          <input type="number" class="form-input" id="themeOrder" value="0">
        </div>
        <button type="submit" class="btn btn--primary btn--full">Создать</button>
      </form>
    `);

    document.getElementById('themeForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.post('/themes', {
          title: document.getElementById('themeTitle').value,
          description: document.getElementById('themeDesc').value,
          order: parseInt(document.getElementById('themeOrder').value) || 0,
          course: courseId
        });
        Modal.close();
        Notify.success('Тема создана');
        this.renderDetail(courseId);
      } catch (err) {
        Notify.error(err.message);
      }
    };
  },

  async openEditTheme(themeId) {
    try {
      const { theme } = await API.get(`/themes/${themeId}`);

      Modal.open('Редактировать тему', `
        <form id="themeEditForm">
          <div class="form-group">
            <label>Название</label>
            <input type="text" class="form-input" id="themeTitle" value="${Utils.escapeHtml(theme.title)}" required>
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea class="form-input" id="themeDesc">${Utils.escapeHtml(theme.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Порядок</label>
            <input type="number" class="form-input" id="themeOrder" value="${theme.order}">
          </div>
          <button type="submit" class="btn btn--primary btn--full">Сохранить</button>
        </form>
      `);

      document.getElementById('themeEditForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          await API.put(`/themes/${themeId}`, {
            title: document.getElementById('themeTitle').value,
            description: document.getElementById('themeDesc').value,
            order: parseInt(document.getElementById('themeOrder').value) || 0
          });
          Modal.close();
          Notify.success('Тема обновлена');
          this.renderDetail(theme.course._id || theme.course);
        } catch (err) {
          Notify.error(err.message);
        }
      };
    } catch (err) {
      Notify.error(err.message);
    }
  },

  async deleteTheme(themeId, courseId) {
    if (!confirm('Удалить тему?')) return;
    try {
      await API.delete(`/themes/${themeId}`);
      Notify.success('Тема удалена');
      this.renderDetail(courseId);
    } catch (err) {
      Notify.error(err.message);
    }
  }
};
