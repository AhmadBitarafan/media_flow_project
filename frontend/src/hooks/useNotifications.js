// useNotifications.js - Custom hook for notification data fetching
import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/NotificationService';

export const useNotifications = (initialParams = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (params = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await NotificationService.getAll(params);
      setNotifications(response.data.results ?? response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      setUnreadCount(response.data.unread_count ?? 0);
    } catch (err) {
      // Silently fail for unread count
    }
  }, []);

  useEffect(() => { 
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return { notifications, unreadCount, loading, error, refetch: fetchNotifications, refetchCount: fetchUnreadCount };
};

export const useNotificationMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const markRead = async (id) => {
    setLoading(true);
    try {
      await NotificationService.markRead(id);
      return { success: true };
    } catch (err) {
      setError(err.response?.data || 'Error marking notification as read');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await NotificationService.markAllRead();
      return { success: true };
    } catch (err) {
      setError(err.response?.data || 'Error marking all as read');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { markRead, markAllRead, loading, error };
};
