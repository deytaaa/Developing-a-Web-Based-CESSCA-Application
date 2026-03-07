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

  // Logo Management
  uploadLogo: async (orgId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/organizations/${orgId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteLogo: async (orgId) => {
    const response = await api.delete(`/organizations/${orgId}/logo`);
    return response.data;
  },

  // Gallery Management
  getGallery: async (orgId, params = {}) => {
    const response = await api.get(`/organizations/${orgId}/gallery`, { params });
    return response.data;
  },

  uploadGalleryPhoto: async (orgId, photoData) => {
    const formData = new FormData();
    formData.append('image', photoData.image);
    formData.append('title', photoData.title);
    if (photoData.description) formData.append('description', photoData.description);
    if (photoData.album_name) formData.append('album_name', photoData.album_name);
    if (photoData.activity_id) formData.append('activity_id', photoData.activity_id);
    if (photoData.photo_order) formData.append('photo_order', photoData.photo_order);

    const response = await api.post(`/organizations/${orgId}/gallery`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteGalleryPhoto: async (orgId, galleryId) => {
    const response = await api.delete(`/organizations/${orgId}/gallery/${galleryId}`);
    return response.data;
  },
};
