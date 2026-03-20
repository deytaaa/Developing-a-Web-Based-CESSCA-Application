import api from './api';

const activityLogService = {
  getAll: async (page = 1, limit = 25) => {
    const { data } = await api.get('/activity-logs', { params: { page, limit } });
    return data;
  },
  create: async (log) => {
    const { data } = await api.post('/activity-logs', log);
    return data;
  },
};

export default activityLogService;
