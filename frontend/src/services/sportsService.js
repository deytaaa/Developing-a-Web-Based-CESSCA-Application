import api from './api';

export const sportsService = {
  getEvents: async (params = {}) => {
    const response = await api.get('/sports/events', { params });
    return response.data;
  },

  getEventById: async (id) => {
    const response = await api.get(`/sports/events/${id}`);
    return response.data;
  },

  createEvent: async (data) => {
    const response = await api.post('/sports/events', data);
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await api.put(`/sports/events/${id}`, data);
    return response.data;
  },

  registerForEvent: async (id, data) => {
    const response = await api.post(`/sports/events/${id}/register`, data);
    return response.data;
  },

  addResult: async (id, data) => {
    const response = await api.post(`/sports/events/${id}/results`, data);
    return response.data;
  },

  getGallery: async (params = {}) => {
    const response = await api.get('/sports/gallery', { params });
    return response.data;
  },

  getAlbumPhotos: async (albumId) => {
    const response = await api.get(`/sports/gallery/album/${albumId}`);
    return response.data;
  },

  uploadToGallery: async (formData) => {
    const response = await api.post('/sports/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  toggleFeatured: async (id, featured) => {
    const response = await api.put(`/sports/gallery/${id}/featured`, { featured });
    return response.data;
  },

  deleteFromGallery: async (id) => {
    const response = await api.delete(`/sports/gallery/${id}`);
    return response.data;
  },
};
