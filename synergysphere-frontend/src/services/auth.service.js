import api from './api';

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    const { user, token } = response.data.data;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },

  async register(username, fullName, password) {
    const response = await api.post('/auth/register', {
      username,
      full_name: fullName,
      password
    });
    const { user, token } = response.data.data;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
};
