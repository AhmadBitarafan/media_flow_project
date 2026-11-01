// useProjects.js - Custom hook for project data fetching
import { useState, useEffect, useCallback } from 'react';
import ProjectService from '../services/ProjectService';

export const useProjectsList = (initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });

  const fetchData = useCallback(async (params = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ProjectService.getAll(params);
      setData(response.data.results ?? response.data);
      if (response.data.count !== undefined) {
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, pagination, refetch: fetchData };
};

export const useProjectDetail = (id) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await ProjectService.getById(id);
      setProject(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  return { project, loading, error, refetch: fetchProject };
};

export const useProjectMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (data) => {
    setLoading(true);
    try {
      const res = await ProjectService.create(data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error creating project');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, data) => {
    setLoading(true);
    try {
      const res = await ProjectService.update(id, data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error updating project');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setLoading(true);
    try {
      await ProjectService.delete(id);
      return { success: true };
    } catch (err) {
      setError(err.response?.data || 'Error deleting project');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
};
