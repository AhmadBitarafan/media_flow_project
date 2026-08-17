// ReviewService.js - Service for review API calls
import apiClient from '../api/index';

const ENDPOINT = '/reviews/';

const ReviewService = {
  getAll: (params = {}) => apiClient.get(ENDPOINT, { params }),
  create: (data) => apiClient.post(ENDPOINT, data),
  
  // Actions
  moderate: (id, data) => apiClient.post(`${ENDPOINT}${id}/moderate/`, data),
};

export default ReviewService;
