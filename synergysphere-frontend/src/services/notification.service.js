import api from './api';

export const notificationService = {
  async getNotifications(page = 1, limit = 20) {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data.notification;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data.data;
  },

  async acceptInvitation(invitationId) {
    const response = await api.post(`/notifications/invitations/${invitationId}/accept`);
    return response.data.data.invitation;
  },

  async declineInvitation(invitationId) {
    const response = await api.post(`/notifications/invitations/${invitationId}/decline`);
    return response.data.data.invitation;
  }
};
