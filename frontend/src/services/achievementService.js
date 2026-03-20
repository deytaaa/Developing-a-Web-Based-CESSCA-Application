import api from './api';

export const achievementService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/achievements', { params });
    return data;
  },

  getFeatured: async () => {
    const { data } = await api.get('/achievements/featured');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/achievements/${id}`);
    return data;
  },

  create: async (formData) => {
    const { data } = await api.post('/achievements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id, formData) => {
    const { data } = await api.put(`/achievements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/achievements/${id}`);
    return data;
  },
};
