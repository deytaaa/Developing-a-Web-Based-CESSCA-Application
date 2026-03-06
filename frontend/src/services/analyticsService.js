import api from './api';

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getOrganizationStats: async (params = {}) => {
    const response = await api.get('/analytics/organizations/stats', { params });
    return response.data;
  },

  getAlumniReports: async () => {
    const response = await api.get('/analytics/alumni/reports');
    return response.data;
  },

  getDisciplineSummary: async () => {
    const response = await api.get('/analytics/discipline/summary');
    return response.data;
  },

  getSportsStats: async () => {
    const response = await api.get('/analytics/sports/stats');
    return response.data;
  },

  exportData: async (type, params = {}) => {
    const response = await api.get(`/analytics/export/${type}`, { params });
    return response.data;
  },
};
