import api from './api';

export const disciplineService = {
  submitCase: async (data) => {
    const response = await api.post('/discipline/cases', data);
    return response.data;
  },

  getCases: async (params = {}) => {
    const response = await api.get('/discipline/cases', { params });
    return response.data;
  },

  getCaseById: async (id) => {
    const response = await api.get(`/discipline/cases/${id}`);
    return response.data;
  },

  updateCaseStatus: async (id, status, updateContent) => {
    const response = await api.put(`/discipline/cases/${id}/status`, {
      status,
      updateContent,
    });
    return response.data;
  },

  assignCase: async (id, assignedTo) => {
    const response = await api.put(`/discipline/cases/${id}/assign`, { assignedTo });
    return response.data;
  },

  addUpdate: async (id, updateType, updateContent) => {
    const response = await api.post(`/discipline/cases/${id}/updates`, {
      updateType,
      updateContent,
    });
    return response.data;
  },

  scheduleConsultation: async (data) => {
    const response = await api.post('/discipline/consultations', data);
    return response.data;
  },

  getConsultations: async () => {
    const response = await api.get('/discipline/consultations');
    return response.data;
  },
};
