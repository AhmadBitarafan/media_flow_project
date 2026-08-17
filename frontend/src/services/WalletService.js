// WalletService.js - Service for wallet API calls
import apiClient from '../api/index';

const WalletService = {
  // Wallet
  getMyWallet: () => apiClient.get('/wallets/my/'),
  getTransactions: (params = {}) => apiClient.get('/wallets/my/transactions/', { params }),
  
  // Admin actions
  adjustBalance: (data) => apiClient.post('/wallets/admin/adjust/', data),
  
  // Payments
  getPayments: (params = {}) => apiClient.get('/wallets/payments/', { params }),
  createPayment: (data) => apiClient.post('/wallets/payments/', data),
  processPayment: (id) => apiClient.post(`/wallets/payments/${id}/process/`),
  
  // Invoices
  getInvoices: (params = {}) => apiClient.get('/wallets/invoices/', { params }),
};

export default WalletService;
