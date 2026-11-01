import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { Card, StatCard, PageHeader, Badge, Btn, Empty } from '../../components/ui'
import { fmt } from '../../utils'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      projectsApi.list().then(r => setProjects(r.data.results || r.data)),
      projectsApi.listRequests().then(r => setRequests(r.data.results || r.data)),
    ]).catch(()=>{}).finally(() => setLoading(false))
  }, [])

  const counts = {
    total: projects.length,
    active: projects.filter(p => ['assigned','in_progress','review','revision'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'completed').length,
    pendingReqs: requests.filter(r => ['submitted','under_review'].includes(r.status)).length,
  }

  return (
    <div>
      <PageHeader
        title={`خوش آمدید، ${user?.first_name} 👋`}
        subtitle="وضعیت پروژه‌های رسانه‌ای شما"
        action={<Link to="/customer/submit-request"><Btn>+ درخواست جدید</Btn></Link>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="کل پروژه‌ها" value={counts.total} icon="📁" />
        <StatCard label="فعال" value={counts.active} icon="⚡" accent="var(--cyan)" />
        <StatCard label="تکمیل‌شده" value={counts.completed} icon="✅" accent="var(--green)" />
        <StatCard label="درخواست‌های در انتظار" value={counts.pendingReqs} icon="🔍" accent="var(--amber)" />
      </div>

      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ fontWeight:600, fontSize:'0.95rem', color:'var(--text)' }}>پروژه‌های اخیر</h2>
          <Link to="/customer/projects" style={{ fontSize:'0.8rem', color:'var(--accent)' }}>مشاهده همه&larr;</Link>
        </div>
        {loading ? (
          <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'2rem', fontSize:'0.875rem' }}>در حال بارگذاری…</p>
        ) : projects.length === 0 ? (
          <Empty icon="🎬" title="هنوز پروژه‌ای وجود ندارد"
            message="اولین درخواست خود را ثبت کنید."
            action={<Link to="/customer/submit-request"><Btn style={{ marginTop:8 }}>ثبت درخواست</Btn></Link>} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {projects.slice(0,6).map(p => (
              <Link key={p.id} to={`/customer/projects/${p.id}`} style={{ textDecoration:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'10px 12px',
                  background:'var(--bg-surface)', borderRadius:'var(--radius)',
                  border:'1px solid var(--border)', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</p>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{p.type_display} · {fmt.relative(p.created_at)}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
                    {p.deadline && <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>مهلت {fmt.date(p.deadline)}</span>}
                    <Badge status={p.status} label={p.status_display} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
