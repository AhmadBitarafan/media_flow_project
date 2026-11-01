// FileService.js - Service for file upload/management API calls
import apiClient from '../api/index';

const FileService = {
  upload: (formData) => apiClient.post('/files/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params = {}) => apiClient.get('/files/', { params }),
  delete: (id) => apiClient.delete(`/files/${id}/`),
};

export default FileService;
