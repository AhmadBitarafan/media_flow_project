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
    ['/admin/requests','📋','مرور درخواست‌ها',`${s?.requests?.pending_review ?? 0} در انتظار`,'var(--amber)'],
    ['/admin/users','👥','تأیید فریلنسرها',`${s?.freelancers?.pending ?? 0} در انتظار`,'var(--purple)'],
    ['/admin/projects','📁','پروژه‌های فعال',`${s?.projects?.active ?? 0} فعال`,'var(--cyan)'],
    ['/admin/tickets','🎫','تیکت‌های باز',`${s?.tickets?.open ?? 0} باز`,'var(--accent)'],
    ['/admin/wallets','💳','پرداخت‌ها',`${s?.payments?.completed_this_month ?? 0} این ماه`,'var(--green)'],
  ]

  return (
    <div>
      <PageHeader title="پنل مدیریت" subtitle="نمای کلی عملیات MediaFlow" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="کل پروژه‌ها" value={s?.projects?.total ?? '—'} icon="📁" />
        <StatCard label="پروژه‌های فعال" value={s?.projects?.active ?? '—'} icon="⚡" accent="var(--cyan)" />
        <StatCard label="تکمیل‌شده" value={s?.projects?.completed ?? '—'} icon="✅" accent="var(--green)" />
        <StatCard label="درخواست‌های در انتظار" value={s?.requests?.pending_review ?? '—'} icon="🔍" accent="var(--amber)" />
        <StatCard label="تیکت‌های باز" value={s?.tickets?.open ?? '—'} icon="🎫" accent="var(--purple)" />
        <StatCard label="فریلنسرها" value={s?.freelancers?.total ?? '—'} icon="👷" sub={`${s?.freelancers?.pending ?? 0} در انتظار`} />
        <StatCard label="مشتریان" value={s?.customers?.total ?? '—'} icon="👥" sub={`${s?.customers?.new_this_month ?? 0} جدید`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem' }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontWeight:600, fontSize:'0.95rem' }}>پروژه‌های اخیر</h2>
            <Link to="/admin/projects" style={{ fontSize:'0.8rem', color:'var(--accent)' }}>مشاهده همه →</Link>
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
          {projects.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', padding:'1rem 0' }}>هنوز پروژه‌ای وجود ندارد</p>}
        </Card>

        <Card>
          <h3 style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'0.85rem' }}>اقدامات سریع</h3>
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
