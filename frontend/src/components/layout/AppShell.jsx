import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { notifApi } from '../../api'
import toast from 'react-hot-toast'
import { t } from '../../i18n/fa'

/* ── Nav definitions per role ─────────────────────────────────────────────── */
const NAV = {
  admin: [
    { to: '/admin', label: t('dashboard'), icon: '⊞', exact: true },
    { to: '/admin/requests', label: t('requests'), icon: '📋' },
    { to: '/admin/projects', label: t('projects'), icon: '📁' },
    { to: '/admin/users', label: t('users'), icon: '👥' },
    { to: '/admin/tickets', label: t('tickets'), icon: '🎫' },
    { to: '/admin/wallets', label: t('wallets'), icon: '💳' },
  ],
  supervisor: [
    { to: '/admin', label: t('dashboard'), icon: '⊞', exact: true },
    { to: '/admin/requests', label: t('requests'), icon: '📋' },
    { to: '/admin/projects', label: t('projects'), icon: '📁' },
    { to: '/admin/users', label: t('users'), icon: '👥' },
    { to: '/admin/tickets', label: t('tickets'), icon: '🎫' },
    { to: '/admin/wallets', label: t('wallets'), icon: '💳' },
  ],
  customer: [
    { to: '/customer', label: t('dashboard'), icon: '⊞', exact: true },
    { to: '/customer/projects', label: t('myProjects'), icon: '📁' },
    { to: '/customer/submit-request', label: t('newRequest'), icon: '✏️' },
    { to: '/customer/tickets', label: t('support'), icon: '🎫' },
    { to: '/customer/wallet', label: t('wallet'), icon: '💳' },
  ],
  freelancer: [
    { to: '/freelancer', label: t('dashboard'), icon: '⊞', exact: true },
    { to: '/freelancer/projects', label: t('projects'), icon: '📁' },
    { to: '/freelancer/tickets', label: t('support'), icon: '🎫' },
    { to: '/freelancer/wallet', label: t('wallet'), icon: '💳' },
  ],
}

const BOTTOM_NAV = (role) => {
  const base = role === 'admin' || role === 'supervisor' ? '/admin' :
    role === 'freelancer' ? '/freelancer' : '/customer'
  return [
    { to: `${base}/notifications`, label: t('notifications'), icon: '🔔' },
    { to: `${base}/profile`, label: t('profile'), icon: '⚙️' },
  ]
}

function NavItem({ to, label, icon, exact, unread, onClick }) {
  const loc = useLocation()
  const active = exact ? loc.pathname === to : loc.pathname.startsWith(to)
  return (
    <Link to={to} onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '7px 10px', borderRadius: 'var(--radius)',
        margin: '1px 0', textDecoration: 'none', userSelect: 'none',
        background: active ? 'var(--accent-glow)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-sub)',
        fontWeight: active ? 600 : 400, fontSize: '0.85rem',
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)' } }}
    >
      <span style={{ fontSize: '0.95rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {unread > 0 && (
        <span style={{
          minWidth: 'fit-content', padding: '0 10px', height: 18, borderRadius: 9, background: 'var(--accent)',
          color: 'white', fontSize: '0.65rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
          ,lineHeight: "16px",textAlign: 'center',
        }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetch = () => notifApi.unreadCount().then(r => setUnread(r.data.unread_count || 0)).catch(() => { })
    fetch()
    const timer = setInterval(fetch, 30000)
    return () => clearInterval(timer)
  }, [])

  const role = user?.role || 'customer'
  const mainNav = NAV[role] || []
  const bottomNav = BOTTOM_NAV(role)

  const handleLogout = async () => {
    await logout()
    toast.success(t('signedOut'))
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(2px)' }} />
      )}

      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'var(--sidebar-w)', background: 'var(--bg-card)',
        borderInlineEnd: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 200,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.22s var(--ease)',
      }}>
        <div style={{
          padding: '0 12px', height: 'var(--header-h)',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: '1px solid var(--border)', flexShrink: 0
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: 'white',
            fontSize: '0.78rem',
            flexShrink: 0,
            lineHeight: "30px",
            letterSpacing: 0,
            boxSizing: 'border-box',
          }}>MF</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>MediaFlow</span>
          <button onClick={() => setSidebarOpen(false)}
            style={{
              marginInlineStart: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '1.1rem', display: 'none'
            }}
            className="sidebar-close"
          >✕</button>
        </div>

        <div style={{ padding: '10px 12px 6px' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)',
            background: 'var(--bg-surface)', padding: '2px 8px',
            borderRadius: '20px', border: '1px solid var(--border)'
          }}>
            {role}
          </span>
        </div>

        <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
          {mainNav.map(item => (
            <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)' }}>
          {bottomNav.map(item => (
            <NavItem key={item.to} {...item}
              unread={item.label === t('notifications') ? unread : 0}
              onClick={() => setSidebarOpen(false)} />
          ))}
        </div>

        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '8px 10px', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', marginBottom: 6
          }}>
            {user?.avatar && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{
              width: '100%', padding: '6px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer',
              fontFamily: 'var(--font)', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >{t('signOut')}</button>
        </div>
      </aside>

      <div style={{ flex: 1, marginInlineStart: 'var(--sidebar-w)', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 'var(--header-h)', background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: '1rem', backdropFilter: 'blur(8px)',
        }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-sub)',
              cursor: 'pointer', fontSize: '1.15rem', display: 'none', flexShrink: 0
            }}
            className="hamburger"
          >☰</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <BreadcrumbTitle />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Link to={`/${role === 'admin' || role === 'supervisor' ? 'admin' : role}/notifications`}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                justifyContent: 'center', width: 34, height: 34,
                borderRadius: 'var(--radius)', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', color: 'var(--text-sub)',
                fontSize: '1rem', textDecoration: 'none', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-sub)' }}
            >
              🔔
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: 'var(--red)', color: 'white',
                  lineHeight: "16px",textAlign: 'center',
                  fontSize: '0.6rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', border: '2px solid var(--bg-card)'
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <Link to={`/${role === 'admin' || role === 'supervisor' ? 'admin' : role}/profile`}
              style={{
                display: 'flex', flexFlow: 'row-reverse', alignItems: 'center', gap: 7,
                borderRadius: 'var(--radius)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                textDecoration: 'none', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
            >
              {user?.avatar && (
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
                }}>
                  <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <span style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1,
                boxSizing: 'border-box',
                textTransform: 'uppercase',
              }}>
                {user?.first_name?.[0] ?? ''}{user?.last_name?.[0] ?? ''}
              </span>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1400, width: '100%', margin: '0 auto' }} className="fade-in">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(100%); }
          .hamburger { display: flex !important; }
          .sidebar-close { display: block !important; }
          main { padding: 1rem !important; }
          div[style*="margin-inline-start: var(--sidebar-w)"] { margin-inline-start: 0 !important; }
        }
      `}</style>
    </div>
  )
}

function BreadcrumbTitle() {
  const loc = useLocation()
  const MAP = {
    dashboard: t('dashboard'), projects: t('projects'), requests: t('requests'),
    users: t('users'), tickets: t('tickets'), wallets: t('wallets'),
    notifications: t('notifications'), profile: t('profile'),
    'submit-request': t('newRequest'), wallet: t('wallet'),
    admin: 'ادمین', customer: 'مشتری', freelancer: 'فریلنسر',
  }
  const parts = loc.pathname.split('/').filter(Boolean)
  const crumbs = parts.map(p => MAP[p] || (p.length > 30 ? p.slice(0, 8) + '…' : p))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
          <span style={{ color: i === crumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c}</span>
        </React.Fragment>
      ))}
    </div>
  )
}
