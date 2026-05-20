import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { projectsApi } from '../../api'
import { Card, PageHeader, Badge, Empty, Tabs } from '../../components/ui'
import { fmt } from '../../utils'

export default function FreelancerProjects() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'assigned')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsApi.list().then(r => setProjects(r.data.results || r.data)).finally(() => setLoading(false))
  }, [])

  const assigned = projects.filter(p => p.current_assignment)
  const open     = projects.filter(p => !p.current_assignment && p.is_public_to_level)
  const items    = tab === 'assigned' ? assigned : open

  const changeTab = (t) => { setTab(t); setSearchParams({ tab: t }) }

  return (
    <div>
      <PageHeader title="Projects" subtitle="Manage your work and explore open opportunities" />
      <Tabs tabs={[['assigned',`My Work (${assigned.length})`],['open',`Open to Bid (${open.length})`]]}
        active={tab} onChange={changeTab} />

      {loading ? <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'3rem' }}>Loading…</p> :
        items.length === 0 ? (
          <Empty icon={tab==='assigned'?'📋':'🎯'}
            title={tab==='assigned'?'No projects assigned':'No open projects right now'}
            message={tab==='assigned'?'Assigned projects appear here.':'Check back for available projects matching your level.'} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            {items.map(p => (
              <Link key={p.id} to={`/freelancer/projects/${p.id}`} style={{ textDecoration:'none' }}>
                <Card style={{ padding:'12px 16px', cursor:'pointer', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                        <span style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)' }}>{p.title}</span>
                        <Badge status={p.status} label={p.status_display} />
                        {p.required_level && <span style={{ fontSize:'0.72rem', color:'var(--amber)', fontWeight:600 }}>Lvl {p.required_level.code}</span>}
                      </div>
                      <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.description}</p>
                      <div style={{ display:'flex', gap:'1rem', marginTop:6, fontSize:'0.74rem', color:'var(--text-muted)', flexWrap:'wrap' }}>
                        <span>🎬 {p.type_display}</span>
                        {p.deadline && <span>📅 Due {fmt.date(p.deadline)}</span>}
                        {p.budget && <span>💰 {fmt.currency(p.budget)}</span>}
                        <span>🕐 {fmt.relative(p.created_at)}</span>
                      </div>
                    </div>
                    <span style={{ color:'var(--text-muted)' }}>›</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      }
    </div>
  )
}
