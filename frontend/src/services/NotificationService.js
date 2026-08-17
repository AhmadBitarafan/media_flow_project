// NotificationService.js - Service for notification API calls
import apiClient from '../api/index';

const ENDPOINT = '/notifications/';

const NotificationService = {
  getAll: (params = {}) => apiClient.get(ENDPOINT, { params }),
  getUnreadCount: () => apiClient.get(`${ENDPOINT}unread_count/`),
  
  // Actions
  markRead: (id) => apiClient.post(`${ENDPOINT}${id}/mark_read/`),
  markAllRead: () => apiClient.post(`${ENDPOINT}mark_all_read/`),
};

export default NotificationService;
