import api from './api';

export const alumniService = {
  getAll: async (params = {}) => {
    const response = await api.get('/alumni', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/alumni/${id}`);
    return response.data;
  },

  getAchievements: async (id) => {
    const response = await api.get(`/alumni/${id}/achievements`);
    return response.data;
  },

  saveProfile: async (data) => {
    const response = await api.post('/alumni/profile', data);
    return response.data;
  },

  addAchievement: async (id, data) => {
    const response = await api.post(`/alumni/${id}/achievements`, data);
    return response.data;
  },

  addEducation: async (id, data) => {
    const response = await api.post(`/alumni/${id}/education`, data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/alumni/stats/summary');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/alumni/stats/summary');
    return response.data;
  },
};

