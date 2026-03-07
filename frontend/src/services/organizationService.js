import api from './api';

export const organizationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/organizations', { params });
    return response.data;
  },

  getMyOfficerOrganizations: async () => {
    const response = await api.get('/organizations/my/officer-organizations');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  getMembers: async (id) => {
    const response = await api.get(`/organizations/${id}/members`);
    return response.data;
  },

  join: async (id) => {
    const response = await api.post(`/organizations/${id}/join`);
    return response.data;
  },

  leave: async (id) => {
    const response = await api.delete(`/organizations/${id}/leave`);
    return response.data;
  },

  getOfficers: async (id) => {
    const response = await api.get(`/organizations/${id}/officers`);
    return response.data;
  },

  getActivities: async (id, params = {}) => {
    const response = await api.get(`/organizations/${id}/activities`, { params });
    return response.data;
  },

  submitActivity: async (id, activityData) => {
    const response = await api.post(`/organizations/${id}/activities`, activityData);
    return response.data;
  },

  reviewActivity: async (activityId, status, remarks) => {
    const response = await api.put(`/organizations/activities/${activityId}/review`, {
      status,
      remarks,
    });
    return response.data;
  },

  deleteActivity: async (activityId) => {
    const response = await api.delete(`/organizations/activities/${activityId}`);
    return response.data;
  },

  // Officer Management
  addOfficer: async (orgId, officerData) => {
    const response = await api.post(`/organizations/${orgId}/officers`, officerData);
    return response.data;
  },

  removeOfficer: async (orgId, officerId) => {
    const response = await api.delete(`/organizations/${orgId}/officers/${officerId}`);
    return response.data;
  },

  getPotentialOfficers: async (orgId) => {
    const response = await api.get(`/organizations/${orgId}/potential-officers`);
    return response.data;
  },

  // Member Management
  approveMember: async (orgId, memberId) => {
    const response = await api.put(`/organizations/${orgId}/members/${memberId}/approve`);
    return response.data;
  },

  rejectMember: async (orgId, memberId) => {
    const response = await api.put(`/organizations/${orgId}/members/${memberId}/reject`);
    return response.data;
  },

  removeMember: async (orgId, memberId) => {
    const response = await api.delete(`/organizations/${orgId}/members/${memberId}`);
    return response.data;
  },
};
