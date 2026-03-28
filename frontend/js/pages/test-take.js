// Страница прохождения теста
const TestTakePage = {
  async render(assignmentId) {
    const app = document.getElementById('app');
    app.innerHTML = Utils.loader();

    try {
      const { assignment } = await API.get(`/assignments/${assignmentId}`);
      const test = assignment.test;

      if (!test || !test.questions || test.questions.length === 0) {
        app.innerHTML = Utils.emptyState('Тест не найден', 'К этому заданию не привязан тест');
        return;
      }

      const answers = {};

      app.innerHTML = `
        <div class="fade-in">
          <div class="back-link" onclick="Router.navigate('/assignments/${assignmentId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>
            Назад к заданию
          </div>

          <div class="page-header">
            <div>
              <h1>${Utils.escapeHtml(test.title || assignment.title)}</h1>
              <p class="page-header__subtitle">${test.questions.length} вопрос(ов)</p>
            </div>
            <div class="badge badge--info" id="testProgress">0 / ${test.questions.length}</div>
          </div>

          <div class="progress mb-3">
            <div class="progress__bar" id="testProgressBar" style="width: 0%"></div>
          </div>

          <div id="questionsRoot">
            ${test.questions.map((q, qi) => `
              <div class="test-question fade-in" style="animation-delay:${qi * 0.1}s" data-qid="${q._id}">
                <div class="test-question__number">Вопрос ${qi + 1}</div>
                <div class="test-question__text">${Utils.escapeHtml(q.text)}</div>
                <div class="test-options">
                  ${q.options.map((opt, oi) => `
                    <div class="test-option" data-qi="${qi}" data-oi="${oi}" onclick="TestTakePage.selectOption(this, '${q._id}', ${oi}, ${q.multipleCorrect || false})">
                      <div class="${q.multipleCorrect ? 'test-option__checkbox' : 'test-option__radio'}"></div>
                      <div class="test-option__text">${Utils.escapeHtml(opt.text)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="text-center mt-4">
            <button class="btn btn--primary btn--lg" id="submitTestBtn" onclick="TestTakePage.submit('${assignmentId}')">
              Завершить тест
            </button>
          </div>
        </div>
      `;

      this.answers = {};
      this.totalQuestions = test.questions.length;
      this.questions = test.questions;
    } catch (err) {
      Notify.error(err.message);
    }
  },

  answers: {},
  totalQuestions: 0,
  questions: [],

  selectOption(el, questionId, optionIndex, multipleCorrect) {
    if (multipleCorrect) {
      el.classList.toggle('selected');
      if (!this.answers[questionId]) this.answers[questionId] = [];
      const idx = this.answers[questionId].indexOf(optionIndex);
      if (idx > -1) {
        this.answers[questionId].splice(idx, 1);
      } else {
        this.answers[questionId].push(optionIndex);
      }
    } else {
      // Single choice — снять выделение с других
      const parent = el.closest('.test-options');
      parent.querySelectorAll('.test-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      this.answers[questionId] = [optionIndex];
    }

    this.updateProgress();
  },

  updateProgress() {
    const answered = Object.keys(this.answers).filter(k => this.answers[k].length > 0).length;
    const pct = Math.round((answered / this.totalQuestions) * 100);
    const bar = document.getElementById('testProgressBar');
    const label = document.getElementById('testProgress');
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = `${answered} / ${this.totalQuestions}`;
  },

  async submit(assignmentId) {
    const answered = Object.keys(this.answers).filter(k => this.answers[k].length > 0).length;

    if (answered < this.totalQuestions) {
      if (!confirm(`Вы ответили на ${answered} из ${this.totalQuestions} вопросов. Отправить?`)) return;
    }

    const btn = document.getElementById('submitTestBtn');
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    try {
      const answersArray = this.questions.map(q => ({
        questionId: q._id,
        selectedOptions: this.answers[q._id] || []
      }));

      const result = await API.post('/submissions/test', {
        assignmentId,
        answers: answersArray
      });

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="fade-in" style="max-width:500px;margin:60px auto;text-align:center">
          <div class="card card--accent" style="padding:48px">
            <div class="score-result__circle" style="--progress: ${result.score}%; width:140px;height:140px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:3rem;font-weight:700;border-radius:50%;position:relative;color:var(--accent)">
              ${result.score}
            </div>
            <h2 style="margin-bottom:8px">Тест завершён!</h2>
            <p style="color:var(--text-muted);margin-bottom:8px">
              Правильных ответов: ${result.correctCount} из ${result.totalQuestions}
            </p>
            <div class="progress progress--lg mt-2" style="max-width:300px;margin:16px auto">
              <div class="progress__bar" style="width:${result.score}%;${result.score >= 60 ? '' : 'background:linear-gradient(90deg,var(--danger),var(--warning))'}"></div>
            </div>
            <p style="margin-top:16px;font-size:1.1rem;font-weight:600;color:${result.score >= 60 ? 'var(--success)' : 'var(--warning)'}">
              ${result.score >= 90 ? 'Превосходно!' : result.score >= 60 ? 'Хороший результат!' : 'Стоит повторить материал'}
            </p>
            <div class="mt-3">
              <button class="btn btn--primary" onclick="Router.navigate('/assignments')">К заданиям</button>
              <button class="btn btn--secondary" onclick="Router.navigate('/dashboard')" style="margin-left:8px">Дашборд</button>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      Notify.error(err.message);
      btn.disabled = false;
      btn.textContent = 'Завершить тест';
    }
  }
};
