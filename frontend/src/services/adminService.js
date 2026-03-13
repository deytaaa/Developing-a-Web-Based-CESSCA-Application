import api from './api';

export const adminService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getPendingUsers: async () => {
    const response = await api.get('/admin/users/pending');
    return response.data;
  },

  approveUser: async (id, status) => {
    const response = await api.put(`/admin/users/${id}/approve`, { status });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users/create', userData);
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getAnnouncements: async (params = {}) => {
    const response = await api.get('/admin/announcements', { params });
    return response.data;
  },

  createAnnouncement: async (data) => {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },

  updateAnnouncement: async (id, data) => {
    const response = await api.put(`/admin/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get('/admin/logs', { params });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSetting: async (key, value) => {
    const response = await api.put(`/admin/settings/${key}`, { value });
    return response.data;
  },

  getPendingMembers: async () => {
    const response = await api.get('/admin/members/pending');
    return response.data;
  },

  approveMembership: async (memberId) => {
    const response = await api.put(`/admin/members/${memberId}/approve`);
    return response.data;
  },

  rejectMembership: async (memberId) => {
    const response = await api.put(`/admin/members/${memberId}/reject`);
    return response.data;
  },
};
