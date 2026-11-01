import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../api'
import { Card, PageHeader, Badge, Empty, Btn, Tabs } from '../../components/ui'
import { fmt } from '../../utils'

export default function CustomerProjects() {
  const [projects, setProjects] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('projects')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      projectsApi.list().then(r => setProjects(r.data.results || r.data)),
      projectsApi.listRequests().then(r => setRequests(r.data.results || r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const data = tab === 'projects' ? projects : requests
  const filtered = data.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="پروژه‌های من" subtitle="همه پروژه‌ها و درخواست‌های رسانه‌ای شما"
        action={<Link to="/customer/submit-request"><Btn>+ درخواست جدید</Btn></Link>} />

      <Tabs
        tabs={[['projects',`پروژه‌ها (${projects.length})`],['requests',`درخواست‌ها (${requests.length})`]]}
        active={tab} onChange={setTab}
      />

      <input placeholder="جستجو بر اساس عنوان…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{ maxWidth:300, marginBottom:'1rem' }} />

      {loading ? <p style={{ color:'var(--text-muted)', padding:'2rem', textAlign:'center' }}>در حال بارگذاری…</p> :
        filtered.length === 0 ? (
          <Empty icon="🎬" title="چیزی پیدا نشد" message="هیچ پروژه‌ای با جستجوی شما مطابقت ندارد."
            action={<Link to="/customer/submit-request"><Btn style={{ marginTop:8 }}>ثبت درخواست</Btn></Link>} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {filtered.map(p => (
  <div key={p.id} style={{ position: 'relative' }}>
    <Link to={`/customer/projects/${p.id}`} style={{ textDecoration:'none' }}>
      <Card style={{ padding:'12px 16px', cursor:'pointer', transition:'border-color 0.15s' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
      >
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
              <span style={{ fontWeight:600, color:'var(--text)', fontSize:'0.875rem' }}>{p.title}</span>
              <Badge status={p.status} label={p.status_display || p.status} />
            </div>
            <p style={{ fontSize:'0.76rem', color:'var(--text-muted)', marginTop:3 }}>
              {p.type_display || p.project_type} · {fmt.relative(p.created_at)}
              {p.deadline && ` · مهلت ${fmt.date(p.deadline)}`}
            </p>
          </div>
          {tab==='projects' && p.current_assignment && (
            <span style={{ fontSize:'0.76rem', color:'var(--text-muted)' }}>
              👤 {p.current_assignment.freelancer?.full_name}
            </span>
          )}
          <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>›</span>
        </div>
      </Card>
    </Link>
  </div>
))}
          </div>
        )
      }
    </div>
  )
}
