// useWallets.js - Custom hook for wallet data fetching
import { useState, useEffect, useCallback } from 'react';
import WalletService from '../services/WalletService';

export const useWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const walletRes = await WalletService.getMyWallet();
      const transactionsRes = await WalletService.getTransactions();
      setWallet(walletRes.data);
      setTransactions(transactionsRes.data.results ?? transactionsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWalletData(); }, [fetchWalletData]);

  return { wallet, transactions, loading, error, refetch: fetchWalletData };
};

export const usePayments = (initialParams = {}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async (params = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await WalletService.getPayments(params);
      setPayments(response.data.results ?? response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return { payments, loading, error, refetch: fetchPayments };
};

export const useWalletMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPayment = async (data) => {
    setLoading(true);
    try {
      const res = await WalletService.createPayment(data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error creating payment');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (id) => {
    setLoading(true);
    try {
      const res = await WalletService.processPayment(id);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data || 'Error processing payment');
      return { success: false, error: err.response?.data };
    } finally {
      setLoading(false);
    }
  };

  return { createPayment, processPayment, loading, error };
};
