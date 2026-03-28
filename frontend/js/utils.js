// Утилиты
const Utils = {
  formatDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatDateTime(date) {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  timeLeft(deadline) {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl - now;

    if (diff < 0) return 'Просрочено';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} дн. ${hours} ч.`;
    if (hours > 0) return `${hours} ч.`;
    return 'Менее часа';
  },

  isOverdue(deadline) {
    return new Date() > new Date(deadline);
  },

  statusBadge(status) {
    const map = {
      'NOT_STARTED': { text: 'Не начато', class: 'badge--muted' },
      'IN_PROGRESS': { text: 'В процессе', class: 'badge--info' },
      'SUBMITTED': { text: 'Сдано', class: 'badge--warning' },
      'GRADED': { text: 'Оценено', class: 'badge--success' },
      'OVERDUE': { text: 'Просрочено', class: 'badge--danger' }
    };
    const s = map[status] || { text: status, class: 'badge--muted' };
    return `<span class="badge ${s.class}">${s.text}</span>`;
  },

  statusDot(status) {
    const map = {
      'NOT_STARTED': 'muted',
      'IN_PROGRESS': 'info',
      'SUBMITTED': 'warning',
      'GRADED': 'success',
      'OVERDUE': 'danger'
    };
    return `<span class="status-dot status-dot--${map[status] || 'muted'}"></span>`;
  },

  typeBadge(type) {
    if (type === 'TEST') return '<span class="badge badge--info">Тест</span>';
    return '<span class="badge badge--warning">Документ</span>';
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  },

  loader() {
    return '<div class="loader"><div class="loader__spinner"></div></div>';
  },

  emptyState(title, text) {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
    `;
  }
};
