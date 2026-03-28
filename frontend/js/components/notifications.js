// Уведомления
const Notify = {
  container: null,

  init() {
    this.container = document.getElementById('notifications');
  },

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const el = document.createElement('div');
    el.className = `notification notification--${type}`;
    el.innerHTML = `
      <span>${message}</span>
      <span class="notification__close">&times;</span>
    `;

    el.querySelector('.notification__close').onclick = () => el.remove();

    this.container.appendChild(el);

    setTimeout(() => {
      el.style.transition = 'opacity 0.3s, transform 0.3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};
