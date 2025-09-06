import api from './api';

export const userService = {
  async searchUsers(username) {
    const response = await api.get(`/users/search?username=${username}`);
    return response.data.data.users;
  },

  async getUserProfile(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data.data.user;
  }
};
