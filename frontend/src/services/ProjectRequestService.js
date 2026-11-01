// ProjectRequestService.js - Service for project request API calls
import apiClient from '../api/index';

const ENDPOINT = '/projects/requests/';

const ProjectRequestService = {
  getAll: (params = {}) => apiClient.get(ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${ENDPOINT}${id}/`),
  create: (data) => apiClient.post(ENDPOINT, data),
  update: (id, data) => apiClient.patch(`${ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${ENDPOINT}${id}/`),
  
  // Actions
  review: (id, data) => apiClient.post(`${ENDPOINT}${id}/review/`, data),
  convertToProject: (id, data) => apiClient.post(`${ENDPOINT}${id}/convert_to_project/`, data),
};

export default ProjectRequestService;
