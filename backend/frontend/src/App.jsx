import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
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
  const router = createBrowserRouter([
    { path: '/', element: <RoleRedirect /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },

    // Customer
    { path: '/customer', element: W(CUST, CustomerDashboard) },
    { path: '/customer/projects', element: W(CUST, CustomerProjects) },
    { path: '/customer/projects/:id', element: W(CUST, CustomerProjectDetail) },
    { path: '/customer/submit-request', element: W(CUST, SubmitRequest) },
    { path: '/customer/tickets', element: W(CUST, TicketsPage) },
    { path: '/customer/tickets/:id', element: W(CUST, TicketDetail) },
    { path: '/customer/wallet', element: W(CUST, WalletPage) },
    { path: '/customer/notifications', element: W(CUST, NotificationsPage) },
    { path: '/customer/profile', element: W(CUST, ProfilePage) },

    // Freelancer
    { path: '/freelancer', element: W(FREE, FreelancerDashboard) },
    { path: '/freelancer/projects', element: W(FREE, FreelancerProjects) },
    { path: '/freelancer/projects/:id', element: W(FREE, FreelancerProjectDetail) },
    { path: '/freelancer/tickets', element: W(FREE, TicketsPage) },
    { path: '/freelancer/tickets/:id', element: W(FREE, TicketDetail) },
    { path: '/freelancer/wallet', element: W(FREE, WalletPage) },
    { path: '/freelancer/notifications', element: W(FREE, NotificationsPage) },
    { path: '/freelancer/profile', element: W(FREE, ProfilePage) },

    // Admin
    { path: '/admin', element: W(ADMIN, AdminDashboard) },
    { path: '/admin/requests', element: W(ADMIN, AdminRequests) },
    { path: '/admin/projects', element: W(ADMIN, AdminProjects) },
    { path: '/admin/projects/:id', element: W(ADMIN, AdminProjectDetail) },
    { path: '/admin/users', element: W(ADMIN, AdminUsers) },
    { path: '/admin/tickets', element: W(ADMIN, TicketsPage) },
    { path: '/admin/tickets/:id', element: W(ADMIN, TicketDetail) },
    { path: '/admin/wallets', element: W(ADMIN, AdminWallets) },
    { path: '/admin/notifications', element: W(ADMIN, NotificationsPage) },
    { path: '/admin/profile', element: W(ADMIN, ProfilePage) },

    { path: '*', element: <NotFoundPage /> },
  ], { future: { v7_startTransition: true, v7_relativeSplatPath: true } })

  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background:'var(--bg-card)', color:'var(--text)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:'0.875rem' },
        success: { iconTheme: { primary:'var(--green)',  secondary:'white' } },
        error:   { iconTheme: { primary:'var(--red)',    secondary:'white' } },
      }} />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
