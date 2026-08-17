// useTickets.js - Custom hook for ticket data fetching
import { useState, useEffect, useCallback } from 'react';
import TicketService from '../services/TicketService';

export const useTicketsList = (initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });

  const fetchData = useCallback(async (params = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await TicketService.getAll(params);
      setData(response.data.results ?? response.data);
      if (response.data.count !== undefined) {
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, pagination, refetch: fetchData };
};

export const useTicketDetail = (id) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await TicketService.getById(id);
      setTicket(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  return { ticket, loading, error, refetch: fetchTicket };
};

export const useTicketMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (data) => {
    setLoading(true);
    try {
      const res = await TicketService.create(data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error creating ticket');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, data) => {
    setLoading(true);
    try {
      const res = await TicketService.update(id, data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error updating ticket');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const reply = async (id, data) => {
    setLoading(true);
    try {
      const res = await TicketService.reply(id, data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error replying to ticket');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setLoading(true);
    try {
      await TicketService.delete(id);
      return { success: true };
    } catch (err) {
      setError(err.response?.data || 'Error deleting ticket');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { create, update, reply, remove, loading, error };
};
