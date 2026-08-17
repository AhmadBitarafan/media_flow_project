// TicketService.js - Service for ticket API calls
import apiClient from '../api/index';

const ENDPOINT = '/tickets/';

const TicketService = {
  getAll: (params = {}) => apiClient.get(ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${ENDPOINT}${id}/`),
  create: (data) => apiClient.post(ENDPOINT, data),
  update: (id, data) => apiClient.patch(`${ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${ENDPOINT}${id}/`),
  
  // Actions
  reply: (id, data) => apiClient.post(`${ENDPOINT}${id}/reply/`, data),
  updateStatus: (id, data) => apiClient.post(`${ENDPOINT}${id}/update_status/`, data),
  assign: (id, data) => apiClient.post(`${ENDPOINT}${id}/assign/`, data),
};

export default TicketService;
