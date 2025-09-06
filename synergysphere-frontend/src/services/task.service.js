import api from './api';

export const taskService = {
  async getMyTasks() {
    const response = await api.get('/tasks/mytasks');
    return response.data.data.tasks;
  },

  async getProjectTasks(projectId) {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data.data.tasks;
  },

  async getTaskById(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data.data.task;
  },

  async createTask(projectId, taskData) {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data.data.task;
  },

  async updateTask(taskId, updates) {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data.data.task;
  },

  async deleteTask(taskId) {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  async assignUserToTask(taskId, assignees) {
    const response = await api.put(`/tasks/${taskId}/assign`, { assignees });
    return response.data.data;
  },

  async getTaskComments(taskId) {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data.data.comments;
  },

  async addTaskComment(taskId, content) {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data.data.comment;
  },

  async uploadTaskAttachment(taskId, file) {
    const formData = new FormData();
    formData.append('files', file);
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }
};
