// API модуль — обёртка над fetch
const API = {
  baseURL: '/api',

  getToken() {
    return localStorage.getItem('lms_token');
  },

  setToken(token) {
    localStorage.setItem('lms_token', token);
  },

  removeToken() {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
  },

  getUser() {
    const data = localStorage.getItem('lms_user');
    return data ? JSON.parse(data) : null;
  },

  setUser(user) {
    localStorage.setItem('lms_user', JSON.stringify(user));
  },

  async request(method, endpoint, data = null, isFormData = false) {
    const headers = {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = { method, headers };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    const response = await fetch(this.baseURL + endpoint, config);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || json.errors?.[0]?.msg || 'Ошибка запроса');
    }

    return json;
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, data) { return this.request('POST', endpoint, data); },
  put(endpoint, data) { return this.request('PUT', endpoint, data); },
  delete(endpoint) { return this.request('DELETE', endpoint); },
  upload(endpoint, formData) { return this.request('POST', endpoint, formData, true); }
};
