import axios from 'axios';

const API_URL = 'http://localhost:5000/api/service-requests';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// Student endpoints
export const serviceRequestService = {
    // Get user's requests
    getMyRequests: async (params = {}) => {
        const response = await axios.get(`${API_URL}/my-requests`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // Submit new request
    submitRequest: async (requestData) => {
        const response = await axios.post(API_URL, requestData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get request details
    getRequestDetails: async (requestId) => {
        const response = await axios.get(`${API_URL}/${requestId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Upload attachment
    uploadAttachment: async (requestId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API_URL}/${requestId}/attachments`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Cancel request
    cancelRequest: async (requestId) => {
        const response = await axios.put(`${API_URL}/${requestId}/cancel`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Staff endpoints
    getAllRequests: async (params = {}) => {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    getStatistics: async () => {
        const response = await axios.get(`${API_URL}/statistics/dashboard`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateStatus: async (requestId, statusData) => {
        const response = await axios.put(`${API_URL}/${requestId}/status`, statusData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    deleteAttachment: async (requestId, attachmentId) => {
        const response = await axios.delete(`${API_URL}/${requestId}/attachments/${attachmentId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};
