// Страница заданий
const AssignmentsPage = {
  async render(params) {
    const app = document.getElementById('app');
    const user = API.getUser();

    if (params && params[0] === 'create') {
      return this.renderCreate();
    }

    if (params && params[0]) {
      return this.renderDetail(params[0]);
    }

    app.innerHTML = Utils.loader();

    try {
      const { assignments } = await API.get('/assignments');

      app.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1>Задания</h1>
              <p class="page-header__subtitle">${assignments.length} задание(й)</p>
            </div>
            ${user.role === 'ADMIN' ? `
              <button class="btn btn--primary" onclick="Router.navigate('/assignments/create')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Новое задание
              </button>
            ` : ''}
          </div>

          <div class="stagger">
            ${assignments.length ? assignments.map(a => `
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
                    <span>${Utils.escapeHtml(a.theme?.title || '')}</span>
                    <span class="assignment-card__deadline">
                      ${Utils.isOverdue(a.deadline) ? '🔴' : '⏰'} ${Utils.formatDate(a.deadline)}
                      ${!Utils.isOverdue(a.deadline) ? `(${Utils.timeLeft(a.deadline)})` : ''}
                    </span>
                  </div>
                </div>
                <div class="assignment-card__status">
                  ${a.submissionStatus ? Utils.statusBadge(a.submissionStatus) : Utils.typeBadge(a.type)}
                  ${a.submissionScore !== null && a.submissionScore !== undefined ? `<div style="font-size:0.85rem;font-weight:700;color:var(--accent);margin-top:4px;text-align:right">${a.submissionScore}/100</div>` : ''}
                </div>
              </div>
            `).join('') : Utils.emptyState('Нет заданий', 'Задания пока не созданы')}
          </div>
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  async renderDetail(assignmentId) {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();
    const user = API.getUser();

    try {
      const { assignment, submission, submissions } = await API.get(`/assignments/${assignmentId}`);

      let contentHtml = '';

      if (user.role === 'STUDENT') {
        if (assignment.type === 'TEST' && assignment.test) {
          // Если уже сдал — показать результат
          if (submission && submission.status === 'GRADED') {
            contentHtml = `
              <div class="score-result card">
                <div class="score-result__circle" style="--progress: ${submission.score}%">
                  ${submission.score}
                </div>
                <h2 style="margin-bottom:8px">Ваш результат</h2>
                <p style="color:var(--text-muted)">${submission.score >= 60 ? 'Отлично! Тест пройден.' : 'Попробуйте ещё раз.'}</p>
                ${assignment.allowResubmit ? `
                  <button class="btn btn--primary mt-3" onclick="TestTakePage.render('${assignmentId}')">Пройти заново</button>
                ` : ''}
              </div>
            `;
          } else {
            contentHtml = `
              <button class="btn btn--primary btn--lg" onclick="TestTakePage.render('${assignmentId}')">
                Начать тест
              </button>
            `;
          }
        } else if (assignment.type === 'DOCUMENT') {
          contentHtml = this.renderFileUpload(assignmentId, submission);
        }
      } else {
        // Админ: список сдач
        contentHtml = `
          <div class="section">
            <div class="section__title">Работы студентов (${submissions.length})</div>
            ${submissions.length ? `
              <div class="table-wrapper">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th>Статус</th>
                      <th>Балл</th>
                      <th>Дата сдачи</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${submissions.map(s => `
                      <tr>
                        <td data-label="Студент">${Utils.escapeHtml((s.student?.firstName || '') + ' ' + (s.student?.lastName || ''))}</td>
                        <td data-label="Статус">${Utils.statusBadge(s.status)}</td>
                        <td data-label="Балл"><strong>${s.score !== null ? s.score : '—'}</strong></td>
                        <td data-label="Дата сдачи">${Utils.formatDateTime(s.submittedAt)}</td>
                        <td data-label="Действия">
                          <div class="actions">
                            <button class="btn btn--secondary btn--sm" onclick="AssignmentsPage.openGrade('${s._id}', ${s.score || 0})">Оценить</button>
                            ${s.files && s.files.length ? `
                              <a href="/uploads/${s.files[0].filename}" target="_blank" class="btn btn--secondary btn--sm">📎 Файл</a>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<p style="color:var(--text-muted)">Нет сданных работ</p>'}
          </div>
        `;
      }

      app.innerHTML = `
        <div class="fade-in">
          <div class="back-link" onclick="Router.navigate('/assignments')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>
            Назад к заданиям
          </div>

          <div class="page-header">
            <div>
              <div class="flex gap-1 mb-1">
                ${Utils.typeBadge(assignment.type)}
                <span class="badge badge--accent">${Utils.escapeHtml(assignment.category)}</span>
                ${Utils.isOverdue(assignment.deadline)
                  ? '<span class="badge badge--danger">Просрочено</span>'
                  : `<span class="badge badge--info">${Utils.timeLeft(assignment.deadline)}</span>`
                }
              </div>
              <h1>${Utils.escapeHtml(assignment.title)}</h1>
              <p class="page-header__subtitle">
                ${Utils.escapeHtml(assignment.course?.title || '')} → ${Utils.escapeHtml(assignment.theme?.title || '')}
              </p>
            </div>
            ${user.role === 'ADMIN' ? `
              <div class="actions">
                <button class="btn btn--secondary" onclick="AssignmentsPage.openEdit('${assignment._id}')">Редактировать</button>
                <button class="btn btn--danger" onclick="AssignmentsPage.deleteAssignment('${assignment._id}')">Удалить</button>
              </div>
            ` : ''}
          </div>

          ${assignment.description ? `
            <div class="card mb-3">
              <div class="card__text">${Utils.escapeHtml(assignment.description)}</div>
              <div class="card__meta">
                <span>Дедлайн: <strong>${Utils.formatDateTime(assignment.deadline)}</strong></span>
                <span>Макс. балл: <strong>${assignment.maxScore}</strong></span>
              </div>
            </div>
          ` : ''}

          ${contentHtml}
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  renderFileUpload(assignmentId, submission) {
    if (submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED')) {
      return `
        <div class="card">
          <h3 style="margin-bottom:16px">Ваша работа</h3>
          ${Utils.statusBadge(submission.status)}
          ${submission.score !== null ? `<div style="font-size:1.5rem;font-weight:700;color:var(--accent);margin-top:12px">${submission.score}/100</div>` : ''}
          ${submission.feedback ? `<p style="margin-top:12px;color:var(--text-secondary)">${Utils.escapeHtml(submission.feedback)}</p>` : ''}
          <div class="file-list mt-2">
            ${(submission.files || []).map(f => `
              <div class="file-item">
                <span>📎</span>
                <span class="file-item__name">${Utils.escapeHtml(f.originalName)}</span>
                <span class="file-item__size">${Utils.formatFileSize(f.size)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <h3 style="margin-bottom:16px">Загрузить работу</h3>
        <form id="uploadForm">
          <div class="file-upload" id="dropZone" onclick="document.getElementById('fileInput').click()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div class="file-upload__text">Нажмите или перетащите файлы</div>
            <div class="file-upload__hint">PDF, DOC, DOCX, XLS, PPT, ZIP, изображения (макс. 10 МБ)</div>
          </div>
          <input type="file" id="fileInput" multiple hidden>
          <div class="file-list" id="fileList"></div>
          <button type="submit" class="btn btn--primary btn--full mt-2" id="uploadBtn" disabled>Отправить</button>
        </form>
      </div>
    `;
  },

  async renderCreate() {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();

    try {
      const { courses } = await API.get('/courses');
      const { tests } = await API.get('/tests');
      const { groups } = await API.get('/groups');

      let themes = [];

      app.innerHTML = `
        <div class="fade-in">
          <div class="back-link" onclick="Router.navigate('/assignments')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>
            Назад
          </div>

          <div class="page-header">
            <h1>Новое задание</h1>
          </div>

          <div class="card">
            <form id="assignmentForm">
              <div class="form-group">
                <label>Название</label>
                <input type="text" class="form-input" id="aTitle" required>
              </div>
              <div class="form-group">
                <label>Описание</label>
                <textarea class="form-input" id="aDesc"></textarea>
              </div>
              <div class="grid grid--2">
                <div class="form-group">
                  <label>Тип</label>
                  <select class="form-select" id="aType">
                    <option value="TEST">Тест</option>
                    <option value="DOCUMENT">Документ (файл)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Категория</label>
                  <select class="form-select" id="aCategory">
                    <option value="Домашнее задание">Домашнее задание</option>
                    <option value="Лабораторная">Лабораторная</option>
                    <option value="Контрольная">Контрольная</option>
                    <option value="Экзамен">Экзамен</option>
                    <option value="Практика">Практика</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>
              </div>
              <div class="grid grid--2">
                <div class="form-group">
                  <label>Курс</label>
                  <select class="form-select" id="aCourse" required>
                    <option value="">Выберите курс</option>
                    ${courses.map(c => `<option value="${c._id}">${Utils.escapeHtml(c.title)}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Тема</label>
                  <select class="form-select" id="aTheme" required>
                    <option value="">Сначала выберите курс</option>
                  </select>
                </div>
              </div>
              <div class="form-group" id="testSelectGroup">
                <label>Тест</label>
                <select class="form-select" id="aTest">
                  <option value="">Без теста</option>
                  ${tests.map(t => `<option value="${t._id}">${Utils.escapeHtml(t.title)} (${t.questions?.length || 0} вопросов)</option>`).join('')}
                </select>
                <div class="mt-1">
                  <button type="button" class="btn btn--secondary btn--sm" onclick="AssignmentsPage.openCreateTest()">+ Создать тест</button>
                </div>
              </div>
              <div class="grid grid--2">
                <div class="form-group">
                  <label>Дедлайн</label>
                  <input type="datetime-local" class="form-input" id="aDeadline" required>
                </div>
                <div class="form-group">
                  <label>Макс. балл</label>
                  <input type="number" class="form-input" id="aMaxScore" value="100">
                </div>
              </div>
              <div class="form-group">
                <label>Группы</label>
                <div class="flex flex-wrap gap-1" id="groupCheckboxes">
                  ${groups.map(g => `
                    <label class="chip" style="cursor:pointer">
                      <input type="checkbox" value="${g._id}" name="groups"> ${Utils.escapeHtml(g.name)}
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="aPublished"> Опубликовать
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="aResubmit"> Разрешить повторную сдачу
                </label>
              </div>
              <button type="submit" class="btn btn--primary btn--full btn--lg">Создать задание</button>
            </form>
          </div>
        </div>
      `;

      // Подгрузка тем при выборе курса
      document.getElementById('aCourse').onchange = async (e) => {
        const courseId = e.target.value;
        if (!courseId) return;
        try {
          const { themes: t } = await API.get(`/themes?course=${courseId}`);
          const sel = document.getElementById('aTheme');
          sel.innerHTML = t.map(th => `<option value="${th._id}">${Utils.escapeHtml(th.title)}</option>`).join('');
        } catch (err) {
          Notify.error(err.message);
        }
      };

      // Скрыть/показать выбор теста
      document.getElementById('aType').onchange = (e) => {
        document.getElementById('testSelectGroup').style.display =
          e.target.value === 'TEST' ? 'block' : 'none';
      };

      document.getElementById('assignmentForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const groups = Array.from(document.querySelectorAll('input[name="groups"]:checked')).map(cb => cb.value);
          const data = {
            title: document.getElementById('aTitle').value,
            description: document.getElementById('aDesc').value,
            type: document.getElementById('aType').value,
            category: document.getElementById('aCategory').value,
            course: document.getElementById('aCourse').value,
            theme: document.getElementById('aTheme').value,
            deadline: new Date(document.getElementById('aDeadline').value).toISOString(),
            maxScore: parseInt(document.getElementById('aMaxScore').value) || 100,
            groups,
            isPublished: document.getElementById('aPublished').checked,
            allowResubmit: document.getElementById('aResubmit').checked
          };

          if (data.type === 'TEST') {
            const testId = document.getElementById('aTest').value;
            if (testId) data.test = testId;
          }

          await API.post('/assignments', data);
          Notify.success('Задание создано');
          Router.navigate('/assignments');
        } catch (err) {
          Notify.error(err.message);
        }
      };
    } catch (err) {
      Notify.error(err.message);
    }
  },

  openCreateTest() {
    Modal.open('Создать тест', `
      <form id="testCreateForm">
        <div class="form-group">
          <label>Название теста</label>
          <input type="text" class="form-input" id="testTitle" required>
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea class="form-input" id="testDescription"></textarea>
        </div>
        <div id="questionsContainer">
          <div class="section__title">Вопросы</div>
        </div>
        <button type="button" class="btn btn--secondary btn--full mb-2" onclick="AssignmentsPage.addQuestion()">+ Добавить вопрос</button>
        <button type="submit" class="btn btn--primary btn--full">Создать тест</button>
      </form>
    `);

    this.questionCount = 0;
    this.addQuestion();

    document.getElementById('testCreateForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const questions = [];
        const qBlocks = document.querySelectorAll('.question-block');

        qBlocks.forEach((block, qi) => {
          const text = block.querySelector('.q-text').value;
          const multipleCorrect = block.querySelector('.q-multiple').checked;
          const options = [];
          block.querySelectorAll('.option-row').forEach(row => {
            options.push({
              text: row.querySelector('.opt-text').value,
              isCorrect: row.querySelector('.opt-correct').checked
            });
          });
          questions.push({ text, multipleCorrect, options, order: qi });
        });

        const test = await API.post('/tests', {
          title: document.getElementById('testTitle').value,
          description: document.getElementById('testDescription').value,
          questions
        });

        Modal.close();
        Notify.success('Тест создан');

        // Обновить список тестов
        const sel = document.getElementById('aTest');
        if (sel) {
          const opt = document.createElement('option');
          opt.value = test.test._id;
          opt.textContent = test.test.title;
          opt.selected = true;
          sel.appendChild(opt);
        }
      } catch (err) {
        Notify.error(err.message);
      }
    };
  },

  questionCount: 0,

  addQuestion() {
    const container = document.getElementById('questionsContainer');
    const idx = this.questionCount++;

    const div = document.createElement('div');
    div.className = 'question-block card mb-2';
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <strong style="color:var(--accent)">Вопрос ${idx + 1}</strong>
        <button type="button" class="btn btn--danger btn--sm" onclick="this.closest('.question-block').remove()">✕</button>
      </div>
      <div class="form-group">
        <input type="text" class="form-input q-text" placeholder="Текст вопроса" required>
      </div>
      <div class="form-group">
        <label><input type="checkbox" class="q-multiple"> Несколько правильных ответов</label>
      </div>
      <div class="options-list">
        <div class="option-row flex items-center gap-1 mb-1">
          <input type="checkbox" class="opt-correct">
          <input type="text" class="form-input opt-text" placeholder="Вариант ответа" style="flex:1" required>
          <button type="button" class="btn btn--danger btn--sm" onclick="this.closest('.option-row').remove()">✕</button>
        </div>
        <div class="option-row flex items-center gap-1 mb-1">
          <input type="checkbox" class="opt-correct">
          <input type="text" class="form-input opt-text" placeholder="Вариант ответа" style="flex:1" required>
          <button type="button" class="btn btn--danger btn--sm" onclick="this.closest('.option-row').remove()">✕</button>
        </div>
      </div>
      <button type="button" class="btn btn--secondary btn--sm" onclick="AssignmentsPage.addOption(this)">+ Вариант</button>
    `;

    container.appendChild(div);
  },

  addOption(btn) {
    const list = btn.previousElementSibling;
    const row = document.createElement('div');
    row.className = 'option-row flex items-center gap-1 mb-1';
    row.innerHTML = `
      <input type="checkbox" class="opt-correct">
      <input type="text" class="form-input opt-text" placeholder="Вариант ответа" style="flex:1" required>
      <button type="button" class="btn btn--danger btn--sm" onclick="this.closest('.option-row').remove()">✕</button>
    `;
    list.appendChild(row);
  },

  openGrade(submissionId, currentScore) {
    Modal.open('Оценить работу', `
      <form id="gradeForm">
        <div class="form-group">
          <label>Балл (0-100)</label>
          <input type="number" class="form-input" id="gradeScore" min="0" max="100" value="${currentScore}" required>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea class="form-input" id="gradeFeedback" placeholder="Комментарий к оценке..."></textarea>
        </div>
        <button type="submit" class="btn btn--primary btn--full">Сохранить оценку</button>
      </form>
    `);

    document.getElementById('gradeForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.put(`/submissions/${submissionId}/grade`, {
          score: parseInt(document.getElementById('gradeScore').value),
          feedback: document.getElementById('gradeFeedback').value
        });
        Modal.close();
        Notify.success('Оценка сохранена');
        // Перезагрузить
        Router.handleRoute();
      } catch (err) {
        Notify.error(err.message);
      }
    };
  },

  async openEdit(assignmentId) {
    try {
      const { assignment } = await API.get(`/assignments/${assignmentId}`);

      Modal.open('Редактировать задание', `
        <form id="aEditForm">
          <div class="form-group">
            <label>Название</label>
            <input type="text" class="form-input" id="aeTitle" value="${Utils.escapeHtml(assignment.title)}" required>
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea class="form-input" id="aeDesc">${Utils.escapeHtml(assignment.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Дедлайн</label>
            <input type="datetime-local" class="form-input" id="aeDeadline" value="${new Date(assignment.deadline).toISOString().slice(0, 16)}" required>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="aePublished" ${assignment.isPublished ? 'checked' : ''}> Опубликовать
            </label>
          </div>
          <button type="submit" class="btn btn--primary btn--full">Сохранить</button>
        </form>
      `);

      document.getElementById('aEditForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          await API.put(`/assignments/${assignmentId}`, {
            title: document.getElementById('aeTitle').value,
            description: document.getElementById('aeDesc').value,
            deadline: new Date(document.getElementById('aeDeadline').value).toISOString(),
            isPublished: document.getElementById('aePublished').checked
          });
          Modal.close();
          Notify.success('Задание обновлено');
          this.renderDetail(assignmentId);
        } catch (err) {
          Notify.error(err.message);
        }
      };
    } catch (err) {
      Notify.error(err.message);
    }
  },

  async deleteAssignment(id) {
    if (!confirm('Удалить задание?')) return;
    try {
      await API.delete(`/assignments/${id}`);
      Notify.success('Задание удалено');
      Router.navigate('/assignments');
    } catch (err) {
      Notify.error(err.message);
    }
  }
};
