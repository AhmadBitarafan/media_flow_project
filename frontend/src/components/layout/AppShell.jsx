import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { notifApi } from '../../api'
import toast from 'react-hot-toast'

/* ── Nav definitions per role ─────────────────────────────────────────────── */
const NAV = {
  admin: [
    { to: '/admin',          label: 'Dashboard',  icon: '⊞',  exact: true },
    { to: '/admin/requests', label: 'Requests',   icon: '📋' },
    { to: '/admin/projects', label: 'Projects',   icon: '📁' },
    { to: '/admin/users',    label: 'Users',      icon: '👥' },
    { to: '/admin/tickets',  label: 'Tickets',    icon: '🎫' },
    { to: '/admin/wallets',  label: 'Wallets',    icon: '💳' },
  ],
  supervisor: [
    { to: '/admin',          label: 'Dashboard',  icon: '⊞',  exact: true },
    { to: '/admin/requests', label: 'Requests',   icon: '📋' },
    { to: '/admin/projects', label: 'Projects',   icon: '📁' },
    { to: '/admin/users',    label: 'Users',      icon: '👥' },
    { to: '/admin/tickets',  label: 'Tickets',    icon: '🎫' },
    { to: '/admin/wallets',  label: 'Wallets',    icon: '💳' },
  ],
  customer: [
    { to: '/customer',                 label: 'Dashboard',    icon: '⊞', exact: true },
    { to: '/customer/projects',        label: 'My Projects',  icon: '📁' },
    { to: '/customer/submit-request',  label: 'New Request',  icon: '✏️' },
    { to: '/customer/tickets',         label: 'Support',      icon: '🎫' },
    { to: '/customer/wallet',          label: 'Wallet',       icon: '💳' },
  ],
  freelancer: [
    { to: '/freelancer',          label: 'Dashboard', icon: '⊞', exact: true },
    { to: '/freelancer/projects', label: 'Projects',  icon: '📁' },
    { to: '/freelancer/tickets',  label: 'Support',   icon: '🎫' },
    { to: '/freelancer/wallet',   label: 'Wallet',    icon: '💳' },
  ],
}

const BOTTOM_NAV = (role) => {
  const base = role === 'admin' || role === 'supervisor' ? '/admin' :
               role === 'freelancer' ? '/freelancer' : '/customer'
  return [
    { to: `${base}/notifications`, label: 'Notifications', icon: '🔔' },
    { to: `${base}/profile`,       label: 'Profile',        icon: '⚙️' },
  ]
}

/* ── Sidebar link ─────────────────────────────────────────────────────────── */
function NavItem({ to, label, icon, exact, unread, onClick }) {
  const loc = useLocation()
  const active = exact ? loc.pathname === to : loc.pathname.startsWith(to)
  return (
    <Link to={to} onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:'9px',
        padding:'7px 10px', borderRadius:'var(--radius)',
        margin:'1px 0', textDecoration:'none', userSelect:'none',
        background: active ? 'var(--accent-glow)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-sub)',
        fontWeight: active ? 600 : 400, fontSize:'0.85rem',
        transition:'background 0.12s, color 0.12s',
        position:'relative',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-sub)' } }}
    >
      <span style={{ fontSize:'0.95rem', width:18, textAlign:'center', flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      {unread > 0 && (
        <span style={{ minWidth:18, height:18, borderRadius:9, background:'var(--accent)',
          color:'white', fontSize:'0.65rem', fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}

/* ── Main AppShell ────────────────────────────────────────────────────────── */
export default function AppShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetch = () => notifApi.unreadCount().then(r => setUnread(r.data.unread_count || 0)).catch(() => {})
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [])

  const role = user?.role || 'customer'
  const mainNav = NAV[role] || []
  const bottomNav = BOTTOM_NAV(role)

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/login')
  }

  const avatarLetters = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
              zIndex:199, backdropFilter:'blur(2px)' }} />
        )}

        <aside style={{
          position:'fixed', top:0, left:0, bottom:0,
          width: 'var(--sidebar-w)',
          background:'var(--bg-card)',
          borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column',
          zIndex:200,
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition:'transform 0.22s var(--ease)',
        }}>
          {/* Logo */}
          <div style={{ padding:'0 12px', height:'var(--header-h)',
            display:'flex', alignItems:'center', gap:'10px',
            borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, color:'white', fontSize:'0.78rem', flexShrink:0 }}>MF</div>
            <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text)' }}>MediaFlow</span>
            <button onClick={() => setSidebarOpen(false)}
              style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--text-muted)',
                cursor:'pointer', fontSize:'1.1rem', display:'none' }}
              className="sidebar-close"
            >✕</button>
          </div>

          {/* Role badge */}
          <div style={{ padding:'10px 12px 6px' }}>
            <span style={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', color:'var(--text-muted)',
              background:'var(--bg-surface)', padding:'2px 8px',
              borderRadius:'20px', border:'1px solid var(--border)' }}>
              {role}
            </span>
          </div>

          {/* Main nav */}
          <nav style={{ flex:1, padding:'4px 10px', overflowY:'auto' }}>
            {mainNav.map(item => (
              <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
          </nav>

          {/* Bottom nav (notifications, profile) */}
          <div style={{ padding:'6px 10px', borderTop:'1px solid var(--border)' }}>
            {bottomNav.map(item => (
              <NavItem key={item.to} {...item}
                unread={item.label === 'Notifications' ? unread : 0}
                onClick={() => setSidebarOpen(false)} />
            ))}
          </div>

          {/* User card + logout */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px',
              padding:'8px 10px', borderRadius:'var(--radius)',
              background:'var(--bg-surface)', marginBottom:6 }}>
              {user?.avatar && (
                <div style={{ width:36, height:36, borderRadius:'50%',
                  flexShrink:0, overflow:'hidden',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img src={user.avatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p style={{ fontSize:'0.7rem', color:'var(--text-muted)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user?.email}
                </p>
              </div>
            </div>
            <button onClick={handleLogout}
              style={{ width:'100%', padding:'6px', background:'transparent',
                border:'1px solid var(--border)', borderRadius:'var(--radius)',
                color:'var(--text-muted)', fontSize:'0.78rem', cursor:'pointer',
                fontFamily:'var(--font)', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--red-bg)'; e.currentTarget.style.color='var(--red)'; e.currentTarget.style.borderColor='var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border)' }}
            >Sign Out</button>
          </div>
        </aside>
      </>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div style={{ flex:1, marginLeft:'var(--sidebar-w)', minWidth:0, display:'flex', flexDirection:'column' }}>

        {/* Top header bar */}
        <header style={{
          position:'sticky', top:0, zIndex:100,
          height:'var(--header-h)',
          background:'var(--bg-card)',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center',
          padding:'0 1.5rem', gap:'1rem',
          backdropFilter:'blur(8px)',
        }}>
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(true)}
            style={{ background:'none', border:'none', color:'var(--text-sub)',
              cursor:'pointer', fontSize:'1.15rem', display:'none', flexShrink:0 }}
            className="hamburger"
          >☰</button>

          {/* Page title area — breadcrumb placeholder */}
          <div style={{ flex:1, minWidth:0 }}>
            <BreadcrumbTitle role={role} />
          </div>

          {/* Right: notification bell + avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            <Link to={`/${role === 'admin' || role === 'supervisor' ? 'admin' : role}/notifications`}
              style={{ position:'relative', display:'flex', alignItems:'center',
                justifyContent:'center', width:34, height:34,
                borderRadius:'var(--radius)', background:'var(--bg-surface)',
                border:'1px solid var(--border)', color:'var(--text-sub)',
                fontSize:'1rem', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--bg-surface)'; e.currentTarget.style.color='var(--text-sub)' }}
            >
              🔔
              {unread > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4,
                  minWidth:16, height:16, borderRadius:8,
                  background:'var(--red)', color:'white',
                  fontSize:'0.6rem', fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  padding:'0 3px', border:'2px solid var(--bg-card)' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <Link to={`/${role === 'admin' || role === 'supervisor' ? 'admin' : role}/profile`}
              style={{ display:'flex', alignItems:'center', gap:7,
                padding:'4px 10px', borderRadius:'var(--radius)',
                background:'var(--bg-surface)', border:'1px solid var(--border)',
                textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--bg-surface)'}
            >
              {user?.avatar && (
                <div style={{ width:28, height:28, borderRadius:'50%',
                  display:'flex', alignItems:'center',
                  justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  <img src={user.avatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}
              <span style={{ fontSize:'0.8rem', fontWeight:500, color:'var(--text)', whiteSpace:'nowrap' }}>
                {user?.first_name}
              </span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:'1.5rem', maxWidth:1400, width:'100%', margin:'0 auto' }}
          className="fade-in">
          {children}
        </main>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); }
          aside.open { transform: translateX(0); }
          div[style*="margin-left: var(--sidebar-w)"] { margin-left: 0 !important; }
          .hamburger { display: flex !important; }
          .sidebar-close { display: block !important; }
          main { padding: 1rem !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Breadcrumb title from URL ───────────────────────────────────────────── */
function BreadcrumbTitle({ role }) {
  const loc = useLocation()
  const parts = loc.pathname.split('/').filter(Boolean)
  const MAP = {
    dashboard:'Dashboard', projects:'Projects', requests:'Requests',
    users:'Users', tickets:'Support Tickets', wallets:'Wallets',
    notifications:'Notifications', profile:'Profile',
    'submit-request':'Submit Request', wallet:'Wallet',
    admin:'Control Panel', customer:'Customer', freelancer:'Freelancer',
  }
  const crumbs = parts.map(p => MAP[p] || (p.length > 30 ? p.slice(0,8)+'…' : p))
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.83rem', color:'var(--text-muted)', flexWrap:'wrap' }}>
      {crumbs.map((c,i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ opacity:0.4 }}>/</span>}
          <span style={{ color: i === crumbs.length-1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === crumbs.length-1 ? 600 : 400, textTransform:'capitalize' }}>{c}</span>
        </React.Fragment>
      ))}
    </div>
  )
}
