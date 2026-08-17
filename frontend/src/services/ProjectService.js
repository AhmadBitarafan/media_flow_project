// ProjectService.js - Service for project API calls
import apiClient from '../api/index';

const ENDPOINT = '/projects/';

const ProjectService = {
  // Projects
  getAll: (params = {}) => apiClient.get(ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${ENDPOINT}${id}/`),
  create: (data) => apiClient.post(ENDPOINT, data),
  update: (id, data) => apiClient.patch(`${ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${ENDPOINT}${id}/`),
  
  // Projects actions
  assign: (id, data) => apiClient.post(`${ENDPOINT}${id}/assign/`, data),
  updateStatus: (id, data) => apiClient.post(`${ENDPOINT}${id}/update_status/`, data),
  requestRevision: (id, data) => apiClient.post(`${ENDPOINT}${id}/request_revision/`, data),
  reviewRevision: (id, data) => apiClient.post(`${ENDPOINT}${id}/review_revision/`, data),
  approveDelivery: (id) => apiClient.post(`${ENDPOINT}${id}/approve_delivery/`),
  acceptAssignment: (id) => apiClient.post(`${ENDPOINT}${id}/accept_assignment/`),
  declineAssignment: (id) => apiClient.post(`${ENDPOINT}${id}/decline_assignment/`),
  
  // Bids
  bid: (id, data) => apiClient.post(`${ENDPOINT}${id}/bid/`, data),
  getBids: (id) => apiClient.get(`${ENDPOINT}${id}/bids/`),
  
  // Milestones
  getMilestones: (id) => apiClient.get(`${ENDPOINT}${id}/milestones/`),
  createMilestone: (id, data) => apiClient.post(`${ENDPOINT}${id}/milestones/`, data),
  
  // Dashboard
  freelancerDashboard: () => apiClient.get('/projects/freelancer/dashboard/'),
};

export default ProjectService;
