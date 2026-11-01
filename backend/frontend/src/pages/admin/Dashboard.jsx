import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auditApi, projectsApi } from '../../api'
import { Card, StatCard, PageHeader, Badge } from '../../components/ui'
import { fmt } from '../../utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    auditApi.stats().then(r => setStats(r.data)).catch(()=>{})
    projectsApi.list({ page_size:5, ordering:'-created_at' }).then(r => setProjects(r.data.results || r.data)).catch(()=>{})
  }, [])

  const s = stats
  const quickActions = [
    ['/admin/requests','📋','Review Requests',`${s?.requests?.pending_review ?? 0} pending`,'var(--amber)'],
    ['/admin/users','👥','Verify Freelancers',`${s?.freelancers?.pending ?? 0} pending`,'var(--purple)'],
    ['/admin/projects','📁','Active Projects',`${s?.projects?.active ?? 0} active`,'var(--cyan)'],
    ['/admin/tickets','🎫','Open Tickets',`${s?.tickets?.open ?? 0} open`,'var(--accent)'],
    ['/admin/wallets','💳','Payments',`${s?.payments?.completed_this_month ?? 0} this month`,'var(--green)'],
  ]

  return (
    <div>
      <PageHeader title="Control Panel" subtitle="System-wide overview of MediaFlow operations" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Total Projects"    value={s?.projects?.total     ?? '—'} icon="📁" />
        <StatCard label="Active Projects"   value={s?.projects?.active    ?? '—'} icon="⚡" accent="var(--cyan)" />
        <StatCard label="Completed"         value={s?.projects?.completed ?? '—'} icon="✅" accent="var(--green)" />
        <StatCard label="Pending Requests"  value={s?.requests?.pending_review ?? '—'} icon="🔍" accent="var(--amber)" />
        <StatCard label="Open Tickets"      value={s?.tickets?.open       ?? '—'} icon="🎫" accent="var(--purple)" />
        <StatCard label="Freelancers"       value={s?.freelancers?.total  ?? '—'} icon="👷" sub={`${s?.freelancers?.pending ?? 0} pending`} />
        <StatCard label="Customers"         value={s?.customers?.total    ?? '—'} icon="👥" sub={`${s?.customers?.new_this_month ?? 0} new`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem' }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontWeight:600, fontSize:'0.95rem' }}>Recent Projects</h2>
            <Link to="/admin/projects" style={{ fontSize:'0.8rem', color:'var(--accent)' }}>View all →</Link>
          </div>
          {projects.map(p => (
            <Link key={p.id} to={`/admin/projects/${p.id}`} style={{ textDecoration:'none', display:'block', marginBottom:'0.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', transition:'background 0.12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--bg-surface)'}
              >
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</p>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{p.customer?.full_name} · {fmt.relative(p.created_at)}</p>
                </div>
                <Badge status={p.status} label={p.status_display} />
              </div>
            </Link>
          ))}
          {projects.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', padding:'1rem 0' }}>No projects yet</p>}
        </Card>

        <Card>
          <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.85rem' }}>Quick Actions</h3>
          {quickActions.map(([to, icon, title, sub, color]) => (
            <Link key={to} to={to} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'10px', borderRadius:'var(--radius)', textDecoration:'none', marginBottom:4, transition:'background 0.12s', background:'var(--bg-surface)' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--bg-surface)'}
            >
              <div style={{ width:34, height:34, borderRadius:'var(--radius)', background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>{icon}</div>
              <div>
                <p style={{ fontSize:'0.83rem', fontWeight:600, color:'var(--text)' }}>{title}</p>
                <p style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>{sub}</p>
              </div>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  )
}
