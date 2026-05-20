import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppShell from './components/layout/AppShell'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer
import CustomerDashboard   from './pages/customer/Dashboard'
import CustomerProjects    from './pages/customer/Projects'
import CustomerProjectDetail from './pages/customer/ProjectDetail'
import SubmitRequest       from './pages/customer/SubmitRequest'

// Freelancer
import FreelancerDashboard    from './pages/freelancer/Dashboard'
import FreelancerProjects     from './pages/freelancer/Projects'
import FreelancerProjectDetail from './pages/freelancer/ProjectDetail'

// Admin
import AdminDashboard   from './pages/admin/Dashboard'
import AdminRequests    from './pages/admin/Requests'
import AdminProjects    from './pages/admin/Projects'
import AdminProjectDetail from './pages/admin/ProjectDetail'
import AdminUsers       from './pages/admin/Users'
import AdminWallets     from './pages/admin/Wallets'

// Shared
import TicketsPage      from './pages/shared/Tickets'
import TicketDetail     from './pages/shared/TicketDetail'
import WalletPage       from './pages/shared/Wallet'
import ProfilePage      from './pages/shared/Profile'
import NotificationsPage from './pages/shared/Notifications'
import NotFoundPage     from './pages/shared/NotFound'

/* ── Guards ──────────────────────────────────────────────────────────────── */
function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  const MAP = { admin:'/admin', supervisor:'/admin', customer:'/customer', freelancer:'/freelancer' }
  return <Navigate to={MAP[user.role] || '/customer'} replace />
}

function Loader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'white', fontSize:'0.9rem' }}>MF</div>
      <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Loading…</p>
    </div>
  )
}

/* ── Wrapped shell ───────────────────────────────────────────────────────── */
const W = (roles, Page) => (
  <RequireAuth roles={roles}>
    <AppShell><Page /></AppShell>
  </RequireAuth>
)

const ADMIN  = ['admin','supervisor']
const CUST   = ['customer']
const FREE   = ['freelancer']

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background:'var(--bg-card)', color:'var(--text)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:'0.875rem' },
          success: { iconTheme: { primary:'var(--green)',  secondary:'white' } },
          error:   { iconTheme: { primary:'var(--red)',    secondary:'white' } },
        }} />
        <Routes>
          {/* Public */}
          <Route path="/"         element={<RoleRedirect />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Customer ──────────────────────────────────────────────── */}
          <Route path="/customer"                    element={W(CUST, CustomerDashboard)} />
          <Route path="/customer/projects"           element={W(CUST, CustomerProjects)} />
          <Route path="/customer/projects/:id"       element={W(CUST, CustomerProjectDetail)} />
          <Route path="/customer/submit-request"     element={W(CUST, SubmitRequest)} />
          <Route path="/customer/tickets"            element={W(CUST, TicketsPage)} />
          <Route path="/customer/tickets/:id"        element={W(CUST, TicketDetail)} />
          <Route path="/customer/wallet"             element={W(CUST, WalletPage)} />
          <Route path="/customer/notifications"      element={W(CUST, NotificationsPage)} />
          <Route path="/customer/profile"            element={W(CUST, ProfilePage)} />

          {/* ── Freelancer ────────────────────────────────────────────── */}
          <Route path="/freelancer"                  element={W(FREE, FreelancerDashboard)} />
          <Route path="/freelancer/projects"         element={W(FREE, FreelancerProjects)} />
          <Route path="/freelancer/projects/:id"     element={W(FREE, FreelancerProjectDetail)} />
          <Route path="/freelancer/tickets"          element={W(FREE, TicketsPage)} />
          <Route path="/freelancer/tickets/:id"      element={W(FREE, TicketDetail)} />
          <Route path="/freelancer/wallet"           element={W(FREE, WalletPage)} />
          <Route path="/freelancer/notifications"    element={W(FREE, NotificationsPage)} />
          <Route path="/freelancer/profile"          element={W(FREE, ProfilePage)} />

          {/* ── Admin / Supervisor ────────────────────────────────────── */}
          <Route path="/admin"                       element={W(ADMIN, AdminDashboard)} />
          <Route path="/admin/requests"              element={W(ADMIN, AdminRequests)} />
          <Route path="/admin/projects"              element={W(ADMIN, AdminProjects)} />
          <Route path="/admin/projects/:id"          element={W(ADMIN, AdminProjectDetail)} />
          <Route path="/admin/users"                 element={W(ADMIN, AdminUsers)} />
          <Route path="/admin/tickets"               element={W(ADMIN, TicketsPage)} />
          <Route path="/admin/tickets/:id"           element={W(ADMIN, TicketDetail)} />
          <Route path="/admin/wallets"               element={W(ADMIN, AdminWallets)} />
          <Route path="/admin/notifications"         element={W(ADMIN, NotificationsPage)} />
          <Route path="/admin/profile"               element={W(ADMIN, ProfilePage)} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
