import axios from 'axios';

const API_URL = 'http://localhost:5000/api/help-desk';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const helpDeskService = {
    // Student endpoints
    getMyTickets: async (params = {}) => {
        const response = await axios.get(`${API_URL}/my-tickets`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    submitTicket: async (ticketData) => {
        const response = await axios.post(API_URL, ticketData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getTicketDetails: async (ticketId) => {
        const response = await axios.get(`${API_URL}/${ticketId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    addResponse: async (ticketId, message) => {
        const response = await axios.post(`${API_URL}/${ticketId}/responses`, 
            { message }, 
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    uploadAttachment: async (ticketId, file, responseId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        if (responseId) {
            formData.append('responseId', responseId);
        }
        
        const response = await axios.post(`${API_URL}/${ticketId}/attachments`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    closeTicket: async (ticketId) => {
        const response = await axios.put(`${API_URL}/${ticketId}/close`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    rateTicket: async (ticketId, rating, feedback) => {
        const response = await axios.post(`${API_URL}/${ticketId}/rate`, 
            { rating, feedback }, 
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Staff endpoints
    getAllTickets: async (params = {}) => {
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

    assignTicket: async (ticketId, assignedTo) => {
        const response = await axios.put(`${API_URL}/${ticketId}/assign`, 
            { assignedTo }, 
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    updateStatus: async (ticketId, status) => {
        const response = await axios.put(`${API_URL}/${ticketId}/status`, 
            { status }, 
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    addInternalNote: async (ticketId, message) => {
        const response = await axios.post(`${API_URL}/${ticketId}/internal-note`, 
            { message }, 
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    getAvailableStaff: async () => {
        const response = await axios.get(`${API_URL}/staff/available`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};
