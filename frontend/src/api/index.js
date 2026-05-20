import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT ────────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let refreshing = false, queue = []
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      if (refreshing) {
        return new Promise((res, rej) => queue.push({ res, rej })).then(t => {
          orig.headers.Authorization = `Bearer ${t}`; return api(orig)
        })
      }
      refreshing = true
      const refresh = localStorage.getItem('refresh')
      if (!refresh) { localStorage.clear(); window.location.href = '/login'; return Promise.reject(err) }
      try {
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('access', data.access)
        queue.forEach(p => p.res(data.access)); queue = []; refreshing = false
        orig.headers.Authorization = `Bearer ${data.access}`; return api(orig)
      } catch (e) {
        queue.forEach(p => p.rej(e)); queue = []; refreshing = false
        localStorage.clear(); window.location.href = '/login'; return Promise.reject(e)
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (d) => api.post('/auth/login/', d),
  register:       (d) => api.post('/auth/register/', d),
  logout:         (r) => api.post('/auth/logout/', { refresh: r }),
  me:             ()  => api.get('/auth/me/'),
  updateMe:       (d) => api.patch('/auth/me/', d),
  changePassword: (d) => api.post('/auth/change-password/', d),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  freelancerLevels:        ()      => api.get('/users/freelancer-levels/'),
  freelancerProfile:       ()      => api.get('/users/profile/freelancer/'),
  updateFreelancerProfile: (d)     => api.patch('/users/profile/freelancer/', d),
  customerProfile:         ()      => api.get('/users/profile/customer/'),
  updateCustomerProfile:   (d)     => api.patch('/users/profile/customer/', d),
  adminUsers:              (p)     => api.get('/users/admin/', { params: p }),
  toggleActive:            (id)    => api.post(`/users/admin/${id}/toggle_active/`),
  verifyFreelancer:        (id, d) => api.post(`/users/admin/${id}/verify_freelancer/`, d),
  setFreelancerLevel:      (id, d) => api.post(`/users/admin/${id}/set_freelancer_level/`, d),
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  // Requests
  listRequests:    (p)     => api.get('/projects/requests/', { params: p }),
  createRequest:   (d)     => api.post('/projects/requests/', d),
  reviewRequest:   (id, d) => api.post(`/projects/requests/${id}/review/`, d),
  convertRequest:  (id, d) => api.post(`/projects/requests/${id}/convert_to_project/`, d),
  // Projects
  list:             (p)     => api.get('/projects/', { params: p }),
  get:              (id)    => api.get(`/projects/${id}/`),
  create:           (d)     => api.post('/projects/', d),
  update:           (id, d) => api.patch(`/projects/${id}/`, d),
  assign:           (id, d) => api.post(`/projects/${id}/assign/`, d),
  updateStatus:     (id, d) => api.post(`/projects/${id}/update_status/`, d),
  requestRevision:  (id, d) => api.post(`/projects/${id}/request_revision/`, d),
  reviewRevision:   (id, d) => api.post(`/projects/${id}/review_revision/`, d),
  approveDelivery:  (id)    => api.post(`/projects/${id}/approve_delivery/`),
  bid:              (id, d) => api.post(`/projects/${id}/bid/`, d),
  bids:             (id)    => api.get(`/projects/${id}/bids/`),
  acceptAssignment: (id)    => api.post(`/projects/${id}/accept_assignment/`),
  declineAssignment:(id)    => api.post(`/projects/${id}/decline_assignment/`),
  milestones:       (pid)   => api.get(`/projects/${pid}/milestones/`),
  createMilestone:  (pid,d) => api.post(`/projects/${pid}/milestones/`, d),
  flDashboard:      ()      => api.get('/projects/freelancer/dashboard/'),
}

// ── Tickets ───────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list:         (p)     => api.get('/tickets/', { params: p }),
  get:          (id)    => api.get(`/tickets/${id}/`),
  create:       (d)     => api.post('/tickets/', d),
  reply:        (id, d) => api.post(`/tickets/${id}/reply/`, d),
  updateStatus: (id, d) => api.post(`/tickets/${id}/update_status/`, d),
  assign:       (id, d) => api.post(`/tickets/${id}/assign/`, d),
}

// ── Files ─────────────────────────────────────────────────────────────────────
export const filesApi = {
  upload: (fd) => api.post('/files/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list:   (p)  => api.get('/files/', { params: p }),
  remove: (id) => api.delete(`/files/${id}/`),
}

// ── Wallets ───────────────────────────────────────────────────────────────────
export const walletsApi = {
  myWallet:      ()      => api.get('/wallets/my/'),
  transactions:  ()      => api.get('/wallets/my/transactions/'),
  adjust:        (d)     => api.post('/wallets/admin/adjust/', d),
  payments:      (p)     => api.get('/wallets/payments/', { params: p }),
  createPayment: (d)     => api.post('/wallets/payments/', d),
  processPayment:(id)    => api.post(`/wallets/payments/${id}/process/`),
  invoices:      (p)     => api.get('/wallets/invoices/', { params: p }),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifApi = {
  list:        (p)  => api.get('/notifications/', { params: p }),
  unreadCount: ()   => api.get('/notifications/unread_count/'),
  markRead:    (id) => api.post(`/notifications/${id}/mark_read/`),
  markAll:     ()   => api.post('/notifications/mark_all_read/'),
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  list:     (p)     => api.get('/reviews/', { params: p }),
  create:   (d)     => api.post('/reviews/', d),
  moderate: (id, d) => api.post(`/reviews/${id}/moderate/`, d),
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditApi = {
  stats: () => api.get('/audit/stats/'),
  logs:  (p)=> api.get('/audit/logs/', { params: p }),
}

export default api
