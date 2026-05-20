import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, StatCard, PageHeader, Badge, Btn, Empty } from '../../components/ui'
import { fmt } from '../../utils'

export default function FreelancerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      projectsApi.flDashboard().then(r => setStats(r.data)),
      projectsApi.list({ page_size:6 }).then(r => setProjects(r.data.results || r.data)),
    ]).catch(()=>{}).finally(() => setLoading(false))
  }, [])

  const profile = user?.freelancer_profile
  const isVerified = profile?.verification_status === 'approved'

  return (
    <div>
      <PageHeader title={`Hello, ${user?.first_name} 👋`} subtitle="Your freelancer workspace" />

      {!isVerified && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'12px 16px', background:'var(--amber-bg)', border:'1px solid rgba(227,179,65,0.3)', borderRadius:'var(--radius-lg)', marginBottom:'1.5rem' }}>
          <span style={{ fontSize:'1.1rem' }}>⚠️</span>
          <div>
            <p style={{ fontWeight:600, color:'var(--amber)', fontSize:'0.875rem' }}>Account Pending Verification</p>
            <p style={{ fontSize:'0.8rem', color:'var(--text-sub)' }}>Your profile is under review. You'll receive projects once approved.</p>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Active Projects" value={stats?.active_assignments ?? '—'} icon="⚡" accent="var(--cyan)" />
        <StatCard label="Completed"       value={stats?.completed_projects ?? '—'} icon="✅" accent="var(--green)" />
        <StatCard label="Open to Bid"     value={stats?.open_projects ?? '—'}      icon="🎯" accent="var(--purple)" />
        <StatCard label="Your Level"      value={profile?.level?.code || '—'}      icon="🏅" accent="var(--amber)"
          sub={profile?.level?.name} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.25rem' }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontWeight:600, fontSize:'0.95rem' }}>Your Projects</h2>
            <Link to="/freelancer/projects" style={{ fontSize:'0.8rem', color:'var(--accent)' }}>View all →</Link>
          </div>
          {loading ? <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', padding:'2rem', textAlign:'center' }}>Loading…</p> :
            projects.length === 0 ? (
              <Empty icon="📭" title="No projects yet" message="Projects assigned to you will appear here." />
            ) : projects.map(p => (
              <Link key={p.id} to={`/freelancer/projects/${p.id}`} style={{ textDecoration:'none', display:'block', marginBottom:'0.5rem' }}>
                <div style={{ padding:'10px 12px', background:'var(--bg-surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ fontWeight:600, color:'var(--text)', fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</p>
                      <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{p.type_display} · {fmt.relative(p.created_at)}</p>
                    </div>
                    <Badge status={p.status} label={p.status_display} />
                  </div>
                  {p.deadline && <p style={{ fontSize:'0.74rem', color:'var(--amber)', marginTop:5 }}>📅 Due {fmt.date(p.deadline)}</p>}
                </div>
              </Link>
            ))
          }
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <Card>
            <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.85rem' }}>My Profile</h3>
            {[
              ['Status', profile?.verification_status || 'N/A', isVerified?'var(--green)':'var(--amber)'],
              ['Level', profile?.level?.name || 'Not assigned', 'var(--amber)'],
              ['Rating', profile?.average_rating ? `${profile.average_rating}/5 ⭐` : 'No ratings', 'var(--text)'],
              ['Completed', `${profile?.completed_projects || 0} projects`, 'var(--text)'],
            ].map(([k,v,c]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-muted)' }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize:'0.8rem', fontWeight:600, color:c, textTransform:'capitalize' }}>{v}</span>
              </div>
            ))}
            <Link to="/freelancer/profile" style={{ display:'block', marginTop:'1rem' }}>
              <Btn variant="secondary" fullWidth size="sm">Edit Profile</Btn>
            </Link>
          </Card>

          <Card>
            <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.75rem' }}>Quick Links</h3>
            {[['/freelancer/projects?tab=open','🎯 Open Projects'],['/freelancer/tickets','🎫 Support Tickets'],['/freelancer/wallet','💳 My Wallet']].map(([to,label]) => (
              <Link key={to} to={to} style={{ display:'block', padding:'8px 10px', borderRadius:'var(--radius)', color:'var(--text-sub)', fontSize:'0.83rem', textDecoration:'none', marginBottom:3, transition:'background 0.12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >{label}</Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
