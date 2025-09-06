import api from './api';

export const projectService = {
  async getAllProjects() {
    const response = await api.get('/users/projects');
    return response.data.data.projects;
  },

  async getProjectById(projectId) {
    const response = await api.get(`/projects/${projectId}`);
    return response.data.data.project;
  },

  async createProject(name, description) {
    const response = await api.post('/projects', { name, description });
    return response.data.data.project;
  },

  async updateProject(projectId, updates) {
    const response = await api.put(`/projects/${projectId}`, updates);
    return response.data.data.project;
  },

  async deleteProject(projectId) {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  async getProjectMembers(projectId) {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data.data;
  },

  async addProjectMember(projectId, username, role = 'Member') {
    const response = await api.post(`/projects/${projectId}/members`, { username, role });
    return response.data.data;
  },

  async removeProjectMember(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  }
};
