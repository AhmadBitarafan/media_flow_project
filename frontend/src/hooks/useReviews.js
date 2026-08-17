// useReviews.js - Custom hook for review data fetching
import { useState, useEffect, useCallback } from 'react';
import ReviewService from '../services/ReviewService';

export const useReviewsList = (initialParams = {}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async (params = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ReviewService.getAll(params);
      setReviews(response.data.results ?? response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  return { reviews, loading, error, refetch: fetchReviews };
};

export const useReviewMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (data) => {
    setLoading(true);
    try {
      const res = await ReviewService.create(data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error creating review');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const moderate = async (id, data) => {
    setLoading(true);
    try {
      const res = await ReviewService.moderate(id, data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error moderating review');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  return { create, moderate, loading, error };
};
